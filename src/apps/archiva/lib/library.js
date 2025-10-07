import processJournal from './process_journal.js';
import experimentReport from './experiment_report.js';
import promptCard from './prompt_card.js';
import { fm, helpers } from '../renderer.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => (Array.isArray(item) ? item : String(item ?? '').split(/[\n,]/)))
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (value == null) return [];
  return [String(value)];
}

function markdownToHtml(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

function formatSectionBody(value, type, format) {
  if (value == null || value === '') return '';

  const normalized = Array.isArray(value) ? value.filter(Boolean) : value;

  if (type === 'code') {
    const body = Array.isArray(normalized) ? normalized.join('\n\n') : String(normalized);
    return helpers.code('text', body, format);
  }

  if (Array.isArray(normalized)) {
    if (!normalized.length) return '';
    if (format === 'html') {
      const items = normalized.map((item) => `<li>${escapeHtml(String(item))}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    return normalized.map((item) => `- ${item}`).join('\n');
  }

  if (type === 'markdown') {
    if (format === 'html') {
      return markdownToHtml(normalized);
    }
    return String(normalized);
  }

  if (type === 'tags') {
    const list = normalizeList(normalized);
    if (!list.length) return '';
    if (format === 'html') {
      const items = list.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      return `<ul class="tag-list">${items}</ul>`;
    }
    return list.map((item) => `- ${item}`).join('\n');
  }

  if (format === 'html') {
    return `<p>${escapeHtml(String(normalized))}</p>`;
  }

  return String(normalized);
}

function formatMetadataValue(value, type) {
  if (value == null) return '';
  if (type === 'tags') {
    return normalizeList(value).join(', ');
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }
  return String(value);
}

function renderMetadata(metadata = [], format, heading = 'Metadata') {
  if (!metadata.length) return '';

  const rows = metadata
    .map(({ label, value, type }) => ({ Label: label, Value: formatMetadataValue(value, type) }))
    .filter((row) => row.Value);

  if (!rows.length) return '';

  if (format === 'html') {
    const table = helpers.tbl(rows, 'html');
    return `<section class="metadata"><h2>${escapeHtml(heading)}</h2>${table}</section>`;
  }

  const bullets = rows.map((row) => `- **${row.Label}:** ${row.Value}`).join('\n');
  return `## ${heading}\n\n${bullets}\n`;
}

function renderSections(sections, format) {
  return sections
    .filter((section) => section.body)
    .map((section) => {
      const content = formatSectionBody(section.body, section.type, format);
      if (!content) return '';
      if (format === 'html') {
        return `<section><h2>${escapeHtml(section.title)}</h2>${content}</section>`;
      }
      return `## ${section.title}\n\n${content}\n`;
    })
    .filter(Boolean)
    .join(format === 'html' ? '' : '\n');
}

function parseTags(value, fallback = []) {
  const list = normalizeList(value);
  if (list.length) return list;
  return fallback;
}

const genericTemplateConfigs = {
  study_archive: {
    name: 'Study Archive',
    type: 'Reflective',
    purpose: 'Track what you’ve learned over time',
    titleField: 'title',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'learning_outcomes', label: 'Learning Outcomes', type: 'markdown' },
      { key: 'artifacts_references', label: 'Artifacts / References', type: 'markdown' },
      { key: 'reflection', label: 'Reflection', type: 'markdown' }
    ]
  },
  learning_lab: {
    name: 'Learning Lab',
    type: 'Reflective',
    purpose: 'Run structured mini-experiments',
    titleField: 'experiment_name',
    subtitleField: 'objective',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'objective', label: 'Objective', type: 'string' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'hypothesis', label: 'Hypothesis', type: 'markdown' },
      { key: 'setup_method', label: 'Setup & Method', type: 'markdown' },
      { key: 'observations_outcomes', label: 'Observations & Outcomes', type: 'markdown' },
      { key: 'analysis', label: 'Analysis', type: 'markdown' },
      { key: 'conclusions_lessons_learned', label: 'Conclusions & Lessons Learned', type: 'markdown' },
      { key: 'next_steps_follow-up_experiments', label: 'Next Steps / Follow-Up Experiments', type: 'markdown' },
      { key: 'artifacts_references', label: 'Artifacts & References', type: 'code' }
    ]
  },
  design_sketchbook: {
    name: 'Design Sketchbook',
    type: 'Reflective',
    purpose: 'Explore visual styles and interface ideas',
    titleField: 'concept_focus',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'moodboard_inspiration', label: 'Moodboard & Inspiration', type: 'markdown' },
      { key: 'wireframes_layouts', label: 'Wireframes & Layouts', type: 'markdown' },
      { key: 'annotations_feedback', label: 'Annotations & Feedback', type: 'markdown' },
      { key: 'iteration_notes', label: 'Iteration Notes', type: 'markdown' },
      { key: 'next_concepts_to_try', label: 'Next Concepts to Try', type: 'markdown' }
    ]
  },
  code_notebook: {
    name: 'Code Notebook',
    type: 'Reflective',
    purpose: 'Save useful code with context',
    titleField: 'title',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'problem_context', label: 'Problem / Context', type: 'markdown' },
      { key: 'code_snippet', label: 'Code Snippet', type: 'code' },
      { key: 'explanation', label: 'Explanation', type: 'markdown' },
      { key: 'usage', label: 'Usage', type: 'markdown' },
      { key: 'references', label: 'References', type: 'markdown' }
    ]
  },
  practice_log: {
    name: 'Practice Log',
    type: 'Reflective',
    purpose: 'Document completed challenges',
    titleField: 'challenge',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'difficulty', label: 'Difficulty', type: 'string' },
      { key: 'duration', label: 'Duration', type: 'string' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'description', label: 'Description', type: 'markdown' },
      { key: 'solution', label: 'Solution', type: 'code' },
      { key: 'outcome_reflection', label: 'Outcome & Reflection', type: 'markdown' },
      { key: 'next_steps', label: 'Next Steps', type: 'markdown' },
      { key: 'references', label: 'References', type: 'markdown' }
    ]
  },
  field_notes: {
    name: 'Field Notes',
    type: 'Reflective',
    purpose: 'Collect insights from the world',
    titleField: 'context',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'location', label: 'Location', type: 'string' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'observation', label: 'Observation', type: 'markdown' },
      { key: 'details_artifacts', label: 'Details & Artifacts', type: 'markdown' },
      { key: 'insights_interpretation', label: 'Insights & Interpretation', type: 'markdown' },
      { key: 'actions_next_steps', label: 'Actions / Next Steps', type: 'markdown' },
      { key: 'references', label: 'References', type: 'markdown' }
    ]
  },
  explorations: {
    name: 'Explorations',
    type: 'Reflective',
    purpose: 'Keep open-ended or curiosity-driven tests',
    titleField: 'title',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'concept_inspiration', label: 'Concept & Inspiration', type: 'markdown' },
      { key: 'steps_taken', label: 'Steps Taken', type: 'markdown' },
      { key: 'observations', label: 'Observations', type: 'markdown' },
      { key: 'reflections', label: 'Reflections', type: 'markdown' },
      { key: 'next_explorations', label: 'Next Explorations', type: 'markdown' },
      { key: 'artifacts', label: 'Artifacts', type: 'markdown' }
    ]
  },
  research_and_prototypes: {
    name: 'Research & Prototypes',
    type: 'Reflective',
    purpose: 'Connect theory with practice',
    titleField: 'topic_question',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'background_motivation', label: 'Background & Motivation', type: 'markdown' },
      { key: 'research_summary', label: 'Research Summary', type: 'markdown' },
      { key: 'prototype_details', label: 'Prototype Details', type: 'markdown' },
      { key: 'results_observations', label: 'Results & Observations', type: 'markdown' },
      { key: 'analysis_insights', label: 'Analysis & Insights', type: 'markdown' },
      { key: 'next_steps', label: 'Next Steps', type: 'markdown' },
      { key: 'artifacts', label: 'Artifacts', type: 'code' }
    ]
  },
  experiments: {
    name: 'Experiments',
    type: 'Technical',
    purpose: 'Test hypotheses with code',
    titleField: 'experiment_name',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'hypothesis', label: 'Hypothesis', type: 'markdown' },
      { key: 'setup', label: 'Setup', type: 'markdown' },
      { key: 'code_execution', label: 'Code & Execution', type: 'code' },
      { key: 'results', label: 'Results', type: 'markdown' },
      { key: 'analysis', label: 'Analysis', type: 'markdown' },
      { key: 'next_iterations', label: 'Next Iterations', type: 'markdown' },
      { key: 'artifacts', label: 'Artifacts', type: 'markdown' }
    ]
  },
  sandbox: {
    name: 'Sandbox',
    type: 'Technical',
    purpose: 'Try out wild ideas without pressure',
    titleField: 'project_experiment',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'overview', label: 'Overview', type: 'markdown' },
      { key: 'setup', label: 'Setup', type: 'markdown' },
      { key: 'steps_explorations', label: 'Steps & Explorations', type: 'markdown' },
      { key: 'observations', label: 'Observations', type: 'markdown' },
      { key: 'reflection', label: 'Reflection', type: 'markdown' },
      { key: 'links_artifacts', label: 'Links & Artifacts', type: 'markdown' }
    ]
  },
  dev_diaries: {
    name: 'Dev Diaries',
    type: 'Technical',
    purpose: 'Log development progress and learning',
    titleField: 'feature_module',
    subtitleField: 'sprint_week',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'sprint_week', label: 'Sprint / Week', type: 'string' },
      { key: 'feature_module', label: 'Feature / Module', type: 'string' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'summary_of_work', label: 'Summary of Work', type: 'markdown' },
      { key: 'challenges_resolutions', label: 'Challenges & Resolutions', type: 'markdown' },
      { key: 'learnings_takeaways', label: 'Learnings & Takeaways', type: 'markdown' },
      { key: 'next_goals', label: 'Next Goals', type: 'markdown' },
      { key: 'artifacts_references', label: 'Artifacts & References', type: 'markdown' }
    ]
  },
  prototypes: {
    name: 'Prototypes',
    type: 'Technical',
    purpose: 'Build fast, test fast',
    titleField: 'prototype_name',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'objective', label: 'Objective', type: 'markdown' },
      { key: 'tools_setup', label: 'Tools & Setup', type: 'markdown' },
      { key: 'prototype_description', label: 'Prototype Description', type: 'markdown' },
      { key: 'quick_demo', label: 'Quick Demo', type: 'markdown' },
      { key: 'feedback_observations', label: 'Feedback & Observations', type: 'markdown' },
      { key: 'next_steps', label: 'Next Steps', type: 'markdown' }
    ]
  },
  code_studies: {
    name: 'Code Studies',
    type: 'Technical',
    purpose: 'Deep-dive into how things are built',
    titleField: 'subject',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'overview_purpose', label: 'Overview & Purpose', type: 'markdown' },
      { key: 'structure_analysis', label: 'Structure Analysis', type: 'markdown' },
      { key: 'key_patterns_architectures', label: 'Key Patterns & Architectures', type: 'markdown' },
      { key: 'code_walkthrough', label: 'Code Walkthrough', type: 'code' },
      { key: 'performance_scalability', label: 'Performance & Scalability', type: 'markdown' },
      { key: 'contrast_comparison', label: 'Contrast & Comparison', type: 'markdown' },
      { key: 'takeaways_applications', label: 'Takeaways & Applications', type: 'markdown' },
      { key: 'references', label: 'References', type: 'markdown' }
    ]
  },
  playground: {
    name: 'Playground',
    type: 'Technical',
    purpose: 'Code for fun',
    titleField: 'title',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'idea_prompt', label: 'Idea / Prompt', type: 'markdown' },
      { key: 'code_experimentation', label: 'Code & Experimentation', type: 'code' },
      { key: 'outcomes_observations', label: 'Outcomes & Observations', type: 'markdown' },
      { key: 'reflection', label: 'Reflection', type: 'markdown' },
      { key: 'next_adventures', label: 'Next Adventures', type: 'markdown' },
      { key: 'artifacts', label: 'Artifacts', type: 'markdown' }
    ]
  },
  snippets_and_sketches: {
    name: 'Snippets & Sketches',
    type: 'Technical',
    purpose: 'Reusable mini code blocks',
    titleField: 'title',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'snippet_sketch', label: 'Snippet / Sketch', type: 'code' },
      { key: 'context_usage', label: 'Context & Usage', type: 'markdown' },
      { key: 'notes_explanation', label: 'Notes & Explanation', type: 'markdown' },
      { key: 'refactor_ideas', label: 'Refactor Ideas', type: 'markdown' },
      { key: 'references', label: 'References', type: 'markdown' }
    ]
  },
  iterations: {
    name: 'Iterations',
    type: 'Technical',
    purpose: 'Show the evolution of an idea',
    titleField: 'project_feature',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'version_comparison', label: 'Version Comparison', type: 'markdown' },
      { key: 'decision_log', label: 'Decision Log', type: 'markdown' },
      { key: 'artifacts', label: 'Artifacts', type: 'markdown' },
      { key: 'lessons_learned', label: 'Lessons Learned', type: 'markdown' },
      { key: 'next_iterations', label: 'Next Iterations', type: 'markdown' }
    ]
  },
  studio_scraps: {
    name: 'Studio Scraps',
    type: 'Creative',
    purpose: 'Archive rejected or rough ideas',
    titleField: 'project_concept',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'scrap_description', label: 'Scrap Description', type: 'markdown' },
      { key: 'reason_for_rejection', label: 'Reason for Rejection', type: 'markdown' },
      { key: 'artifacts', label: 'Artifacts', type: 'markdown' },
      { key: 'lessons_learned', label: 'Lessons Learned', type: 'markdown' },
      { key: 'potential_revival', label: 'Potential Revival', type: 'markdown' }
    ]
  },
  wip_work_in_progress: {
    name: 'WIP (Work In Progress)',
    type: 'Creative',
    purpose: 'Share early or ongoing projects',
    titleField: 'project',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'overview', label: 'Overview', type: 'markdown' },
      { key: 'current_progress', label: 'Current Progress', type: 'markdown' },
      { key: 'challenges_open_questions', label: 'Challenges & Open Questions', type: 'markdown' },
      { key: 'next_milestones', label: 'Next Milestones', type: 'markdown' },
      { key: 'assets_links', label: 'Assets & Links', type: 'markdown' },
      { key: 'notes', label: 'Notes', type: 'markdown' }
    ]
  },
  things_i_tried: {
    name: 'Things I Tried',
    type: 'Creative',
    purpose: 'Showcase one-shot or trial experiments',
    titleField: 'experiment_name',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tool_medium', label: 'Tool / Medium', type: 'string' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'objective', label: 'Objective', type: 'markdown' },
      { key: 'steps_taken', label: 'Steps Taken', type: 'markdown' },
      { key: 'outcome', label: 'Outcome', type: 'markdown' },
      { key: 'reflection', label: 'Reflection', type: 'markdown' },
      { key: 'artifacts_links', label: 'Artifacts & Links', type: 'markdown' },
      { key: 'next_experiments', label: 'Next Experiments', type: 'markdown' }
    ]
  },
  the_backroom: {
    name: 'The Backroom',
    type: 'Creative',
    purpose: 'Reveal personal or raw explorations',
    titleField: 'context_prompt',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'notes_brainstorm', label: 'Notes & Brainstorm', type: 'markdown' },
      { key: 'attachments', label: 'Attachments', type: 'markdown' },
      { key: 'reflections', label: 'Reflections', type: 'markdown' },
      { key: 'potential_gems', label: 'Potential Gems', type: 'markdown' }
    ]
  },
  visual_experiments: {
    name: 'Visual Experiments',
    type: 'Creative',
    purpose: 'Explore aesthetics and visuals',
    titleField: 'concept',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'technique_tool', label: 'Technique / Tool', type: 'string' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'implementation', label: 'Implementation', type: 'code' },
      { key: 'outputs', label: 'Outputs', type: 'markdown' },
      { key: 'observations', label: 'Observations', type: 'markdown' },
      { key: 'refinements', label: 'Refinements', type: 'markdown' },
      { key: 'next_variations', label: 'Next Variations', type: 'markdown' },
      { key: 'files_links', label: 'Files & Links', type: 'markdown' }
    ]
  },
  digital_messbook: {
    name: 'Digital Messbook',
    type: 'Creative',
    purpose: 'Keep your chaotic but rich collection organized',
    titleField: 'context',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'fragments_notes', label: 'Fragments & Notes', type: 'markdown' },
      { key: 'links_references', label: 'Links & References', type: 'markdown' },
      { key: 'themes_tags', label: 'Themes & Tags', type: 'markdown' },
      { key: 'actions', label: 'Actions', type: 'markdown' },
      { key: 'tools_formats', label: 'Tools & Formats', type: 'markdown' }
    ]
  },
  unpolished: {
    name: 'Unpolished',
    type: 'Creative',
    purpose: "Show work before it's 'ready'",
    titleField: 'project_piece',
    metadata: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'tags_keywords', label: 'Tags / Keywords', type: 'tags' }
    ],
    sections: [
      { key: 'original_version', label: 'Original Version', type: 'markdown' },
      { key: 'feedback_issues', label: 'Feedback & Issues', type: 'markdown' },
      { key: 'lessons_learned', label: 'Lessons Learned', type: 'markdown' },
      { key: 'next_steps', label: 'Next Steps', type: 'markdown' }
    ]
  }
};

