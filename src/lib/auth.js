/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import logger from './logger.js';

const JWT_SECRET = process.env.AUTH_SECRET || 'your-dev-secret-change-in-production';
// Support environments where only the Vite-prefixed variable is defined.
// Vercel projects sometimes expose the client ID as VITE_GOOGLE_CLIENT_ID
// (for the frontend) without duplicating it for the backend runtime. When
// that happens the authentication route fails with "Google OAuth not
// configured" because we never instantiate the OAuth client. By checking both
// env vars we gracefully support either configuration.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const ALLOWED_DOMAIN = 'code.berlin';

// Initialize Google OAuth client
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

/**
 * Verify Google ID token and check domain
 */
export async function verifyGoogleToken(idToken) {
    if (!googleClient) {
        throw new Error('Google OAuth not configured');
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload.email;
        const emailVerified = payload.email_verified;

        if (!emailVerified) {
            throw new Error('Email not verified with Google');
        }

        if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
            throw new Error(`Only ${ALLOWED_DOMAIN} email addresses are allowed`);
        }

        return {
            id: payload.sub,
            email,
            name: payload.name,
            picture: payload.picture,
            domain: ALLOWED_DOMAIN
        };
    } catch (error) {
        logger.error('Google token verification failed:', error.message);
        throw error;
    }
}

/**
 * Generate JWT token for authenticated user
 */
export function generateJWT(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            domain: user.domain
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

/**
 * Verify JWT token
 */
export function verifyJWT(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Express middleware to require authentication
 */
export function requireAuth(req, res, next) {
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const user = verifyJWT(token);
        req.user = user;
        next();
    } catch (error) {
        logger.warn('Authentication failed:', error.message);
        res.status(401).json({ error: 'Invalid authentication token' });
    }
}

/**
 * Express middleware for optional authentication (doesn't block if no token)
 */
export function optionalAuth(req, res, next) {
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');

    if (token) {
        try {
            const user = verifyJWT(token);
            req.user = user;
        } catch (error) {
            // Token exists but is invalid - clear it
            res.clearCookie('auth_token');
            logger.warn('Invalid token cleared:', error.message);
        }
    }

    next();
}