/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import useStore from './store';

/**
 * Extract context from the current application state for workflow generation
 * @returns {Object} Context object with relevant application state
 */
export function extractWorkflowContext() {
  const state = useStore.getState();

  return {
    timestamp: new Date().toISOString(),
    activeApp: state.activeApp,
    activeModule: state.activeModuleId ? {
      id: state.activeModuleId,
      title: state.modules[state.activeModuleId]?.['Module Title'],
      code: state.modules[state.activeModuleId]?.['Module Code'],
      type: state.modules[state.activeModuleId]?.['Module Type'],
      ects: state.modules[state.activeModuleId]?.['ECTS Credits'],
      coordinator: state.modules[state.activeModuleId]?.['Module Coordinator']
    } : null,
    recentOrchestratorHistory: state.orchestratorHistory?.slice(-5) || [],
    connectedServices: Object.entries(state.connectedServices || {})
      .filter(([_, service]) => service?.connected)
      .map(([serviceName, service]) => ({
        name: serviceName,
        connected: service.connected,
        lastConnected: service.lastConnected
      })),
    plannerState: state.plannerGraph ? {
      hasGraph: true,
      nodeCount: state.plannerGraph.nodes?.length || 0,
      edgeCount: state.plannerGraph.edges?.length || 0,
      title: state.plannerGraph.title,
      nodeTypes: [...new Set(state.plannerGraph.nodes?.map(n => n.data?.kind) || [])],
      hasWorkflowData: state.plannerGraph.nodes?.some(n => n.type === 'workflow') || false
    } : { hasGraph: false },
    preferences: {
      theme: state.theme,
      workflowAutoTitleModel: state.workflowAutoTitleModel
    },
    customWorkflows: Object.keys(state.customWorkflows || {}).map(id => ({
      id,
      title: state.customWorkflows[id]?.title,
      category: state.customWorkflows[id]?.category,
      difficulty: state.customWorkflows[id]?.difficulty,
      stepCount: state.customWorkflows[id]?.steps?.length || 0
    }))
  };
}

/**
 * Extract context specifically for module-based workflows
 * @param {string} moduleId - The module code/ID
 * @returns {Object} Module-specific context
 */
export function extractModuleContext(moduleId) {
  const state = useStore.getState();
  const module = state.modules[moduleId];

  if (!module) {
    return null;
  }

  return {
    module: {
      code: module['Module Code'],
      title: module['Module Title'],
      type: module['Module Type'],
      ects: module['ECTS Credits'],
      contactHours: module['Contact Time (hours)'],
      coordinator: module['Module Coordinator'],
      objectives: module['Qualification Objectives'] || [],
      keyContents: module['Key Contents / Topics'] || '',
      prerequisites: module['Prerequisites'] || '',
      focusAreas: module['Focus Areas'] || [],
      assessment: module['Assessment'] || '',
      semester: module['Semester'] || ''
    },
    context: extractWorkflowContext(),
    relevantWorkflows: Object.values(state.customWorkflows || {})
      .filter(workflow => workflow.moduleId === moduleId)
      .map(workflow => ({
        id: workflow.id,
        title: workflow.title,
        difficulty: workflow.difficulty,
        stepCount: workflow.steps?.length || 0,
        lastModified: workflow.metadata?.lastModified
      }))
  };
}

/**
 * Extract context for orchestrator conversations
 * @param {number} historyLimit - Number of recent messages to include (default: 10)
 * @returns {Object} Orchestrator-specific context
 */
export function extractOrchestratorContext(historyLimit = 10) {
  const state = useStore.getState();

  return {
    conversation: {
      messageCount: state.orchestratorHistory?.length || 0,
      recentMessages: state.orchestratorHistory?.slice(-historyLimit) || [],
      hasActiveConversation: (state.orchestratorHistory?.length || 0) > 0
    },
    activePersonalities: state.orchestratorHistory
      ?.slice(-historyLimit)
      ?.filter(msg => msg.role === 'assistant')
      ?.map(msg => msg.personality)
      ?.filter(Boolean) || [],
    context: extractWorkflowContext()
  };
}

/**
 * Extract context for specific planner workflows
 * @param {Object} plannerGraph - The planner graph data
 * @returns {Object} Planner-specific context
 */
export function extractPlannerContext(plannerGraph) {
  if (!plannerGraph) {
    return { hasPlanner: false };
  }

  const nodes = plannerGraph.nodes || [];
  const edges = plannerGraph.edges || [];

  // Analyze node types and connections
  const nodesByType = nodes.reduce((acc, node) => {
    const type = node.data?.kind || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(node);
    return acc;
  }, {});

  // Find workflow patterns
  const hasSequentialFlow = edges.some(edge =>
    edge.source?.startsWith('task') && edge.target?.startsWith('task')
  );

  const hasConnectors = nodes.some(node => node.data?.kind === 'connector');

  const assistantNodes = nodesByType.assistant || [];
  const moduleNodes = nodesByType.module || [];
  const toolNodes = nodesByType.tool || [];

  return {
    hasPlanner: true,
    title: plannerGraph.title,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodeTypes: Object.keys(nodesByType),
      assistantCount: assistantNodes.length,
      moduleCount: moduleNodes.length,
      toolCount: toolNodes.length,
      connectorCount: (nodesByType.connector || []).length
    },
    patterns: {
      hasSequentialFlow,
      hasConnectors,
      hasModularStructure: moduleNodes.length > 0 && assistantNodes.length > 0,
      hasToolIntegration: toolNodes.length > 0,
      complexity: nodes.length > 5 ? 'complex' : nodes.length > 2 ? 'moderate' : 'simple'
    },
    primaryFocus: moduleNodes.length > 0 ? 'module-based' :
                  assistantNodes.length > 0 ? 'assistant-driven' :
                  toolNodes.length > 0 ? 'tool-focused' : 'general'
  };
}

