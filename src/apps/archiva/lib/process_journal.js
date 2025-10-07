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

function renderList(items, format = 'md') {
  if (!items?.length) return '';
  if (format === 'html') {
    return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  }
  return items.map(item => `- ${item}`).join('\n');
}

function renderSection(title, body, format = 'md') {
  if (!body) return '';
  if (format === 'html') {
    return `<section><h2>${escapeHtml(title)}</h2>${body}</section>`;
  }
  return `## ${title}\n\n${body}\n`;
}

function renderMetadata(data, format = 'md') {
  const rows = [
    ['Workflow', data.workflow_id || 'N/A'],
    ['Run', data.run_id || 'N/A'],
    ['Time Range', helpers.timeRange(data.started_at, data.ended_at)],
    ['Status', data.status || 'Completed']
  ];

  if (format === 'html') {
    const cells = rows
      .filter(([, value]) => value)
      .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
      .join('');
    return `<table class="meta"><tbody>${cells}</tbody></table>`;
  }

  return rows
    .filter(([, value]) => value)
    .map(([label, value]) => `- **${label}:** ${value}`)
    .join('\n');
}

export function render(format = 'md', data = {}) {
  const summary = data.summary || {};
  const findings = renderList(summary.findings, format);
  const nextSteps = renderList(summary.next_steps, format);
  const stepRows = (data.steps || []).map((step, index) => ({
    Step: `${index + 1}. ${step.name || 'Step'}`,
    Model: step.model || '—',
    Latency: step.metrics?.latency_ms ? `${step.metrics.latency_ms} ms` : '—',
    Tokens: step.metrics?.tokens_out ? `${step.metrics.tokens_out}` : '—',
    Notes: step.request?.prompt || step.response || step.notes || ''
  }));

  const meta = renderMetadata(data, format);
  const methodHtml = data.method ? mdToHtml(data.method) : '';
  const contextHtml = data.context ? mdToHtml(data.context) : '';
  const stepsTable = stepRows.length ? helpers.tbl(stepRows, format) : '';

  if (format === 'html') {
    const header = `\n      <header>\n        <h1>${escapeHtml(data.title || 'Process Journal')}</h1>\n      </header>\n    `;
    const sections = [
      meta ? `<section>${meta}</section>` : '',
      renderSection('Context', contextHtml ? `<div class="markdown-content">${contextHtml}</div>` : '<p>No context provided.</p>', format),
      renderSection('Method', methodHtml ? `<div class="markdown-content">${methodHtml}</div>` : '<p>No method documented.</p>', format),
      findings ? renderSection('Key Findings', findings, format) : '',
      nextSteps ? renderSection('Next Steps', nextSteps, format) : '',
      stepsTable ? renderSection('Execution Steps', stepsTable, format) : ''
    ].filter(Boolean).join('');

    return `\n${header}${sections}`;
  }

  const frontmatter = fm({
    title: data.title || 'Process Journal',
    workflow_id: data.workflow_id || null,
    run_id: data.run_id || null,
    started_at: data.started_at || null,
    ended_at: data.ended_at || null
  });

  const parts = [
    frontmatter,
    `# ${data.title || 'Process Journal'}\n`,
    meta,
    '',
    renderSection('Context', data.context || 'No context provided.', format),
    renderSection('Method', data.method || 'No method documented.', format),
    findings ? renderSection('Key Findings', findings, format) : '',
    nextSteps ? renderSection('Next Steps', nextSteps, format) : '',
    stepsTable ? renderSection('Execution Steps', stepsTable, format) : ''
  ].filter(Boolean);

  return parts.join('\n');
}

export default { render };
