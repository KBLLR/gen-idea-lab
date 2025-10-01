/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Workflow Execution Engine
 * Executes nodes in dependency order and manages data flow
 */

/**
 * Resolve execution order using topological sort
 * @param {Array} nodes - All nodes in the workflow
 * @param {Array} edges - All edges connecting nodes
 * @returns {Array} - Nodes in execution order
 */
function resolveExecutionOrder(nodes, edges) {
  // Build adjacency list
  const graph = new Map();
  const inDegree = new Map();

  // Initialize
  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  // Build graph
  edges.forEach(edge => {
    if (graph.has(edge.source)) {
      graph.get(edge.source).push(edge);
    }
    if (inDegree.has(edge.target)) {
      inDegree.set(edge.target, inDegree.get(edge.target) + 1);
    }
  });

  // Topological sort (Kahn's algorithm)
  const queue = [];
  const result = [];

  // Start with nodes that have no dependencies
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      const node = nodes.find(n => n.id === nodeId);
      if (node) queue.push(node);
    }
  });

  while (queue.length > 0) {
    const currentNode = queue.shift();
    result.push(currentNode);

    // Process outgoing edges
    const outgoingEdges = graph.get(currentNode.id) || [];
    outgoingEdges.forEach(edge => {
      const targetId = edge.target;
      inDegree.set(targetId, inDegree.get(targetId) - 1);

      if (inDegree.get(targetId) === 0) {
        const targetNode = nodes.find(n => n.id === targetId);
        if (targetNode) queue.push(targetNode);
      }
    });
  }

  // Check for cycles
  if (result.length !== nodes.length) {
    throw new Error('Workflow contains circular dependencies');
  }

  return result;
}

/**
 * Get input data for a node from its predecessors
 * @param {Object} node - The node to get inputs for
 * @param {Array} edges - All edges
 * @param {Map} executionResults - Results from previous node executions
 * @returns {Object} - Input data mapped by port ID
 */
function getNodeInputs(node, edges, executionResults) {
  const inputs = {};

  // Find all incoming edges
  const incomingEdges = edges.filter(edge => edge.target === node.id);

  incomingEdges.forEach(edge => {
    // Get the source node's result
    const sourceResult = executionResults.get(edge.source);

    if (sourceResult && sourceResult.outputs) {
      // Map source output to target input
      const sourcePortId = edge.sourceHandle || 'output-0';
      const targetPortId = edge.targetHandle || 'input-0';

      inputs[targetPortId] = sourceResult.outputs[sourcePortId];
    }
  });

  return inputs;
}

/**
 * Execute an AI Agent node
 * @param {Object} node - The node to execute
 * @param {Object} inputs - Input data for the node
 * @returns {Promise<Object>} - Execution result with outputs
 */
async function executeAIAgentNode(node, inputs) {
  const { nodeName, settings } = node.data;

  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

  // For now, return mock data
  // TODO: Integrate with actual Gemini Live API
  const outputs = {};

  node.data.outputs.forEach((output, index) => {
    const portId = output.id || `output-${index}`;
    outputs[portId] = {
      type: output.type,
      value: `Result from ${nodeName} (processed inputs: ${JSON.stringify(inputs)})`,
      timestamp: new Date().toISOString(),
    };
  });

  return {
    success: true,
    outputs,
    metadata: {
      nodeName,
      settings,
      executionTime: Date.now(),
    },
  };
}

/**
 * Execute a Topic node
 */
async function executeTopicNode(node, inputs) {
  await new Promise(resolve => setTimeout(resolve, 500));

  const outputs = {
    'output-0': {
      type: 'text',
      value: `Topic context: ${node.data.label || 'Unknown topic'}`,
      timestamp: new Date().toISOString(),
    }
  };

  return { success: true, outputs, metadata: { nodeType: 'topic' } };
}

/**
 * Execute an Idea node
 */
