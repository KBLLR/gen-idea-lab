/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import useStore from '../lib/store';
import { modules } from '../lib/modules';
import { specializedTasks } from '../lib/assistant/tasks';
import ReactFlow, { Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import '../styles/components/planner.css';

const nodeStyles = {
  module: { className: 'node-card node-module' },
  assistant: { className: 'node-card node-assistant' },
  task: { className: 'node-card node-task' },
  tool: { className: 'node-card node-tool' },
  workflow: { className: 'node-card node-workflow' },
  connector: { className: 'node-card node-connector' },
};

function LabelNode({ data }) {
  return (
    <div className={data.className}>
      <div className="node-title">{data.label}</div>
      {data.sub && <div className="node-sub">{data.sub}</div>}
    </div>
  );
}

const nodeTypes = { default: LabelNode };

// Extend mapping for dynamic class selection
// Include source kind
nodeStyles.source = { className: 'node-card node-source' };

export default function PlannerCanvas() {
  const persisted = useStore.use.plannerGraph?.() || { nodes: [], edges: [] };
  const [nodes, setNodes, onNodesChange] = useNodesState(persisted.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(persisted.edges || []);
  const setActiveApp = useStore.use.actions().setActiveApp;
  const addCustomWorkflow = useStore.use.actions().addCustomWorkflow;

  const rfRef = useRef(null);
  const fileInputRef = useRef(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

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
    setNodes((nds) => nds.concat({
      id: nid,
      type: 'default',
      position,
      data: { label: item.label, className: styleClass, sub: subText },
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

  // Persist planner graph on each render change
  useMemo(() => {
    const actions = useStore.getState().actions;
    if (actions && actions.setPlannerGraph) {
      actions.setPlannerGraph({ nodes, edges });
    }
  }, [nodes, edges]);

  return (
    <div className="planner-canvas-container">
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
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
