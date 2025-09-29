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
import { Ollama } from 'ollama';
import crypto from 'crypto';
import net from 'net';
import logger from './src/lib/logger.js';
import { register, httpRequestDurationMicroseconds, httpRequestsTotal } from './src/lib/metrics.js';
import { verifyGoogleToken, generateJWT, requireAuth, optionalAuth } from './src/lib/auth.js';

// In ES modules, __dirname is not available. path.resolve() provides the project root.
const __dirname = path.resolve();

// Development environment checks
const isDevelopment = process.env.NODE_ENV !== 'production';
if (isDevelopment) {
  console.log('🔧 Development mode - Environment variables check:');
  const requiredEnvVars = ['GOOGLE_API_KEY', 'AUTH_SECRET'];
  const optionalEnvVars = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'CLAUDE_API_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];

  console.log('✅ Required variables:');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`   ${varName}: ${value ? '✓ Set' : '❌ Missing'}`);
  });

  console.log('🔧 Optional variables:');
  optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`   ${varName}: ${value ? '✓ Set' : '⚠️  Not set'}`);
  });

  console.log('📁 Current working directory:', process.cwd());
  console.log('📄 .env file should be at:', path.join(process.cwd(), '.env'));
}

const app = express();
app.use(cookieParser());

// Behind proxies (e.g., Vercel) trust X-Forwarded-* headers
app.set('trust proxy', 1);

// Helper function to identify Ollama models
function isOllamaModelId(model = '') {
  const m = (model || '').toLowerCase().trim();
  // Common Ollama model prefixes and patterns
  const prefixes = ['gemma','llama','qwen','mistral','mixtral','phi','yi','deepseek','gpt-oss','neural','starling','command'];
  return m.includes(':') || prefixes.some(p => m.startsWith(p));
}

// Helper to compute base URL for OAuth redirects
function normalizeUrl(u) {
  if (!u) return null;
  const s = String(u).trim();
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  return withScheme.replace(/\/$/, '');
}
function getBaseUrl(req) {
  const envUrl = process.env.BACKEND_URL || process.env.DOMAIN || process.env.FRONTEND_URL;
  if (envUrl) {
    return normalizeUrl(envUrl);
  }
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').toString().split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

// CORS headers for development and production
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Build allowed origins dynamically from env
  const envAllowed = [
    normalizeUrl(process.env.FRONTEND_URL),
    normalizeUrl(process.env.BACKEND_URL),
    process.env.VERCEL_URL ? normalizeUrl(`https://${process.env.VERCEL_URL}`) : null,
    normalizeUrl(process.env.DOMAIN),
  ].filter(Boolean);

  const allowedOrigins = Array.from(new Set([
    'http://localhost:3000',
    'http://localhost:3001',
    ...envAllowed,
  ]));
  
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

// Relax COOP/COEP for OAuth popups, Google One Tap, and third-party embeds
app.use((req, res, next) => {
  // Use the most permissive COOP value so OAuth popups and third-party iframes can
  // communicate via postMessage. Browsers log a console error and block communication
  // when COOP is "same-origin" or "same-origin-allow-popups".
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  // Do not opt-in to COEP so third-party embeds (e.g. YouTube) retain access to
  // postMessage even when loaded without cross-origin isolation headers.
  res.removeHeader('Cross-Origin-Embedder-Policy');
  next();
});

const CUSTOM_PORT = Number(process.env.PORT);
const hasCustomPort = Number.isInteger(CUSTOM_PORT) && CUSTOM_PORT > 0;
const DEFAULT_PORT = 8081;
let serverPort = hasCustomPort ? CUSTOM_PORT : DEFAULT_PORT;

function isPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer();

    tester.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        reject(err);
      }
    });

    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });

    tester.listen({ port });
  });
}

async function findAvailablePort(startPort, maxAttempts = 10) {
  let attempt = 0;
  let candidate = startPort;

  while (attempt < maxAttempts) {
    const available = await isPortAvailable(candidate);
    if (available) {
      return candidate;
    }
    candidate += 1;
    attempt += 1;
  }

  throw new Error(`No available port found starting from ${startPort}`);
}

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
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
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

