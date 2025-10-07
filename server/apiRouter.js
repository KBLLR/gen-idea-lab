import express from 'express';
import auth from './routes/auth.js';
import createImageRouter from './routes/image.js';
import createChatRouter from './routes/chat.js';
import createModelsRouter from './routes/models.js';
import createEmbeddingsRouter from './routes/embeddings.js';
import createToolsRouter from './routes/tools.js';
import createModuleChatsRouter from './routes/moduleChats.js';
import createPlannerRouter from './routes/planner.js';
import createGoogleServicesRouter from './routes/google.js';
import createHumeRouter from './routes/hume.js';
import createServicesConfigAndNotionRouter from './routes/servicesConfig.js';
import createModulesRouter from './routes/modules.js';
import createWorkflowDocsRouter from './routes/workflowDocs.js';
import createServicesRouter from './routes/services.js';
import createProxyRouter from './routes/proxy.js';

// API router composer. Builds and returns an Express Router with all feature routers mounted.
// Dependencies are injected for full DI: getUserConnections, geminiBootstrap, getDb
export default function createApiRouter({ getUserConnections, geminiBootstrap, getDb }) {
  const router = express.Router();

  // Auth routes (mounted at /auth)
  router.use('/auth', auth);

  // Health first
  router.get('/healthz', (_req, res) => res.json({ ok: true }));

  // Auth
  router.use('/auth', auth);

  // Services (OAuth/API-key endpoints)
  router.use('/services', createServicesRouter({ getUserConnections }));

  // Services config + Notion webhooks
  router.use('/', createServicesConfigAndNotionRouter());

  // Proxy to Gemini and others
  router.use('/', createProxyRouter({ getGeminiClient: () => geminiBootstrap.getClient() }));

  // Image routes (factory) need DI
  const imageRouter = createImageRouter({ getUserConnections, geminiBootstrap });
  router.use('/image', imageRouter);

  // Chat routes
  const chatRouter = createChatRouter({ getUserConnections, getGeminiClient: () => geminiBootstrap.getClient() });
  router.use('/', chatRouter);

  // Models, embeddings, tools, module-chats, planner
  router.use('/', createModelsRouter({ getUserConnections }));
  router.use('/', createEmbeddingsRouter({ getUserConnections }));
  router.use('/', createToolsRouter({ getUserConnections }));
  router.use('/', createModuleChatsRouter({ getDb }));
  router.use('/', createPlannerRouter());

  // Google services
  router.use('/', createGoogleServicesRouter());

  // Hume and services config + Notion webhooks
  router.use('/', createHumeRouter());
  router.use('/', createServicesConfigAndNotionRouter());

  // Modules resources
  router.use('/', createModulesRouter({
    // For now, create a simple in-memory module store per process
    getModuleStore: (() => {
      const moduleResources = {};
      return (moduleId) => {
        if (!moduleResources[moduleId]) {
          moduleResources[moduleId] = { chats: [], workflows: [], documentation: [] };
        }
        return moduleResources[moduleId];
      };
    })(),
    generateResourceId: (type) => `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }));

  // Workflow docs
  router.use('/', createWorkflowDocsRouter());

  return router;
}