async function executeIdeaNode(node, inputs) {
  await new Promise(resolve => setTimeout(resolve, 500));

  const outputs = {
    'output-0': {
      type: 'text',
      value: `Idea: ${node.data.label || 'Unknown idea'}`,
      timestamp: new Date().toISOString(),
    }
  };

  return { success: true, outputs, metadata: { nodeType: 'idea' } };
}

/**
 * Execute a Tool node
 */
async function executeToolNode(node, inputs) {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const toolId = node.data.id || node.id;
  const outputs = {
    'output-0': {
      type: 'any',
      value: `Tool executed: ${toolId} with inputs: ${JSON.stringify(inputs)}`,
      timestamp: new Date().toISOString(),
    }
  };

  return { success: true, outputs, metadata: { nodeType: 'tool', toolId } };
}

/**
 * Execute an ArchivAI Template node
 */
async function executeArchivaTemplateNode(node, inputs) {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const { templateType, purpose, fields } = node.data;

  // Collect all input data
  const inputData = Object.values(inputs).map(inp => inp?.value || inp).join('\n\n');

  const outputs = {
    'output-0': {
      type: 'document',
      value: {
        template: node.data.label,
        type: templateType,
        purpose,
        content: inputData,
        fields: fields || [],
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    }
  };

  return {
    success: true,
    outputs,
    metadata: {
      nodeType: 'archiva-template',
      templateType,
      purpose
    }
  };
}

/**
 * Execute a single node
 * @param {Object} node - The node to execute
 * @param {Array} edges - All edges
 * @param {Map} executionResults - Results from previous executions
 * @param {Function} updateNodeState - Function to update node visual state
 * @returns {Promise<Object>} - Execution result
 */
async function executeNode(node, edges, executionResults, updateNodeState) {
  try {
    // Update state to processing
    updateNodeState(node.id, { state: 'processing', error: null });

    // Get inputs from predecessor nodes
    const inputs = getNodeInputs(node, edges, executionResults);

    let result;

    // Execute based on node type
    switch (node.type) {
      case 'ai-agent':
        result = await executeAIAgentNode(node, inputs);
        break;

      case 'topic':
        result = await executeTopicNode(node, inputs);
        break;

      case 'idea':
        result = await executeIdeaNode(node, inputs);
        break;

      case 'tool':
        result = await executeToolNode(node, inputs);
        break;

      case 'archiva-template':
        result = await executeArchivaTemplateNode(node, inputs);
        break;

      // Passthrough nodes that just relay data
      case 'module':
      case 'assistant':
      case 'task':
      case 'source':
      case 'connector':
        result = {
          success: true,
          outputs: inputs, // Pass through
          metadata: { nodeType: node.type }
        };
        break;

      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }

    // Update state to complete
    updateNodeState(node.id, {
      state: 'complete',
      result: result,
      error: null
    });

    return result;

  } catch (error) {
    console.error(`Node ${node.id} execution failed:`, error);

    // Update state to error
    updateNodeState(node.id, {
      state: 'error',
      error: error.message,
      result: null
    });

    throw error;
  }
}

/**
 * Execute an entire workflow
 * @param {Array} nodes - All nodes in the workflow
 * @param {Array} edges - All edges connecting nodes
 * @param {Function} setNodes - React state setter to update nodes
 * @param {Function} addOrchestratorMessage - Optional callback to add orchestrator narration
 * @returns {Promise<Map>} - Map of node ID to execution results
 */
export async function executeWorkflow(nodes, edges, setNodes, addOrchestratorMessage) {
  console.log('Starting workflow execution...', { nodes, edges });

  // Orchestrator narration helper
  const narrate = (message) => {
    console.log('[Orchestrator]:', message);
    if (addOrchestratorMessage) {
      addOrchestratorMessage(message);
    }
  };

  // Filter out non-executable node types (like visual-only connectors)
  const executableNodeTypes = [
    'ai-agent', 'topic', 'idea', 'tool', 'archiva-template',
    'module', 'assistant', 'task', 'source'
  ];

  const executableNodes = nodes.filter(n => executableNodeTypes.includes(n.type));

  if (executableNodes.length === 0) {
    narrate('⚠️ No executable nodes found in this workflow.');
    throw new Error('No executable nodes in workflow');
  }

  narrate(`🚀 Starting workflow execution with ${executableNodes.length} nodes...`);

  // Get IDs of executable nodes
  const executableNodeIds = new Set(executableNodes.map(n => n.id));

  // Filter edges to only include those between executable nodes
  const executableEdges = edges.filter(
    edge => executableNodeIds.has(edge.source) && executableNodeIds.has(edge.target)
  );

  // Resolve execution order
  const executionOrder = resolveExecutionOrder(executableNodes, executableEdges);
  console.log('Execution order:', executionOrder.map(n => `${n.id} (${n.type})`));

  narrate(`📋 Execution plan: ${executionOrder.map(n => n.data?.label || n.data?.nodeName || n.type).join(' → ')}`);

  // Store results
  const executionResults = new Map();

  // Helper function to update node state
  const updateNodeState = (nodeId, updates) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  };

  // Execute nodes in order
  for (let i = 0; i < executionOrder.length; i++) {
    const node = executionOrder[i];
    const nodeLabel = node.data?.nodeName || node.data?.label || node.type;
    const progress = `[${i + 1}/${executionOrder.length}]`;

    console.log(`Executing node: ${node.id} (${nodeLabel})`);

    // Narrate what we're doing
    switch (node.type) {
      case 'topic':
        narrate(`${progress} 📚 Analyzing topic: ${nodeLabel}`);
        break;
      case 'idea':
        narrate(`${progress} 💡 Processing idea: ${nodeLabel}`);
        break;
      case 'ai-agent':
        narrate(`${progress} 🤖 AI Agent "${nodeLabel}" is thinking...`);
        break;
      case 'tool':
        narrate(`${progress} 🔧 Executing tool: ${nodeLabel}`);
        break;
      case 'archiva-template':
        narrate(`${progress} 📝 Generating document with template: ${nodeLabel}`);
        break;
      default:
        narrate(`${progress} ⚙️ Processing: ${nodeLabel}`);
    }

    try {
      const result = await executeNode(node, executableEdges, executionResults, updateNodeState);
      executionResults.set(node.id, result);
      console.log(`Node ${node.id} completed:`, result);

      // Narrate completion
      narrate(`✅ ${nodeLabel} completed successfully`);
    } catch (error) {
      console.error(`Node ${node.id} failed:`, error);
      narrate(`❌ ${nodeLabel} failed: ${error.message}`);
      // Continue execution with other nodes
      // In the future, we might want to support error handling strategies
    }
  }

  console.log('Workflow execution complete', executionResults);

  narrate('🎉 Workflow execution complete!');

  // Display final results (last node in execution order)
  if (executionOrder.length > 0) {
    const lastNode = executionOrder[executionOrder.length - 1];
    const lastResult = executionResults.get(lastNode.id);

    if (lastResult && lastResult.success) {
      console.log('===== WORKFLOW FINAL OUTPUT =====');
      console.log('Last node:', lastNode.type, lastNode.data?.label || lastNode.data?.nodeName);

      if (lastNode.type === 'archiva-template' && lastResult.outputs['output-0']) {
        const doc = lastResult.outputs['output-0'].value;
        console.log('Document created:');
        console.log('- Template:', doc.template);
        console.log('- Type:', doc.type);
        console.log('- Purpose:', doc.purpose);
        console.log('- Content:', doc.content);
        console.log('=================================');

        narrate(`📄 Created document: "${doc.template}" (${doc.type})`);
        narrate(`Purpose: ${doc.purpose}`);
        narrate(`The workflow has generated a complete document with all research and analysis. You can now find it in ArchivAI.`);

        // TODO: Open ArchivAI with this document
        // TODO: Or show in a modal/notification
      } else {
        console.log('Output:', lastResult.outputs);
        console.log('=================================');

        const nodeLabel = lastNode.data?.label || lastNode.data?.nodeName || lastNode.type;
        narrate(`📊 Final output from "${nodeLabel}" is ready. Check the console for details.`);
      }
    }
  }

  return executionResults;
}
