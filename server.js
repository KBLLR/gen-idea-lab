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
import { DEFAULT_IMAGE_MODELS } from './src/lib/imageProviders.js';
import { renderTemplate, getTemplateIds } from './src/lib/archiva/templates/library.js';

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

function sanitizeEndpointUrl(endpoint) {
  if (!endpoint) return null;
  const trimmed = String(endpoint).trim();
  if (!trimmed) return null;
  const withScheme = /^(https?|grpc|grpcs):\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withScheme.replace(/\/$/, '');
}

function normalizeDrawThingsUrl(endpoint, transport = 'http') {
  const sanitized = sanitizeEndpointUrl(endpoint);
  if (!sanitized) return null;
  if (transport === 'grpc') {
    return sanitized
      .replace(/^grpcs:\/\//i, 'https://')
      .replace(/^grpc:\/\//i, 'http://');
  }
  return sanitized;
}

function parseBase64ImagePayload(image) {
  if (!image || typeof image !== 'string') {
    return null;
  }
  const match = image.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }
  return { mimeType: 'image/png', base64: image };
}

const providerRateLimitMessages = {
  gemini: 'Gemini image generation rate limit reached. Please try again shortly.',
  openai: 'OpenAI image generation rate limit reached. Please try again later.',
  drawthings: 'DrawThings is busy right now. Wait a moment or try another provider.'
};

function respondWithRateLimit(res, provider, message) {
  const fallback = providerRateLimitMessages[provider] || 'Rate limit reached. Please try again later.';
  return res.status(429).json({
    error: message || fallback,
    code: 'RATE_LIMIT'
  });
}

const GEMINI_SAFETY_SETTINGS = [
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
  'HARM_CATEGORY_HARASSMENT'
].map(category => ({ category, threshold: 'BLOCK_NONE' }));

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

// University API proxy endpoints
app.post('/api/university/auth', requireAuth, async (req, res) => {
  try {
    const { googleIdToken } = req.body;

    if (!googleIdToken) {
      return res.status(400).json({ error: 'Google ID token required' });
    }

    // Forward authentication to University API
    const response = await fetch('https://api.app.code.berlin/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        variables: { code: googleIdToken },
        operationName: 'googleSignin',
        query: 'mutation googleSignin($code: String!) { googleSignin(code: $code) { token } }'
      })
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(400).json({ error: data.errors[0].message });
    }

    const sessionToken = data.data?.googleSignin?.token;
    if (!sessionToken) {
      return res.status(400).json({ error: 'No session token received' });
    }

    // Store university connection
    const connections = getUserConnections(req.user.email);
    connections.university = {
      type: 'university_api',
      name: 'CODE University',
      sessionToken: sessionToken,
      connectedAt: new Date().toISOString()
    };

    // Forward any set-cookie headers from university API
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      res.setHeader('set-cookie', cookies);
    }

    res.json({
      success: true,
      sessionToken,
      message: 'University API connected successfully'
    });
  } catch (error) {
    logger.error('University authentication failed:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

app.post('/api/university/refresh', requireAuth, async (req, res) => {
  try {
    const response = await fetch('https://api.app.code.berlin/cid_refresh', {
      method: 'POST',
      headers: {
        'Cookie': req.headers.cookie || ''
      }
    });

    const data = await response.json();

    if (!data.ok || !data.token) {
      return res.status(401).json({ error: 'Token refresh failed' });
    }

    // Update stored connection
    const connections = getUserConnections(req.user.email);
    if (connections.university) {
      connections.university.sessionToken = data.token;
      connections.university.lastRefresh = new Date().toISOString();
    }

    res.json({
      success: true,
      sessionToken: data.token
    });
  } catch (error) {
    logger.error('University token refresh failed:', error);
    res.status(500).json({ error: 'Token refresh failed', details: error.message });
  }
});

app.post('/api/university/graphql', requireAuth, async (req, res) => {
  try {
    const { query, variables, operationName } = req.body;
    const connections = getUserConnections(req.user.email);
    const universityConnection = connections.university;

    if (!universityConnection?.sessionToken) {
      return res.status(401).json({ error: 'University API not connected' });
    }

    const response = await fetch('https://api.app.code.berlin/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${universityConnection.sessionToken}`
      },
      body: JSON.stringify({
        query,
        variables,
        operationName
      })
    });

    const data = await response.json();

    if (data.errors) {
      // Check if token expired
      const isTokenError = data.errors.some(error =>
        error.message.includes('token') ||
        error.message.includes('unauthorized') ||
        error.message.includes('expired')
      );

      if (isTokenError) {
        return res.status(401).json({ error: 'Token expired', requiresRefresh: true });
      }
    }

    res.json(data);
  } catch (error) {
    logger.error('University GraphQL request failed:', error);
    res.status(500).json({ error: 'GraphQL request failed', details: error.message });
  }
});

