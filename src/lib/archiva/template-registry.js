import { templates as templateDefinitions } from './templates.js';
import { render as renderProcessJournal } from './templates/process_journal.js';
import { render as renderExperimentReport } from './templates/experiment_report.js';
import { render as renderPromptCard } from './templates/prompt_card.js';
import { renderGeneric } from './templates/generic_renderer.js';

const customRenderers = {
  process_journal: renderProcessJournal,
  experiment_report: renderExperimentReport,
  prompt_card: renderPromptCard
};

const templateKeyMap = Object.entries(templateDefinitions).reduce((acc, [key, definition]) => {
  const slug = normalizeTemplateId(key);
  acc[slug] = { key, definition };
  return acc;
}, {});

const rendererRegistry = Object.entries(templateDefinitions).reduce((acc, [key, definition]) => {
  const slug = normalizeTemplateId(key);
  if (customRenderers[slug]) {
    acc[slug] = (format, data = {}) => customRenderers[slug](format, data);
  } else {
    acc[slug] = (format, data = {}) => renderGeneric(format, { ...data }, { definition, slug, key });
  }
  return acc;
}, {});

export function normalizeTemplateId(templateId) {
  return String(templateId || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function hasTemplateRenderer(templateId) {
  return Boolean(rendererRegistry[normalizeTemplateId(templateId)]);
}

export function listTemplateRenderers() {
  return Object.keys(rendererRegistry);
}

export function renderTemplate(templateId, format = 'md', data = {}) {
  const slug = normalizeTemplateId(templateId);
  const renderer = rendererRegistry[slug];
  if (!renderer) {
    throw new Error(`Renderer not found for template: ${templateId}`);
  }
  return renderer(format, data);
}

export function renderTemplateAllFormats(templateId, data = {}) {
  return {
    markdown: renderTemplate(templateId, 'md', data),
    html: renderTemplate(templateId, 'html', data)
  };
}

export function getTemplateContext(templateId) {
  const slug = normalizeTemplateId(templateId);
  return templateKeyMap[slug];
}

export function resolveTemplateKey(templateId) {
  const context = getTemplateContext(templateId);
  return context?.key;
}

export default {
  normalizeTemplateId,
  hasTemplateRenderer,
  listTemplateRenderers,
  renderTemplate,
  renderTemplateAllFormats,
  getTemplateContext,
  resolveTemplateKey
};
