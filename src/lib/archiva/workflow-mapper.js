/**
 * Workflow JSON to Template Field Mapping System
 * Maps workflow execution results to ArchivAI template fields
 */

import { templates as templateDefinitions } from './templates.js';
import { normalizeTemplateId } from './template-registry.js';

// Map workflow JSON to template fields
export function mapWorkflowToTemplate(workflowResult, templateId) {
  const mappers = {
    process_journal: {
      title: (w) => w.title || `Workflow: ${w.workflow_id}`,
      started_at: (w) => w.started_at,
      ended_at: (w) => w.ended_at,
      context: (w) => w.meta?.description || generateContext(w),
      method: (w) => generateMethodDescription(w.steps),
      summary: (w) => ({
        findings: extractFindings(w.steps),
        next_steps: generateNextSteps(w.results || w.steps)
      })
    },

    experiment_report: {
      title: (w) => w.title || `Experiment: ${w.workflow_id}`,
      hypothesis: (w) => w.meta?.hypothesis || generateHypothesis(w),
      inputs: (w) => w.inputs || extractInputs(w.steps),
      meta: (w) => ({ env: w.meta?.env || {} }),
      steps: (w) => w.steps,
      discussion: (w) => w.meta?.discussion || generateDiscussion(w.results),
      limitations: (w) => w.meta?.limitations || generateLimitations(w)
    },

    prompt_card: {
      title: (w) => w.title || 'Prompt Card',
      steps: (w) => w.steps,
      workflow_id: (w) => w.workflow_id,
      run_id: (w) => w.run_id,
      started_at: (w) => w.started_at,
      ended_at: (w) => w.ended_at
    }
  };

  const mapper = mappers[templateId];
  if (!mapper) {
    return mapGenericTemplate(workflowResult, templateId);
  }

  const mappedData = {};
  for (const [field, mapperFn] of Object.entries(mapper)) {
    try {
      mappedData[field] = mapperFn(workflowResult);
    } catch (error) {
      console.warn(`Error mapping field ${field}:`, error);
      mappedData[field] = null;
    }
  }

  return mappedData;
}

// Helper functions for generating content from workflow data
function generateContext(workflow) {
  if (workflow.meta?.description) return workflow.meta.description;

  const stepCount = workflow.steps?.length || 0;
  const models = [...new Set(workflow.steps?.map(s => s.model).filter(Boolean) || [])];

  return `Workflow execution with ${stepCount} steps using models: ${models.join(', ')}.`;
}

function generateMethodDescription(steps) {
  if (!steps?.length) return 'No steps recorded.';

  const descriptions = steps.map((step, i) => {
    const model = step.model ? ` (${step.model})` : '';
    const duration = step.metrics?.latency_ms ? ` [${step.metrics.latency_ms}ms]` : '';
    return `${i + 1}. ${step.name}${model}${duration}`;
  });

  return descriptions.join('\n');
}

function extractFindings(steps) {
  const findings = [];

  steps?.forEach(step => {
    if (step.metrics?.latency_ms) {
      findings.push(`${step.name}: ${step.metrics.latency_ms}ms response time`);
    }
    if (step.metrics?.tokens_out) {
      findings.push(`${step.name}: Generated ${step.metrics.tokens_out} tokens`);
    }
    if (step.error) {
      findings.push(`${step.name}: Encountered error - ${step.error}`);
    }
  });

  return findings.length ? findings : ['Workflow completed successfully'];
}

function generateNextSteps(results) {
  const steps = [];

  // Analyze results and suggest improvements
  if (results?.some(r => r.metrics?.latency_ms > 5000)) {
    steps.push('Optimize model selection for better performance');
  }

  if (results?.some(r => r.error)) {
    steps.push('Review and fix error handling in workflow steps');
  }

  steps.push('Consider running workflow with different input parameters');
  steps.push('Document lessons learned for future workflows');

  return steps;
}

function generateHypothesis(workflow) {
  const models = [...new Set(workflow.steps?.map(s => s.model).filter(Boolean) || [])];

  if (models.length > 1) {
    return `Different AI models (${models.join(', ')}) will show distinct performance characteristics for this task.`;
  }

  return `The ${models[0] || 'selected model'} will effectively complete the specified task within acceptable performance parameters.`;
}

