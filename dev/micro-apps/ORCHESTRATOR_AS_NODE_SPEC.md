# Orchestrator-as-Node: Technical Specification

## Overview
This document provides detailed technical specifications for implementing the "Orchestrator as Node" feature, where the voice-controlled orchestrator can transform into a workflow node in the Planner.

---

## Architecture

### Component Hierarchy
```
App
├── GlassDock (can be in chat or node mode)
│   ├── ChatMode (default)
│   │   ├── VoiceVisualization
│   │   ├── Messages
│   │   └── Controls
│   └── NodeMode (new)
│       ├── NodeConfig
│       ├── InputPorts
│       ├── OutputPorts
│       └── Controls
└── PlannerCanvas
    └── AIAgentNode (synced with GlassDock when in node mode)
```

### State Management

#### Zustand Store Updates
```javascript
// src/lib/store.js - Add to existing store

// New slice for dock mode
dockMode: 'chat', // 'chat' | 'node'
activeNodeId: null,
currentNodeConfig: null,

// Actions
actions: {
  setDockMode: (mode) => set({ dockMode: mode }),
  setActiveNodeId: (id) => set({ activeNodeId: id }),
  setCurrentNodeConfig: (config) => set({ currentNodeConfig: config }),

  // Transform dock to node mode
  becomePlannerNode: (config) => {
    const nodeId = `ai-agent-${Date.now()}`;

    set({
      dockMode: 'node',
      activeNodeId: nodeId,
      currentNodeConfig: config
    });

    // Create node in planner (handled by planner reducer)
    return nodeId;
  },

  // Return to chat mode
  returnToChat: () => {
    set({
      dockMode: 'chat',
      activeNodeId: null,
      currentNodeConfig: null
    });
  }
}
```

---

## Implementation Details

### 1. GlassDock Component Updates

#### File: `src/components/GlassDock.jsx`

```javascript
// Add mode switching logic
const dockMode = useStore(state => state.dockMode);
const activeNodeId = useStore(state => state.activeNodeId);
const currentNodeConfig = useStore(state => state.currentNodeConfig);
const becomePlannerNode = useStore(state => state.actions.becomePlannerNode);
const returnToChat = useStore(state => state.actions.returnToChat);

// Render based on mode
return (
  <div className={`glass-dock ${dockMode === 'node' ? 'node-mode' : 'chat-mode'}`}>
    {dockMode === 'chat' ? (
      <ChatModePanel />
    ) : (
      <NodeModePanel
        nodeId={activeNodeId}
        config={currentNodeConfig}
        onReturnToChat={returnToChat}
      />
    )}
  </div>
);
```

### 2. NodeModePanel Component

#### File: `src/components/NodeModePanel.jsx`

