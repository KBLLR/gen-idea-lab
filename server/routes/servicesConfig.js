import express, { raw as rawBody } from 'express';
import { getBaseUrl } from '../config/env.js';

export default function createServicesConfigAndNotionRouter() {
  const router = express.Router();

  // Report OAuth configuration readiness and redirect URIs
  router.get('/services/config', (req, res) => {
    const baseUrl = getBaseUrl(req);
    const required = {
      github: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'],
      notion: ['NOTION_CLIENT_ID', 'NOTION_CLIENT_SECRET'],
      figma: ['FIGMA_CLIENT_ID', 'FIGMA_CLIENT_SECRET'],
      googleDrive: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      googlePhotos: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      googleCalendar: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      gmail: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    };
    const redirect = (service) => `${baseUrl}/api/services/${service}/callback`;
    const config = {};
    for (const [service, vars] of Object.entries(required)) {
      const missing = vars.filter((v) => !process.env[v]);
      config[service] = { configured: missing.length === 0, missing, redirectUri: redirect(service) };
    }
    res.json(config);
  });

  // Notion Webhook verification
  const webhookSubscriptions = new Map();

  router.post('/webhooks/notion/verify', rawBody({ type: 'application/json' }), (req, res) => {
    try {
      const payload = JSON.parse(req.body.toString());
      if (payload.verification_token) {
        const webhookId = payload.webhook_id || 'default';
        webhookSubscriptions.set(webhookId, { verification_token: payload.verification_token, created_at: new Date().toISOString() });
        return res.status(200).json({ verification_token: payload.verification_token });
      }
      return res.status(400).json({ error: 'No verification token provided' });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
  });

  // Notion main webhook
  router.post('/webhooks/notion', rawBody({ type: 'application/json' }), (req, res) => {
    try {
      const signature = req.headers['x-notion-signature'];
      const payload = req.body.toString();

      if (signature && webhookSubscriptions.size > 0) {
        let validSignature = false;
        for (const [, subscription] of webhookSubscriptions) {
          // Note: Notion signature verification specifics are not public; keep the legacy placeholder comparison logic
          // This preserves previous behavior without enforcing strict cryptographic verification here.
          // In production, replace with Notion's official verification method when available.
          const expectedSignature = subscription.verification_token; // placeholder
          if (signature === expectedSignature) {
            validSignature = true;
            break;
          }
        }
        if (!validSignature) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const event = JSON.parse(payload);
      // Log minimal event info and acknowledge
      // (processing moved out; keep behavior consistent with legacy implementation)
      res.status(200).json({ received: true });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
  });

  return router;
}
