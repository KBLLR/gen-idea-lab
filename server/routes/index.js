import express from 'express';
import auth from './auth.js';
// Note: image/services may require factories with dependencies; wire here in a later pass.

const api = express.Router();
api.use('/auth', auth);

// Lightweight health endpoint
api.get('/healthz', (_req, res) => res.json({ ok: true }));

export default api;
