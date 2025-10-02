/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Workflow Execution Engine
 * Executes nodes in dependency order and manages data flow
 */

/**
 * Execute AI completion via unified chat endpoint
 * Supports: Gemini, OpenAI, Claude, Ollama
 */
async function executeAICompletion({ model, prompt, systemPrompt, settings = {} }) {
  const requestBody = {
    model: model,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    systemPrompt: systemPrompt,
    enableThinking: settings.enableThinking || false,
    thinkingBudget: settings.thinkingBudget || 'medium'
  };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `API request failed with status: ${response.status}`);
  }

  const data = await response.json();
  return data.response || data.text || '';
}

/**
 * Execute AI completion with tool support
 * Handles multi-turn conversation for tool calling
 */
async function executeAICompletionWithTools({ model, prompt, systemPrompt, settings = {} }) {
  // Import tools
  const { WORKFLOW_TOOLS, executeTool } = await import('./workflowTools.js');

  // Get available tools as array
  const availableTools = Object.values(WORKFLOW_TOOLS);

  // Detect provider from model
  let provider = 'gemini';
  if (model.startsWith('gpt-')) provider = 'openai';
  else if (model.startsWith('claude-')) provider = 'claude';
  else if (model.includes('ollama') || model.includes('llama') || model.includes('qwen') || model.includes('gpt-oss')) provider = 'ollama';

  // First request with tools
  const requestBody = {
    model,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    systemPrompt,
    tools: availableTools,
    provider // Pass provider for proper tool formatting
  };

  const response = await fetch('/api/chat/tools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `API request with tools failed: ${response.status}`);
  }

  const data = await response.json();

  // Check if AI wants to use tools
  if (data.toolCalls && data.toolCalls.length > 0) {
    console.log('[Tool Calling] AI requested tools:', data.toolCalls.map(tc => tc.name));

    // Execute all tool calls
    const toolResults = [];
    for (const toolCall of data.toolCalls) {
      try {
        const result = await executeTool(toolCall.name, toolCall.args);
        toolResults.push({
          toolCallId: toolCall.id,
          name: toolCall.name,
          result
        });
      } catch (error) {
        toolResults.push({
          toolCallId: toolCall.id,
          name: toolCall.name,
          result: {
            success: false,
            error: error.message
          }
        });
      }
    }

    // Send tool results back to AI for final response
    const followupBody = {
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        },
        {
          role: 'assistant',
          toolCalls: data.toolCalls
        },
        {
          role: 'tool',
          toolResults
        }
      ],
      systemPrompt,
      provider
    };

    const followupResponse = await fetch('/api/chat/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(followupBody),
    });

    if (!followupResponse.ok) {
      const error = await followupResponse.json();
      throw new Error(error.error || `Follow-up request failed: ${followupResponse.status}`);
    }

    const followupData = await followupResponse.json();

    return {
      response: followupData.response || followupData.text || '',
      toolCalls: data.toolCalls,
      toolResults
    };
  }

  // No tools used, return direct response
  return {
    response: data.response || data.text || '',
    toolCalls: []
  };
}

/**
 * Get default model based on provider preference
 */