function extractInputs(steps) {
  const inputs = {};

  steps?.forEach((step, i) => {
    if (step.request?.prompt) {
      inputs[`step_${i + 1}_prompt`] = step.request.prompt;
    }
    if (step.request?.messages) {
      inputs[`step_${i + 1}_messages`] = step.request.messages;
    }
  });

  return inputs;
}

function generateDiscussion(results) {
  if (!results?.length) return 'Results analysis pending.';

  const avgLatency = results
    .map(r => r.metrics?.latency_ms)
    .filter(Boolean)
    .reduce((a, b, _, arr) => a + b / arr.length, 0);

  const totalTokens = results
    .map(r => (r.metrics?.tokens_in || 0) + (r.metrics?.tokens_out || 0))
    .reduce((a, b) => a + b, 0);

  return `Workflow completed with average latency of ${Math.round(avgLatency)}ms and processed ${totalTokens} total tokens. Performance metrics suggest successful execution with measurable computational cost.`;
}

function generateLimitations(workflow) {
  const limitations = [];

  if (workflow.steps?.length === 1) {
    limitations.push('Single-step workflow limits complexity analysis');
  }

  if (!workflow.meta?.hypothesis) {
    limitations.push('No explicit hypothesis defined for validation');
  }

  limitations.push('Results limited to current model versions and configurations');
  limitations.push('Performance may vary with different input sizes or complexity');

  return limitations.join('. ') + '.';
}

function mapGenericTemplate(workflow, templateId) {
  const slug = normalizeTemplateId(templateId);
  const templateEntry = Object.entries(templateDefinitions).find(
    ([key]) => normalizeTemplateId(key) === slug
  );

  if (!templateEntry) {
    throw new Error(`No mapper found for template: ${templateId}`);
  }

  const [, definition] = templateEntry;

  const summaryFindings = workflow.summary?.findings?.length
    ? workflow.summary.findings
    : extractFindings(workflow.steps);
  const nextSteps = workflow.summary?.next_steps?.length
    ? workflow.summary.next_steps
    : generateNextSteps(workflow.steps);
  const contextDescription = generateContext(workflow);
  const methodDescription = generateMethodDescription(workflow.steps);
  const analysisText = generateDiscussion(workflow.steps);
  const limitationsText = generateLimitations(workflow);
  const blockersList = gatherBlockers(workflow.steps);
  const artifactsList = gatherArtifacts(workflow);
  const tagsList = deriveTags(workflow);
  const notesList = gatherNotes(workflow.steps);
  const codeSample = gatherCodeSample(workflow.steps);
  const toolsSummary = deriveToolsSummary(workflow.steps);
  const reflectionsText = buildReflections(summaryFindings, analysisText, nextSteps);

  const mappedData = {
    workflow_id: workflow.workflow_id || null,
    run_id: workflow.run_id || null,
    started_at: workflow.started_at || null,
    ended_at: workflow.ended_at || null,
    title: workflow.title || definition.name
  };

  definition.fields.forEach((field, index) => {
    mappedData[field.field_key] = deriveFieldValue(field, workflow, {
      summaryFindings,
      nextSteps,
      contextDescription,
      methodDescription,
      analysisText,
      limitationsText,
      blockersList,
      artifactsList,
      tagsList,
      notesList,
      codeSample,
      toolsSummary,
      reflectionsText,
      stepIndex: index
    });
  });

  return mappedData;
}