const geminiBootstrap = {
  initializeGeminiAPI,
  setClient(client) {
    ai = client;
  },
  getClient() {
    return ai;
  }
};

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
  
  // Handle Ollama connection (URL for local, API key for cloud)
  if (service === 'ollama') {
    const connections = getUserConnections(req.user.email);

    if (url) {
      // Local Ollama instance
      connections[service] = {
        type: 'url',
        name: 'Ollama (Local)',
        url: url,
        connectedAt: new Date().toISOString()
      };
      return res.json({ success: true, message: 'Ollama (Local) connected successfully' });
    } else if (apiKey) {
      // Ollama Cloud API
      connections[service] = {
        type: 'api_key',
        name: 'Ollama (Cloud)',
        apiKey: apiKey,
        apiUrl: 'https://ollama.com/api',
        connectedAt: new Date().toISOString(),
        features: ['web_search', 'web_fetch', 'cloud_models']
      };
      return res.json({ success: true, message: 'Ollama (Cloud) connected successfully' });
    } else {
      return res.status(400).json({ error: 'Either URL (for local) or API key (for cloud) is required for Ollama' });
    }
  }
  
  // Handle OAuth services
  const config = oauthConfigs[service];
  if (!config || !config.clientId) {
    return res.status(400).json({ error: `Service ${service} not configured or not supported` });
  }
  
  const redirectUri = `${getBaseUrl(req)}/api/services/${service}/callback`;
  const state = `${req.user.email}:${Date.now()}`; // Simple state for CSRF protection
  
  let authUrl;
  if (service.startsWith('google') || service === 'gmail') {
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
    const redirectUri = `${getBaseUrl(req)}/api/services/${service}/callback`;
    
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
    } else if (service.startsWith('google') || service === 'gmail') {
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
    } else if (service === 'ollama') {
      if (connection.type === 'url') {
        // Test local Ollama instance
        const response = await fetch(`${connection.url}/api/tags`);
        const models = await response.json();
        testResult.info = {
          type: 'local',
          models: models.models?.length || 0,
          url: connection.url
        };
      } else if (connection.type === 'api_key') {
        // Test Ollama Cloud API with the JavaScript library
        const ollama = new Ollama({
          host: 'https://ollama.com',
          auth: connection.apiKey
        });

        // Test with a simple web search
        const results = await ollama.webSearch({ query: 'test', max_results: 1 });
        testResult.info = {
          type: 'cloud',
          features: connection.features || ['web_search', 'web_fetch'],
          api_url: connection.apiUrl,
          test_results: results.results?.length || 0
        };
      }
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

// Universal chat endpoint that routes to appropriate AI provider
app.post('/api/chat', requireAuth, async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  try {
    const { model, messages, systemPrompt, enableThinking = false, thinkingBudget = 'medium' } = req.body;
    if (!model || !messages) {
      logger.warn('Bad request to /api/chat', { body: req.body });
      return res.status(400).json({ error: 'Missing "model" or "messages" in request body' });
    }

    const connections = getUserConnections(req.user.email);

    // Determine which service to use based on model name
    let service, response;

    if ((model.startsWith('gpt-') && !model.includes('gpt-oss')) || model.includes('openai')) {
      // OpenAI models
      service = 'openai';
      const connection = connections[service];
      if (!connection?.apiKey) {
        return res.status(400).json({ error: 'OpenAI not connected' });
      }

      const openaiMessages = messages.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.content || (msg.parts && msg.parts[0]?.text) || ''
      }));

      if (systemPrompt) {
        openaiMessages.unshift({ role: 'system', content: systemPrompt });
      }

      const requestBody = {
        model: model,
        messages: openaiMessages,
        max_tokens: 2000,
        temperature: 0.7
      };

      // Add thinking model support for GPT-OSS models
      if (enableThinking && (model.includes('gpt-oss') || model.includes('reasoning'))) {
        requestBody.reasoning_effort = thinkingBudget === 'low' ? 'low' : thinkingBudget === 'high' ? 'high' : 'medium';
      }

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const openaiData = await openaiResponse.json();
      if (!openaiResponse.ok) {
        throw new Error(openaiData.error?.message || 'OpenAI API error');
      }

      response = openaiData.choices[0].message.content;

      // Include reasoning for GPT-OSS thinking models
      if (enableThinking && openaiData.choices[0].message.reasoning) {
        response = `**Reasoning Process:**\n${openaiData.choices[0].message.reasoning}\n\n**Final Answer:**\n${response}`;
      }

    } else if (model.startsWith('claude-') || model.includes('anthropic')) {
      // Claude models
      service = 'claude';
      const connection = connections[service];
      if (!connection?.apiKey) {
        return res.status(400).json({ error: 'Claude not connected' });
      }

      const claudeMessages = messages.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.content || (msg.parts && msg.parts[0]?.text) || ''
      }));

      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': connection.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: claudeMessages,
          max_tokens: 2000,
          system: systemPrompt
        })
      });

      const claudeData = await claudeResponse.json();
      if (!claudeResponse.ok) {
        throw new Error(claudeData.error?.message || 'Claude API error');
      }

      response = claudeData.content[0].text;

    } else if (isOllamaModelId(model)) {
      // Ollama models
      service = 'ollama';
      const connection = connections[service];

      // Accept either local URL or cloud key, but don't deref null
      if (!connection) {
        return res.status(400).json({ error: 'Ollama is not connected. Provide http://localhost:11434 in Settings.' });
      }

      const ollamaMessages = messages.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.content || (msg.parts && msg.parts[0]?.text) || ''
      }));

      if (systemPrompt) {
        ollamaMessages.unshift({ role: 'system', content: systemPrompt });
      }

      // For local URL, no apiKey required
      const isLocal = connection?.type === 'url' && /^https?:\/\//i.test(connection.url || '');
      const ollamaBase = isLocal ? connection.url : (process.env.OLLAMA_API_BASE || connection.url);

      let ollamaUrl, headers = { 'Content-Type': 'application/json' };

      // Safe null checking for apiKey
      const apiKey = connection && connection.type === 'api_key' ? connection.apiKey : null;

      if (apiKey) {
        // Ollama Cloud
        ollamaUrl = 'https://ollama.com/api/chat';
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        // Local Ollama
        ollamaUrl = `${ollamaBase}/api/chat`;
      }

      // Validate the requested model exists; fail with a helpful 400 (not a 500)
      try {
        if (ollamaBase) {
          const tagsResp = await fetch(`${ollamaBase}/api/tags`);
          if (tagsResp.ok) {
            const { models: installed = [] } = await tagsResp.json();
            const names = new Set(installed.map(m => (m?.name || '').toLowerCase()));
            if (!names.has((model || '').toLowerCase())) {
              return res.status(400).json({
                error: `Model '${model}' is not installed on Ollama.`,
                available: [...names].sort(),
                hint: `Run: ollama pull ${model.split(':')[0]}`
              });
            }
          }
        }
      } catch (e) {
        // don't explode on tags failure—let the normal request still try
      }

      const requestBody = {
        model: model,
        messages: ollamaMessages,
        stream: false
      };

      // Add thinking model support for DeepSeek-R1 and other thinking models
      if (enableThinking && (model.includes('deepseek-r1') || model.includes('thinking') || model.includes('reasoning'))) {
        requestBody.think = true;
      }

      const ollamaResponse = await fetch(ollamaUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const ollamaData = await ollamaResponse.json();
      if (!ollamaResponse.ok) {
        throw new Error(ollamaData.error || 'Ollama API error');
      }

      response = ollamaData.message.content;

      // Include thinking process for Ollama thinking models
      if (enableThinking && ollamaData.message.thinking) {
        response = `**Thinking Process:**\n${ollamaData.message.thinking}\n\n**Final Answer:**\n${response}`;
      }

    } else {
      // Default to Gemini for built-in models
      service = 'gemini';

      // Convert messages to Gemini format
      const geminiContents = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content || (msg.parts && msg.parts[0]?.text) || '' }]
      }));

      // Add system prompt as first user message if provided
      if (systemPrompt) {
        geminiContents.unshift({
          role: 'user',
          parts: [{ text: systemPrompt }]
        });
      }

      const requestConfig = {
        model: model,
        contents: geminiContents
      };

      // Add thinking model support for Gemini 2.5
      if (enableThinking && (model.includes('2.5') || model.includes('thinking'))) {
        requestConfig.generationConfig = {
          thinkingConfig: {
            thinkingBudget: thinkingBudget,
            includeThoughts: true
          }
        };
      }

      const geminiResponse = await ai.models.generateContent(requestConfig);

      response = geminiResponse.candidates[0].content.parts[0].text;

      // Include thinking process for Gemini thinking models
      if (enableThinking && geminiResponse.candidates[0].content.thoughtSummary) {
        response = `**Thought Summary:**\n${geminiResponse.candidates[0].content.thoughtSummary}\n\n**Final Answer:**\n${response}`;
      }
    }

    res.json({ response, service });

  } catch (error) {
    logger.error('Error in universal chat endpoint:', { errorMessage: error.message, stack: error.stack });
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  } finally {
    end({ route: '/api/chat', code: res.statusCode, method: 'POST' });
    httpRequestsTotal.inc({ route: '/api/chat', code: res.statusCode, method: 'POST' });
  }
});

