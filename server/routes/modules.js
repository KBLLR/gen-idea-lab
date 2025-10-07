import express from 'express';
import logger from '../../src/shared/lib/logger.js';
import { requireAuth } from '../../src/shared/lib/auth.js';
import { httpRequestDurationMicroseconds, httpRequestsTotal } from '../../src/shared/lib/metrics.js';

export default function createModulesRouter({ getModuleStore, generateResourceId }) {
  const router = express.Router();
  const validTypes = new Set(['chats', 'workflows', 'documentation']);

  // Index (lightweight metadata)
  router.get('/modules/:moduleId/resources/:resourceType/index', requireAuth, (req, res) => {
    const timer = httpRequestDurationMicroseconds.startTimer();
    try {
      const { moduleId, resourceType } = req.params;
      if (!validTypes.has(resourceType)) return res.status(400).json({ error: 'Invalid resource type' });
      const store = getModuleStore(moduleId);
      const resources = store[resourceType] || [];
      const recent = resources
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 20)
        .map(r => ({ id: r.id, title: r.title, timestamp: r.updatedAt || r.createdAt, preview: r.preview || r.description?.substring(0, 100), status: r.status, progress: r.progress, source: r.source }));
      const items = resources.map(r => ({ id: r.id, title: r.title, timestamp: r.updatedAt || r.createdAt, preview: r.preview || r.description?.substring(0, 100), status: r.status, progress: r.progress, source: r.source }));
      res.json({ recent, items, total: resources.length });
    } catch (error) {
      logger.error('Resource index fetch failed:', error);
      res.status(500).json({ error: 'Failed to fetch resource index' });
    } finally {
      timer({ code: res.statusCode });
      httpRequestsTotal.inc({ route: '/api/modules/resources/index', code: res.statusCode, method: 'GET' });
    }
  });

  // Get full resource
  router.get('/modules/:moduleId/resources/:resourceType/:resourceId', requireAuth, (req, res) => {
    const timer = httpRequestDurationMicroseconds.startTimer();
    try {
      const { moduleId, resourceType, resourceId } = req.params;
      if (!validTypes.has(resourceType)) return res.status(400).json({ error: 'Invalid resource type' });
      const store = getModuleStore(moduleId);
      const resource = store[resourceType]?.find(r => r.id === resourceId);
      if (!resource) return res.status(404).json({ error: 'Resource not found' });
      res.json(resource);
    } catch (error) {
      logger.error('Resource fetch failed:', error);
      res.status(500).json({ error: 'Failed to fetch resource' });
    } finally {
      timer({ code: res.statusCode });
      httpRequestsTotal.inc({ route: '/api/modules/resources/item', code: res.statusCode, method: 'GET' });
    }
  });

  // Search resources
  router.get('/modules/:moduleId/resources/:resourceType/search', requireAuth, (req, res) => {
    const timer = httpRequestDurationMicroseconds.startTimer();
    try {
      const { moduleId, resourceType } = req.params;
      const query = req.query.q;
      if (!query) return res.status(400).json({ error: 'Missing query parameter' });
      if (!validTypes.has(resourceType)) return res.status(400).json({ error: 'Invalid resource type' });
      const store = getModuleStore(moduleId);
      const resources = store[resourceType] || [];
      const searchTerm = String(query).toLowerCase();
      const results = resources
        .filter(r => r.title?.toLowerCase().includes(searchTerm)
          || r.description?.toLowerCase().includes(searchTerm)
          || r.content?.toLowerCase().includes(searchTerm)
          || (r.messages && r.messages.some(msg => msg.content?.toLowerCase().includes(searchTerm))))
        .map(r => ({ id: r.id, title: r.title, timestamp: r.updatedAt || r.createdAt, preview: r.preview || r.description?.substring(0, 100), status: r.status, progress: r.progress, source: r.source, relevance: 1 }))
        .sort((a, b) => b.relevance - a.relevance || new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50);
      res.json(results);
    } catch (error) {
      logger.error('Resource search failed:', error);
      res.status(500).json({ error: 'Failed to search resources' });
    } finally {
      timer({ code: res.statusCode });
      httpRequestsTotal.inc({ route: '/api/modules/resources/search', code: res.statusCode, method: 'GET' });
    }
  });

  // Create resource
  router.post('/modules/:moduleId/resources/:resourceType', requireAuth, (req, res) => {
    const timer = httpRequestDurationMicroseconds.startTimer();
    try {
      const { moduleId, resourceType } = req.params;
      const resourceData = req.body || {};
      if (!validTypes.has(resourceType)) return res.status(400).json({ error: 'Invalid resource type' });
      const store = getModuleStore(moduleId);
      const newResource = { id: generateResourceId(resourceType), ...resourceData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: req.user?.email || 'system' };
      store[resourceType].push(newResource);
      logger.info(`Added ${resourceType} resource to module ${moduleId}`, { resourceId: newResource.id, title: newResource.title });
      res.status(201).json(newResource);
    } catch (error) {
      logger.error('Resource creation failed:', error);
      res.status(500).json({ error: 'Failed to create resource' });
    } finally {
      timer({ code: res.statusCode });
      httpRequestsTotal.inc({ route: '/api/modules/resources/create', code: res.statusCode, method: 'POST' });
    }
  });

  // Update resource
  router.put('/modules/:moduleId/resources/:resourceType/:resourceId', requireAuth, (req, res) => {
    const timer = httpRequestDurationMicroseconds.startTimer();
    try {
      const { moduleId, resourceType, resourceId } = req.params;
      const updates = req.body || {};
      if (!validTypes.has(resourceType)) return res.status(400).json({ error: 'Invalid resource type' });
      const store = getModuleStore(moduleId);
      const resourceIndex = store[resourceType]?.findIndex(r => r.id === resourceId);
      if (resourceIndex === -1) return res.status(404).json({ error: 'Resource not found' });
      const updatedResource = { ...store[resourceType][resourceIndex], ...updates, updatedAt: new Date().toISOString() };
      store[resourceType][resourceIndex] = updatedResource;
      logger.info(`Updated ${resourceType} resource in module ${moduleId}`, { resourceId, title: updatedResource.title });
      res.json(updatedResource);
    } catch (error) {
      logger.error('Resource update failed:', error);
      res.status(500).json({ error: 'Failed to update resource' });
    } finally {
      timer({ code: res.statusCode });
      httpRequestsTotal.inc({ route: '/api/modules/resources/update', code: res.statusCode, method: 'PUT' });
    }
  });

  // Delete resource
  router.delete('/modules/:moduleId/resources/:resourceType/:resourceId', requireAuth, (req, res) => {
    const timer = httpRequestDurationMicroseconds.startTimer();
    try {
      const { moduleId, resourceType, resourceId } = req.params;
      if (!validTypes.has(resourceType)) return res.status(400).json({ error: 'Invalid resource type' });
      const store = getModuleStore(moduleId);
      const resourceIndex = store[resourceType]?.findIndex(r => r.id === resourceId);
      if (resourceIndex === -1) return res.status(404).json({ error: 'Resource not found' });
      const deletedResource = store[resourceType].splice(resourceIndex, 1)[0];
      logger.info(`Deleted ${resourceType} resource from module ${moduleId}`, { resourceId, title: deletedResource.title });
      res.json({ success: true, deletedResource });
    } catch (error) {
      logger.error('Resource deletion failed:', error);
      res.status(500).json({ error: 'Failed to delete resource' });
    } finally {
      timer({ code: res.statusCode });
      httpRequestsTotal.inc({ route: '/api/modules/resources/delete', code: res.statusCode, method: 'DELETE' });
    }
  });

  return router;
}
