import express from 'express';
import logger from '../../src/shared/lib/logger.js';
import { requireAuth } from '../../src/shared/lib/auth.js';
import { renderTemplate, getTemplateIds, getTemplateMeta } from '../../src/apps/archiva/lib/library.js';
import { mapWorkflowToTemplate } from '../../src/apps/archiva/lib/workflow-mapper.js';

export default function createWorkflowDocsRouter() {
  const router = express.Router();

  // Generate documentation from workflow result using a template
  router.post('/workflow/generate-docs', requireAuth, async (req, res) => {
    try {
const { workflowResult, templateId, enhanceWithAI = false, model = process.env.DOCS_MODEL_DEFAULT || 'gemini-2.5-flash' } = req.body;
      if (!workflowResult || !templateId) {
        return res.status(400).json({ error: 'Missing required fields: workflowResult and templateId' });
      }

      // Validate template and workflow structure
      const availableTemplates = new Set(getTemplateIds());
      if (!availableTemplates.has(templateId)) {
        return res.status(400).json({ error: `Unknown templateId: ${templateId}` });
      }
      if (!Array.isArray(workflowResult.steps) || workflowResult.steps.length === 0) {
        return res.status(400).json({ error: 'workflowResult.steps must be a non-empty array' });
      }

      // Map workflow data to template fields
      let templateData;
      try {
        templateData = mapWorkflowToTemplate(workflowResult, templateId);
      } catch (e) {
        logger.error('Mapping failed:', e);
        return res.status(400).json({ error: `Failed to map workflow to template: ${templateId}` });
      }

      // Optional AI enhancement is not implemented on server yet
      if (enhanceWithAI) {
        logger.warn('enhanceWithAI requested, but server-side enhancement is not implemented. Proceeding without enhancement.');
      }

      // Render output in both formats
      let renderedContent;
      try {
        renderedContent = {
          markdown: renderTemplate(templateId, 'md', templateData),
          html: renderTemplate(templateId, 'html', templateData)
        };
      } catch (renderError) {
        logger.error('Template rendering failed:', renderError);
        return res.status(400).json({ error: `Template renderer not found or failed: ${templateId}`, available: getTemplateIds() });
      }

      res.json({ ok: true, doc: renderedContent.markdown, templateId, templateData, renderedContent, enhanced: false, requestedEnhancement: enhanceWithAI, model, timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error('Workflow documentation generation failed:', error);
      res.status(500).json({ error: 'Documentation generation failed' });
    }
  });

  // List available templates for discovery
  router.get('/workflow/templates', requireAuth, async (_req, res) => {
    try {
      const ids = getTemplateIds();
      const templates = ids.map((id) => {
        const meta = getTemplateMeta(id) || {};
        return {
          id,
          title: meta.name || id,
          description: meta.purpose || '',
          version: '1',
          requires: ['workflowResult.steps']
        };
      });
      res.json({ ok: true, templates });
    } catch (e) {
      logger.error('Failed to list templates:', e);
      res.status(500).json({ error: 'Failed to list templates' });
    }
  });

  return router;
}
