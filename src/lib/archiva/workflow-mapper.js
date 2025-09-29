/**
 * Workflow JSON to Template Field Mapping System
 * Maps workflow execution results to ArchivAI template fields
 */

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
    throw new Error(`No mapper found for template: ${templateId}`);
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
  return ['process_journal', 'experiment_report', 'prompt_card'];
}

// Validate if a workflow can be mapped to a specific template
export function canMapWorkflowToTemplate(workflowResult, templateId) {
  if (!workflowResult || !templateId) return false;

  const requiredFields = {
    process_journal: ['steps'],
    experiment_report: ['steps'],
    prompt_card: ['steps']
  };

  const required = requiredFields[templateId] || [];
  return required.every(field => workflowResult[field]);
}