```javascript
import { useState } from 'react';
import useStore from '../lib/store';

export default function NodeModePanel({ nodeId, config, onReturnToChat }) {
  const [nodeName, setNodeName] = useState(config?.name || 'AI Agent');
  const [inputs, setInputs] = useState(config?.inputs || [
    { id: 'user_query', type: 'text', label: 'User Query' }
  ]);
  const [outputs, setOutputs] = useState(config?.outputs || [
    { id: 'result', type: 'text', label: 'Result' }
  ]);
  const [settings, setSettings] = useState(config?.settings || {
    screenAwareness: false,
    conversationHistory: false,
    maxTokens: 2000
  });

  const updateNode = useStore(state => state.actions.updatePlannerNode);

  const handleSaveConfig = () => {
    const updatedConfig = {
      name: nodeName,
      inputs,
      outputs,
      settings
    };

    updateNode(nodeId, updatedConfig);
  };

  return (
    <div className="node-mode-panel">
      <div className="node-mode-header">
        <span className="icon">smart_toy</span>
        <input
          type="text"
          value={nodeName}
          onChange={(e) => setNodeName(e.target.value)}
          className="node-name-input"
        />
        <span className="mode-badge">Node Mode</span>
        <button className="icon-btn" onClick={onReturnToChat}>
          <span className="icon">close</span>
        </button>
      </div>

      <div className="node-mode-content">
        {/* Inputs Section */}
        <div className="config-section">
          <h4>Inputs ({inputs.length})</h4>
          {inputs.map((input, idx) => (
            <div key={input.id} className="port-config">
              <span className="port-dot input-port"></span>
              <input
                type="text"
                value={input.label}
                onChange={(e) => {
                  const newInputs = [...inputs];
                  newInputs[idx].label = e.target.value;
                  setInputs(newInputs);
                }}
              />
              <select
                value={input.type}
                onChange={(e) => {
                  const newInputs = [...inputs];
                  newInputs[idx].type = e.target.value;
                  setInputs(newInputs);
                }}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
                <option value="any">Any</option>
              </select>
            </div>
          ))}
          <button
            className="add-port-btn"
            onClick={() => setInputs([...inputs, {
              id: `input_${Date.now()}`,
              type: 'text',
              label: 'New Input'
            }])}
          >
            + Add Input
          </button>
        </div>

        {/* Configuration Section */}
        <div className="config-section">
          <h4>Configuration</h4>
          <label>
            <input
              type="checkbox"
              checked={settings.screenAwareness}
              onChange={(e) => setSettings({
                ...settings,
                screenAwareness: e.target.checked
              })}
            />
            Use screen awareness
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.conversationHistory}
              onChange={(e) => setSettings({
                ...settings,
                conversationHistory: e.target.checked
              })}
            />
            Include conversation history
          </label>
          <label>
            Max tokens:
            <input
              type="number"
              value={settings.maxTokens}
              onChange={(e) => setSettings({
                ...settings,
                maxTokens: parseInt(e.target.value)
              })}
              min="100"
              max="10000"
            />
          </label>
        </div>

        {/* Outputs Section */}
        <div className="config-section">
          <h4>Outputs ({outputs.length})</h4>
          {outputs.map((output, idx) => (
            <div key={output.id} className="port-config">
              <span className="port-dot output-port"></span>
              <input
                type="text"
                value={output.label}
                onChange={(e) => {
                  const newOutputs = [...outputs];
                  newOutputs[idx].label = e.target.value;
                  setOutputs(newOutputs);
                }}
              />
              <select
                value={output.type}
                onChange={(e) => {
                  const newOutputs = [...outputs];
                  newOutputs[idx].type = e.target.value;
                  setOutputs(newOutputs);
                }}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
                <option value="any">Any</option>
              </select>
            </div>
          ))}
          <button
            className="add-port-btn"
            onClick={() => setOutputs([...outputs, {
              id: `output_${Date.now()}`,
              type: 'text',
              label: 'New Output'
            }])}
          >
            + Add Output
          </button>
        </div>
      </div>

      <div className="node-mode-footer">
        <button className="test-node-btn" onClick={handleTestNode}>
          <span className="icon">play_arrow</span>
          Test Node
        </button>
        <button className="save-btn" onClick={handleSaveConfig}>
          Save Configuration
        </button>
        <button className="return-btn" onClick={onReturnToChat}>
          Return to Chat Mode
        </button>
      </div>
    </div>
  );

  async function handleTestNode() {
    // Test node execution with sample data
    const testInputs = {};
    inputs.forEach(input => {
      testInputs[input.id] = getSampleData(input.type);
    });

    const result = await executeAIAgentNode(nodeId, testInputs, settings);
    console.log('Test result:', result);
  }
}

function getSampleData(type) {
  switch (type) {
    case 'text': return 'Sample text input';
    case 'number': return 42;
    case 'object': return { key: 'value' };
    case 'array': return ['item1', 'item2'];
    default: return null;
  }
}
```

### 3. AIAgentNode for Planner Canvas

#### File: `src/components/planner/nodes/AIAgentNode.jsx`

