import express from 'express';
import logger from '../../src/shared/lib/logger.js';
import { requireAuth } from '../../src/shared/lib/auth.js';

export default function createModelsRouter({ getUserConnections }) {
  const router = express.Router();

  // Rate limiting and caching for Ollama discovery spam
  const modelCache = new Map();
  const ollamaLogCache = new Map();
  const CACHE_TTL_MS = 5000; // Cache for 5 seconds
  const LOG_THROTTLE_MS = 60000; // Only log Ollama discovery once per minute unless model count changes

  // Available models across providers
  router.get('/models', requireAuth, async (req, res) => {
    // Check cache per user
    const userKey = req.user?.email || 'anonymous';
    const now = Date.now();
    const cached = modelCache.get(userKey);

    // Return cached response if still valid
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return res.json({ models: cached.models });
    }
    try {
      const connections = getUserConnections(req.user.email);
      const availableModels = [];

      // Built-in Gemini
      availableModels.push(
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Gemini', category: 'text', available: true },
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', provider: 'Gemini', category: 'text', available: true }
      );

      // OpenAI
      if (connections.openai?.apiKey) {
        availableModels.push(
          { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', category: 'text', available: true },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', category: 'text', available: true },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', category: 'text', available: true }
        );
      }

      // Claude
      if (connections.claude?.apiKey) {
        availableModels.push(
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Claude', category: 'text', available: true },
          { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'Claude', category: 'text', available: true }
        );
      }

      // Ollama - try to list tags from configured URL
      try {
        const ollamaUrl = connections.ollama?.url || 'http://localhost:11434';
        const resp = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2000) });
        if (resp.ok) {
          const data = await resp.json();
          const TEXT_EXCLUDES = ['embed','embedding','nomic','bge','e5','gte','gte-','all-minilm','text-embed','llava','moondream','whisper','audiodec','sd-','flux','llm-vision'];
          const isTextish = (n) => !TEXT_EXCLUDES.some(x => n.includes(x));
          const ollamaModels = (data.models || [])
            .map(m => (m?.name || '').toLowerCase())
            .filter(n => isTextish(n))
            .map(n => ({ id: n, name: n.split(':')[0] || n, provider: 'Ollama', category: 'text', available: true }));
          availableModels.push(...ollamaModels);
          const logKey = ollamaUrl;
          const lastLog = ollamaLogCache.get(logKey);
          const now = Date.now();
          const shouldLog = !lastLog
            || lastLog.count !== ollamaModels.length
            || (now - lastLog.timestamp) > LOG_THROTTLE_MS;

          if (shouldLog) {
            logger.info(`Discovered ${ollamaModels.length} Ollama models at ${ollamaUrl}`);
            ollamaLogCache.set(logKey, { count: ollamaModels.length, timestamp: now });
          }
        }
      } catch (e) {
        logger.debug('Ollama not available:', e.message);
      }

      // Additional providers
      if (connections.huggingface?.apiKey) {
        availableModels.push(
          { id: 'microsoft/DialoGPT-medium', name: 'DialoGPT Medium', provider: 'Hugging Face', category: 'text', available: true },
          { id: 'facebook/blenderbot-400M-distill', name: 'BlenderBot 400M', provider: 'Hugging Face', category: 'text', available: true },
          { id: 'microsoft/CodeBERT-base', name: 'CodeBERT Base', provider: 'Hugging Face', category: 'code', available: true }
        );
      }
      if (connections.replicate?.apiKey) {
        availableModels.push(
          { id: 'meta/llama-2-70b-chat', name: 'Llama 2 70B Chat', provider: 'Replicate', category: 'text', available: true },
          { id: 'stability-ai/stable-diffusion', name: 'Stable Diffusion', provider: 'Replicate', category: 'image', available: true },
          { id: 'replicate/musicgen', name: 'MusicGen', provider: 'Replicate', category: 'audio', available: true }
        );
      }
      if (connections.together?.apiKey) {
        availableModels.push(
          { id: 'togethercomputer/llama-2-70b-chat', name: 'Llama 2 70B Chat', provider: 'Together AI', category: 'text', available: true },
          { id: 'togethercomputer/falcon-40b-instruct', name: 'Falcon 40B Instruct', provider: 'Together AI', category: 'text', available: true },
          { id: 'togethercomputer/RedPajama-INCITE-7B-Chat', name: 'RedPajama 7B Chat', provider: 'Together AI', category: 'text', available: true }
        );
      }
      if (connections.mistral?.apiKey) {
        availableModels.push(
          { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'Mistral AI', category: 'text', available: true },
          { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'Mistral AI', category: 'text', available: true },
          { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'Mistral AI', category: 'text', available: true }
        );
      }
      if (connections.cohere?.apiKey) {
        availableModels.push(
          { id: 'command', name: 'Command', provider: 'Cohere', category: 'text', available: true },
          { id: 'command-light', name: 'Command Light', provider: 'Cohere', category: 'text', available: true },
          { id: 'summarize-xlarge', name: 'Summarize XLarge', provider: 'Cohere', category: 'text', available: true }
        );
      }
      if (connections.vllm?.url) availableModels.push({ id: 'vllm-hosted-model', name: 'vLLM Hosted Model', provider: 'vLLM', category: 'text', available: true });
      if (connections.localai?.url) availableModels.push({ id: 'localai-model', name: 'LocalAI Model', provider: 'LocalAI', category: 'text', available: true });
      if (connections.stability?.apiKey) {
        availableModels.push(
          { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0', provider: 'Stability AI', category: 'image', available: true },
          { id: 'stable-diffusion-v1-6', name: 'Stable Diffusion 1.6', provider: 'Stability AI', category: 'image', available: true }
        );
      }
      if (connections.midjourney?.apiKey) availableModels.push({ id: 'midjourney-v6', name: 'Midjourney v6', provider: 'Midjourney', category: 'image', available: true });
      if (connections.runway?.apiKey) availableModels.push({ id: 'runway-gen3', name: 'Runway Gen-3', provider: 'Runway ML', category: 'video', available: true });

      // Cache the response to prevent spam
      modelCache.set(userKey, {
        models: availableModels,
        timestamp: Date.now()
      });

      res.json({ models: availableModels });
    } catch (error) {
      logger.error('Error fetching available models:', { errorMessage: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Ollama: list installed models
  router.get('/ollama/models', requireAuth, async (req, res) => {
    try {
      const connections = getUserConnections(req.user.email);
      const connection = connections.ollama;
      if (!connection) {
        return res.status(400).json({ error: 'Ollama is not connected. Please connect in Settings.' });
      }

      let models = [];
      if (connection.type === 'url') {
        const resp = await fetch(`${connection.url}/api/tags`);
        if (!resp.ok) {
          const text = await resp.text();
          return res.status(502).json({ error: 'Failed to fetch models from local Ollama', details: text });
        }
        const data = await resp.json();
        models = (data.models || []).map(m => ({ name: m.name, modified_at: m.modified_at, size: m.size, digest: m.digest, details: m.details || {}, source: 'local' }));
      } else if (connection.type === 'api_key') {
        models = [
          { name: 'qwen3:480b-cloud', description: 'Qwen 3 480B Cloud Model', source: 'cloud', features: ['web_search', 'large_context'] },
          { name: 'gpt-oss', description: 'GPT Open Source Model', source: 'cloud', features: ['web_search', 'reasoning'] },
        ];
      }

      res.json({ models, connection_type: connection.type });
    } catch (error) {
      logger.error('Error fetching Ollama models:', { errorMessage: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