function deriveFieldValue(field, workflow, context) {
  const key = field.field_key || '';
  const lowerKey = key.toLowerCase();
  const defaultText = `Generated from workflow ${workflow.workflow_id || ''}`.trim();

  if (key === 'date') {
    return (workflow.ended_at || workflow.started_at || new Date().toISOString()).split('T')[0];
  }

  if (key === 'title') {
    return workflow.title || context.contextDescription;
  }

  if (key === 'session') {
    return `Session ${context.stepIndex + 1}`;
  }

  if (lowerKey.includes('experiment_name') || lowerKey === 'project') {
    return workflow.title || 'Workflow Experiment';
  }

  if (lowerKey.includes('objective') || lowerKey.includes('goal')) {
    return workflow.meta?.objective || workflow.meta?.description || context.contextDescription;
  }

  if (lowerKey.includes('hypothesis')) {
    return workflow.meta?.hypothesis || generateHypothesis(workflow);
  }

  if (lowerKey.includes('context') || lowerKey.includes('background') || lowerKey.includes('overview')) {
    return context.contextDescription;
  }

  if (lowerKey.includes('setup') || lowerKey.includes('method') || lowerKey.includes('procedure') || lowerKey.includes('steps_taken')) {
    return context.methodDescription;
  }

  if (lowerKey.includes('observation') || lowerKey.includes('results') || lowerKey.includes('outputs') || lowerKey.includes('summary')) {
    const findings = formatBulletList(context.summaryFindings);
    return findings || context.analysisText || context.methodDescription;
  }

  if (lowerKey.includes('analysis') || lowerKey.includes('insight') || lowerKey.includes('interpretation')) {
    return context.analysisText || context.limitationsText;
  }

  if (lowerKey.includes('limitation')) {
    return context.limitationsText;
  }

  if (lowerKey.includes('next') || lowerKey.includes('action') || lowerKey.includes('follow')) {
    return formatBulletList(context.nextSteps);
  }

  if (lowerKey.includes('blocker') || lowerKey.includes('challenge') || lowerKey.includes('risk')) {
    return formatBulletList(context.blockersList) || 'No blockers identified during this run.';
  }

  if (lowerKey.includes('feedback') || lowerKey.includes('critique') || lowerKey.includes('review')) {
    return formatBulletList(context.notesList) || 'Feedback pending.';
  }

  if (lowerKey.includes('artifact') || lowerKey.includes('reference') || lowerKey.includes('attachment') || lowerKey.includes('link') || lowerKey.includes('asset')) {
    return formatBulletList(context.artifactsList);
  }

  if (lowerKey.includes('tag') || lowerKey.includes('keyword') || lowerKey.includes('theme')) {
    return context.tagsList.join(', ');
  }

  if (lowerKey.includes('code') || lowerKey.includes('snippet')) {
    return context.codeSample;
  }

  if (lowerKey.includes('reflection') || lowerKey.includes('lesson') || lowerKey.includes('takeaway') || lowerKey.includes('retrospective')) {
    return context.reflectionsText;
  }

  if (lowerKey.includes('notes')) {
    return formatBulletList(context.notesList) || context.reflectionsText;
  }

  if (lowerKey.includes('duration')) {
    return computeDuration(workflow.started_at, workflow.ended_at);
  }

  if (lowerKey.includes('tool') || lowerKey.includes('technique') || lowerKey.includes('model')) {
    return context.toolsSummary;
  }

  return defaultText;
}

function formatBulletList(items) {
  if (!items) return '';
  const list = Array.isArray(items) ? items : [items];
  const filtered = list.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  if (!filtered.length) return '';
  return filtered.map((item) => `- ${item}`).join('\n');
}

function gatherBlockers(steps = []) {
  const blockers = [];
  steps.forEach((step) => {
    if (step.error) {
      blockers.push(`${step.name || 'Step'}: ${step.error}`);
    }
    if (step.metrics?.latency_ms && step.metrics.latency_ms > 5000) {
      blockers.push(`${step.name || 'Step'} experienced high latency (${step.metrics.latency_ms}ms)`);
    }
  });
  return blockers.length ? blockers : ['No critical blockers reported'];
}

function gatherArtifacts(workflow) {
  const artifacts = [];
  workflow.steps?.forEach((step) => {
    if (step.response) {
      artifacts.push(`${step.name || 'Step'} output: ${truncateText(step.response)}`);
    }
    if (step.output) {
      artifacts.push(`${step.name || 'Step'} artifact: ${truncateText(step.output)}`);
    }
    if (step.links) {
      artifacts.push(`${step.name || 'Step'} links: ${[].concat(step.links).join(', ')}`);
    }
  });

  if (workflow.meta?.references) {
    artifacts.push(`References: ${[].concat(workflow.meta.references).join(', ')}`);
  }

  return artifacts.length ? artifacts : ['Artifacts captured automatically from workflow steps'];
}