```javascript
import { Handle, Position } from 'reactflow';
import { useState, useEffect } from 'react';

export default function AIAgentNode({ data, id }) {
  const [state, setState] = useState('idle'); // idle | processing | complete | error
  const [lastResult, setLastResult] = useState(null);

  const handleColor = {
    idle: '#94a3b8',
    processing: '#3b82f6',
    complete: '#22c55e',
    error: '#ef4444'
  };

  return (
    <div className={`ai-agent-node state-${state}`}>
      <div className="node-header">
        <span className="node-icon">🤖</span>
        <span className="node-title">{data.name || 'AI Agent'}</span>
        <div className={`state-indicator ${state}`}></div>
      </div>

      <div className="node-body">
        {/* Input Handles */}
        <div className="input-ports">
          {data.inputs?.map((input, idx) => (
            <Handle
              key={input.id}
              type="target"
              position={Position.Left}
              id={input.id}
              style={{
                top: `${30 + idx * 20}px`,
                background: handleColor[state]
              }}
            >
              <span className="port-label">{input.label}</span>
            </Handle>
          ))}
        </div>

        {/* Status Display */}
        <div className="node-status">
          {state === 'processing' && (
            <div className="processing-indicator">
              <span className="spinner"></span>
              <span>Processing...</span>
            </div>
          )}
          {state === 'complete' && lastResult && (
            <div className="result-preview">
              <span className="icon">check_circle</span>
              <span>Complete</span>
            </div>
          )}
          {state === 'error' && (
            <div className="error-display">
              <span className="icon">error</span>
              <span>Error occurred</span>
            </div>
          )}
        </div>

        {/* Output Handles */}
        <div className="output-ports">
          {data.outputs?.map((output, idx) => (
            <Handle
              key={output.id}
              type="source"
              position={Position.Right}
              id={output.id}
              style={{
                top: `${30 + idx * 20}px`,
                background: handleColor[state]
              }}
            >
              <span className="port-label">{output.label}</span>
            </Handle>
          ))}
        </div>
      </div>

      <div className="node-footer">
        <span className="voice-indicator">🎤 Puck</span>
      </div>
    </div>
  );
}
```

### 4. Node Execution Engine

#### File: `src/lib/planner/aiAgentExecutor.js`

```javascript
import { useLiveAPI } from '../voice';

export async function executeAIAgentNode(nodeId, inputs, config) {
  const { client, connect, disconnect } = useLiveAPI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY
  });

  try {
    // 1. Build system prompt with inputs
    const systemPrompt = buildSystemPrompt(inputs, config);

    // 2. Connect to Live API
    await connect({
      responseModalities: ['TEXT'], // Node mode doesn't need audio
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      }
    });

    // 3. Send query (from inputs)
    const query = inputs.user_query || 'Process the provided data';

    // 4. Wait for response
    const response = await waitForResponse(client);

    // 5. Extract outputs
    const outputs = extractOutputs(response, config.outputs);

    // 6. Disconnect
    disconnect();

    return {
      success: true,
      outputs,
      metadata: {
        timestamp: Date.now(),
        tokensUsed: response.tokensUsed || 0
      }
    };

  } catch (error) {
    console.error('AI Agent execution error:', error);
    return {
      success: false,
      error: error.message,
      outputs: {}
    };
  }
}

function buildSystemPrompt(inputs, config) {
  let prompt = `You are an AI agent node in a workflow. Your task is to process the inputs and generate the required outputs.\n\n`;

  prompt += `Inputs:\n`;
  Object.entries(inputs).forEach(([key, value]) => {
    prompt += `- ${key}: ${JSON.stringify(value)}\n`;
  });

  prompt += `\nRequired outputs:\n`;
  config.outputs.forEach(output => {
    prompt += `- ${output.label} (${output.type})\n`;
  });

  if (config.settings.screenAwareness && window.screenContext) {
    prompt += `\nScreen context:\n${JSON.stringify(window.screenContext, null, 2)}\n`;
  }

  return prompt;
}

function extractOutputs(response, outputSchema) {
  // Parse AI response and map to output schema
  const outputs = {};

  // Simple extraction (can be enhanced with structured output)
  outputSchema.forEach(output => {
    outputs[output.id] = parseOutputValue(response.text, output.type);
  });

  return outputs;
}

function parseOutputValue(text, type) {
  // Parse based on expected type
  switch (type) {
    case 'number':
      return parseFloat(text) || 0;
    case 'object':
    case 'array':
      try {
        return JSON.parse(text);
      } catch {
        return type === 'array' ? [] : {};
      }
    default:
      return text;
  }
}

async function waitForResponse(client) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Response timeout')), 30000);

    client.on('content', (content) => {
      clearTimeout(timeout);
      if (content.modelTurn?.parts) {
        const text = content.modelTurn.parts
          .map(part => part.text)
          .join('');
        resolve({ text });
      }
    });

    client.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}
```

