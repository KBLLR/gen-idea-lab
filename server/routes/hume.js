import express from 'express';
import logger from '../../src/shared/lib/logger.js';
import { requireAuth } from '../../src/shared/lib/auth.js';

export default function createHumeRouter() {
  const router = express.Router();

  // Hume AI - Get access token for EVI (Empathic Voice Interface)
  router.get('/services/hume/token', requireAuth, async (req, res) => {
    try {
      const apiKey = process.env.HUME_API_KEY;
      const secretKey = process.env.HUME_SECRET_KEY;
      if (!apiKey || !secretKey) {
        return res.status(500).json({
          error: 'Hume API credentials not configured',
          details: 'HUME_API_KEY and HUME_SECRET_KEY must be set in environment variables'
        });
      }
      const response = await fetch('https://api.hume.ai/oauth2-cc/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'client_credentials', client_id: apiKey, client_secret: secretKey })
      });
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Hume token request failed:', { status: response.status, error: errorText });
        return res.status(response.status).json({ error: 'Failed to fetch Hume access token', details: errorText });
      }
      const data = await response.json();
      logger.info('Hume access token generated successfully', { expiresIn: data.expires_in, user: req.user.email });
      const tokenResponse = { accessToken: data.access_token, expiresIn: data.expires_in, tokenType: data.token_type };
      if (process.env.HUME_CONFIG_ID) tokenResponse.configId = process.env.HUME_CONFIG_ID;
      res.json(tokenResponse);
    } catch (err) {
      logger.error('Hume token error:', err);
      res.status(500).json({ error: 'Failed to generate Hume access token', details: err.message });
    }
  });

  // Hume EVI configs
  router.post('/hume/configs', requireAuth, async (req, res) => {
    try {
      const apiKey = process.env.HUME_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'HUME_API_KEY not configured' });
      const r = await fetch('https://api.hume.ai/v0/evi/configs', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hume-Api-Key': apiKey }, body: JSON.stringify(req.body)
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        logger.error('Hume create config failed', { status: r.status, data });
        return res.status(r.status).json(data);
      }
      res.json(data);
    } catch (err) {
      logger.error('Hume create config error:', err);
      res.status(500).json({ error: 'Failed to create Hume config', details: err.message });
    }
  });

  router.post('/hume/prompts', requireAuth, async (req, res) => {
    try {
      const apiKey = process.env.HUME_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'HUME_API_KEY not configured' });
      const r = await fetch('https://api.hume.ai/v0/evi/prompts', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hume-Api-Key': apiKey }, body: JSON.stringify(req.body)
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        logger.error('Hume create prompt failed', { status: r.status, data });
        return res.status(r.status).json(data);
      }
      res.json(data);
    } catch (err) {
      logger.error('Hume create prompt error:', err);
      res.status(500).json({ error: 'Failed to create Hume prompt', details: err.message });
    }
  });

  router.post('/hume/tools', requireAuth, async (req, res) => {
    try {
      const apiKey = process.env.HUME_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'HUME_API_KEY not configured' });
      const r = await fetch('https://api.hume.ai/v0/evi/tools', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hume-Api-Key': apiKey }, body: JSON.stringify(req.body)
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        logger.error('Hume create tool failed', { status: r.status, data });
        return res.status(r.status).json(data);
      }
      res.json(data);
    } catch (err) {
      logger.error('Hume create tool error:', err);
      res.status(500).json({ error: 'Failed to create Hume tool', details: err.message });
    }
  });

  // List Hume voices
  router.get('/hume/voices', requireAuth, async (req, res) => {
    try {
      const apiKey = process.env.HUME_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'HUME_API_KEY not configured' });
      const provider = req.query.provider || 'HUME_AI';
      const pageNumber = req.query.page_number || 0;
      const pageSize = req.query.page_size || 100;
      const r = await fetch(`https://api.hume.ai/v0/tts/voices?provider=${provider}&page_number=${pageNumber}&page_size=${pageSize}`, { method: 'GET', headers: { 'X-Hume-Api-Key': apiKey } });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        logger.error('Hume list voices failed', { status: r.status, data });
        return res.status(r.status).json(data);
      }
      res.json(data);
    } catch (err) {
      logger.error('Hume list voices error:', err);
      res.status(500).json({ error: 'Failed to list Hume voices', details: err.message });
    }
  });

  return router;
}
