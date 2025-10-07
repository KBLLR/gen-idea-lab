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

export default router;
