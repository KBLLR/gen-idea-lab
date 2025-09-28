/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import 'dotenv/config';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { GoogleGenAI } from '@google/genai';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';
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

// Initialize Google Auth for Gemini API with OAuth2
let ai;

async function initializeGeminiAPI() {
  try {
    // Try to use OAuth2 credentials (preferred method for 2025)
    const auth = new GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/generative-language.retriever'
      ],
      // This will use Application Default Credentials (ADC)
      // Can be set via gcloud auth application-default login
    });

    // Get credentials and access token
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    if (accessToken.token) {
      ai = new GoogleGenAI({
        credentials: authClient
      });
      logger.info('Google Gemini API initialized with OAuth2 credentials');
      return;
    } else {
      throw new Error('No access token obtained');
    }
  } catch (oauthError) {
    logger.warn('OAuth2 initialization failed, trying API key fallback:', oauthError.message);

    // Fallback to API key method (deprecated but may still work)
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        ai = new GoogleGenAI({ apiKey });
        logger.info('Google Gemini API initialized with API key (deprecated method)');
        return;
      } catch (apiKeyError) {
        logger.error('Both OAuth2 and API key initialization failed');
        logger.error('OAuth2 error:', oauthError.message);
        logger.error('API key error:', apiKeyError.message);
        process.exit(1);
      }
    } else {
      logger.error('No authentication method available for Gemini API');
      logger.error('Please run "gcloud auth application-default login" or set API_KEY environment variable');
      process.exit(1);
    }
  }
}

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
      scope: 'files:read',
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

// Special handler for Notion OAuth redirect (before general routes)
app.get('/auth/notion/callback', async (req, res) => {
  // Redirect Notion OAuth to the standard callback endpoint
  const notion_callback_url = `/api/services/notion/callback?${new URLSearchParams(req.query).toString()}`;
  res.redirect(notion_callback_url);
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

// Web search endpoint
app.post('/api/search', requireAuth, async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  try {
    const { query, maxResults = 5 } = req.body;

    if (!query) {
      logger.warn('Bad request to /api/search', { body: req.body });
      return res.status(400).json({ error: 'Missing "query" in request body' });
    }

    // Use DuckDuckGo Instant Answer API for simple search results
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    // Format the results for the frontend
    const results = {
      query,
      instant_answer: data.AbstractText || data.Answer || null,
      abstract_url: data.AbstractURL || null,
      definition: data.Definition || null,
      related_topics: (data.RelatedTopics || []).slice(0, maxResults).map(topic => ({
        title: topic.Text || '',
        url: topic.FirstURL || ''
      }))
    };

    res.json(results);

  } catch (error) {
    logger.error('Error performing web search:', { errorMessage: error.message, stack: error.stack });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Search failed: ' + error.message });
    }
  } finally {
    end({ route: '/api/search', code: res.statusCode, method: 'POST' });
    httpRequestsTotal.inc({ route: '/api/search', code: res.statusCode, method: 'POST' });
  }
});

// Notion Webhook Handler
// Store webhook subscriptions and verification tokens
const webhookSubscriptions = new Map();

// Webhook verification endpoint (called once by Notion to verify the endpoint)
app.post('/api/webhooks/notion/verify', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const payload = JSON.parse(req.body.toString());

    if (payload.verification_token) {
      // Store the verification token for this webhook
      const webhookId = payload.webhook_id || 'default';
      webhookSubscriptions.set(webhookId, {
        verification_token: payload.verification_token,
        created_at: new Date().toISOString()
      });

      logger.info('Notion webhook verified successfully', {
        webhook_id: webhookId,
        verification_token: payload.verification_token
      });

      // Respond with the verification token to complete verification
      res.status(200).json({
        verification_token: payload.verification_token
      });
    } else {
      logger.error('No verification token in webhook verification request');
      res.status(400).json({ error: 'No verification token provided' });
    }
  } catch (error) {
    logger.error('Error processing webhook verification:', error);
    res.status(400).json({ error: 'Invalid payload' });
  }
});

// Main webhook endpoint for receiving Notion events
app.post('/api/webhooks/notion', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const signature = req.headers['x-notion-signature'];
    const payload = req.body.toString();

    // Verify webhook signature if we have verification tokens
    if (signature && webhookSubscriptions.size > 0) {
      let validSignature = false;

      // Try to verify with any stored verification token
      for (const [webhookId, subscription] of webhookSubscriptions) {
        const expectedSignature = crypto
          .createHmac('sha256', subscription.verification_token)
          .update(payload)
          .digest('hex');

        if (signature === expectedSignature) {
          validSignature = true;
          logger.info('Webhook signature verified', { webhook_id: webhookId });
          break;
        }
      }

      if (!validSignature) {
        logger.warn('Invalid webhook signature', { signature });
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Parse the webhook payload
    const event = JSON.parse(payload);

    // Log the event for debugging
    logger.info('Received Notion webhook event', {
      event_type: event.event?.type,
      object_type: event.event?.object?.object,
      workspace_id: event.workspace_id,
      timestamp: event.timestamp
    });

    // Process different event types
    if (event.event) {
      processNotionEvent(event.event, event.workspace_id);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });

  } catch (error) {
    logger.error('Error processing Notion webhook:', error);
    res.status(400).json({ error: 'Invalid payload' });
  }
});

// Process different types of Notion events
function processNotionEvent(event, workspaceId) {
  const eventType = event.type;
  const objectType = event.object?.object;

  logger.info('Processing Notion event', {
    eventType,
    objectType,
    workspaceId,
    objectId: event.object?.id
  });

  switch (eventType) {
    case 'page.property_values_updated':
      logger.info('Page properties updated', {
        pageId: event.object.id,
        properties: Object.keys(event.object.properties || {})
      });
      // Handle page property updates
      break;

    case 'database.property_schema_updated':
      logger.info('Database schema updated', {
        databaseId: event.object.id,
        title: event.object.title?.[0]?.plain_text
      });
      // Handle database schema changes
      break;

    case 'block.child_page_updated':
      logger.info('Child page updated', {
        blockId: event.object.id,
        type: event.object.type
      });
      // Handle block updates
      break;

    default:
      logger.info('Unhandled event type', { eventType, objectType });
  }

  // Here you could:
  // - Update local cache/database
  // - Trigger notifications to connected users
  // - Sync changes to other services
  // - Send real-time updates via WebSocket
}

// Endpoint to get webhook subscription status
app.get('/api/webhooks/notion/status', requireAuth, (req, res) => {
  const subscriptions = Array.from(webhookSubscriptions.entries()).map(([id, sub]) => ({
    webhook_id: id,
    created_at: sub.created_at,
    verified: !!sub.verification_token
  }));

  res.json({
    webhook_url: `${req.protocol}://${req.get('host')}/api/webhooks/notion`,
    verification_url: `${req.protocol}://${req.get('host')}/api/webhooks/notion/verify`,
    subscriptions
  });
});

// Serve legal pages before static files
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'privacy.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'terms.html'));
});

// Explicit 404 route
app.get('/404', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'src', 'pages', '404.html'));
});

// Serve all static files from the project root directory (after API routes)
app.use(express.static(path.join(__dirname, 'dist')));

// Serve the main app for known routes (you might want to customize this list)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 404 handler for all other routes
app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'src', 'pages', '404.html'));
});

// Main server startup function
async function startServer() {
  try {
    // Initialize the Gemini API first
    await initializeGeminiAPI();

    // Start the server
    app.listen(port, () => {
      logger.info(`Server listening at http://localhost:${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
