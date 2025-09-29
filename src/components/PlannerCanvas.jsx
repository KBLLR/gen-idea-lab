/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import useStore from '../lib/store';
import { modules } from '../lib/modules';
import { specializedTasks } from '../lib/assistant/tasks';
import ReactFlow, { Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState, useReactFlow, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import '../styles/components/planner.css';

const nodeStyles = {
  module: { className: 'node-card node-module' },
  assistant: { className: 'node-card node-assistant' },
  task: { className: 'node-card node-task' },
  tool: { className: 'node-card node-tool' },
  workflow: { className: 'node-card node-workflow' },
  connector: { className: 'node-card node-connector' },
  source: { className: 'node-card node-source' },
  'model-provider': { className: 'node-card node-model-provider' },
};

function LabelNode({ data }) {
  return (
    <div className={data.className}>
      {/* Input handle on the left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      <div className="node-title">{data.label}</div>
      {data.sub && <div className="node-sub">{data.sub}</div>}

      {/* Output handle on the right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
}

// Create a context for sharing setNodes function and canvas ref
const NodeUpdateContext = React.createContext();

function ModelProviderNode({ data, id }) {
  const [contextMenu, setContextMenu] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const connectedServices = useStore.use.connectedServices();
  const { updateNode, canvasRef } = React.useContext(NodeUpdateContext);
  const { screenToFlowPosition } = useReactFlow();

  const handleDoubleClick = useCallback(async (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Ensure the node is not in selected state for double-click to work
    if (event.detail === 2) { // Verify it's actually a double-click

    // Fetch available models for this provider
    let models = [];
    try {
      if (data.providerId === 'gemini') {
        models = [
          { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: 'Experimental' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Balanced' },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast' },
        ];
      } else if (data.providerId === 'openai' && connectedServices?.openai?.connected) {
        models = [
          { id: 'gpt-4o', name: 'GPT-4o', description: 'Advanced' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Efficient' },
        ];
      } else if (data.providerId === 'claude' && connectedServices?.claude?.connected) {
        models = [
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Smart' },
          { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Quick' },
        ];
      } else if (data.providerId === 'ollama' && connectedServices?.ollama?.connected) {
        const response = await fetch('/api/ollama/models', { credentials: 'include' });
        if (response.ok) {
          const modelData = await response.json();
          models = (modelData.models || []).map(m => ({
            id: m.name,
            name: m.name,
            description: 'Local'
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }

    setAvailableModels(models);

    // Get the canvas container bounds to position relative to it
    const canvasRect = canvasRef?.current?.getBoundingClientRect();
    if (canvasRect) {
      setContextMenu({
        x: event.clientX - canvasRect.left + 2,
        y: event.clientY - canvasRect.top + 2,
      });
    } else {
      setContextMenu({
        x: event.clientX + 2,
        y: event.clientY + 2,
      });
    }
    } // Close the event.detail === 2 check
  }, [data, connectedServices]);

  const handleModelSelect = useCallback((model) => {
    if (updateNode) {
      updateNode(id, {
        selectedModel: model,
        sub: `Model: ${model.name}${model.description ? ` (${model.description})` : ''}`
      });
    }
    setContextMenu(null);
  }, [id, updateNode]);

  const handleClickOutside = useCallback((event) => {
    if (contextMenu && !event.target.closest('.context-menu')) {
      setContextMenu(null);
    }
  }, [contextMenu]);

  // Close context menu on outside click
  useEffect(() => {
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu, handleClickOutside]);

  return (
    <div className={data.className} onDoubleClick={handleDoubleClick}>
      {/* Input handle on the left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      <div className="node-title">{data.label}</div>
      {data.sub && <div className="node-sub">{data.sub}</div>}

      {/* Output handle on the right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
          }}
        >
          <div className="context-menu-header">Select Model</div>
          {availableModels.length === 0 ? (
            <div className="context-menu-item disabled">No models available</div>
          ) : (
            availableModels.map((model) => (
              <div
                key={model.id}
                className="context-menu-item"
                onClick={() => handleModelSelect(model)}
              >
                <div className="model-name">{model.name}</div>
                {model.description && (
                  <div className="model-description">{model.description}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ArchivAI Template Node Component
function ArchivAITemplateNode({ data, id }) {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [templateData, setTemplateData] = useState({});
  const [outputFormat, setOutputFormat] = useState('markdown');
  const { updateNode } = React.useContext(NodeUpdateContext);

  const templateFields = data.fields || [];

  const handleConfigure = useCallback(() => {
    setIsConfiguring(true);
  }, []);

  const handleSave = useCallback(() => {
    // Update node with configuration
    updateNode(id, {
      ...data,
      configured: true,
      templateData,
      outputFormat,
      sub: `${data.templateType} • ${outputFormat.toUpperCase()}`
    });
    setIsConfiguring(false);
  }, [id, data, templateData, outputFormat, updateNode]);

  const handleCancel = useCallback(() => {
    setIsConfiguring(false);
  }, []);

  return (
    <div className={`${data.className} node-archiva-template`}>
      {/* Input handle on the left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      <div className="node-title">{data.label}</div>
      {data.sub && <div className="node-sub">{data.sub}</div>}

      {!data.configured && (
        <div className="node-config-prompt">
          <button onClick={handleConfigure} className="btn-configure">
            <span className="icon">settings</span>
            Configure Template
          </button>
        </div>
      )}

      {/* Output handle on the right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      {/* Configuration Modal */}
      {isConfiguring && (
        <div className="template-config-modal">
          <div className="config-header">
            <h3>Configure {data.label}</h3>
            <p>{data.purpose}</p>
          </div>

          <div className="config-body">
            <div className="config-section">
              <label>Output Format:</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="format-select"
              >
                <option value="markdown">Markdown (.md)</option>
                <option value="html">HTML (.html)</option>
              </select>
            </div>

            <div className="config-section">
              <label>Template Fields:</label>
              <div className="fields-preview">
                {templateFields.slice(0, 5).map((field, index) => (
                  <div key={index} className="field-preview">
                    <span className="field-name">{field.label}</span>
                    <span className="field-type">{field.field_type}</span>
                  </div>
                ))}
                {templateFields.length > 5 && (
                  <div className="field-preview">
                    <span className="field-more">+ {templateFields.length - 5} more fields</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="config-actions">
            <button onClick={handleCancel} className="btn-cancel">Cancel</button>
            <button onClick={handleSave} className="btn-save">Save Configuration</button>
          </div>
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  default: LabelNode,
  'model-provider': ModelProviderNode,
  'archiva-template': ArchivAITemplateNode,
};

// Note: nodeStyles now include source and model-provider

export default function PlannerCanvas() {
  const persisted = useStore.use.plannerGraph?.() || { nodes: [], edges: [] };
  const [nodes, setNodes, onNodesChange] = useNodesState(persisted.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(persisted.edges || []);
  const [workflowTitle, setWorkflowTitle] = useState(persisted.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const setActiveApp = useStore.use.actions().setActiveApp;
  const addCustomWorkflow = useStore.use.actions().addCustomWorkflow;
  const workflowAutoTitleModel = useStore.use.workflowAutoTitleModel();

  const rfRef = useRef(null);
  const fileInputRef = useRef(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Handle node clicks to manage selection state
  const onNodeClick = useCallback((event, node) => {
    // Allow normal selection behavior, but ensure double-click works
  }, []);

  // Add a canvas click handler to deselect nodes
  const onPaneClick = useCallback(() => {
    setNodes((nds) => nds.map((node) => ({ ...node, selected: false })));
  }, [setNodes]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const bounds = rfRef.current.getBoundingClientRect();
    const payload = event.dataTransfer.getData('application/x-planner');
    if (!payload) return;
    const item = JSON.parse(payload);

    const position = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };

    const baseId = `${item.kind}:${item.id}`;
    const nid = `${baseId}:${Date.now()}`;
    const styleClass = (nodeStyles[item.kind] || {}).className || 'node-card';

    // Determine subtext for modules
    let subText = item.meta?.description;
    if (item.kind === 'module') {
      const mod = Object.values(modules).find(m => m['Module Code'] === item.id);
      if (mod) {
        const qual = (mod['Qualification Objectives'] || []).join('; ');
        const key = mod['Key Contents / Topics'] || '';
        const prereq = mod['Prerequisites'] || '';
        subText = [`Objectives: ${qual}`, `Key: ${key}`, prereq ? `Prerequisites: ${prereq}` : '']
          .filter(Boolean)
          .join('\n');
      }
    }

    // Add the dropped node
    const nodeType = item.kind === 'model-provider' ? 'model-provider' :
                     item.kind === 'archiva-template' ? 'archiva-template' : 'default';
    setNodes((nds) => nds.concat({
      id: nid,
      type: nodeType,
      position,
      data: {
        label: item.label,
        className: styleClass,
        sub: subText || (item.kind === 'archiva-template' ? `${item.templateType} Template` : undefined),
        kind: item.kind,
        providerId: item.id, // Store the provider ID for model providers
        // ArchivAI template specific data
        ...(item.kind === 'archiva-template' && {
          templateType: item.templateType,
          purpose: item.purpose,
          fields: item.fields,
          configured: false,
        }),
      },
    }));

    // If it's an assistant, auto-add its specialized tasks and connect
    if (item.kind === 'assistant') {
      const modCode = item.id;
      const spec = specializedTasks[modCode] || {};
      const createdTaskNodes = [];
      const now = Date.now();
      let i = 0;
      Object.values(spec).forEach(t => {
        const tnid = `task:${modCode}:${t.id}:${now + i}`;
        const tpos = { x: position.x + 240, y: position.y + i * 100 };
        createdTaskNodes.push({
          id: tnid,
          type: 'default',
          position: tpos,
          data: { label: t.name, className: (nodeStyles['task']||{}).className || 'node-card', sub: t.description }
        });
        i++;
      });
      if (createdTaskNodes.length) {
        setNodes((nds) => nds.concat(createdTaskNodes));
        // Connect assistant to each task node
        const newEdges = createdTaskNodes.map(tn => ({ id: `e_${nid}_${tn.id}`, source: nid, target: tn.id }));
        setEdges((eds) => eds.concat(newEdges));
      }
    }
  }, [setNodes, setEdges]);

  const clear = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  const buildWorkflowFromGraph = useCallback(() => {
    // Identify tasks and connectors
    const taskNodes = nodes.filter(n => n.id.startsWith('task'))
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
    const connectors = nodes.filter(n => n.id.startsWith('connector'));

    const assistantNode = nodes.find(n => n.id.startsWith('assistant'));
    const moduleNode = nodes.find(n => n.id.startsWith('module'));

    const title = moduleNode?.data?.label || assistantNode?.data?.label || 'Planned Workflow';
    const category = moduleNode ? 'module_assistant' : 'orchestrator';
    const moduleId = moduleNode ? moduleNode.id.split(':')[1] : null;

    // Build dependency maps from connectors and direct task->task edges
    const parentsByTask = {}; // taskId -> [{ parentId, type, group }]
    const parallelGroupByTask = {}; // taskId -> groupId
    const decisionGroupByTask = {}; // taskId -> groupId

    function addParent(childId, parentId, type, group) {
      parentsByTask[childId] = parentsByTask[childId] || [];
      parentsByTask[childId].push({ parentId, type, group });
    }

    // Direct task->task edges treated as sequence
    edges.forEach(e => {
      if (e.source?.startsWith('task') && e.target?.startsWith('task')) {
        addParent(e.target, e.source, 'sequence', null);
      }
    });

    // Connector-based dependencies
    const seqPairs = []; // for consolidation
    connectors.forEach(cn => {
      const kind = (cn.id.split(':')[1] || '').toLowerCase();
      const groupId = cn.id;
      const upstream = edges
        .filter(e => e.target === cn.id && e.source?.startsWith('task'))
        .map(e => e.source);
      const downstream = edges
        .filter(e => e.source === cn.id && e.target?.startsWith('task'))
        .map(e => e.target);

      if (kind === 'sequence') {
        downstream.forEach(d => upstream.forEach(u => { addParent(d, u, 'sequence', groupId); seqPairs.push([u,d]); }));
      } else if (kind === 'parallel') {
        downstream.forEach(d => {
          parallelGroupByTask[d] = groupId;
          upstream.forEach(u => addParent(d, u, 'parallel', groupId));
        });
      } else if (kind === 'decision') {
        downstream.forEach(d => {
          decisionGroupByTask[d] = groupId;
          upstream.forEach(u => addParent(d, u, 'decision', groupId));
        });
      }
    });

    // Build sequence graph for consolidation
    const seqEdges = new Set();
    edges.forEach(e => { if (e.source?.startsWith('task') && e.target?.startsWith('task')) seqEdges.add(`${e.source}->${e.target}`); });
    seqPairs.forEach(([u,d]) => seqEdges.add(`${u}->${d}`));

    const seqChildren = {}; // id -> [child]
    const seqInDeg = {}; // id -> count
    taskNodes.forEach(n => { seqChildren[n.id] = []; seqInDeg[n.id] = 0; });
    Array.from(seqEdges).forEach(s => {
      const [u,d] = s.split('->');
      if (!seqChildren[u]) seqChildren[u] = [];
      seqChildren[u].push(d);
      seqInDeg[d] = (seqInDeg[d] || 0) + 1;
    });

    const visited = new Set();
    const steps = [];

    // Helper to collect tools/resources for a set of task ids
    function collectTR(taskIds) {
      const seenTool = new Map();
      const resources = [];
      const tools = [];
      taskIds.forEach(tid => {
        const connectedEdges = edges.filter(e => e.source === tid || e.target === tid);
        const connectedNodes = connectedEdges
          .map(e => (e.source === tid ? e.target : e.source))
          .map(id => nodes.find(nn => nn.id === id))
          .filter(Boolean);
        connectedNodes.filter(nn => nn.id.startsWith('tool')).forEach(tn => {
          const key = tn.id.split(':')[1];
          if (!seenTool.has(key)) { seenTool.set(key, true); tools.push({ id: key, title: tn.data?.label }); }
        });
        connectedNodes.filter(nn => nn.id.startsWith('source')).forEach(sn => {
          resources.push({ type: 'source', title: sn.data?.label });
        });
      });
      return { tools, resources };
    }

    // Build consolidated steps
    taskNodes.forEach((n, idx) => {
      if (visited.has(n.id)) return;
      const start = (seqInDeg[n.id] || 0) === 1 ? null : n.id;
      if (!start) return; // not a chain start

      // Walk forward while single-child and child has inDeg==1
      const chain = [n.id];
      let cur = n.id;
      while (seqChildren[cur] && seqChildren[cur].length === 1) {
        const next = seqChildren[cur][0];
        if ((seqInDeg[next] || 0) !== 1) break;
        chain.push(next);
        cur = next;
      }
      chain.forEach(id => visited.add(id));

      // Flow metadata from first node
      const parents = (parentsByTask[chain[0]] || []).map(p => p.parentId);
      const flow = {};
      if (parents.length) flow.dependsOn = parents;
      // Group tags: union across chain
      chain.forEach(tid => {
        if (parallelGroupByTask[tid]) flow.parallelGroup = parallelGroupByTask[tid];
        if (decisionGroupByTask[tid]) flow.decisionGroup = decisionGroupByTask[tid];
      });

      // Tools/resources union across chain
      const { tools, resources } = collectTR(chain);

      if (chain.length > 1) {
        const promptChain = chain.map((tid, i) => {
          const node = nodes.find(nn => nn.id === tid);
          return { id: `pc_${steps.length+1}_${i+1}`, prompt: node?.data?.label || tid, dependsOn: i > 0 ? (nodes.find(nn => nn.id === chain[i-1])?.data?.label) : undefined };
        });
        steps.push({
          id: `step_${steps.length+1}`,
          title: nodes.find(nn => nn.id === chain[chain.length-1])?.data?.label || 'Prompt Chain',
          type: 'prompt_chain',
          promptChain,
          guidance: {
            explanation: nodes.find(nn => nn.id === chain[chain.length-1])?.data?.sub || 'Planned chain',
            ...(tools.length ? { tools } : {}),
            ...(resources.length ? { resources } : {}),
            ...(Object.keys(flow).length ? { flow } : {}),
          },
        });
      } else {
        const node = nodes.find(nn => nn.id === n.id);
        steps.push({
          id: `step_${steps.length+1}`,
          title: node?.data?.label || 'Task',
          type: 'interactive',
          guidance: {
            explanation: node?.data?.sub || 'Planned task',
            ...(tools.length ? { tools } : {}),
            ...(resources.length ? { resources } : {}),
            ...(Object.keys(flow).length ? { flow } : {}),
          },
        });
      }
    });

    // Add any remaining tasks not part of a chain start (e.g. isolated single with inDeg==1 but no parent start)
    taskNodes.forEach(n => {
      if (visited.has(n.id)) return;
      const node = nodes.find(nn => nn.id === n.id);
      const { tools, resources } = collectTR([n.id]);
      const parents = (parentsByTask[n.id] || []).map(p => p.parentId);
      const flow = {};
      if (parents.length) flow.dependsOn = parents;
      if (parallelGroupByTask[n.id]) flow.parallelGroup = parallelGroupByTask[n.id];
      if (decisionGroupByTask[n.id]) flow.decisionGroup = decisionGroupByTask[n.id];
      steps.push({
        id: `step_${steps.length+1}`,
        title: node?.data?.label || 'Task',
        type: 'interactive',
        guidance: {
          explanation: node?.data?.sub || 'Planned task',
          ...(tools.length ? { tools } : {}),
          ...(resources.length ? { resources } : {}),
          ...(Object.keys(flow).length ? { flow } : {}),
        },
      });
      visited.add(n.id);
    });

    const id = `custom_${Date.now()}`;
    return {
      id,
      title,
      description: 'Generated from PlannerAI canvas',
      moduleId: category === 'module_assistant' ? moduleId : null,
      category,
      difficulty: 'intermediate',
      estimatedTime: '30-60 minutes',
      metadata: { tags: ['planner', 'custom'] },
      steps,
    };
  }, [nodes, edges]);

  const onSave = useCallback(() => {
    const wf = buildWorkflowFromGraph();
    addCustomWorkflow(wf);
    // Navigate to workflows app to review
    setActiveApp('workflows');
  }, [buildWorkflowFromGraph, addCustomWorkflow, setActiveApp]);

  const onExport = useCallback(() => {
    const data = { version: 1, nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planner-graph-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const onImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onImportFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
          alert('Invalid planner graph JSON. Expecting { nodes: [], edges: [] }.');
          return;
        }
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
      } catch (err) {
        alert('Failed to parse JSON: ' + (err?.message || 'unknown error'));
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  }, [setNodes, setEdges]);

  // Function to update node data
  const updateNode = useCallback((nodeId, updates) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [setNodes]);

  // Handle title editing
  const handleTitleDoubleClick = useCallback(() => {
    setIsEditingTitle(true);
  }, []);

  const handleTitleChange = useCallback((e) => {
    setWorkflowTitle(e.target.value);
  }, []);

  const handleTitleBlur = useCallback(() => {
    setIsEditingTitle(false);
  }, []);

  const handleTitleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
    }
  }, []);

  // AI naming function
  const generateAITitle = useCallback(async () => {
    if (isGeneratingTitle) return; // Prevent double-clicks

    try {
      console.log('Generating AI title...');
      setIsGeneratingTitle(true);

      const flowData = { nodes, edges };

      // Show loading state
      setWorkflowTitle('Generating title...');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: workflowAutoTitleModel,
          messages: [{
            role: 'user',
            content: `Analyze this workflow/flow data and suggest a concise, descriptive title (2-4 words max). Return only the title, no explanation: ${JSON.stringify(flowData, null, 2)}`
          }]
        }),
        credentials: 'include'
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API response:', data);

        // Try different possible response formats
        let suggestedTitle = data.content || data.response || data.message || data.text;

        if (suggestedTitle) {
          suggestedTitle = suggestedTitle.replace(/['"]/g, '').trim();
          console.log('Suggested title:', suggestedTitle);
          setWorkflowTitle(suggestedTitle);
        } else {
          console.warn('No title in response:', data);
          setWorkflowTitle('AI Generated Flow');
        }
      } else {
        console.error('API error:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        setWorkflowTitle(''); // Reset to empty
      }
    } catch (error) {
      console.error('Failed to generate AI title:', error);
      setWorkflowTitle(''); // Reset to empty
    } finally {
      setIsGeneratingTitle(false);
    }
  }, [nodes, edges, isGeneratingTitle, workflowAutoTitleModel]);

  // Persist planner graph on each change
  useEffect(() => {
    const actions = useStore.getState().actions;
    if (actions && actions.setPlannerGraph) {
      actions.setPlannerGraph({ nodes, edges, title: workflowTitle });
    }
  }, [nodes, edges, workflowTitle]);

  return (
    <div className="planner-canvas-container">
      {/* Workflow Title in upper left corner */}
      <div className="workflow-title-container">
        {isEditingTitle ? (
          <input
            type="text"
            value={workflowTitle}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyPress={handleTitleKeyPress}
            placeholder="Title your Flow"
            className="workflow-title-input"
            autoFocus
          />
        ) : (
          <div
            className="workflow-title-display"
            onDoubleClick={handleTitleDoubleClick}
          >
            {workflowTitle || 'Title your Flow'}
          </div>
        )}
        <button
          className="btn btn-ai-title"
          onClick={generateAITitle}
          disabled={isGeneratingTitle}
          title={isGeneratingTitle ? "Generating title..." : "Generate title with AI"}
        >
          <span className="icon">{isGeneratingTitle ? 'hourglass_empty' : 'auto_awesome'}</span>
        </button>
      </div>

      <div className="planner-toolbar">
        <button className="btn btn-secondary btn-sm" onClick={clear}>
          <span className="icon">delete</span> Clear
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onExport}>
          <span className="icon">download</span> Export JSON
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onImportClick}>
          <span className="icon">upload</span> Import JSON
        </button>
        <button className="btn btn-primary btn-sm" onClick={onSave}>
          <span className="icon">save</span> Save as Workflow
        </button>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={onImportFileChange}
        />
      </div>
      <div className="planner-canvas" ref={rfRef}>
        <NodeUpdateContext.Provider value={{ updateNode, canvasRef: rfRef }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </NodeUpdateContext.Provider>
      </div>
    </div>
  );
}
