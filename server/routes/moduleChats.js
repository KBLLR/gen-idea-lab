import express from 'express';
import { requireAuth } from '../../src/shared/lib/auth.js';
import logger from '../../src/shared/lib/logger.js';
import { httpRequestDurationMicroseconds, httpRequestsTotal } from '../../src/shared/lib/metrics.js';

export default function createModuleChatsRouter({ getDb }) {
  const router = express.Router();

  // Save module chat
  router.post('/module-chats/save', requireAuth, async (req, res) => {
    try {
      const { moduleId, title, model, messages } = req.body || {};
      if (!moduleId || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid payload' });
      const db = await getDb();
      const doc = {
        moduleId,
        title: title || `Chat ${new Date().toLocaleString()}`,
        model: model || 'gemini-2.5-flash',
        messages,
        createdAt: new Date().toISOString(),
      };
      const r = await db.collection('module_assistant_chats').insertOne(doc);
      res.json({ ok: true, id: r.insertedId });
    } catch (e) {
      logger.error('save chat failed:', e);
      res.status(500).json({ error: 'Save failed' });
    }
  });

  // List module chats
  router.get('/module-chats', requireAuth, async (req, res) => {
    try {
      const moduleId = req.query.moduleId;
      const limit = Number(req.query.limit || 20);
      if (!moduleId) return res.status(400).json({ error: 'moduleId required' });
      const db = await getDb();
      const items = await db
        .collection('module_assistant_chats')
        .find({ moduleId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      res.json({ ok: true, items });
    } catch (e) {
      logger.error('fetch chats failed:', e);
      res.status(500).json({ error: 'Fetch failed' });
    }
  });

  return router;
}
