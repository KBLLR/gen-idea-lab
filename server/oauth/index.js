/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unified OAuth router - modular service connection subsystem
 */

import express from 'express';
import logger from '../../src/shared/lib/logger.js';
import { requireAuth } from '../../src/lib/auth.js';
import tokenStore from '../../src/lib/secureTokens.js';
import { PROVIDERS, isProviderConfigured, getAllProviderConfigs } from './config.js';
import { handleOAuthCallback } from './callbacks.js';

// Provider-specific handlers
import * as github from './providers/github.js';
import * as notion from './providers/notion.js';
import * as figma from './providers/figma.js';
import * as google from './providers/google.js';
import * as ollama from './providers/ollama.js';
import * as drawthings from './providers/drawthings.js';
import * as apiKeys from './providers/apiKeys.js';

/**
 * Create the OAuth router
 */
export default function createOAuthRouter({ getUserConnections }) {
  const router = express.Router();

  // GET /api/services/config - Get configuration status for all providers
  router.get('/config', requireAuth, async (req, res) => {
    try {
      const configs = getAllProviderConfigs(req);
      res.json(configs);
    } catch (error) {
      logger.error('Failed to get service configs:', error);
      res.status(500).json({ error: 'Failed to get service configurations' });
    }
  });

  // GET /api/services - List connected services
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

  // POST /api/services/:service/connect - Initiate connection
  router.post('/:service/connect', requireAuth, async (req, res) => {
    const { service } = req.params;
    const { apiKey, url, transport } = req.body;

    try {
      // API key-based services
      if (['openai', 'claude', 'gemini'].includes(service)) {
        const result = await apiKeys.connect(req.user.email, service, apiKey);
        return res.json(result);
      }

      // DrawThings (endpoint-based)
      if (service === 'drawthings') {
        const result = await drawthings.connect(req.user.email, { url, transport });
        return res.json(result);
      }

      // Ollama (hybrid)
      if (service === 'ollama') {
        const result = await ollama.connect(req.user.email, { apiKey, url });
        return res.json(result);
      }

      // OAuth-based services
      const providerConfig = PROVIDERS[service];
      if (!providerConfig || providerConfig.type === 'api_key' || providerConfig.type === 'endpoint') {
        return res.status(400).json({ error: `Service ${service} not supported for OAuth` });
      }

      const configStatus = isProviderConfigured(service);
      if (!configStatus.configured) {
        return res.status(400).json({
          error: `Service ${service} not configured`,
          missing: configStatus.missing,
        });
      }

      // Build OAuth URL
      const state = `${req.user.email}:${Date.now()}`;
      let authUrl;

      if (service === 'github') {
        authUrl = github.buildAuthUrl(req, state);
      } else if (service === 'notion') {
        authUrl = notion.buildAuthUrl(req, state);
      } else if (service === 'figma') {
        authUrl = figma.buildAuthUrl(req, state);
      } else if (['googleDrive', 'googlePhotos', 'googleCalendar', 'gmail'].includes(service)) {
        authUrl = google.buildAuthUrl(req, service, state);
      } else {
        return res.status(400).json({ error: `OAuth flow not implemented for ${service}` });
      }

      res.json({ authUrl });
    } catch (error) {
      logger.error(`Connection failed for ${service}:`, error);
      res.status(500).json({ error: error.message || 'Connection failed' });
    }
  });

  // GET /api/services/:service/callback - OAuth callback handler
  router.get('/:service/callback', async (req, res) => {
    const { service } = req.params;
    await handleOAuthCallback(service, req, res);
  });

  // DELETE /api/services/:service - Disconnect service
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

  // POST /api/services/:service/test - Test service connection
  router.post('/:service/test', requireAuth, async (req, res) => {
    const { service } = req.params;
    const connections = getUserConnections(req.user.email);
    const connection = connections[service];

    if (!connection) {
      return res.status(404).json({ error: 'Service not connected' });
    }

    try {
      let testResult;

      if (service === 'github') {
        testResult = await github.testConnection(connection);
      } else if (service === 'notion') {
        testResult = await notion.testConnection(connection);
      } else if (service === 'figma') {
        testResult = await figma.testConnection(connection);
      } else if (['googleDrive', 'googlePhotos', 'googleCalendar', 'gmail'].includes(service)) {
        testResult = await google.testConnection(connection, service);
      } else if (service === 'ollama') {
        testResult = await ollama.testConnection(connection);
      } else if (service === 'drawthings') {
        testResult = await drawthings.testConnection(connection);
      } else if (['openai', 'claude', 'gemini'].includes(service)) {
        testResult = await apiKeys.testConnection(connection, service);
      } else {
        return res.status(400).json({ error: `Test not implemented for ${service}` });
      }

      res.json(testResult);
    } catch (error) {
      logger.error(`Error testing ${service} connection:`, error);
      res.status(500).json({ error: 'Connection test failed', details: error.message });
    }
  });

  return router;
}
