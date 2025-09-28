/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import 'dotenv/config';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { GoogleGenAI } from '@google/genai';
import logger from './src/lib/logger.js';
import { register, httpRequestDurationMicroseconds, httpRequestsTotal } from './src/lib/metrics.js';
import { verifyGoogleToken, generateJWT, requireAuth, optionalAuth } from './src/lib/auth.js';

// In ES modules, __dirname is not available. path.resolve() provides the project root.
const __dirname = path.resolve();

const app = express();
app.use(cookieParser());

// CORS headers for development and production
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://www.kbllr.com',
    'https://kbllr.com'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const port = process.env.PORT || 8081;

// Allow GEMINI_API_KEY fallback for local/dev environments
if (!process.env.API_KEY && process.env.GEMINI_API_KEY) {
  process.env.API_KEY = process.env.GEMINI_API_KEY;
}

// The API key must be set as an environment variable on the server.
// The app will fail to start if it's missing.
if (!process.env.API_KEY) {
  logger.error("API_KEY environment variable not set. Application will exit.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Increase payload limit for base64 image data
app.use(express.json({ limit: '10mb' })); 

// Authentication routes (must come before static serving)
app.post('/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token required' });
    }

    const user = await verifyGoogleToken(idToken);
    const jwt = generateJWT(user);

    // Set secure HTTP-only cookie
    res.cookie('auth_token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info('User authenticated:', { email: user.email });
    res.json({ user: { name: user.name, email: user.email, picture: user.picture } });
  } catch (error) {
    logger.warn('Authentication failed:', error.message);
    res.status(401).json({ error: error.message });
  }
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Logged out successfully' });
});

app.get('/auth/me', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({ user: { name: req.user.name, email: req.user.email, picture: req.user.picture } });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Service integration routes
// In-memory store for user service connections (in production, use a database)
const userConnections = new Map();

// Helper function to get user connections
function getUserConnections(userId) {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, {
      github: null,
      notion: null,
      figma: null,
      googleDrive: null,
      googlePhotos: null,
      googleCalendar: null,
      gmail: null,
      openai: null,
      claude: null,
      gemini: null,
      ollama: null
    });
  }
  return userConnections.get(userId);
}

// Get user's connected services
app.get('/api/services', requireAuth, (req, res) => {
  const connections = getUserConnections(req.user.email);
  const connectedServices = {};
  
  for (const [service, connection] of Object.entries(connections)) {
    connectedServices[service] = {
      connected: !!connection,
      info: connection ? { name: connection.name || service } : null
    };
  }
  
  res.json(connectedServices);
});

// Generic OAuth initiation endpoint
app.post('/api/services/:service/connect', requireAuth, (req, res) => {
  const { service } = req.params;
  const { apiKey, url } = req.body;
  
  // OAuth services configuration
  const oauthConfigs = {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      scope: 'repo user',
      authUrl: 'https://github.com/login/oauth/authorize'
    },
    notion: {
      clientId: process.env.NOTION_CLIENT_ID,
      scope: '',
      authUrl: 'https://api.notion.com/v1/oauth/authorize'
    },
    figma: {
      clientId: process.env.FIGMA_CLIENT_ID,
      scope: 'file_read',
      authUrl: 'https://www.figma.com/oauth'
    },
    googleDrive: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
    },
    googlePhotos: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
    },
    googleCalendar: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
    },
    gmail: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
    }
  };
  
  // Handle API key based services
  if (apiKey && ['openai', 'claude', 'gemini'].includes(service)) {
    const connections = getUserConnections(req.user.email);
    connections[service] = {
      type: 'api_key',
      name: service.charAt(0).toUpperCase() + service.slice(1),
      apiKey: apiKey,
      connectedAt: new Date().toISOString()
    };
    
    return res.json({ success: true, message: `${service} connected successfully` });
  }
  
  // Handle URL based services (Ollama)
  if (url && service === 'ollama') {
    const connections = getUserConnections(req.user.email);
    connections[service] = {
      type: 'url',
      name: 'Ollama',
      url: url,
      connectedAt: new Date().toISOString()
    };
    
    return res.json({ success: true, message: 'Ollama connected successfully' });
  }
  
  // Handle OAuth services
  const config = oauthConfigs[service];
  if (!config || !config.clientId) {
    return res.status(400).json({ error: `Service ${service} not configured or not supported` });
  }
  
  const redirectUri = `${req.protocol}://${req.get('host')}/api/services/${service}/callback`;
  const state = `${req.user.email}:${Date.now()}`; // Simple state for CSRF protection
  
  let authUrl;
  if (service.startsWith('google')) {
    authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scope)}&response_type=code&state=${encodeURIComponent(state)}&access_type=offline`;
  } else if (service === 'github') {
    authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scope)}&state=${encodeURIComponent(state)}`;
  } else if (service === 'notion') {
    authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${encodeURIComponent(state)}&owner=user`;
  } else if (service === 'figma') {
    authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scope)}&response_type=code&state=${encodeURIComponent(state)}`;
  }
  
  res.json({ authUrl });
});

