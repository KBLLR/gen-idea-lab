/**
 * Workflow JSON to Template Field Mapping System
 * Maps workflow execution results to ArchivAI template fields
 */

import { getGenericTemplateConfig, isGenericTemplate, getTemplateIds } from './templates/library.js';

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
  if (mapper) {
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

  if (isGenericTemplate(templateId)) {
    return createGenericTemplateData(workflowResult, templateId);
  }

  throw new Error(`No mapper found for template: ${templateId}`);
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

function createGenericTemplateData(workflowResult, templateId) {
  const config = getGenericTemplateConfig(templateId);
  if (!config) {
    throw new Error(`Generic template configuration missing for: ${templateId}`);
  }

  const summary = buildWorkflowSummary(workflowResult);
  const defaultDate = workflowResult.ended_at || workflowResult.started_at || new Date().toISOString();

  const data = {
    workflow_id: workflowResult.workflow_id,
    run_id: workflowResult.run_id,
    date: defaultDate,
    tags_keywords: summary.tags.join(', '),
    __summary: summary.overview
  };

  if (config.titleField && !data[config.titleField]) {
    data[config.titleField] = workflowResult.title || summary.focus;
  }

  if (config.subtitleField && !data[config.subtitleField]) {
    data[config.subtitleField] = summary.objective;
  }

  const assignValue = (key, type) => {
    if (!key || Object.prototype.hasOwnProperty.call(data, key)) return;
    const value = generateContentForField(key, type, summary, workflowResult);
    if (value != null) {
      data[key] = value;
    }
  };

  (config.metadata || []).forEach(({ key, type }) => {
    if (key === 'date' || key === 'tags_keywords') return;
    assignValue(key, type);
  });

  (config.sections || []).forEach(({ key, type }) => assignValue(key, type));

  return data;
}

function buildWorkflowSummary(workflow) {
  const steps = workflow.steps || [];
  const models = [...new Set(steps.map((step) => step.model).filter(Boolean))];
  const overview = generateContext(workflow);
  const method = generateMethodDescription(steps);
  const findings = extractFindings(steps);
  const nextSteps = generateNextSteps(steps);
  const discussion = generateDiscussion(steps);
  const limitations = generateLimitations(workflow);
  const objective = workflow.meta?.objective || workflow.meta?.goal || `Document the workflow "${workflow.title || workflow.workflow_id}".`;
  const hypothesis = generateHypothesis(workflow);
  const status = workflow.status || workflow.meta?.status || 'completed';
  const duration = computeDuration(workflow.started_at, workflow.ended_at);
  const observationsList = steps.length ? steps.map((step, index) => formatObservation(step, index)) : ['Workflow executed without detailed step records.'];
  const analysisList = findings;
  const artifactsList = collectArtifacts(steps);
  const feedbackList = collectFeedback(steps);
  const promptsList = collectPrompts(steps);
  const codeSnippet = collectCode(steps);
  const attachmentsList = collectLinks(steps);
  const metricsList = collectMetrics(steps);
  const tags = buildTags(workflow, models);

  const reflectionsList = [
    overview,
    discussion,
    limitations,
    metricsList.length ? `Captured metrics for ${metricsList.length} step(s).` : null
  ].filter(Boolean);

  return {
    overview,
    method,
    findings,
    nextSteps,
    discussion,
    limitations,
    objective,
    hypothesis,
    status,
    duration,
    modelsUsed: models,
    observationsList,
    analysisList,
    artifactsList,
    reflectionsList,
    feedbackList,
    promptsList,
    codeSnippet,
    attachmentsList,
    metricsList,
    tags,
    focus: workflow.meta?.focus || workflow.meta?.description || workflow.title || 'Workflow exploration'
  };
}

function generateContentForField(key, type, summary, workflow) {
  if (!key) return null;
  const lower = key.toLowerCase();

  if (lower === 'date') {
    return workflow.ended_at || workflow.started_at || null;
  }

  if (lower.includes('objective') || lower.includes('goal')) {
    return summary.objective;
  }

  if (lower.includes('hypothesis')) {
    return summary.hypothesis;
  }

  if (lower.includes('setup') || lower.includes('method')) {
    return summary.method;
  }

  if (lower.includes('observation') || lower.includes('outcome') || lower.includes('result') || lower.includes('output')) {
    return summary.observationsList;
  }

  if (lower.includes('analysis') || lower.includes('insight')) {
    return summary.analysisList;
  }

  if (lower.includes('conclusion') || lower.includes('lesson')) {
    return summary.findings.join('\n');
  }

  if (lower.includes('next') || lower.includes('future') || lower.includes('milestone') || lower.includes('iteration')) {
    return summary.nextSteps;
  }

  if (lower.includes('artifact') || lower.includes('reference') || lower.includes('link') || lower.includes('attachment') || lower.includes('file')) {
    return summary.artifactsList.length ? summary.artifactsList : summary.attachmentsList;
  }

  if (lower.includes('reflection') || lower.includes('note') || lower.includes('learning')) {
    return summary.reflectionsList;
  }

  if (lower.includes('feedback')) {
    return summary.feedbackList.length ? summary.feedbackList : summary.reflectionsList;
  }

  if (lower.includes('prompt') || lower.includes('inspiration') || lower.includes('moodboard')) {
    return summary.promptsList;
  }

  if (lower.includes('code') || type === 'code') {
    return summary.codeSnippet;
  }

  if (lower.includes('status')) {
    return summary.status;
  }

  if (lower.includes('duration') || lower.includes('time')) {
    return summary.duration;
  }

  if (lower.includes('concept') || lower.includes('focus') || lower.includes('context') || lower.includes('project') || lower.includes('feature')) {
    return summary.focus;
  }

  if (lower.includes('sprint') || lower.includes('week')) {
    return workflow.meta?.sprint || 'Current Sprint';
  }

  if (lower.includes('difficulty')) {
    return workflow.meta?.difficulty || 'Medium';
  }

  if (lower.includes('challenge')) {
    return workflow.meta?.challenge || summary.focus;
  }

  if (lower.includes('location')) {
    return workflow.meta?.location || 'Virtual';
  }

  if (lower.includes('tools') || lower.includes('tool')) {
    return summary.modelsUsed.join(', ');
  }

  if (lower.includes('theme') || lower.includes('tags_keywords')) {
    return summary.tags.join(', ');
  }

  if (lower.includes('overview')) {
    return summary.overview;
  }

  return summary.overview;
}

function computeDuration(start, end) {
  if (!start || !end) return '';
  try {
    const s = new Date(start);
    const e = new Date(end);
    const minutes = Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000));
    return `${s.toISOString()} → ${e.toISOString()} (${minutes} min)`;
  } catch (error) {
    console.warn('Failed to compute duration:', error);
    return `${start} → ${end}`;
  }
}

