import express from 'express';
import { requireAuth } from '../../src/shared/lib/auth.js';
import logger from '../../src/shared/lib/logger.js';

export default function createEmbeddingsRouter({ getUserConnections }) {
  const router = express.Router();

  // Embeddings via Ollama
  router.post('/embeddings/ollama', requireAuth, async (req, res) => {
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

  return router;
}
