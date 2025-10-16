import express from 'express';
import logger from '../../src/shared/lib/logger.js';
import { verifyGoogleToken, generateJWT, optionalAuth } from '../../src/lib/auth.js';

const router = express.Router();

// POST /auth/google
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'ID token required' });
    }

    const user = await verifyGoogleToken(idToken);
    const jwt = generateJWT(user);

    res.cookie('auth_token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info('User authenticated:', { email: user.email });
    res.json({ user: { name: user.name, email: user.email, picture: user.picture } });
  } catch (error) {
    logger.warn('Authentication failed:', error.message);
    res.status(401).json({ error: error.message });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Logged out successfully' });
});

// GET /auth/me
router.get('/me', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({ user: { name: req.user.name, email: req.user.email, picture: req.user.picture } });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// GET /auth/connect/:service - OAuth initiation bridge
router.get('/connect/:service', optionalAuth, async (req, res) => {
  const { service } = req.params;

  if (!req.user) {
    return res.status(401).send('Authentication required');
  }

  try {
    // Fetch the OAuth URL from the services API
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const response = await fetch(`${baseUrl}/api/services/${service}/connect`, {
      method: 'POST',
      headers: {
        'Cookie': req.headers.cookie || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).send(`Failed to initiate OAuth: ${error.error || 'Unknown error'}`);
    }

    const data = await response.json();

    if (data.authUrl) {
      // Redirect to the OAuth provider
      res.redirect(data.authUrl);
    } else {
      res.status(500).send('No auth URL returned');
    }
  } catch (error) {
    logger.error(`Failed to initiate OAuth for ${service}:`, error);
    res.status(500).send('Failed to initiate OAuth flow');
  }
});

export default router;