function formatObservation(step, index) {
  const name = step.name || `Step ${index + 1}`;
  const response = step.response || step.output || step.notes || '';
  return response ? `${name}: ${truncate(response)}` : `${name}: No response recorded.`;
}

function collectArtifacts(steps) {
  const items = [];
  steps?.forEach((step, index) => {
    if (Array.isArray(step.artifacts)) {
      step.artifacts.forEach((artifact, idx) => {
        items.push(`${step.name || `Step ${index + 1}`}: ${describeArtifact(artifact, idx)}`);
      });
    }
    if (step.response) {
      items.push(`${step.name || `Step ${index + 1}`}: ${truncate(step.response)}`);
    }
    if (step.output && typeof step.output === 'string') {
      items.push(`${step.name || `Step ${index + 1}`}: ${truncate(step.output)}`);
    }
  });
  return items.length ? items : ['Outputs captured during workflow execution.'];
}

function collectFeedback(steps) {
  const items = [];
  steps?.forEach((step, index) => {
    const feedback = step.feedback || step.notes;
    if (feedback) {
      items.push(`${step.name || `Step ${index + 1}`}: ${truncate(feedback)}`);
    }
  });
  return items;
}

function collectPrompts(steps) {
  const prompts = [];
  steps?.forEach((step, index) => {
    const prompt = step.request?.prompt;
    if (prompt) {
      prompts.push(`${step.name || `Step ${index + 1}`}: ${truncate(prompt)}`);
    }
  });
  return prompts;
}

function collectCode(steps) {
  const blocks = [];
  steps?.forEach((step, index) => {
    const prompt = step.request?.prompt;
    const response = step.response;
    if (!prompt && !response) return;
    const header = `// ${step.name || `Step ${index + 1}`}`;
    const body = [header];
    if (prompt) body.push(prompt);
    if (response && response !== prompt) body.push(response);
    blocks.push(body.join('\n'));
  });
  return blocks.join('\n\n');
}

function collectLinks(steps) {
  const links = [];
  steps?.forEach((step) => {
    const attachments = step.attachments || step.links || step.resources;
    if (Array.isArray(attachments)) {
      attachments.forEach((attachment, index) => {
        links.push(describeArtifact(attachment, index));
      });
    } else if (attachments) {
      links.push(String(attachments));
    }
  });
  return links;
}

function collectMetrics(steps) {
  const metrics = [];
  steps?.forEach((step, index) => {
    if (!step.metrics) return;
    const latency = step.metrics.latency_ms != null ? `${step.metrics.latency_ms} ms` : 'latency n/a';
    const tokensIn = step.metrics.tokens_in != null ? `${step.metrics.tokens_in} tokens in` : null;
    const tokensOut = step.metrics.tokens_out != null ? `${step.metrics.tokens_out} tokens out` : null;
    const parts = [latency, tokensIn, tokensOut].filter(Boolean).join(', ');
    metrics.push(`${step.name || `Step ${index + 1}`}: ${parts || 'No metrics recorded'}`);
  });
  return metrics;
}

function describeArtifact(artifact, index = 0) {
  if (typeof artifact === 'string') return artifact;
  if (!artifact || typeof artifact !== 'object') return `Artifact ${index + 1}`;
  if (artifact.name && artifact.url) return `${artifact.name} (${artifact.url})`;
  if (artifact.name) return artifact.name;
  if (artifact.url) return artifact.url;
  return `Artifact ${index + 1}`;
}

function buildTags(workflow, models) {
  const tagSet = new Set();
  const addTag = (tag) => {
    if (!tag) return;
    String(tag)
      .split(/[\n,]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => tagSet.add(part));
  };

  (workflow.tags || []).forEach(addTag);
  addTag(workflow.meta?.tags);
  addTag(workflow.meta?.category);
  models.forEach(addTag);
  addTag('workflow');
  return Array.from(tagSet);
}

function truncate(value, length = 160) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1)}…`;
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
  return getTemplateIds();
}

// Validate if a workflow can be mapped to a specific template
export function canMapWorkflowToTemplate(workflowResult, templateId) {
  if (!workflowResult || !templateId) return false;

  const requiredFields = {
    process_journal: ['steps'],
    experiment_report: ['steps'],
    prompt_card: ['steps']
  };

  if (isGenericTemplate(templateId)) {
    return Array.isArray(workflowResult.steps) && workflowResult.steps.length > 0;
  }

  const required = requiredFields[templateId] || [];
  return required.every(field => workflowResult[field]);
}