// OAuth callback handler
app.get('/api/services/:service/callback', async (req, res) => {
  const { service } = req.params;
  const { code, state, error } = req.query;
  
  if (error) {
    return res.redirect(`/?error=oauth_error&service=${service}`);
  }
  
  if (!code || !state) {
    return res.redirect(`/?error=missing_params&service=${service}`);
  }
  
  const [userEmail] = state.split(':');
  if (!userEmail) {
    return res.redirect(`/?error=invalid_state&service=${service}`);
  }
  
  try {
    // Exchange code for access token
    let tokenResponse;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/services/${service}/callback`;
    
    if (service === 'github') {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
          redirect_uri: redirectUri
        })
      });
      tokenResponse = await response.json();
    } else if (service === 'notion') {
      const response = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64')}`
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri
        })
      });
      tokenResponse = await response.json();
    } else if (service === 'figma') {
      const response = await fetch('https://www.figma.com/api/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.FIGMA_CLIENT_ID,
          client_secret: process.env.FIGMA_CLIENT_SECRET,
          redirect_uri: redirectUri,
          code: code,
          grant_type: 'authorization_code'
        })
      });
      tokenResponse = await response.json();
    } else if (service.startsWith('google')) {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          code: code,
          grant_type: 'authorization_code'
        })
      });
      tokenResponse = await response.json();
    }
    
    if (tokenResponse.error) {
      logger.error(`OAuth error for ${service}:`, tokenResponse.error);
      return res.redirect(`/?error=token_exchange&service=${service}`);
    }
    
    // Store the connection
    const connections = getUserConnections(userEmail);
    connections[service] = {
      type: 'oauth',
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: tokenResponse.expires_in ? Date.now() + (tokenResponse.expires_in * 1000) : null,
      scope: tokenResponse.scope,
      connectedAt: new Date().toISOString(),
      name: service.charAt(0).toUpperCase() + service.slice(1)
    };
    
    logger.info(`Successfully connected ${service} for user ${userEmail}`);
    res.redirect('/?success=connected&service=' + service);
    
  } catch (error) {
    logger.error(`Error during ${service} OAuth callback:`, error);
    res.redirect(`/?error=callback_error&service=${service}`);
  }
});

// Disconnect a service
app.delete('/api/services/:service', requireAuth, (req, res) => {
  const { service } = req.params;
  const connections = getUserConnections(req.user.email);
  
  if (connections[service]) {
    connections[service] = null;
    logger.info(`Disconnected ${service} for user ${req.user.email}`);
    res.json({ success: true, message: `${service} disconnected successfully` });
  } else {
    res.status(404).json({ error: 'Service not connected' });
  }
});

// Test a service connection
app.post('/api/services/:service/test', requireAuth, async (req, res) => {
  const { service } = req.params;
  const connections = getUserConnections(req.user.email);
  const connection = connections[service];
  
  if (!connection) {
    return res.status(404).json({ error: 'Service not connected' });
  }
  
  try {
    let testResult = { connected: true, service };
    
    // Test different service types
    if (service === 'github' && connection.type === 'oauth') {
      const response = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `token ${connection.accessToken}` }
      });
      const userData = await response.json();
      testResult.info = { username: userData.login, name: userData.name };
    } else if (service === 'notion' && connection.type === 'oauth') {
      const response = await fetch('https://api.notion.com/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
          'Notion-Version': '2022-06-28'
        }
      });
      const userData = await response.json();
      testResult.info = { name: userData.name, type: userData.type };
    } else if (service === 'ollama' && connection.type === 'url') {
      const response = await fetch(`${connection.url}/api/tags`);
      const models = await response.json();
      testResult.info = { models: models.models?.length || 0, url: connection.url };
    }
    
    res.json(testResult);
  } catch (error) {
    logger.error(`Error testing ${service} connection:`, error);
    res.status(500).json({ error: 'Connection test failed', details: error.message });
  }
});

// Expose the /metrics endpoint for Prometheus scraping
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    logger.error('Error serving metrics:', { error: ex.message });
    res.status(500).end(ex);
  }
});

// Add a /healthz endpoint for load balancers and orchestration tools.
// It performs a live check against the Gemini API.
app.get('/healthz', async (req, res) => {
  try {
    // Make a lightweight, non-streaming call to the Gemini API to check its health.
    // A simple prompt is sufficient and cost-effective.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'hello',
    });
    
    // A successful response with text content indicates the API is healthy.
    if (response && response.text) {
        res.status(200).json({ status: 'ok', message: 'Gemini API is healthy.' });
    } else {
        // This case handles unexpected but non-error responses from the API.
        throw new Error('Received an invalid or empty response from Gemini API.');
    }

  } catch (error) {
    logger.error('Health check failed: Could not connect to Gemini API.', { errorMessage: error.message });
    res.status(503).json({ status: 'error', message: 'Service Unavailable: Cannot connect to Gemini API.' });
  }
});


// A single, generic proxy endpoint for all Gemini API calls from the frontend
app.post('/api/proxy', requireAuth, async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  try {
    const { model, contents, config, safetySettings } = req.body;

    if (!model || !contents) {
      logger.warn('Bad request to /api/proxy', { body: req.body });
      return res.status(400).json({ error: 'Missing "model" or "contents" in request body' });
    }
    
    const response = await ai.models.generateContent({
        model,
        contents,
        config,
        safetySettings
    });

    res.json(response);

  } catch (error) {
    logger.error('Error proxying request to Gemini API:', { errorMessage: error.message, stack: error.stack });
    // Ensure status is set before 'finally' block if not already sent
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  } finally {
    // Record metrics in the 'finally' block to ensure it runs even if there's an error.
    end({ route: '/api/proxy', code: res.statusCode, method: 'POST' });
    httpRequestsTotal.inc({ route: '/api/proxy', code: res.statusCode, method: 'POST' });
  }
});

// Serve all static files from the project root directory (after API routes)
app.use(express.static(path.join(__dirname, 'dist')));

// A catch-all route to serve the main index.html for any non-API GET requests.
// This is crucial for single-page applications with client-side routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  logger.info(`Server listening at http://localhost:${port}`);
});