app.delete('/api/university/disconnect', requireAuth, async (req, res) => {
  try {
    const connections = getUserConnections(req.user.email);
    delete connections.university;

    res.json({ success: true, message: 'University API disconnected' });
  } catch (error) {
    logger.error('University disconnect failed:', error);
    res.status(500).json({ error: 'Disconnect failed', details: error.message });
  }
});

// In-memory storage for OAuth state (in production, use Redis or proper session store)
const oauthStates = new Map();

// University OAuth flow endpoints
app.get('/api/services/university/connect', requireAuth, (req, res) => {
  // Generate Google OAuth URL for University authentication
  const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const clientId = '358660676559-02rrefr671bdi1chqtd3l0c44mc8jt9p.apps.googleusercontent.com';
  const redirectUri = `${process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:8081'}/api/services/university/callback`;
  const scope = 'openid email profile';
  const state = `${req.user.email}-${Math.random().toString(36).substring(2, 15)}`;

  const authUrl = `${googleAuthUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;

  // Store state for verification with expiration (5 minutes)
  oauthStates.set(state, {
    userEmail: req.user.email,
    createdAt: Date.now(),
    expires: Date.now() + 5 * 60 * 1000 // 5 minutes
  });

  // Clean up expired states
  for (const [key, value] of oauthStates.entries()) {
    if (Date.now() > value.expires) {
      oauthStates.delete(key);
    }
  }

  res.redirect(authUrl);
});

app.get('/api/services/university/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.send(`
      <script>
        window.opener.postMessage({
          type: 'university-auth-error',
          error: '${error}'
        }, '${process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000'}');
        window.close();
      </script>
    `);
  }

  // Verify state and get user info
  const stateData = oauthStates.get(state);
  if (!code || !stateData || Date.now() > stateData.expires) {
    oauthStates.delete(state); // Clean up
    return res.send(`
      <script>
        window.opener.postMessage({
          type: 'university-auth-error',
          error: 'Invalid state, missing code, or expired session'
        }, '${process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000'}');
        window.close();
      </script>
    `);
  }

  const userEmail = stateData.userEmail;
  oauthStates.delete(state); // Clean up used state

  try {
    // Exchange code for Google ID token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: '358660676559-02rrefr671bdi1chqtd3l0c44mc8jt9p.apps.googleusercontent.com',
        client_secret: '', // No client secret needed for this flow
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:8081'}/api/services/university/callback`,
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

    // Store university connection
    const connections = getUserConnections(userEmail);
    connections.university = {
      type: 'university_api',
      connected: true,
      sessionToken,
      connectedAt: new Date().toISOString(),
      lastRefresh: new Date().toISOString()
    };

    res.send(`
      <script>
        window.opener.postMessage({
          type: 'university-auth-success',
          sessionToken: '${sessionToken}'
        }, '${process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000'}');
        window.close();
      </script>
    `);

  } catch (error) {
    logger.error('University OAuth callback failed:', error);
    res.send(`
      <script>
        window.opener.postMessage({
          type: 'university-auth-error',
          error: '${error.message}'
        }, '${process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000'}');
        window.close();
      </script>
    `);
  }
});

// Test endpoint for University API connection
app.get('/api/university/test', requireAuth, async (req, res) => {
  try {
    const connections = getUserConnections(req.user.email);
    const universityConnection = connections.university;

    if (!universityConnection?.sessionToken) {
      return res.status(400).json({
        error: 'University not connected',
        message: 'Please connect University service in settings first'
      });
    }

    // Test with a simple user query
    const response = await fetch('https://api.app.code.berlin/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${universityConnection.sessionToken}`
      },
      credentials: 'include',
      body: JSON.stringify({
        query: 'query testConnection { me { firstName lastName email } }',
        operationName: 'testConnection'
      })
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(400).json({
        error: 'GraphQL error',
        details: data.errors
      });
    }

    res.json({
      success: true,
      connection: 'University API connected successfully',
      user: data.data?.me,
      tokenValid: true
    });

  } catch (error) {
    logger.error('University test failed:', error);
    res.status(500).json({
      error: 'Connection test failed',
      details: error.message
    });
  }
});

