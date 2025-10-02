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

function renderPromptSteps(steps = [], format = 'md') {
  if (!steps.length) return '';

  if (format === 'html') {
    const items = steps.map((step, index) => {
      const prompt = step.request?.prompt || step.prompt || '';
      const response = step.response || step.output || '';
      const notes = step.notes || '';
      const promptHtml = prompt ? mdToHtml(prompt) : '';
      const responseHtml = response ? mdToHtml(response) : '';
      const notesHtml = notes ? mdToHtml(notes) : '';
      return `
        <article class="prompt-step">
          <header><h3>Step ${index + 1}: ${escapeHtml(step.name || 'Prompt')}</h3></header>
          ${promptHtml ? `<h4>Prompt</h4><div class="markdown-content">${promptHtml}</div>` : ''}
          ${responseHtml ? `<h4>Response</h4><div class="markdown-content">${responseHtml}</div>` : ''}
          ${notesHtml ? `<h4>Notes</h4><div class="markdown-content">${notesHtml}</div>` : ''}
        </article>
      `;
    }).join('');
    return `<div class="prompt-steps">${items}</div>`;
  }

  return steps.map((step, index) => {
    const prompt = step.request?.prompt || step.prompt || '';
    const response = step.response || step.output || '';
    const lines = [`### Step ${index + 1}: ${step.name || 'Prompt'}`];
    if (prompt) {
      lines.push('**Prompt**');
      lines.push('');
      lines.push('```');
      lines.push(prompt);
      lines.push('```');
      lines.push('');
    }
    if (response) {
      lines.push('**Response**');
      lines.push('');
      lines.push('```');
      lines.push(response);
      lines.push('```');
      lines.push('');
    }
    if (step.notes) {
      lines.push(step.notes);
      lines.push('');
    }
    return lines.join('\n');
  }).join('\n');
}

export function render(format = 'md', data = {}) {
  const frontmatter = fm({
    title: data.title || 'Prompt Card',
    workflow_id: data.workflow_id || null,
    run_id: data.run_id || null,
    started_at: data.started_at || null,
    ended_at: data.ended_at || null
  });

  const metadataRows = [
    { Label: 'Workflow', Value: data.workflow_id || 'N/A' },
    { Label: 'Run', Value: data.run_id || 'N/A' },
    { Label: 'Models Used', Value: [...new Set((data.steps || []).map(step => step.model).filter(Boolean))].join(', ') || 'N/A' },
    { Label: 'Duration', Value: helpers.timeRange(data.started_at, data.ended_at) }
  ];

  const metaTable = helpers.tbl(metadataRows, format);
  const promptSteps = renderPromptSteps(data.steps, format);

  if (format === 'html') {
    return [
      `<header><h1>${escapeHtml(data.title || 'Prompt Card')}</h1></header>`,
      renderSection('Summary', data.summary ? `<p>${escapeHtml(data.summary)}</p>` : '', format),
      metaTable ? renderSection('Metadata', metaTable, format) : '',
      promptSteps ? renderSection('Prompt Steps', promptSteps, format) : '',
      data.notes ? renderSection('Notes', `<p>${escapeHtml(data.notes)}</p>`, format) : ''
    ].filter(Boolean).join('');
  }

  const parts = [
    frontmatter,
    `# ${data.title || 'Prompt Card'}\n`,
    data.summary ? renderSection('Summary', data.summary, format) : '',
    metaTable ? renderSection('Metadata', metaTable, format) : '',
    promptSteps ? renderSection('Prompt Steps', promptSteps, format) : '',
    data.notes ? renderSection('Notes', data.notes, format) : ''
  ].filter(Boolean);

  return parts.join('\n');
}

export default { render };