// Universal endpoint to get available models from all connected services
app.get('/api/models', requireAuth, async (req, res) => {
  try {
    const connections = getUserConnections(req.user.email);
    const availableModels = [];

    // Always include Gemini models (built-in)
    availableModels.push(
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Gemini', category: 'text', available: true },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', provider: 'Gemini', category: 'text', available: true }
    );

    // OpenAI models (if connected)
    if (connections.openai?.apiKey) {
      availableModels.push(
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', category: 'text', available: true },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', category: 'text', available: true },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', category: 'text', available: true }
      );
    }

    // Claude models (if connected)
    if (connections.claude?.apiKey) {
      availableModels.push(
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Claude', category: 'text', available: true },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'Claude', category: 'text', available: true }
      );
    }

    // Ollama models (if connected) - fetch from the instance
    if (connections.ollama) {
      try {
        if (connections.ollama.type === 'url') {
          // Local Ollama instance
          const resp = await fetch(`${connections.ollama.url}/api/tags`);
          if (resp.ok) {
            const data = await resp.json();
            const TEXT_EXCLUDES = [
              'embed','embedding','nomic','bge','e5','gte','gte-','all-minilm','text-embed',
              'llava','moondream','whisper','audiodec','sd-','flux','llm-vision'
            ];
            const isTextish = (n) => !TEXT_EXCLUDES.some(x => n.includes(x));
            const ollamaModels = (data.models || [])
              .map(m => (m?.name || '').toLowerCase())
              .filter(n => isTextish(n))
              .map(n => ({
                id: n,
                name: n.split(':')[0] || n,
                provider: 'Ollama',
                category: 'text',
                available: true
              }));
            availableModels.push(...ollamaModels);
          }
        } else if (connections.ollama.type === 'api_key') {
          // Ollama Cloud - add some common cloud models
          availableModels.push(
            { id: 'qwen3:480b-cloud', name: 'Qwen 3 480B', provider: 'Ollama Cloud', category: 'text', available: true },
            { id: 'gpt-oss', name: 'GPT OSS', provider: 'Ollama Cloud', category: 'text', available: true }
          );
        }
      } catch (ollamaError) {
        logger.warn('Failed to fetch Ollama models:', ollamaError.message);
        // Don't fail the entire request if Ollama is unreachable
      }
    }

    res.json({ models: availableModels });
  } catch (error) {
    logger.error('Error fetching available models:', { errorMessage: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Ollama: list available models (local or cloud)
app.get('/api/ollama/models', requireAuth, async (req, res) => {
  try {
    const connections = getUserConnections(req.user.email);
    const connection = connections.ollama;
    if (!connection) {
      return res.status(400).json({ error: 'Ollama is not connected. Please connect in Settings.' });
    }

    let models = [];

    if (connection.type === 'url') {
      // Local Ollama instance
      const resp = await fetch(`${connection.url}/api/tags`);
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(502).json({ error: 'Failed to fetch models from local Ollama', details: text });
      }
      const data = await resp.json();
      models = (data.models || []).map(m => ({
        name: m.name,
        modified_at: m.modified_at,
        size: m.size,
        digest: m.digest,
        details: m.details || {},
        source: 'local'
      }));
    } else if (connection.type === 'api_key') {
      // Ollama Cloud API - for now return some standard cloud models
      // Note: Ollama's cloud API doesn't have a public models endpoint yet
      models = [
        {
          name: 'qwen3:480b-cloud',
          description: 'Qwen 3 480B Cloud Model',
          source: 'cloud',
          features: ['web_search', 'large_context']
        },
        {
          name: 'gpt-oss',
          description: 'GPT Open Source Model',
          source: 'cloud',
          features: ['web_search', 'reasoning']
        }
      ];
    }

    res.json({ models, connection_type: connection.type });
  } catch (error) {
    logger.error('Error fetching Ollama models:', { errorMessage: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Embeddings via Ollama
app.post('/api/embeddings/ollama', requireAuth, async (req, res) => {
  try {
    const { texts, model } = req.body;
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'texts must be a non-empty array' });
    }

    const connections = getUserConnections(req.user.email);
    const connection = connections.ollama;
    if (!connection || !connection.url) {
      return res.status(400).json({ error: 'Ollama is not connected. Please connect in Settings.' });
    }

    // If model not provided, attempt to auto-select from known embedding models present
    let embeddingModel = model;
    if (!embeddingModel) {
      const tagsResp = await fetch(`${connection.url}/api/tags`);
      const tags = await tagsResp.json();
      const available = (tags.models || []).map(m => m.name);
      const candidates = ['nomic-embed-text', 'all-minilm', 'mxbai-embed-large'];
      embeddingModel = candidates.find(c => available.some(a => a.startsWith(c)));
      if (!embeddingModel) {
        return res.status(400).json({ error: 'No embedding model found in Ollama. Please `ollama pull nomic-embed-text` or similar and retry.' });
      }
    }

    // Ollama embeddings endpoint supports one prompt per call. Batch loop.
    const vectors = [];
    for (const t of texts) {
      const r = await fetch(`${connection.url}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: embeddingModel, prompt: t })
      });
      if (!r.ok) {
        const detail = await r.text();
        return res.status(502).json({ error: 'Embedding generation failed', details: detail });
      }
      const j = await r.json();
      if (!j || !j.embedding) {
        return res.status(502).json({ error: 'Invalid embedding response from Ollama' });
      }
      vectors.push(j.embedding);
    }

    res.json({ model: embeddingModel, vectors });
  } catch (error) {
    logger.error('Embeddings error (Ollama):', { errorMessage: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Simple per-user, per-module RAG store with file persistence
import fs from 'fs';
import fsp from 'fs/promises';
const RAG_PATH = path.join(__dirname, 'data', 'rag-store.json');
async function ensureRagFile() {
  try {
    await fsp.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fsp.access(RAG_PATH).catch(async () => {
      await fsp.writeFile(RAG_PATH, JSON.stringify({}), 'utf-8');
    });
  } catch (e) {
    logger.error('Failed to ensure rag-store file:', e.message);
  }
}
function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
async function loadRag() {
  await ensureRagFile();
  const buf = await fsp.readFile(RAG_PATH, 'utf-8');
  return JSON.parse(buf || '{}');
}
async function saveRag(db) {
  await ensureRagFile();
  await fsp.writeFile(RAG_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// Upsert chunks into RAG
app.post('/api/rag/upsert', requireAuth, async (req, res) => {
  try {
    const { moduleId, chunks, embeddingModel } = req.body;
    if (!moduleId || !Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({ error: 'moduleId and non-empty chunks are required' });
    }

    // Compute embeddings with Ollama (server decides model if not provided)
    const texts = chunks.map(c => c.text);
    const embResp = await fetch(`${req.protocol}://${req.get('host')}/api/embeddings/ollama`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.cookie || '' },
      body: JSON.stringify({ texts, model: embeddingModel })
    });
    const embJson = await embResp.json();
    if (!embResp.ok) return res.status(embResp.status).json(embJson);

    const db = await loadRag();
    const userKey = req.user.email;
    db[userKey] = db[userKey] || {};
    db[userKey][moduleId] = db[userKey][moduleId] || [];

    const now = new Date().toISOString();
    embJson.vectors.forEach((vec, i) => {
      const item = {
        id: chunks[i].id || crypto.randomUUID(),
        text: chunks[i].text,
        metadata: chunks[i].metadata || {},
        embedding: vec,
        ts: now
      };
      db[userKey][moduleId].push(item);
    });

    await saveRag(db);
    res.json({ success: true, count: embJson.vectors.length });
  } catch (error) {
    logger.error('RAG upsert error:', { errorMessage: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Query RAG
app.post('/api/rag/query', requireAuth, async (req, res) => {
  try {
    const { moduleId, query, topK = 4, embeddingModel } = req.body;
    if (!moduleId || !query) {
      return res.status(400).json({ error: 'moduleId and query are required' });
    }

    // Embed query
    const embResp = await fetch(`${req.protocol}://${req.get('host')}/api/embeddings/ollama`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.cookie || '' },
      body: JSON.stringify({ texts: [query], model: embeddingModel })
    });
    const embJson = await embResp.json();
    if (!embResp.ok) return res.status(embResp.status).json(embJson);

    const qvec = embJson.vectors[0];
    const db = await loadRag();
    const userKey = req.user.email;
    const items = (db[userKey]?.[moduleId]) || [];

    const scored = items.map(it => ({ ...it, score: cosineSim(qvec, it.embedding) }));
    scored.sort((a, b) => b.score - a.score);
    res.json({ results: scored.slice(0, topK) });
  } catch (error) {
    logger.error('RAG query error:', { errorMessage: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Ollama official web search API (2025) - using JavaScript library
app.post('/api/ollama/web_search', requireAuth, async (req, res) => {
  try {
    const { query, max_results = 5 } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Missing "query" in request body' });
    }

    const connections = getUserConnections(req.user.email);
    const connection = connections.ollama;

    if (!connection || connection.type !== 'api_key' || !connection.apiKey) {
      return res.status(400).json({ error: 'Ollama Cloud API key is required for web search. Please connect Ollama Cloud in Settings.' });
    }

    // Initialize Ollama client with API key
    const ollama = new Ollama({
      host: 'https://ollama.com',
      auth: connection.apiKey
    });

    // Use the official JavaScript library method
    const results = await ollama.webSearch({
      query,
      max_results: Math.min(max_results, 10)
    });

    logger.info('Ollama web search successful', {
      query,
      results_count: results.results?.length || 0
    });

    res.json(results);

  } catch (error) {
    logger.error('Ollama web search error:', { errorMessage: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Ollama official web fetch API (2025) - using JavaScript library
app.post('/api/ollama/web_fetch', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Missing "url" in request body' });
    }

    const connections = getUserConnections(req.user.email);
    const connection = connections.ollama;

    if (!connection || connection.type !== 'api_key' || !connection.apiKey) {
      return res.status(400).json({ error: 'Ollama Cloud API key is required for web fetch. Please connect Ollama Cloud in Settings.' });
    }

    // Initialize Ollama client with API key
    const ollama = new Ollama({
      host: 'https://ollama.com',
      auth: connection.apiKey
    });

    // Use the official JavaScript library method
    const results = await ollama.webFetch({ url });

    logger.info('Ollama web fetch successful', {
      url,
      title: results.title || 'No title',
      content_length: results.content?.length || 0,
      links_count: results.links?.length || 0
    });

    res.json(results);

  } catch (error) {
    logger.error('Ollama web fetch error:', { errorMessage: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Ollama-aware web search endpoint (legacy with fallback providers)
app.post('/api/ollama/search', requireAuth, async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  try {
    const { query, maxResults = 5 } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Missing "query" in request body' });
    }

    const connections = getUserConnections(req.user.email);
    const connection = connections.ollama;
    const provider = connection?.searchProvider;
    const apiKey = connection?.searchApiKey;

    let results;
    if (provider === 'tavily' && apiKey) {
      // Tavily web search API
      const tavResp = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          include_answer: true,
          search_depth: 'advanced',
          max_results: Math.min(maxResults, 10)
        })
      });
      const tav = await tavResp.json();
      if (!tavResp.ok) {
        return res.status(502).json({ error: 'Tavily search failed', details: tav });
      }
      results = {
        query,
        instant_answer: tav.answer || null,
        related_topics: (tav.results || []).map(r => ({ title: r.title, url: r.url, text: r.content }))
      };
    } else if (provider === 'brave' && apiKey) {
      // Brave Search API
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${Math.min(maxResults, 10)}`;
      const braveResp = await fetch(url, {
        headers: {
          'X-Subscription-Token': apiKey
        }
      });
      const brave = await braveResp.json();
      if (!braveResp.ok) {
        return res.status(502).json({ error: 'Brave search failed', details: brave });
      }
      const items = (brave.web?.results || []).map(r => ({ title: r.title, url: r.url, text: r.description || r.snippet || '' }));
      results = {
        query,
        related_topics: items
      };
    } else {
      // Fallback to DuckDuckGo instant answer
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      results = {
        query,
        instant_answer: data.AbstractText || data.Answer || null,
        abstract_url: data.AbstractURL || null,
        definition: data.Definition || null,
        related_topics: (data.RelatedTopics || []).slice(0, maxResults).map(topic => ({
          title: topic.Text || '',
          url: topic.FirstURL || ''
        }))
      };
    }

    res.json(results);
  } catch (error) {
    logger.error('Ollama web search failed:', { errorMessage: error.message, stack: error.stack });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Search failed: ' + error.message });
    }
  } finally {
    end({ route: '/api/ollama/search', code: res.statusCode, method: 'POST' });
    httpRequestsTotal.inc({ route: '/api/ollama/search', code: res.statusCode, method: 'POST' });
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
// Workflow to Documentation API
app.post('/api/workflow/generate-docs', requireAuth, async (req, res) => {
  const timer = httpRequestDurationMicroseconds.startTimer({ route: '/api/workflow/generate-docs' });

  try {
    const { workflowResult, templateId, enhanceWithAI = false, model = 'gemini-2.5-flash' } = req.body;

    if (!workflowResult || !templateId) {
      return res.status(400).json({
        error: 'Missing required fields: workflowResult and templateId'
      });
    }

    // Import the workflow mapper (ES modules require dynamic import)
    const { mapWorkflowToTemplate, enhanceTemplateContent, canMapWorkflowToTemplate } =
      await import('./src/lib/archiva/workflow-mapper.js');

    // Validate workflow can be mapped to template
    if (!canMapWorkflowToTemplate(workflowResult, templateId)) {
      return res.status(400).json({
        error: `Workflow data is not compatible with template: ${templateId}`,
        required: 'Workflow must contain steps array'
      });
    }

    // Map workflow data to template fields
    let templateData = mapWorkflowToTemplate(workflowResult, templateId);

    // Enhance with AI if requested
    if (enhanceWithAI) {
      try {
        templateData = await enhanceTemplateContent(templateData, model);
      } catch (enhanceError) {
        logger.warn('AI enhancement failed:', enhanceError.message);
        // Continue without enhancement
      }
    }

    // Import and render the template
    let renderedContent;
    try {
      if (templateId === 'process_journal') {
        const { render } = await import('./src/lib/archiva/templates/process_journal.js');
        renderedContent = {
          markdown: render('md', templateData),
          html: render('html', templateData)
        };
      } else if (templateId === 'experiment_report') {
        const { render } = await import('./src/lib/archiva/templates/experiment_report.js');
        renderedContent = {
          markdown: render('md', templateData),
          html: render('html', templateData)
        };
      } else if (templateId === 'prompt_card') {
        const { render } = await import('./src/lib/archiva/templates/prompt_card.js');
        renderedContent = {
          markdown: render('md', templateData),
          html: render('html', templateData)
        };
      } else {
        return res.status(400).json({
          error: `Template renderer not found: ${templateId}`,
          available: ['process_journal', 'experiment_report', 'prompt_card']
        });
      }
    } catch (renderError) {
      logger.error('Template rendering failed:', renderError);
      return res.status(500).json({ error: 'Template rendering failed' });
    }

    res.json({
      success: true,
      templateId,
      templateData,
      renderedContent,
      enhanced: enhanceWithAI,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Workflow documentation generation failed:', error);
    res.status(500).json({ error: 'Documentation generation failed' });
  } finally {
    timer({ code: res.statusCode });
    httpRequestsTotal.inc({ route: '/api/workflow/generate-docs', code: res.statusCode, method: 'POST' });
  }
});

// ===================================
// MODULE RESOURCE MANAGEMENT API
// ===================================

// In-memory storage for module resources (replace with database in production)
const moduleResources = {
  // Structure: moduleId -> { chats: [], workflows: [], documentation: [] }
};

// Helper to get or create module resource store
function getModuleStore(moduleId) {
  if (!moduleResources[moduleId]) {
    moduleResources[moduleId] = {
      chats: [],
      workflows: [],
      documentation: []
    };
  }
  return moduleResources[moduleId];
}

// Helper to generate resource ID
function generateResourceId(type) {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get resource index (lightweight metadata) for a module resource type
app.get('/api/modules/:moduleId/resources/:resourceType/index', requireAuth, (req, res) => {
  const timer = httpRequestDurationMicroseconds.startTimer();

  try {
    const { moduleId, resourceType } = req.params;

    if (!['chats', 'workflows', 'documentation'].includes(resourceType)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    const store = getModuleStore(moduleId);
    const resources = store[resourceType] || [];

    // Create lightweight index with metadata only
    const recent = resources
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 20) // Return 20 most recent
      .map(resource => ({
        id: resource.id,
        title: resource.title,
        timestamp: resource.updatedAt || resource.createdAt,
        preview: resource.preview || resource.description?.substring(0, 100),
        status: resource.status,
        progress: resource.progress,
        source: resource.source
      }));

    const items = resources.map(resource => ({
      id: resource.id,
      title: resource.title,
      timestamp: resource.updatedAt || resource.createdAt,
      preview: resource.preview || resource.description?.substring(0, 100),
      status: resource.status,
      progress: resource.progress,
      source: resource.source
    }));

    res.json({
      recent,
      items,
      total: resources.length
    });

  } catch (error) {
    logger.error('Resource index fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch resource index' });
  } finally {
    timer({ code: res.statusCode });
    httpRequestsTotal.inc({ route: '/api/modules/resources/index', code: res.statusCode, method: 'GET' });
  }
});

// Get full resource data
app.get('/api/modules/:moduleId/resources/:resourceType/:resourceId', requireAuth, (req, res) => {
  const timer = httpRequestDurationMicroseconds.startTimer();

  try {
    const { moduleId, resourceType, resourceId } = req.params;

    if (!['chats', 'workflows', 'documentation'].includes(resourceType)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    const store = getModuleStore(moduleId);
    const resource = store[resourceType]?.find(r => r.id === resourceId);

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json(resource);

  } catch (error) {
    logger.error('Resource fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
  } finally {
    timer({ code: res.statusCode });
    httpRequestsTotal.inc({ route: '/api/modules/resources/item', code: res.statusCode, method: 'GET' });
  }
});

// Search resources
app.get('/api/modules/:moduleId/resources/:resourceType/search', requireAuth, (req, res) => {
  const timer = httpRequestDurationMicroseconds.startTimer();

  try {
    const { moduleId, resourceType } = req.params;
    const { q: query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }

    if (!['chats', 'workflows', 'documentation'].includes(resourceType)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    const store = getModuleStore(moduleId);
    const resources = store[resourceType] || [];

    // Simple text search (replace with full-text search in production)
    const searchTerm = query.toLowerCase();
    const results = resources
      .filter(resource =>
        resource.title?.toLowerCase().includes(searchTerm) ||
        resource.description?.toLowerCase().includes(searchTerm) ||
        resource.content?.toLowerCase().includes(searchTerm) ||
        (resource.messages && resource.messages.some(msg =>
          msg.content?.toLowerCase().includes(searchTerm)
        ))
      )
      .map(resource => ({
        id: resource.id,
        title: resource.title,
        timestamp: resource.updatedAt || resource.createdAt,
        preview: resource.preview || resource.description?.substring(0, 100),
        status: resource.status,
        progress: resource.progress,
        source: resource.source,
        relevance: 1 // Could implement proper relevance scoring
      }))
      .sort((a, b) => b.relevance - a.relevance || new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50); // Limit search results

    res.json(results);

  } catch (error) {
    logger.error('Resource search failed:', error);
    res.status(500).json({ error: 'Failed to search resources' });
  } finally {
    timer({ code: res.statusCode });
    httpRequestsTotal.inc({ route: '/api/modules/resources/search', code: res.statusCode, method: 'GET' });
  }
});

// Add new resource
app.post('/api/modules/:moduleId/resources/:resourceType', requireAuth, (req, res) => {
  const timer = httpRequestDurationMicroseconds.startTimer();

  try {
    const { moduleId, resourceType } = req.params;
    const resourceData = req.body;

    if (!['chats', 'workflows', 'documentation'].includes(resourceType)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    const store = getModuleStore(moduleId);
    const newResource = {
      id: generateResourceId(resourceType),
      ...resourceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user?.email || 'system'
    };

    store[resourceType].push(newResource);

    logger.info(`Added ${resourceType} resource to module ${moduleId}`, {
      resourceId: newResource.id,
      title: newResource.title
    });

    res.status(201).json(newResource);

  } catch (error) {
    logger.error('Resource creation failed:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  } finally {
    timer({ code: res.statusCode });
    httpRequestsTotal.inc({ route: '/api/modules/resources/create', code: res.statusCode, method: 'POST' });
  }
});

// Update resource
app.put('/api/modules/:moduleId/resources/:resourceType/:resourceId', requireAuth, (req, res) => {
  const timer = httpRequestDurationMicroseconds.startTimer();

  try {
    const { moduleId, resourceType, resourceId } = req.params;
    const updates = req.body;

    if (!['chats', 'workflows', 'documentation'].includes(resourceType)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    const store = getModuleStore(moduleId);
    const resourceIndex = store[resourceType]?.findIndex(r => r.id === resourceId);

    if (resourceIndex === -1) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const updatedResource = {
      ...store[resourceType][resourceIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    store[resourceType][resourceIndex] = updatedResource;

    logger.info(`Updated ${resourceType} resource in module ${moduleId}`, {
      resourceId,
      title: updatedResource.title
    });

    res.json(updatedResource);

  } catch (error) {
    logger.error('Resource update failed:', error);
    res.status(500).json({ error: 'Failed to update resource' });
  } finally {
    timer({ code: res.statusCode });
    httpRequestsTotal.inc({ route: '/api/modules/resources/update', code: res.statusCode, method: 'PUT' });
  }
});

// Delete resource
app.delete('/api/modules/:moduleId/resources/:resourceType/:resourceId', requireAuth, (req, res) => {
  const timer = httpRequestDurationMicroseconds.startTimer();

  try {
    const { moduleId, resourceType, resourceId } = req.params;

    if (!['chats', 'workflows', 'documentation'].includes(resourceType)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    const store = getModuleStore(moduleId);
    const resourceIndex = store[resourceType]?.findIndex(r => r.id === resourceId);

    if (resourceIndex === -1) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const deletedResource = store[resourceType].splice(resourceIndex, 1)[0];

    logger.info(`Deleted ${resourceType} resource from module ${moduleId}`, {
      resourceId,
      title: deletedResource.title
    });

    res.json({ success: true, deletedResource });

  } catch (error) {
    logger.error('Resource deletion failed:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  } finally {
    timer({ code: res.statusCode });
    httpRequestsTotal.inc({ route: '/api/modules/resources/delete', code: res.statusCode, method: 'DELETE' });
  }
});

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
    await geminiBootstrap.initializeGeminiAPI();

    if (hasCustomPort) {
      const available = await isPortAvailable(CUSTOM_PORT);
      if (!available) {
        throw new Error(`Configured port ${CUSTOM_PORT} is already in use. Stop the process using it or set PORT to a different value.`);
      }
      serverPort = CUSTOM_PORT;
    } else {
      const resolvedPort = await findAvailablePort(DEFAULT_PORT);
      if (resolvedPort !== DEFAULT_PORT) {
        logger.warn(`Port ${DEFAULT_PORT} is in use. Falling back to ${resolvedPort}.`);
      }
      serverPort = resolvedPort;
    }

    // Start the server
    app.listen(serverPort, () => {
      logger.info(`Server listening at http://localhost:${serverPort}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server unless running in a test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, initializeGeminiAPI, startServer, geminiBootstrap };
export default app;
