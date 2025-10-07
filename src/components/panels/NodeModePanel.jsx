/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import useStore from '@store';

export default function NodeModePanel({ nodeId, config, onReturnToChat }) {
  const [nodeName, setNodeName] = useState(config?.nodeName || config?.name || 'AI Agent');
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

  const setCurrentNodeConfig = useStore(state => state.actions.setCurrentNodeConfig);
  const plannerGraph = useStore(state => state.plannerGraph);
  const setPlannerGraph = useStore(state => state.actions.setPlannerGraph);

  const handleSaveConfig = () => {
    console.log('[NodeModePanel] Saving config for node:', nodeId);
    console.log('[NodeModePanel] Current plannerGraph:', plannerGraph);

    const updatedConfig = {
      nodeName,
      inputs,
      outputs,
      settings
    };

    setCurrentNodeConfig(updatedConfig);

    // If we're editing an existing node, update it in the planner graph
    if (nodeId && plannerGraph) {
      const nodeIndex = plannerGraph.nodes.findIndex(n => n.id === nodeId);
      console.log('[NodeModePanel] Found node at index:', nodeIndex);

      if (nodeIndex !== -1) {
        // Create a deep copy of the graph with updated node
        const updatedNodes = plannerGraph.nodes.map((node, idx) => {
          if (idx === nodeIndex) {
            return {
              ...node,
              data: {
                ...node.data,
                nodeName,
                inputs,
                outputs,
                settings,
                state: 'idle' // Reset state to idle
              }
            };
          }
          return node;
        });

        setPlannerGraph({
          ...plannerGraph,
          nodes: updatedNodes,
          edges: [...plannerGraph.edges]
        });
      }
    }

    // Return to chat mode after saving
    onReturnToChat();
  };

  const handleTestNode = async () => {
    // Test node execution with sample data
    const testInputs = {};
    inputs.forEach(input => {
      testInputs[input.id] = getSampleData(input.type);
    });

    console.log('Testing node with inputs:', testInputs);
    // TODO: Implement actual node execution test
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
          placeholder="Node name"
        />
        <span className="mode-badge">Node Mode</span>
        <button className="icon-btn" onClick={onReturnToChat} title="Return to chat">
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
                placeholder="Input label"
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
              <button
                className="icon-btn remove-port"
                onClick={() => setInputs(inputs.filter((_, i) => i !== idx))}
                title="Remove input"
              >
                <span className="icon">close</span>
              </button>
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

          {/* AI Provider Selection */}
          <label className="select-label">
            <span>AI Provider:</span>
            <select
              value={settings.provider || 'gemini'}
              onChange={(e) => setSettings({
                ...settings,
                provider: e.target.value,
                model: '' // Reset model when provider changes
              })}
            >
              <option value="gemini">Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="claude">Claude</option>
              <option value="ollama">Ollama</option>
            </select>
          </label>

          {/* Model Selection */}
          <label className="select-label">
            <span>Model:</span>
            <select
              value={settings.model || ''}
              onChange={(e) => setSettings({
                ...settings,
                model: e.target.value
              })}
            >
              <option value="">Default</option>
              {settings.provider === 'gemini' && (
                <>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </>
              )}
              {settings.provider === 'openai' && (
                <>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </>
              )}
              {settings.provider === 'claude' && (
                <>
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                </>
              )}
              {settings.provider === 'ollama' && (
                <>
                  <option value="gpt-oss:20b">GPT-OSS 20B</option>
                  <option value="llama3.2">Llama 3.2</option>
                  <option value="qwen2.5">Qwen 2.5</option>
                </>
              )}
            </select>
          </label>

          <label className="checkbox-label">
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
          <label className="checkbox-label">
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
          <label className="number-label">
            <span>Max tokens:</span>
            <input
              type="number"
              value={settings.maxTokens}
              onChange={(e) => setSettings({
                ...settings,
                maxTokens: parseInt(e.target.value) || 2000
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
                placeholder="Output label"
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
              <button
                className="icon-btn remove-port"
                onClick={() => setOutputs(outputs.filter((_, i) => i !== idx))}
                title="Remove output"
              >
                <span className="icon">close</span>
              </button>
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
        <button
          type="button"
          className="test-node-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTestNode();
          }}
        >
          <span className="icon">play_arrow</span>
          Test Node
        </button>
        <button
          type="button"
          className="save-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSaveConfig();
          }}
        >
          Save Configuration
        </button>
        <button
          type="button"
          className="return-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onReturnToChat();
          }}
        >
          Return to Chat Mode
        </button>
      </div>
    </div>
  );
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