function renderGenericTemplate(templateId, config, format = 'md', data = {}) {
  const tags = parseTags(data.tags_keywords, [config.type, 'workflow']);
  const title = data[config.titleField] || data.title || config.name;
  const subtitle = config.subtitleField ? data[config.subtitleField] : null;
  const dateValue = data.date || data.ended_at || data.started_at || null;

  const metadataEntries = (config.metadata || []).map(({ key, label, type }) => ({
    label,
    value:
      key === 'tags_keywords'
        ? tags
        : key === 'date'
          ? dateValue
          : data[key],
    type
  }));

  const summarySection = data.__summary
    ? [{ title: 'Workflow Summary', type: 'markdown', body: data.__summary }]
    : [];

  const sections = [
    ...summarySection,
    ...(config.sections || []).map(({ key, label, type }) => ({
      title: label,
      type,
      body: data[key]
    }))
  ];

  if (format === 'html') {
    const headerParts = [
      `<article class="archivai-template" data-template="${templateId}">`,
      '<header>',
      `<h1>${escapeHtml(title)}</h1>`
    ];
    if (subtitle) {
      headerParts.push(`<p class="subtitle">${escapeHtml(String(subtitle))}</p>`);
    }
    if (config.purpose) {
      headerParts.push(`<p class="template-purpose">${escapeHtml(config.purpose)}</p>`);
    }
    headerParts.push('</header>');

    const metadataBlock = renderMetadata(metadataEntries, 'html');
    const sectionsBlock = renderSections(sections, 'html');

    return `${headerParts.join('')}${metadataBlock}${sectionsBlock}</article>`;
  }

  const frontmatter = fm({
    title,
    template: templateId,
    type: config.type,
    purpose: config.purpose,
    date: dateValue,
    tags
  });

  const metadataBlock = renderMetadata(metadataEntries, 'md');
  const sectionsBlock = renderSections(sections, 'md');

  const lines = [
    frontmatter,
    `# ${title}`
  ];

  if (subtitle) {
    lines.push('', `_${subtitle}_`);
  }

  if (config.purpose) {
    lines.push('', `> ${config.purpose}`);
  }

  if (metadataBlock) {
    lines.push('', metadataBlock.trimEnd());
  }

  if (sectionsBlock) {
    lines.push('', sectionsBlock.trimEnd());
  }

  return lines.filter((segment, index) => segment !== '' || lines[index - 1] !== '').join('\n') + '\n';
}