### 5. Tool Registration

#### File: `src/lib/voice/tools.js`

```javascript
export const tools = [
  // ... existing tools ...

  {
    name: 'become_planner_node',
    displayName: 'Become Planner Node',
    description: 'Transform the orchestrator into a workflow node in the planner',
    icon: 'account_tree',
    category: 'planner',
    parameters: {
      type: 'object',
      properties: {
        nodeName: {
          type: 'string',
          description: 'Name for the AI agent node',
          default: 'AI Agent'
        },
        inputs: {
          type: 'array',
          description: 'Input ports configuration',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              label: { type: 'string' }
            }
          }
        },
        outputs: {
          type: 'array',
          description: 'Output ports configuration'
        }
      },
      required: []
    },
    handler: async (args, { store }) => {
      const config = {
        name: args.nodeName || 'AI Agent',
        inputs: args.inputs || [
          { id: 'user_query', type: 'text', label: 'User Query' }
        ],
        outputs: args.outputs || [
          { id: 'result', type: 'text', label: 'Result' }
        ],
        settings: {
          screenAwareness: false,
          conversationHistory: false,
          maxTokens: 2000
        }
      };

      const nodeId = store.getState().actions.becomePlannerNode(config);

      return {
        success: true,
        message: `Transformed into planner node: ${config.name}`,
        nodeId
      };
    }
  }
];
```

---

## CSS Styling

#### File: `src/styles/components/node-mode-panel.css`

```css
.node-mode-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
}

.node-mode-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.node-name-input {
  flex: 1;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  font-weight: 600;
  outline: none;
}

.mode-badge {
  padding: 4px 10px;
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.node-mode-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-section h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.port-config {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 8px;
}

.port-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.port-dot.input-port {
  background: #94a3b8;
}

.port-dot.output-port {
  background: #3b82f6;
}

.port-config input[type="text"] {
  flex: 1;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  outline: none;
}

.port-config select {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  cursor: pointer;
}

.add-port-btn {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-port-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.9);
}

.node-mode-footer {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.test-node-btn,
.save-btn,
.return-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.test-node-btn {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.save-btn {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.return-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.test-node-btn:hover {
  background: rgba(59, 130, 246, 0.3);
}

.save-btn:hover {
  background: rgba(34, 197, 94, 0.3);
}

.return-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}
```

---

## Testing Strategy

### Unit Tests
- [ ] Test mode switching (chat → node → chat)
- [ ] Test input/output configuration
- [ ] Test node execution with sample data
- [ ] Test error handling

### Integration Tests
- [ ] Test voice activation of `become_planner_node()`
- [ ] Test dock UI transformation
- [ ] Test node creation in planner canvas
- [ ] Test data flow through node

### E2E Tests
- [ ] Complete workflow: voice command → node creation → execution → results
- [ ] Multi-node workflow with AI agent
- [ ] Error recovery scenarios

---

## Next Steps

1. ✅ Specification complete
2. **Implement NodeModePanel component**
3. **Add mode switching to GlassDock**
4. **Create AIAgentNode for canvas**
5. **Implement execution engine**
6. **Test with simple workflow**
7. **Polish UI/animations**
8. **User testing & feedback**

---

**Status**: Specification Complete
**Feasibility**: ✅ Highly Feasible
**Estimated Effort**: 2-3 weeks for full implementation