// Initialize Google Auth for Gemini API with OAuth2
let ai;

function ensureGeminiAvailable(res) {
  if (!ai) {
    if (!res.headersSent) {
      res.status(503).json({ error: 'Gemini API is not configured. Please add credentials to enable this feature.' });
    }
    return false;
  }
  return true;
}

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
      }
    } else {
      logger.warn('No authentication method available for Gemini API');
      logger.warn('Proceeding without Gemini integration. Set GOOGLE_API_KEY or configure ADC to enable it.');
    }
  }

  if (!ai) {
    logger.warn('Gemini functionality is disabled; related endpoints will return 503 responses.');
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
      ollama: null,
      drawthings: null
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
      info: connection
        ? {
            name: connection.name || service,
            transport: connection.transport,
            url: connection.url
          }
        : null
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
    },
    university: {
      clientId: '358660676559-02rrefr671bdi1chqtd3l0c44mc8jt9p.apps.googleusercontent.com',
      scope: 'openid email profile',
      authUrl: 'https://accounts.google.com/o/oauth2/auth',
      apiBase: 'https://api.app.code.berlin'
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

  if (service === 'drawthings') {
    const endpoint = sanitizeEndpointUrl(url);
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint URL is required for DrawThings' });
    }

    const rawTransport = (req.body.transport || '').toString().toLowerCase();
    const inferredTransport = endpoint.startsWith('grpc') ? 'grpc' : 'http';
    const transport = ['http', 'grpc'].includes(rawTransport) ? rawTransport : inferredTransport;

    const connections = getUserConnections(req.user.email);
    const connectionName = transport === 'grpc' ? 'DrawThings (gRPC)' : 'DrawThings (HTTP)';

    connections[service] = {
      type: 'endpoint',
      name: connectionName,
      url: endpoint,
      transport,
      connectedAt: new Date().toISOString()
    };

    return res.json({
      success: true,
      message: 'DrawThings connected successfully',
      info: {
        name: connectionName,
        transport,
        url: endpoint
      }
    });
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
  } else if (service === 'university') {
    // University uses custom authentication flow
    return res.json({ authUrl: '/api/services/university/connect', requiresCustomFlow: true });
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
    } else if (service === 'university') {
      // University service uses client-side authentication
      return res.status(400).json({ error: 'University authentication must be handled client-side' });
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
    const frontendUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000';
    res.redirect(`${frontendUrl}/?success=connected&service=${service}`);
    
  } catch (error) {
    logger.error(`Error during ${service} OAuth callback:`, error);
    const frontendUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000';
    res.redirect(`${frontendUrl}/?error=callback_error&service=${service}`);
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
    } else if (service === 'drawthings' && connection.type === 'endpoint') {
      testResult.info = {
        type: 'local',
        transport: connection.transport || 'http',
        url: connection.url
      };
    } else if (service === 'university' && connection.type === 'university_api') {
      // Test University API connection
      const response = await fetch('https://api.app.code.berlin/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${connection.sessionToken}`
        },
        body: JSON.stringify({
          query: 'query currentUser { me { firstName lastName email studentId program semester } }',
          operationName: 'currentUser'
        })
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(`University API test failed: ${data.errors[0].message}`);
      }

      const user = data.data?.me;
      testResult.info = {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        studentId: user.studentId,
        program: user.program,
        semester: user.semester
      };
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
  if (!ai) {
    return res.status(503).json({ status: 'error', message: 'Gemini API not configured.' });
  }
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