function createGenericRenderer(id, config) {
  return {
    meta: {
      id,
      name: config.name,
      type: config.type,
      purpose: config.purpose
    },
    render(format = 'md', data = {}) {
      return renderGenericTemplate(id, config, format, data);
    }
  };
}

const genericRenderers = Object.fromEntries(
  Object.entries(genericTemplateConfigs).map(([id, config]) => [id, createGenericRenderer(id, config)])
);

const baseRenderers = {
  process_journal: {
    meta: { id: 'process_journal', name: 'Process Journal', type: 'Reflective', purpose: 'Chronicle project progress and iteration' },
    render(format = 'md', data = {}) {
      return processJournal.render(format, data);
    }
  },
  experiment_report: {
    meta: { id: 'experiment_report', name: 'Experiment Report', type: 'Technical', purpose: 'Document controlled experiments' },
    render(format = 'md', data = {}) {
      return experimentReport.render(format, data);
    }
  },
  prompt_card: {
    meta: { id: 'prompt_card', name: 'Prompt Card', type: 'Technical', purpose: 'Capture prompt / response exchanges' },
    render(format = 'md', data = {}) {
      return promptCard.render(format, data);
    }
  }
};

const templateRenderers = { ...baseRenderers, ...genericRenderers };

export function renderTemplate(templateId, format = 'md', data = {}) {
  const renderer = templateRenderers[templateId];
  if (!renderer) {
    throw new Error(`Unknown template renderer: ${templateId}`);
  }
  return renderer.render(format, data);
}

export function getTemplateIds() {
  return Object.keys(templateRenderers);
}

export function getTemplateMeta(templateId) {
  return templateRenderers[templateId]?.meta || null;
}

export function getGenericTemplateConfig(templateId) {
  return genericTemplateConfigs[templateId] || null;
}

export function isGenericTemplate(templateId) {
  return Object.prototype.hasOwnProperty.call(genericTemplateConfigs, templateId);
}

export { templateRenderers, genericTemplateConfigs };
