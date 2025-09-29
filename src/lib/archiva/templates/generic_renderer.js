import { helpers, fm } from '../renderer.js';

function normalizeDate(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString();
  } catch {
    return String(value);
  }
}

function toText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : JSON.stringify(item, null, 2)))
      .join('\n');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMarkdownLikeHtml(markdown) {
  const safe = String(markdown ?? '')
    .split('\n\n')
    .map((block) => {
      if (!block.trim()) return '';
      const trimmed = block.trim();
      if (trimmed.startsWith('- ')) {
        const items = trimmed
          .split('\n')
          .filter(Boolean)
          .map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s*/, ''))}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }
      return `<p>${escapeHtml(trimmed).replace(/\n/g, '<br />')}</p>`;
    })
    .filter(Boolean)
    .join('');
  return safe || '';
}

function renderFieldSection(field, value, format = 'md') {
  if (value == null || value === '') return '';
  const label = field.label || field.field_key;
  const type = field.field_type || 'string';
  const stringValue = toText(value);

  if (format === 'html') {
    let body = '';
    if (type === 'code') {
      body = helpers.code('text', stringValue, 'html');
    } else if (type === 'markdown') {
      body = renderMarkdownLikeHtml(stringValue);
    } else if (type === 'date') {
      body = `<p>${escapeHtml(normalizeDate(stringValue))}</p>`;
    } else {
      body = `<p>${escapeHtml(stringValue)}</p>`;
    }

    if (!body) return '';
    return `<section class="doc-section"><h2>${escapeHtml(label)}</h2>${body}</section>`;
  }

  let body = '';
  if (type === 'code') {
    body = helpers.code('text', stringValue, 'md');
  } else {
    body = stringValue || '';
  }

  if (!body) return '';
  return `## ${label}\n\n${body}\n`;
}

function renderMetaTable(format, context, data) {
  const rows = [
    { Key: 'Template', Value: context.definition.name },
    { Key: 'Type', Value: context.definition.type },
    { Key: 'Purpose', Value: context.definition.purpose },
    { Key: 'Workflow', Value: data.workflow_id || '—' },
    { Key: 'Run', Value: data.run_id || '—' },
    { Key: 'Started', Value: data.started_at ? normalizeDate(data.started_at) : '—' },
    { Key: 'Ended', Value: data.ended_at ? normalizeDate(data.ended_at) : '—' }
  ].filter((row) => row.Value && row.Value !== '');

  if (!rows.length) return '';
  const table = helpers.tbl(rows, format);

  if (format === 'html') {
    return `<section class="doc-section"><h2>Metadata</h2>${table}</section>`;
  }

  return `## Metadata\n\n${table}\n`;
}

function renderAiInsightsSection(format, insights) {
  if (!insights) return '';
  const entries = Object.entries(insights);
  if (!entries.length) return '';

  if (format === 'html') {
    const content = entries
      .map(([key, value]) => `<h3>${escapeHtml(key.replace(/_/g, ' '))}</h3><p>${escapeHtml(toText(value))}</p>`)
      .join('');
    return `<section class="doc-section doc-ai-insights"><h2>AI Insights</h2>${content}</section>`;
  }

  const content = entries
    .map(([key, value]) => `### ${key.replace(/_/g, ' ')}\n\n${toText(value)}\n`)
    .join('\n');
  return `## AI Insights\n\n${content}`;
}

export function renderGeneric(format = 'md', data = {}, context) {
  if (!context?.definition) {
    throw new Error('Generic renderer requires template definition context');
  }

  const { definition } = context;
  const fieldMap = definition.fields || [];
  const nowIso = new Date().toISOString();

  const titleCandidate = data.title || data.name || data[findTitleFieldKey(fieldMap)] || definition.name;
  const title = titleCandidate || definition.name;

  if (format === 'html') {
    const header = `<header class="doc-header">\n  <h1>${escapeHtml(title)}</h1>\n  <p class="doc-purpose">${escapeHtml(definition.purpose || '')}</p>\n</header>`;

    const metaSection = renderMetaTable('html', context, data);
    const fieldSections = fieldMap
      .map((field) => renderFieldSection(field, data[field.field_key], 'html'))
      .filter(Boolean)
      .join('');
    const aiSection = renderAiInsightsSection('html', data.aiInsights);

    return `\n${header}${metaSection}${fieldSections}${aiSection}`;
  }

  const frontmatter = fm({
    title,
    template: context.slug,
    template_name: definition.name,
    template_type: definition.type,
    generated_at: data.generated_at || nowIso,
    workflow_id: data.workflow_id || null,
    run_id: data.run_id || null,
    started_at: data.started_at || null,
    ended_at: data.ended_at || null
  });

  const metaSection = renderMetaTable('md', context, data);
  const fieldSections = fieldMap
    .map((field) => renderFieldSection(field, data[field.field_key], 'md'))
    .filter(Boolean)
    .join('\n');
  const aiSection = renderAiInsightsSection('md', data.aiInsights);

  return [
    frontmatter,
    `# ${title}\n`,
    metaSection,
    '',
    fieldSections,
    aiSection
  ].filter(Boolean).join('\n');
}

function findTitleFieldKey(fields = []) {
  const titleField = fields.find((field) => field.field_key === 'title');
  if (titleField) return titleField.field_key;
  const alt = fields.find((field) => /name$/i.test(field.field_key));
  return alt ? alt.field_key : fields[0]?.field_key;
}

export default { renderGeneric };
