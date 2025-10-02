import { helpers, fm } from '../renderer.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function mdToHtml(md) {
  if (!md) return '';
  try {
    const raw = marked.parse(String(md));
    return DOMPurify.sanitize(raw);
  } catch {
    return String(md)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSection(title, body, format = 'md') {
  if (!body) return '';
  if (format === 'html') {
    return `<section><h2>${escapeHtml(title)}</h2>${body}</section>`;
  }
  return `## ${title}\n\n${body}\n`;
}

function renderMetaTable(meta = {}, format = 'md') {
  if (!meta || typeof meta !== 'object') return '';
  const rows = Object.entries(meta).map(([key, value]) => ({
    Setting: key,
    Value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
  }));
  if (!rows.length) return '';
  return helpers.tbl(rows, format);
}

function renderInputs(inputs = {}, format = 'md') {
  const entries = Object.entries(inputs);
  if (!entries.length) return '';
  if (format === 'html') {
    return `<dl>${entries.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd><pre>${escapeHtml(String(value))}</pre></dd>`).join('')}</dl>`;
  }
  return entries.map(([key, value]) => `- **${key}:**\n\n${'    ' + String(value).split('\n').join('\n    ')}`).join('\n');
}

export function render(format = 'md', data = {}) {
  const frontmatter = fm({
    title: data.title || 'Experiment Report',
    workflow_id: data.workflow_id || null,
    run_id: data.run_id || null,
    started_at: data.started_at || null,
    ended_at: data.ended_at || null
  });

  const stepsTable = helpers.tbl((data.steps || []).map((step, index) => ({
    Step: `${index + 1}. ${step.name || 'Step'}`,
    Model: step.model || step.provider || '—',
    Status: step.status || 'completed',
    Latency: step.metrics?.latency_ms ? `${step.metrics.latency_ms} ms` : '—',
    Tokens: step.metrics?.tokens_out ? `${step.metrics.tokens_out}` : '—'
  })), format);

  if (format === 'html') {
    const hypothesisHtml = mdToHtml(data.hypothesis || 'Not documented');
    const discussionHtml = data.discussion ? mdToHtml(data.discussion) : '';
    const limitationsHtml = data.limitations ? mdToHtml(data.limitations) : '';

    const sections = [
      `<header><h1>${escapeHtml(data.title || 'Experiment Report')}</h1></header>`,
      renderSection('Hypothesis', `<div class="markdown-content">${hypothesisHtml}</div>`, format),
      renderSection('Inputs', renderInputs(data.inputs, format), format),
      renderSection('Environment & Settings', renderMetaTable(data.meta?.env, format), format),
      stepsTable ? renderSection('Execution Steps', stepsTable, format) : '',
      discussionHtml ? renderSection('Discussion', `<div class="markdown-content">${discussionHtml}</div>`, format) : '',
      limitationsHtml ? renderSection('Limitations', `<div class="markdown-content">${limitationsHtml}</div>`, format) : ''
    ].filter(Boolean);
    return sections.join('');
  }

  const parts = [
    frontmatter,
    `# ${data.title || 'Experiment Report'}\n`,
    renderSection('Hypothesis', data.hypothesis || 'Not documented', format),
    renderSection('Inputs', renderInputs(data.inputs, format) || 'No inputs recorded.', format),
    renderSection('Environment & Settings', renderMetaTable(data.meta?.env, format) || 'No environment metadata.', format),
    stepsTable ? renderSection('Execution Steps', stepsTable, format) : '',
    renderSection('Discussion', data.discussion || 'Pending analysis.', format),
    renderSection('Limitations', data.limitations || 'Not documented.', format)
  ].filter(Boolean);

  return parts.join('\n');
}

export default { render };