function getDefaultModel(settings = {}) {
  const provider = settings.provider || 'gemini';

  const defaultModels = {
    gemini: 'gemini-2.5-flash',
    openai: 'gpt-4o-mini',
    claude: 'claude-3-5-haiku-20241022',
    ollama: 'gpt-oss:20b' // Ollama default model
  };

  return settings.model || defaultModels[provider] || defaultModels.gemini;
}

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
  const { nodeName, settings = {} } = node.data;
  const startTime = Date.now();

  try {
    // Get the model to use
    const model = getDefaultModel(settings);

    // Determine if tools are enabled
    const enableTools = settings.enableTools !== false; // Default true

    // Build system instruction
    let systemInstruction = `You are an AI agent named "${nodeName}". Your role is to process input data and generate the requested outputs.`;

    if (enableTools) {
      systemInstruction += '\n\nYou have access to tools that can help you complete tasks. Use them when necessary.';
    }

    // Build the prompt from inputs
    let promptText = '';

    // Add input data to the prompt
    if (Object.keys(inputs).length > 0) {
      promptText += 'Input data:\n';
      Object.entries(inputs).forEach(([key, value]) => {
        const actualValue = value?.value || value;
        promptText += `- ${key}: ${JSON.stringify(actualValue)}\n`;
      });
      promptText += '\n';
    }

    // Add task instruction based on outputs
    if (node.data.outputs && node.data.outputs.length > 0) {
      promptText += 'Your task is to process the input data and generate the following outputs:\n';
      node.data.outputs.forEach((output) => {
        promptText += `- ${output.label} (${output.type}): A ${output.type} value\n`;
      });
      promptText += '\n';
    }

    promptText += 'Please provide a structured response with the requested outputs.';

    let aiResponse;
    let toolCalls = [];

    if (enableTools) {
      // Execute with tool support
      const result = await executeAICompletionWithTools({
        model,
        prompt: promptText,
        systemPrompt: systemInstruction,
        settings
      });

      aiResponse = result.response;
      toolCalls = result.toolCalls || [];
    } else {
      // Execute without tools
      aiResponse = await executeAICompletion({
        model,
        prompt: promptText,
        systemPrompt: systemInstruction,
        settings: {
          temperature: settings.temperature || 0.7,
          maxTokens: settings.maxTokens || 2000,
          enableThinking: settings.enableThinking || false,
          thinkingBudget: settings.thinkingBudget || 'medium'
        }
      });
    }

    // Map AI response to outputs
    const outputs = {};

    node.data.outputs.forEach((output, index) => {
      const portId = output.id || `output-${index}`;

      // For now, use the full AI response for each output
      // In a more sophisticated implementation, we could parse the response
      // to extract specific values for each output
      let outputValue = aiResponse;

      // Try to convert to appropriate type
      if (output.type === 'number') {
        const num = parseFloat(aiResponse);
        outputValue = isNaN(num) ? aiResponse : num;
      } else if (output.type === 'object' || output.type === 'array') {
        try {
          outputValue = JSON.parse(aiResponse);
        } catch {
          outputValue = aiResponse;
        }
      }

      outputs[portId] = {
        type: output.type,
        value: outputValue,
        timestamp: new Date().toISOString(),
      };
    });

    // Determine provider name from model
    let providerName = 'Unknown';
    if (model.startsWith('gpt-')) providerName = 'OpenAI';
    else if (model.startsWith('claude-')) providerName = 'Claude';
    else if (model.startsWith('gemini-')) providerName = 'Gemini';
    else providerName = 'Ollama';

    return {
      success: true,
      outputs,
      metadata: {
        nodeName,
        provider: providerName,
        model,
        settings,
        executionTime: Date.now() - startTime,
        promptUsed: promptText,
        rawResponse: aiResponse,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
      },
    };

  } catch (error) {
    console.error(`AI Agent "${nodeName}" execution failed:`, error);
    throw new Error(`AI Agent execution failed: ${error.message}`);
  }
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
  const toolId = node.data.id || node.id;

  try {
    // Import tool execution system
    const { executeTool } = await import('./workflowTools.js');

    // Prepare tool arguments from inputs
    const toolArgs = {};
    Object.entries(inputs).forEach(([key, value]) => {
      const actualValue = value?.value || value;
      // Remove port prefixes like 'input-0', 'input-1'
      const cleanKey = key.replace(/^(input|output)-\d+/, key).replace(/^(input|output)_/, '');
      toolArgs[cleanKey] = actualValue;
    });

    // Execute the tool
    const result = await executeTool(toolId, toolArgs);

    // Map result to outputs
    const outputs = {
      'output-0': {
        type: 'object',
        value: result,
        timestamp: new Date().toISOString(),
      }
    };

    return {
      success: result.success,
      outputs,
      metadata: {
        nodeType: 'tool',
        toolId,
        executionTime: Date.now(),
        toolResult: result
      }
    };
  } catch (error) {
    console.error(`Tool ${toolId} execution failed:`, error);

    const outputs = {
      'output-0': {
        type: 'object',
        value: {
          success: false,
          error: error.message
        },
        timestamp: new Date().toISOString(),
      }
    };

    return {
      success: false,
      outputs,
      metadata: {
        nodeType: 'tool',
        toolId,
        error: error.message
      }
    };
  }
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