app.post('/api/image/generate', requireAuth, async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  const providerId = (req.body?.provider || 'gemini').toString().toLowerCase();

  try {
    const { prompt, image, model } = req.body || {};
    if (!prompt || !image) {
      return res.status(400).json({ error: 'Both prompt and image fields are required.' });
    }

    const parsedImage = parseBase64ImagePayload(image);
    if (!parsedImage?.base64) {
      return res.status(400).json({ error: 'Invalid image payload supplied.' });
    }

    const connections = getUserConnections(req.user.email);
    let resolvedModel = model || DEFAULT_IMAGE_MODELS[providerId] || null;
    let outputBase64;
    let outputMime = parsedImage.mimeType || 'image/png';

    if (providerId === 'gemini') {
      const geminiClient = geminiBootstrap.getClient();
      if (!geminiClient?.models?.generateContent) {
        return res.status(503).json({ error: 'Gemini client not configured.' });
      }

      const request = {
        model: resolvedModel || DEFAULT_IMAGE_MODELS.gemini || 'gemini-2.5-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: parsedImage.base64,
                mimeType: parsedImage.mimeType || 'image/png'
              }
            },
            { text: prompt }
          ]
        },
        safetySettings: GEMINI_SAFETY_SETTINGS
      };

      if ((request.model || '').includes('image')) {
        request.config = { responseModalities: ['IMAGE', 'TEXT'] };
      }

      const response = await geminiClient.models.generateContent(request);
      const candidate = response?.candidates?.[0];
      const inlinePart = candidate?.content?.parts?.find((part) => part.inlineData);

      if (!inlinePart?.inlineData?.data) {
        const textPart = candidate?.content?.parts?.find((part) => part.text);
        throw new Error(textPart?.text || 'Gemini response missing image data.');
      }

      outputBase64 = inlinePart.inlineData.data;
      outputMime = inlinePart.inlineData.mimeType || outputMime;
      resolvedModel = request.model;
    } else if (providerId === 'openai') {
      const connection = connections.openai;
      if (!connection?.apiKey) {
        return res.status(400).json({ error: 'OpenAI not connected' });
      }

      const openaiModel = resolvedModel || DEFAULT_IMAGE_MODELS.openai || 'gpt-image-1';
      const formData = new FormData();
      formData.append(
        'image',
        new Blob([Buffer.from(parsedImage.base64, 'base64')], { type: parsedImage.mimeType || 'image/png' }),
        'input.png'
      );
      formData.append('model', openaiModel);
      formData.append('prompt', prompt);
      formData.append('n', '1');
      formData.append('response_format', 'b64_json');

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${connection.apiKey}`
        },
        body: formData
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) {
          return respondWithRateLimit(res, 'openai', body?.error?.message);
        }
        throw new Error(body?.error?.message || `OpenAI request failed with status ${response.status}`);
      }

      const openaiData = body?.data?.[0]?.b64_json;
      if (!openaiData) {
        throw new Error('OpenAI response missing image data.');
      }

      outputBase64 = openaiData;
      outputMime = 'image/png';
      resolvedModel = openaiModel;
    } else if (providerId === 'drawthings') {
      const connection = connections.drawthings;
      if (!connection?.url) {
        return res.status(400).json({ error: 'DrawThings not connected' });
      }

      const endpoint = normalizeDrawThingsUrl(connection.url, connection.transport);
      if (!endpoint) {
        return res.status(400).json({ error: 'Invalid DrawThings endpoint.' });
      }

      const response = await fetch(`${endpoint}/v1/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          image: parsedImage.base64,
          model: resolvedModel,
          mimeType: parsedImage.mimeType || 'image/png'
        })
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) {
          return respondWithRateLimit(res, 'drawthings', body?.error);
        }
        throw new Error(body?.error || `DrawThings request failed with status ${response.status}`);
      }

      const dtImage =
        body?.image ||
        body?.base64 ||
        body?.data ||
        body?.images?.[0]?.base64 ||
        body?.images?.[0]?.data;

      if (!dtImage) {
        throw new Error('DrawThings response missing image data.');
      }

      if (dtImage.startsWith('data:')) {
        const parsed = parseBase64ImagePayload(dtImage);
        outputBase64 = parsed?.base64;
        outputMime = parsed?.mimeType || outputMime;
      } else {
        outputBase64 = dtImage;
      }

      if (!resolvedModel && body?.model) {
        resolvedModel = body.model;
      }
    } else {
      return res.status(400).json({ error: `Unsupported provider: ${providerId}` });
    }

    if (!outputBase64) {
      throw new Error('Provider response did not include image data.');
    }

    const dataUrl = outputBase64.startsWith('data:')
      ? outputBase64
      : `data:${outputMime || 'image/png'};base64,${outputBase64}`;

    return res.json({
      image: dataUrl,
      provider: providerId,
      model: resolvedModel || null
    });
  } catch (error) {
    logger.error('Image generation failed:', {
      errorMessage: error.message,
      provider: providerId
    });

    if (!res.headersSent) {
      if (
        error?.status === 'RESOURCE_EXHAUSTED' ||
        error?.statusCode === 429 ||
        error?.code === 'RATE_LIMIT'
      ) {
        return respondWithRateLimit(res, providerId, error.message);
      }

      res.status(500).json({ error: error.message || 'Image generation failed' });
    }
  } finally {
    end({ route: '/api/image/generate', code: res.statusCode, method: 'POST' });
    httpRequestsTotal.inc({ route: '/api/image/generate', code: res.statusCode, method: 'POST' });
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

    if (!ensureGeminiAvailable(res)) {
      return;
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

      if (!ensureGeminiAvailable(res)) {
        return;
      }

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

// Planner workflow generation endpoint
app.post('/api/planner/generate-from-context', requireAuth, async (req, res) => {
  try {
    const { context } = req.body;
    if (!context) {
      return res.status(400).json({ error: 'Context is required' });
    }

    const connections = getUserConnections(req.user.email);

    // Create a workflow generation prompt
    const systemPrompt = `You are a workflow generation assistant. Based on the provided application context, generate a workflow graph with nodes and connections that would be useful for the user's current situation.

Return a JSON object with:
- title: A descriptive title for the workflow
- nodes: Array of node objects with id, type, position {x, y}, and data {label, description}
- edges: Array of edge objects with id, source, target

Available node types: module, assistant, task, tool, workflow, connector, source, model-provider

Focus on creating practical, actionable workflows that relate to the user's current context.`;

    const userPrompt = `Current Application Context:
- Active App: ${context.activeApp}
- Active Module: ${context.activeModule ? `${context.activeModule.id} (${context.activeModule['Module Title']})` : 'None'}
- Connected Services: ${context.connectedServices?.join(', ') || 'None'}
- Recent Chat History: ${context.orchestratorHistory?.map(h => `${h.role}: ${h.parts[0]?.text}`).slice(-3).join('\n') || 'No recent messages'}

Generate a workflow that would be helpful for this context.`;

    // Use the chat endpoint internally to generate the workflow
    const chatResponse = await fetch(`${req.protocol}://${req.get('host')}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || ''
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!chatResponse.ok) {
      throw new Error('Failed to generate workflow via AI');
    }

    const aiResponse = await chatResponse.text();

    // Try to extract JSON from the response
    let workflowData;
    try {
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        workflowData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      // Fallback: create a simple default workflow
      workflowData = {
        title: `Workflow for ${context.activeApp || 'Current Context'}`,
        nodes: [
          {
            id: 'start-1',
            type: 'default',
            position: { x: 100, y: 100 },
            data: { label: 'Start', description: 'Generated workflow starting point' }
          },
          {
            id: 'context-1',
            type: 'default',
            position: { x: 300, y: 100 },
            data: { label: 'Current Context', description: `Working with ${context.activeApp}` }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'start-1', target: 'context-1' }
        ]
      };
    }

    res.json(workflowData);

  } catch (error) {
    logger.error('Workflow generation failed:', error);
    res.status(500).json({ error: 'Failed to generate workflow' });
  }
});

// Universal endpoint to get available models from all connected services
app.get('/api/models', requireAuth, async (req, res) => {
  try {
    const connections = getUserConnections(req.user.email);
    const availableModels = [];

    // Always include Gemini models (built-in)
    availableModels.push(
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Gemini', category: 'text', available: Boolean(ai) },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', provider: 'Gemini', category: 'text', available: Boolean(ai) }
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

    // Hugging Face models (if connected)
    if (connections.huggingface?.apiKey) {
      availableModels.push(
        { id: 'microsoft/DialoGPT-medium', name: 'DialoGPT Medium', provider: 'Hugging Face', category: 'text', available: true },
        { id: 'facebook/blenderbot-400M-distill', name: 'BlenderBot 400M', provider: 'Hugging Face', category: 'text', available: true },
        { id: 'microsoft/CodeBERT-base', name: 'CodeBERT Base', provider: 'Hugging Face', category: 'code', available: true }
      );
    }

    // Replicate models (if connected)
    if (connections.replicate?.apiKey) {
      availableModels.push(
        { id: 'meta/llama-2-70b-chat', name: 'Llama 2 70B Chat', provider: 'Replicate', category: 'text', available: true },
        { id: 'stability-ai/stable-diffusion', name: 'Stable Diffusion', provider: 'Replicate', category: 'image', available: true },
        { id: 'replicate/musicgen', name: 'MusicGen', provider: 'Replicate', category: 'audio', available: true }
      );
    }

    // Together AI models (if connected)
    if (connections.together?.apiKey) {
      availableModels.push(
        { id: 'togethercomputer/llama-2-70b-chat', name: 'Llama 2 70B Chat', provider: 'Together AI', category: 'text', available: true },
        { id: 'togethercomputer/falcon-40b-instruct', name: 'Falcon 40B Instruct', provider: 'Together AI', category: 'text', available: true },
        { id: 'togethercomputer/RedPajama-INCITE-7B-Chat', name: 'RedPajama 7B Chat', provider: 'Together AI', category: 'text', available: true }
      );
    }

    // Mistral AI models (if connected)
    if (connections.mistral?.apiKey) {
      availableModels.push(
        { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'Mistral AI', category: 'text', available: true },
        { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'Mistral AI', category: 'text', available: true },
        { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'Mistral AI', category: 'text', available: true }
      );
    }

    // Cohere models (if connected)
    if (connections.cohere?.apiKey) {
      availableModels.push(
        { id: 'command', name: 'Command', provider: 'Cohere', category: 'text', available: true },
        { id: 'command-light', name: 'Command Light', provider: 'Cohere', category: 'text', available: true },
        { id: 'summarize-xlarge', name: 'Summarize XLarge', provider: 'Cohere', category: 'text', available: true }
      );
    }

    // vLLM models (if connected)
    if (connections.vllm?.url) {
      availableModels.push(
        { id: 'vllm-hosted-model', name: 'vLLM Hosted Model', provider: 'vLLM', category: 'text', available: true }
      );
    }

    // LocalAI models (if connected)
    if (connections.localai?.url) {
      availableModels.push(
        { id: 'localai-model', name: 'LocalAI Model', provider: 'LocalAI', category: 'text', available: true }
      );
    }

    // Stability AI models (if connected)
    if (connections.stability?.apiKey) {
      availableModels.push(
        { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0', provider: 'Stability AI', category: 'image', available: true },
        { id: 'stable-diffusion-v1-6', name: 'Stable Diffusion 1.6', provider: 'Stability AI', category: 'image', available: true }
      );
    }

    // Midjourney models (if connected)
    if (connections.midjourney?.apiKey) {
      availableModels.push(
        { id: 'midjourney-v6', name: 'Midjourney v6', provider: 'Midjourney', category: 'image', available: true }
      );
    }

    // Runway models (if connected)
    if (connections.runway?.apiKey) {
      availableModels.push(
        { id: 'runway-gen3', name: 'Runway Gen-3', provider: 'Runway ML', category: 'video', available: true }
      );
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


// --- Placeholder Routes for ResourceManager ---

// Endpoint to get a resource index
app.get('/api/modules/:moduleId/resources/:resourceType/index', requireAuth, (req, res) => {
  const { moduleId, resourceType } = req.params;
  logger.info(`Serving placeholder index for ${moduleId}/${resourceType}`);
  res.json({ recent: [], total: 0, items: [] });
});

// Endpoint to get a specific resource
app.get('/api/modules/:moduleId/resources/:resourceType/:resourceId', requireAuth, (req, res) => {
  const { moduleId, resourceType, resourceId } = req.params;
  logger.info(`Serving placeholder resource for ${moduleId}/${resourceType}/${resourceId}`);
  res.json({ id: resourceId, content: `Placeholder content for ${resourceId}` });
});

// Endpoint for resource search
app.get('/api/modules/:moduleId/resources/:resourceType/search', requireAuth, (req, res) => {
  const { moduleId, resourceType, q } = req.params;
  logger.info(`Serving placeholder search results for ${moduleId}/${resourceType} with query "${q}"`);
  res.json([]);
});


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
      renderedContent = {
        markdown: renderTemplate(templateId, 'md', templateData),
        html: renderTemplate(templateId, 'html', templateData)
      };
    } catch (renderError) {
      logger.error('Template rendering failed:', renderError);
      return res.status(400).json({
        error: `Template renderer not found or failed: ${templateId}`,
        available: getTemplateIds()
      });
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
    logger.error('Failed to start server:', error);
    console.error('Full error details:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// Start the server unless running in a test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, initializeGeminiAPI, startServer, geminiBootstrap };
export default app;
