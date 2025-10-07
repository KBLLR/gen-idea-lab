import express from 'express';
import { requireAuth } from '../../src/shared/lib/auth.js';
import { httpRequestDurationMicroseconds, httpRequestsTotal } from '../../src/shared/lib/metrics.js';

export default function createProxyRouter({ getGeminiClient }) {
  const router = express.Router();

  // Generic proxy to Gemini API (non-streaming)
  router.post('/proxy', requireAuth, async (req, res) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    try {
      const { model, contents, config, safetySettings } = req.body;
      if (!model || !contents) return res.status(400).json({ error: 'Missing "model" or "contents" in request body' });
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({ model, contents, config, safetySettings });
      res.json(response);
    } catch (error) {
      if (!res.headersSent) res.status(500).json({ error: error.message });
    } finally {
      end({ route: '/api/proxy', code: res.statusCode, method: 'POST' });
      httpRequestsTotal.inc({ route: '/api/proxy', code: res.statusCode, method: 'POST' });
    }
  });

  return router;
}