/**
 * Extract comprehensive context combining all relevant application state
 * @returns {Object} Complete application context
 */
export function extractCompleteContext() {
  const state = useStore.getState();

  return {
    workflow: extractWorkflowContext(),
    module: state.activeModuleId ? extractModuleContext(state.activeModuleId) : null,
    orchestrator: extractOrchestratorContext(),
    planner: extractPlannerContext(state.plannerGraph),
    metadata: {
      extractedAt: new Date().toISOString(),
      version: '1.0.0',
      source: 'GenBooth Idea Lab'
    }
  };
}

/**
 * Generate a natural language summary of the current context
 * @param {Object} context - Context object (defaults to current complete context)
 * @returns {string} Human-readable context summary
 */
export function generateContextSummary(context = null) {
  const ctx = context || extractCompleteContext();

  const parts = [];

  // Active app and module
  if (ctx.workflow.activeApp) {
    parts.push(`Currently working in the ${ctx.workflow.activeApp} app`);
  }

  if (ctx.module?.module) {
    const mod = ctx.module.module;
    parts.push(`Active module: ${mod.title} (${mod.code}) - ${mod.ects} ECTS`);
  }

  // Planner state
  if (ctx.planner.hasPlanner) {
    parts.push(`Planner contains ${ctx.planner.stats.totalNodes} nodes with ${ctx.planner.patterns.complexity} complexity`);
    if (ctx.planner.primaryFocus !== 'general') {
      parts.push(`Primary focus: ${ctx.planner.primaryFocus}`);
    }
  }

  // Connected services
  if (ctx.workflow.connectedServices.length > 0) {
    const serviceNames = ctx.workflow.connectedServices.map(s => s.name).join(', ');
    parts.push(`Connected services: ${serviceNames}`);
  }

  // Orchestrator activity
  if (ctx.orchestrator.conversation.hasActiveConversation) {
    parts.push(`${ctx.orchestrator.conversation.messageCount} orchestrator messages`);
  }

  // Custom workflows
  if (ctx.workflow.customWorkflows.length > 0) {
    parts.push(`${ctx.workflow.customWorkflows.length} custom workflows available`);
  }

  return parts.length > 0
    ? parts.join('. ') + '.'
    : 'No significant application activity detected.';
}

/**
 * Check if the current context suggests specific workflow recommendations
 * @returns {Array} Array of workflow suggestions with reasoning
 */
export function generateWorkflowSuggestions() {
  const context = extractCompleteContext();
  const suggestions = [];

  // Module-based suggestions
  if (context.module?.module) {
    const mod = context.module.module;

    if (mod.focusAreas?.includes('UI') || mod.focusAreas?.includes('UX')) {
      suggestions.push({
        type: 'module_workflow',
        title: 'UI/UX Design Workflow',
        reasoning: 'Active module has UI/UX focus areas',
        complexity: 'moderate',
        estimatedSteps: 4
      });
    }

    if (mod.type === 'Project' || mod.type === 'Practical') {
      suggestions.push({
        type: 'project_workflow',
        title: 'Project Development Workflow',
        reasoning: 'Module type suggests hands-on project work',
        complexity: 'complex',
        estimatedSteps: 6
      });
    }
  }

  // Planner-based suggestions
  if (context.planner.hasPlanner && context.planner.stats.totalNodes > 3) {
    suggestions.push({
      type: 'planner_workflow',
      title: 'Convert Planner to Workflow',
      reasoning: 'Existing planner graph with multiple nodes detected',
      complexity: context.planner.patterns.complexity,
      estimatedSteps: Math.max(3, Math.floor(context.planner.stats.totalNodes / 2))
    });
  }

  // Service integration suggestions
  if (context.workflow.connectedServices.length >= 2) {
    suggestions.push({
      type: 'integration_workflow',
      title: 'Service Integration Workflow',
      reasoning: `Multiple connected services (${context.workflow.connectedServices.map(s => s.name).join(', ')})`,
      complexity: 'moderate',
      estimatedSteps: 3
    });
  }

  // Orchestrator conversation suggestions
  if (context.orchestrator.conversation.messageCount > 5) {
    suggestions.push({
      type: 'conversation_workflow',
      title: 'Document Conversation Workflow',
      reasoning: 'Active orchestrator conversation with multiple messages',
      complexity: 'simple',
      estimatedSteps: 2
    });
  }

  return suggestions;
}

export default {
  extractWorkflowContext,
  extractModuleContext,
  extractOrchestratorContext,
  extractPlannerContext,
  extractCompleteContext,
  generateContextSummary,
  generateWorkflowSuggestions
};