/**
 * Workflow Documentation Service
 * Client-side service for generating documentation from workflow results
 * MIGRATED: Now uses centralized API endpoints
 */

import { getTemplateIds, isGenericTemplate } from './library.js';
import { api } from '@shared/lib/dataLayer/endpoints.js';

// Generate documentation from workflow results
export async function generateWorkflowDocumentation(workflowResult, templateId, options = {}) {
  const {
    enhanceWithAI = false,
    model = 'gemini-2.5-flash',
    format = 'both' // 'md', 'html', or 'both'
  } = options;

  try {
    const result = await api.workflow.generateDocs({
      workflowResult,
      templateId,
      enhanceWithAI,
      model
    });

    // Return in requested format
    if (format === 'md') {
      return result.renderedContent.markdown;
    } else if (format === 'html') {
      return result.renderedContent.html;
    }

    return result;
  } catch (error) {
    console.error('Workflow documentation generation failed:', error);
    throw error;
  }
}

// Download documentation as file
export function downloadDocumentation(content, filename, format = 'md') {
  const mimeTypes = {
    'md': 'text/markdown',
    'html': 'text/html',
    'txt': 'text/plain'
  };

  const blob = new Blob([content], { type: mimeTypes[format] || 'text/plain' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${format}`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Copy documentation to clipboard
export async function copyToClipboard(content) {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// Save documentation to local storage for later retrieval
export function saveDocumentationDraft(id, documentationData) {
  const drafts = getDocumentationDrafts();
  drafts[id] = {
    ...documentationData,
    savedAt: new Date().toISOString()
  };

  localStorage.setItem('archivai_drafts', JSON.stringify(drafts));
}

// Get saved documentation drafts
export function getDocumentationDrafts() {
  try {
    const drafts = localStorage.getItem('archivai_drafts');
    return drafts ? JSON.parse(drafts) : {};
  } catch (error) {
    console.error('Failed to load drafts:', error);
    return {};
  }
}

// Delete a documentation draft
export function deleteDocumentationDraft(id) {
  const drafts = getDocumentationDrafts();
  delete drafts[id];
  localStorage.setItem('archivai_drafts', JSON.stringify(drafts));
}

// Validate workflow data for template compatibility
export function validateWorkflowForTemplate(workflowResult, templateId) {
  if (!workflowResult || !templateId) {
    return { valid: false, error: 'Missing workflow data or template ID' };
  }

  const requiredFields = {
    process_journal: ['steps'],
    experiment_report: ['steps'],
    prompt_card: ['steps']
  };

  if (isGenericTemplate(templateId)) {
    if (Array.isArray(workflowResult.steps) && workflowResult.steps.length > 0) {
      return { valid: true };
    }
    return {
      valid: false,
      error: 'Generic templates require workflow steps to summarize',
      missing: ['steps']
    };
  }

  const required = requiredFields[templateId];
  if (!required) {
    return { valid: false, error: `Unknown template: ${templateId}` };
  }

  const missing = required.filter(field => !workflowResult[field]);
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(', ')}`,
      missing
    };
  }

  return { valid: true };
}

// Get available templates that can render the given workflow
export function getCompatibleTemplates(workflowResult) {
  const allTemplates = getTemplateIds();

  return allTemplates.filter(templateId => {
    const validation = validateWorkflowForTemplate(workflowResult, templateId);
    return validation.valid;
  });
}

// Create a sample workflow for testing
export function createSampleWorkflow(type = 'basic') {
  const base = {
    workflow_id: `wf_${Date.now()}`,
    run_id: `run_${Date.now()}`,
    title: 'Sample AI Workflow',
    started_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    ended_at: new Date().toISOString(),
    meta: {
      description: 'A sample workflow for testing template generation'
    },
    steps: [
      {
        name: 'Initialize Model',
        model: 'gemini-2.5-flash',
        metrics: {
          latency_ms: 1200,
          tokens_in: 45,
          tokens_out: 128
        },
        request: {
          prompt: 'Generate a creative solution for the given problem'
        },
        response: 'Here is a creative approach to solving the problem...'
      }
    ]
  };

  if (type === 'experiment') {
    return {
      ...base,
      title: 'Model Performance Experiment',
      meta: {
        ...base.meta,
        hypothesis: 'Newer models will show improved performance on complex reasoning tasks',
        discussion: 'Results demonstrate clear performance improvements with latest model versions'
      },
      steps: [
        ...base.steps,
        {
          name: 'Compare Models',
          model: 'claude-3-5-sonnet',
          metrics: {
            latency_ms: 2100,
            tokens_in: 52,
            tokens_out: 256
          }
        }
      ]
    };
  }

  return base;
}

// Format workflow metrics for display
export function formatWorkflowMetrics(workflow) {
  if (!workflow.steps?.length) return null;

  const totalLatency = workflow.steps.reduce((sum, step) =>
    sum + (step.metrics?.latency_ms || 0), 0);

  const totalTokensIn = workflow.steps.reduce((sum, step) =>
    sum + (step.metrics?.tokens_in || 0), 0);

  const totalTokensOut = workflow.steps.reduce((sum, step) =>
    sum + (step.metrics?.tokens_out || 0), 0);

  const models = [...new Set(workflow.steps.map(s => s.model).filter(Boolean))];

  return {
    duration: totalLatency,
    tokensProcessed: totalTokensIn + totalTokensOut,
    modelsUsed: models,
    stepCount: workflow.steps.length,
    successRate: workflow.steps.filter(s => !s.error).length / workflow.steps.length
  };
}