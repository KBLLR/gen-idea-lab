import { helpers, fm } from '../renderer.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderField(field, value, format = 'md') {
  if (!value) return '';

  const { label, field_type } = field;
  const fieldValue = String(value).trim();

  if (!fieldValue) return '';

  if (format === 'html') {
    switch (field_type) {
      case 'code':
        return `<section>
          <h3>${escapeHtml(label)}</h3>
          <pre><code>${escapeHtml(fieldValue)}</code></pre>
        </section>`;

      case 'markdown':
        return `<section>
          <h3>${escapeHtml(label)}</h3>
          <div class="markdown-content">${fieldValue}</div>
        </section>`;

      case 'date':
        const date = new Date(fieldValue).toLocaleDateString();
        return `<div class="field-date">
          <strong>${escapeHtml(label)}:</strong> ${escapeHtml(date)}
        </div>`;

      default:
        return `<div class="field-text">
          <strong>${escapeHtml(label)}:</strong> ${escapeHtml(fieldValue)}
        </div>`;
    }
  }

  // Markdown format
  switch (field_type) {
    case 'code':
      return `## ${label}\n\n\`\`\`\n${fieldValue}\n\`\`\`\n`;

    case 'markdown':
      return `## ${label}\n\n${fieldValue}\n`;

    case 'date':
      const date = new Date(fieldValue).toLocaleDateString();
      return `**${label}:** ${date}\n`;

    default:
      return `**${label}:** ${fieldValue}\n`;
  }
}

export function renderGenericTemplate(templateDefinition, templateData, format = 'md') {
  if (!templateDefinition) {
    console.error('renderGenericTemplate: templateDefinition is required');
    return format === 'html' ? '<div>Template definition missing</div>' : '# Template definition missing';
  }

  const { name, purpose, fields = [] } = templateDefinition;
  const { values = {} } = templateData || {};

  if (format === 'html') {
    const header = `
      <header class="template-header">
        <h1>${escapeHtml(name || 'Untitled Template')}</h1>
        <p class="template-purpose">${escapeHtml(purpose || 'No description available')}</p>
      </header>
    `;

    const content = fields
      .map(field => renderField(field, values[field.field_key], format))
      .filter(Boolean)
      .join('\n');

    return `${header}<div class="template-content">${content}</div>`;
  }

  // Markdown format
  const frontmatter = fm({
    title: values.title || name,
    template: name,
    date: values.date || new Date().toISOString().split('T')[0],
    purpose
  });

  const parts = [
    frontmatter,
    `# ${values.title || name}\n`,
    `*${purpose}*\n`,
    ...fields
      .map(field => renderField(field, values[field.field_key], format))
      .filter(Boolean)
  ];

  return parts.join('\n');
}

// Create specific renderers for missing templates
export function renderStudyArchive(format = 'md', data = {}) {
  const templateDef = {
    name: "Study Archive",
    purpose: "Track what you've learned over time",
    fields: [
      { field_key: "date", label: "Date", field_type: "date" },
      { field_key: "title", label: "Title", field_type: "string" },
      { field_key: "learning_outcomes", label: "Learning Outcomes", field_type: "markdown" },
      { field_key: "artifacts_references", label: "Artifacts / References", field_type: "markdown" },
      { field_key: "reflection", label: "Reflection", field_type: "markdown" },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string" }
    ]
  };
  return renderGenericTemplate(templateDef, data, format);
}

export function renderLearningLab(format = 'md', data = {}) {
  const templateDef = {
    name: "Learning Lab",
    purpose: "Run structured mini-experiments",
    fields: [
      { field_key: "date", label: "Date", field_type: "date" },
      { field_key: "experiment_name", label: "Experiment Name", field_type: "string" },
      { field_key: "objective", label: "Objective", field_type: "string" },
      { field_key: "hypothesis", label: "Hypothesis", field_type: "markdown" },
      { field_key: "setup_method", label: "Setup & Method", field_type: "markdown" },
      { field_key: "observations_outcomes", label: "Observations & Outcomes", field_type: "markdown" },
      { field_key: "analysis", label: "Analysis", field_type: "markdown" },
      { field_key: "conclusions_lessons_learned", label: "Conclusions & Lessons Learned", field_type: "markdown" },
      { field_key: "artifacts_references", label: "Artifacts & References", field_type: "code" }
    ]
  };
  return renderGenericTemplate(templateDef, data, format);
}

export function renderCodeNotebook(format = 'md', data = {}) {
  const templateDef = {
    name: "Code Notebook",
    purpose: "Save useful code with context",
    fields: [
      { field_key: "date", label: "Date", field_type: "date" },
      { field_key: "title", label: "Title", field_type: "string" },
      { field_key: "problem_context", label: "Problem / Context", field_type: "markdown" },
      { field_key: "code_snippet", label: "Code Snippet", field_type: "code" },
      { field_key: "explanation", label: "Explanation", field_type: "markdown" },
      { field_key: "usage", label: "Usage", field_type: "markdown" },
      { field_key: "references", label: "References", field_type: "markdown" }
    ]
  };
  return renderGenericTemplate(templateDef, data, format);
}

export function renderDesignSketchbook(format = 'md', data = {}) {
  const templateDef = {
    name: "Design Sketchbook",
    purpose: "Explore visual styles and interface ideas",
    fields: [
      { field_key: "date", label: "Date", field_type: "date" },
      { field_key: "concept_focus", label: "Concept / Focus", field_type: "string" },
      { field_key: "moodboard_inspiration", label: "Moodboard & Inspiration", field_type: "markdown" },
      { field_key: "wireframes_layouts", label: "Wireframes & Layouts", field_type: "markdown" },
      { field_key: "annotations_feedback", label: "Annotations & Feedback", field_type: "markdown" },
      { field_key: "iteration_notes", label: "Iteration Notes", field_type: "markdown" }
    ]
  };
  return renderGenericTemplate(templateDef, data, format);
}

export function renderExperiments(format = 'md', data = {}) {
  const templateDef = {
    name: "Experiments",
    purpose: "Test hypotheses with code",
    fields: [
      { field_key: "date", label: "Date", field_type: "date" },
      { field_key: "experiment_name", label: "Experiment Name", field_type: "string" },
      { field_key: "hypothesis", label: "Hypothesis", field_type: "markdown" },
      { field_key: "setup", label: "Setup", field_type: "markdown" },
      { field_key: "code_execution", label: "Code & Execution", field_type: "code" },
      { field_key: "results", label: "Results", field_type: "markdown" },
      { field_key: "analysis", label: "Analysis", field_type: "markdown" }
    ]
  };
  return renderGenericTemplate(templateDef, data, format);
}

export default {
  renderGenericTemplate,
  renderStudyArchive,
  renderLearningLab,
  renderCodeNotebook,
  renderDesignSketchbook,
  renderExperiments
};