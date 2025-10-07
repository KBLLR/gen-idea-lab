import express from 'express';
import logger from '../../src/lib/logger.js';
import { requireAuth } from '../../src/lib/auth.js';
import { getBaseUrl, getFrontendBaseUrl } from '../config/env.js';

// Local in-module state for OAuth CSRF protection
const oauthStates = new Map();

export default function createUniversityRouter({ getUserConnections }) {
  const router = express.Router();

  // University OAuth flow endpoints
  router.get('/services/university/connect', requireAuth, (req, res) => {
    const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const clientId = '358660676559-02rrefr671bdi1chqtd3l0c44mc8jt9p.apps.googleusercontent.com';
    const redirectUri = `${getBaseUrl(req)}/api/services/university/callback`;
    const scope = 'openid email profile';
    const state = `${req.user.email}-${Math.random().toString(36).substring(2, 15)}`;

    const authUrl = `${googleAuthUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;

    // Store state for verification with expiration (5 minutes)
    oauthStates.set(state, {
      userEmail: req.user.email,
      createdAt: Date.now(),
      expires: Date.now() + 5 * 60 * 1000
    });

    // Cleanup expired entries
    for (const [key, value] of oauthStates.entries()) {
      if (Date.now() > value.expires) oauthStates.delete(key);
    }

    res.redirect(authUrl);
  });

  router.get('/services/university/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
      const front = getFrontendBaseUrl(req);
      return res.send(`
        <script>
          window.opener.postMessage({ type: 'university-auth-error', error: '${error}' }, '${front}');
          window.close();
        </script>
      `);
    }

    const stateData = oauthStates.get(state);
    if (!code || !stateData || Date.now() > stateData.expires) {
      oauthStates.delete(state);
      const front = getFrontendBaseUrl(req);
      return res.send(`
        <script>
          window.opener.postMessage({ type: 'university-auth-error', error: 'Invalid state, missing code, or expired session' }, '${front}');
          window.close();
        </script>
      `);
    }

    const userEmail = stateData.userEmail;
    oauthStates.delete(state);

    try {
      // Exchange code for Google ID token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: '358660676559-02rrefr671bdi1chqtd3l0c44mc8jt9p.apps.googleusercontent.com',
          client_secret: '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${getBaseUrl(req)}/api/services/university/callback`,
        })
      });
      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenData.id_token) {
        throw new Error(tokenData.error_description || 'Failed to get ID token');
      }

      // Exchange Google ID token for University session token
      const universityResponse = await fetch('https://api.app.code.berlin/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          variables: { code: tokenData.id_token },
          operationName: 'googleSignin',
          query: 'mutation googleSignin($code: String!) { googleSignin(code: $code) { token } }'
        })
      });
      const universityData = await universityResponse.json();
      if (universityData.errors || !universityData.data?.googleSignin?.token) {
        throw new Error(universityData.errors?.[0]?.message || 'University authentication failed');
      }

      const sessionToken = universityData.data.googleSignin.token;
      const connections = getUserConnections(userEmail);
      connections.university = {
        type: 'university_api',
        connected: true,
        sessionToken,
        connectedAt: new Date().toISOString(),
        lastRefresh: new Date().toISOString()
      };

      const front = getFrontendBaseUrl(req);
      res.send(`
        <script>
          window.opener.postMessage({ type: 'university-auth-success', sessionToken: '${sessionToken}' }, '${front}');
          window.close();
        </script>
      `);
    } catch (err) {
      logger.error('University OAuth callback failed:', err);
      const front = getFrontendBaseUrl(req);
      res.send(`
        <script>
          window.opener.postMessage({ type: 'university-auth-error', error: '${err.message}' }, '${front}');
          window.close();
        </script>
      `);
    }
  });

  // Proxy endpoints for University API
  router.post('/university/auth', requireAuth, async (req, res) => {
    try {
      const { googleIdToken } = req.body;
      if (!googleIdToken) return res.status(400).json({ error: 'Google ID token required' });

      const response = await fetch('https://api.app.code.berlin/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          variables: { code: googleIdToken },
          operationName: 'googleSignin',
          query: 'mutation googleSignin($code: String!) { googleSignin(code: $code) { token } }'
        })
      });
      const data = await response.json();
      if (data.errors) return res.status(400).json({ error: data.errors[0].message });
      const sessionToken = data.data?.googleSignin?.token;
      if (!sessionToken) return res.status(400).json({ error: 'No session token received' });

      const connections = getUserConnections(req.user.email);
      connections.university = {
        type: 'university_api',
        name: 'CODE University',
        sessionToken,
        connectedAt: new Date().toISOString()
      };

      const cookies = response.headers.get('set-cookie');
      if (cookies) res.setHeader('set-cookie', cookies);
      res.json({ success: true, sessionToken, message: 'University API connected successfully' });
    } catch (error) {
      logger.error('University authentication failed:', error);
      res.status(500).json({ error: 'Authentication failed', details: error.message });
    }
  });

  router.post('/university/refresh', requireAuth, async (req, res) => {
    try {
      const response = await fetch('https://api.app.code.berlin/cid_refresh', {
        method: 'POST', headers: { 'Cookie': req.headers.cookie || '' }
      });
      const data = await response.json();
      if (!data.ok || !data.token) return res.status(401).json({ error: 'Token refresh failed' });
      const connections = getUserConnections(req.user.email);
      if (connections.university) {
        connections.university.sessionToken = data.token;
        connections.university.lastRefresh = new Date().toISOString();
      }
      res.json({ success: true, sessionToken: data.token });
    } catch (error) {
      logger.error('University token refresh failed:', error);
      res.status(500).json({ error: 'Token refresh failed', details: error.message });
    }
  });

  router.post('/university/graphql', requireAuth, async (req, res) => {
    try {
      const { query, variables, operationName } = req.body;
      const connections = getUserConnections(req.user.email);
      const universityConnection = connections.university;
      if (!universityConnection?.sessionToken) return res.status(401).json({ error: 'University API not connected' });

      const response = await fetch('https://api.app.code.berlin/graphql', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${universityConnection.sessionToken}` },
        body: JSON.stringify({ query, variables, operationName })
      });
      const data = await response.json();
      if (data.errors) {
        const isTokenError = data.errors.some(error =>
          error.message.includes('token') || error.message.includes('unauthorized') || error.message.includes('expired')
        );
        if (isTokenError) return res.status(401).json({ error: 'Token expired', requiresRefresh: true });
      }
      res.json(data);
    } catch (error) {
      logger.error('University GraphQL request failed:', error);
      res.status(500).json({ error: 'GraphQL request failed', details: error.message });
    }
  });

  router.delete('/university/disconnect', requireAuth, async (req, res) => {
    try {
      const connections = getUserConnections(req.user.email);
      delete connections.university;
      res.json({ success: true, message: 'University API disconnected' });
    } catch (error) {
      logger.error('University disconnect failed:', error);
      res.status(500).json({ error: 'Disconnect failed', details: error.message });
    }
  });

  router.get('/university/test', requireAuth, async (req, res) => {
    try {
      const connections = getUserConnections(req.user.email);
      const universityConnection = connections.university;
      if (!universityConnection?.sessionToken) {
        return res.status(400).json({ error: 'University not connected', message: 'Please connect University service in settings first' });
      }
      const response = await fetch('https://api.app.code.berlin/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${universityConnection.sessionToken}` },
        credentials: 'include',
        body: JSON.stringify({ query: 'query testConnection { me { firstName lastName email } }', operationName: 'testConnection' })
      });
      const data = await response.json();
      if (data.errors) return res.status(400).json({ error: 'GraphQL error', details: data.errors });
      res.json({ success: true, connection: 'University API connected successfully', user: data.data?.me, tokenValid: true });
    } catch (error) {
      logger.error('University test failed:', error);
      res.status(500).json({ error: 'Connection test failed', details: error.message });
    }
  });

  return router;
}

