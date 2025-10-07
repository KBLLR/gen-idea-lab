import express from 'express';
import logger from '../../src/shared/lib/logger.js';
import { requireAuth } from '../../src/shared/lib/auth.js';
import { Ollama } from 'ollama';
import { getBaseUrl } from '../config/env.js';

export default function createToolsRouter({ getUserConnections }) {
  const router = express.Router();

  // Unified web search
  router.post('/tools/web-search', requireAuth, async (req, res) => {
    try {
      const { query, max_results = 5 } = req.body;
      if (!query) return res.status(400).json({ error: 'Missing "query" in request body' });

      const connections = getUserConnections(req.user.email);

      // Try Ollama Cloud web search first
      const ollamaApiKey = connections.ollama?.apiKey || process.env.OLLAMA_API_KEY;
      if (ollamaApiKey && (connections.ollama?.type === 'api_key' || process.env.OLLAMA_API_KEY)) {
        try {
          logger.info('Attempting Ollama web search', { query, using_env_key: !connections.ollama?.apiKey });
          const ollama = new Ollama({ host: 'https://ollama.com', auth: ollamaApiKey });
          const results = await ollama.webSearch({ query, max_results: Math.min(max_results, 10) });
          return res.json({ results: results.results || [], source: 'ollama' });
        } catch (e) {
          logger.warn('Ollama web search failed, trying fallback', { error: e.message });
        }
      }

      // Google Custom Search fallback
      if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
        try {
          const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=${Math.min(max_results, 10)}`;
          const searchResponse = await fetch(searchUrl);
          const searchData = await searchResponse.json();
          if (searchData.items) {
            const results = searchData.items.map(item => ({ title: item.title, url: item.link, snippet: item.snippet }));
            return res.json({ results, source: 'google' });
          }
        } catch (googleError) {
          logger.warn('Google search failed', { error: googleError.message });
        }
      }

      // No search provider
      return res.status(503).json({ error: 'No web search provider available. Please configure Ollama Cloud or Google Custom Search.', results: [] });
    } catch (error) {
      logger.error('Web search tool error:', { errorMessage: error.message });
      res.status(500).json({ error: error.message, results: [] });
    }
  });

  // Ollama official: web_search
  router.post('/ollama/web_search', requireAuth, async (req, res) => {
    try {
      const { query, max_results = 5 } = req.body;
      if (!query) return res.status(400).json({ error: 'Missing "query" in request body' });
      const connections = getUserConnections(req.user.email);
      const connection = connections.ollama;
      if (!connection || connection.type !== 'api_key' || !connection.apiKey) {
        return res.status(400).json({ error: 'Ollama Cloud API key is required for web search. Please connect Ollama Cloud in Settings.' });
      }
      const ollama = new Ollama({ host: 'https://ollama.com', auth: connection.apiKey });
      const results = await ollama.webSearch({ query, max_results: Math.min(max_results, 10) });
      res.json(results);
    } catch (error) {
      logger.error('Ollama web search error:', { errorMessage: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Ollama official: web_fetch
  router.post('/ollama/web_fetch', requireAuth, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'Missing "url" in request body' });
      const connections = getUserConnections(req.user.email);
      const connection = connections.ollama;
      if (!connection || connection.type !== 'api_key' || !connection.apiKey) {
        return res.status(400).json({ error: 'Ollama Cloud API key is required for web fetch. Please connect Ollama Cloud in Settings.' });
      }
      const ollama = new Ollama({ host: 'https://ollama.com', auth: connection.apiKey });
      const results = await ollama.webFetch({ url });
      res.json(results);
    } catch (error) {
      logger.error('Ollama web fetch error:', { errorMessage: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Legacy Ollama-aware search with fallbacks
  router.post('/ollama/search', requireAuth, async (req, res) => {
    try {
      const { query, maxResults = 5 } = req.body;
      if (!query) return res.status(400).json({ error: 'Missing "query" in request body' });
      const connections = getUserConnections(req.user.email);
      const connection = connections.ollama;
      const provider = connection?.searchProvider;
      const apiKey = connection?.searchApiKey;

      let results;
      if (provider === 'tavily' && apiKey) {
        const tavResp = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: apiKey, query, include_answer: true, search_depth: 'advanced', max_results: Math.min(maxResults, 10) }) });
        const tav = await tavResp.json();
        if (!tavResp.ok) return res.status(502).json({ error: 'Tavily search failed', details: tav });
        results = { query, instant_answer: tav.answer || null, related_topics: (tav.results || []).map(r => ({ title: r.title, url: r.url, text: r.content })) };
      } else if (provider === 'brave' && apiKey) {
        const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${Math.min(maxResults, 10)}`;
        const braveResp = await fetch(url, { headers: { 'X-Subscription-Token': apiKey } });
        const brave = await braveResp.json();
        if (!braveResp.ok) return res.status(502).json({ error: 'Brave search failed', details: brave });
        const items = (brave.web?.results || []).map(r => ({ title: r.title, url: r.url, text: r.description || r.snippet || '' }));
        results = { query, related_topics: items };
      } else {
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        results = { query, instant_answer: data.AbstractText || data.Answer || null, abstract_url: data.AbstractURL || null, definition: data.Definition || null, related_topics: (data.RelatedTopics || []).slice(0, maxResults).map(topic => ({ title: topic.Text || '', url: topic.FirstURL || '' })) };
      }

      res.json(results);
    } catch (error) {
      logger.error('Ollama web search failed:', { errorMessage: error.message, stack: error.stack });
      if (!res.headersSent) res.status(500).json({ error: 'Search failed: ' + error.message });
    }
  });

  // Simple web search (DuckDuckGo)
  router.post('/search', requireAuth, async (req, res) => {
    try {
      const { query, maxResults = 5 } = req.body;
      if (!query) return res.status(400).json({ error: 'Missing "query" in request body' });
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      const results = { query, instant_answer: data.AbstractText || data.Answer || null, abstract_url: data.AbstractURL || null, definition: data.Definition || null, related_topics: (data.RelatedTopics || []).slice(0, maxResults).map(topic => ({ title: topic.Text || '', url: topic.FirstURL || '' })) };
      res.json(results);
    } catch (error) {
      logger.error('Web search /search failed:', { errorMessage: error.message });
      res.status(500).json({ error: error.message, results: [] });
    }
  });

  return router;
}
