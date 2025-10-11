import express from 'express';
import logger from '../../src/lib/logger.js';
import { requireAuth } from '../../src/lib/auth.js';
import tokenStore from '../../src/lib/secureTokens.js';
import { getBaseUrl, getFrontendBaseUrl, sanitizeEndpointUrl } from '../config/env.js';

export default function createServicesRouter({ getUserConnections }) {
  const router = express.Router();

  router.get('/', requireAuth, async (req, res) => {
    try {
      const dbMap = await tokenStore.listConnected(req.user.email);
      const out = {};
      for (const [service, entry] of Object.entries(dbMap)) {
        out[service] = { connected: true, info: entry.info || null };
      }
      res.json(out);
    } catch (e) {
      logger.error('Failed to list services:', e);
      res.json({});
    }
  });

  router.post('/:service/connect', requireAuth, async (req, res) => {
    const { service } = req.params;
    const { apiKey, url } = req.body;

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

    if (apiKey && ['openai', 'claude', 'gemini'].includes(service)) {
      await tokenStore.upsertApiKey(req.user.email, service, apiKey, { name: service });
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

      const connectionName = transport === 'grpc' ? 'DrawThings (gRPC)' : 'DrawThings (HTTP)';
      await tokenStore.upsertEndpoint(req.user.email, service, { url: endpoint, transport, info: { name: connectionName } });

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

    if (service === 'ollama') {
      if (url) {
        await tokenStore.upsertEndpoint(req.user.email, service, { url, transport: 'http', info: { name: 'Ollama (Local)' } });
        return res.json({ success: true, message: 'Ollama (Local) connected successfully' });
      } else if (apiKey) {
        await tokenStore.upsertApiKey(req.user.email, service, apiKey, { name: 'Ollama (Cloud)', apiUrl: 'https://ollama.com/api', features: ['web_search', 'web_fetch', 'cloud_models'] });
        return res.json({ success: true, message: 'Ollama (Cloud) connected successfully' });
      } else {
        return res.status(400).json({ error: 'Either URL (for local) or API key (for cloud) is required for Ollama' });
      }
    }

    const config = oauthConfigs[service];
    if (!config || !config.clientId) {
      return res.status(400).json({ error: `Service ${service} not configured or not supported` });
    }

    const redirectUri = `${getBaseUrl(req)}/api/services/${service}/callback`;
    logger.info(`OAuth start for ${service}`, { redirectUri, baseUrl: getBaseUrl(req) });
    const state = `${req.user.email}:${Date.now()}`;

    let authUrl;
    if (service.startsWith('google') || service === 'gmail') {
      authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scope)}&response_type=code&state=${encodeURIComponent(state)}&access_type=offline&prompt=consent`;
    } else if (service === 'github') {
      authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scope)}&state=${encodeURIComponent(state)}`;
    } else if (service === 'notion') {
      authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${encodeURIComponent(state)}&owner=user`;
    } else if (service === 'figma') {
      authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scope)}&response_type=code&state=${encodeURIComponent(state)}`;
    }

    res.json({ authUrl });
  });

  router.get('/:service/callback', async (req, res) => {
    const { service } = req.params;
    const { code, state, error } = req.query;

    if (error) {
      const front = getFrontendBaseUrl(req);
      return res.redirect(`${front}/?error=oauth_error&service=${service}`);
    }

    if (!code || !state) {
      const front = getFrontendBaseUrl(req);
      return res.redirect(`${front}/?error=missing_params&service=${service}`);
    }

    const [userEmail] = state.split(':');
    if (!userEmail) {
      const front = getFrontendBaseUrl(req);
      return res.redirect(`${front}/?error=invalid_state&service=${service}`);
    }

    try {
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
        if (!response.ok) {
          const text = await response.text();
          logger.error('Notion token exchange failed', { status: response.status, text });
          const front = getFrontendBaseUrl(req);
          return res.redirect(`${front}/?error=token_exchange&service=${service}`);
        }
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
        const front = getFrontendBaseUrl(req);
        return res.redirect(`${front}/?error=token_exchange&service=${service}`);
      }

      await tokenStore.upsertOAuthToken(userEmail, service, {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        scopes: (tokenResponse.scope || '').split(' ').filter(Boolean),
        expiresAt: tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString() : null,
        info: { name: service.charAt(0).toUpperCase() + service.slice(1) }
      });

      logger.info(`Successfully connected ${service} for user ${userEmail}`);
      const front = getFrontendBaseUrl(req);
      res.redirect(`${front}/?success=connected&service=${service}`);

    } catch (error) {
      logger.error(`Error during ${service} OAuth callback:`, error);
      const front = getFrontendBaseUrl(req);
      res.redirect(`${front}/?error=callback_error&service=${service}`);
    }
  });

  router.delete('/:service', requireAuth, async (req, res) => {
    const { service } = req.params;
    try {
      await tokenStore.removeProvider(req.user.email, service);
      logger.info(`Disconnected ${service} for user ${req.user.email}`);
      res.json({ success: true, message: `${service} disconnected successfully` });
    } catch (e) {
      logger.error('Failed to disconnect:', e);
      res.status(500).json({ error: 'Failed to disconnect service' });
    }
  });

  router.post('/:service/test', requireAuth, async (req, res) => {
    const { service } = req.params;
    const connections = getUserConnections(req.user.email);
    const connection = connections[service];

    if (!connection) {
      return res.status(404).json({ error: 'Service not connected' });
    }

    try {
      let testResult = { connected: true, service };

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
          const response = await fetch(`${connection.url}/api/tags`);
          const models = await response.json();
          testResult.info = {
            type: 'local',
            models: models.models?.length || 0,
            url: connection.url
          };
        } else if (connection.type === 'api_key') {
          const ollama = new Ollama({
            host: 'https://ollama.com',
            auth: connection.apiKey
          });

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
      }

      res.json(testResult);
    } catch (error) {
      logger.error(`Error testing ${service} connection:`, error);
      res.status(500).json({ error: 'Connection test failed', details: error.message });
    }
  });

  return router;
}