function deriveTags(workflow) {
  const tags = new Set();
  workflow.steps?.forEach((step) => {
    if (step.model) tags.add(step.model);
    if (step.type) tags.add(step.type);
  });
  if (workflow.meta?.category) tags.add(workflow.meta.category);
  if (workflow.title) {
    workflow.title.split(/\s+/).slice(0, 3).forEach((word) => tags.add(word.toLowerCase()));
  }
  tags.add('archivai');
  tags.add('planner');
  return Array.from(tags);
}

function gatherNotes(steps = []) {
  const notes = [];
  steps.forEach((step) => {
    if (step.notes) {
      notes.push(`${step.name || 'Step'}: ${step.notes}`);
    }
    if (step.request?.prompt) {
      notes.push(`${step.name || 'Step'} prompt: ${truncateText(step.request.prompt)}`);
    }
  });
  return notes;
}

function gatherCodeSample(steps = []) {
  for (const step of steps) {
    if (step.code) {
      return String(step.code);
    }
    if (step.response && step.response.includes('```')) {
      return step.response.replace(/.*```[a-zA-Z]*\n?/s, '').replace(/```\s*$/, '');
    }
    if (step.request?.prompt && step.request.prompt.includes('function')) {
      return step.request.prompt;
    }
  }
  return '/* No explicit code captured from workflow run */';
}

function deriveToolsSummary(steps = []) {
  const models = new Set();
  steps.forEach((step) => {
    if (step.model) models.add(step.model);
    if (step.provider) models.add(step.provider);
  });
  return models.size ? `Models used: ${Array.from(models).join(', ')}` : 'Models: not specified';
}

function buildReflections(findings, analysis, nextSteps) {
  const firstFinding = Array.isArray(findings) ? findings[0] : findings;
  const nextStep = Array.isArray(nextSteps) ? nextSteps[0] : nextSteps;
  return [
    firstFinding ? `Key insight: ${firstFinding}` : null,
    analysis ? `Analysis: ${analysis}` : null,
    nextStep ? `Next focus: ${nextStep}` : null
  ].filter(Boolean).join('\n');
}

function computeDuration(start, end) {
  if (!start || !end) return 'Duration not recorded';
  try {
    const s = new Date(start);
    const e = new Date(end);
    const minutes = Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000));
    return `${s.toISOString()} → ${e.toISOString()} (${minutes} min)`;
  } catch {
    return `${start} → ${end}`;
  }
}

function truncateText(text, limit = 160) {
  const str = String(text);
  if (str.length <= limit) return str;
  return `${str.slice(0, limit)}…`;
}

// AI Enhancement function for intelligent content population
export async function enhanceTemplateContent(templateData, model, aiServiceUrl = '/api/chat') {
  const prompt = `
Analyze this workflow documentation data and enhance it with intelligent insights:

${JSON.stringify(templateData, null, 2)}

Please provide enhanced content for:
1. Key findings and patterns from the workflow execution
2. Potential improvements and optimizations
3. Next experimental directions based on results
4. Technical observations and lessons learned

Format your response as a JSON object with these keys: findings, improvements, next_directions, technical_notes
`;

  try {
    const response = await fetch(aiServiceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`AI enhancement failed: ${response.statusText}`);
    }

    const result = await response.json();
    let enhancement;

    try {
      enhancement = JSON.parse(result.response || result.message || '{}');
    } catch {
      // Fallback if AI doesn't return valid JSON
      enhancement = {
        findings: ['AI analysis completed'],
        improvements: ['Consider iterating on current approach'],
        next_directions: ['Explore variations of this workflow'],
        technical_notes: ['Performance within expected parameters']
      };
    }

    return { ...templateData, aiInsights: enhancement };
  } catch (error) {
    console.warn('AI enhancement failed, using template data as-is:', error);
    return templateData;
  }
}

// Utility to get available template renderers
export function getAvailableRenderers() {
  return Object.keys(templateDefinitions).map((key) => normalizeTemplateId(key));
}

// Validate if a workflow can be mapped to a specific template
export function canMapWorkflowToTemplate(workflowResult, templateId) {
  if (!workflowResult || !templateId) return false;

  const normalizedTemplate = normalizeTemplateId(templateId);
  const available = getAvailableRenderers();
  if (!available.includes(normalizedTemplate)) {
    return false;
  }

  return Boolean(workflowResult.steps);
}
