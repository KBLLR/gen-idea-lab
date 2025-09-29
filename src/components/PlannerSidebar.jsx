/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import useStore from '../lib/store';
import { personalities } from '../lib/assistant/personalities';
import { commonTasks, specializedTasks } from '../lib/assistant/tasks';
import { modules } from '../lib/modules';
import '../styles/components/planner.css';

// Helper: build assistants list (exclude OS_* and BM_* as requested)
function useAssistants() {
  return useMemo(() => {
    const excludedPrefixes = ['OS_', 'BM_'];
    return Object.values(personalities)
      .filter(p => p.id && p.id !== 'orchestrator' && !excludedPrefixes.some(pre => p.id.startsWith(pre)) )
      .map(p => ({ id: p.id, label: p.name, icon: p.icon, kind: 'assistant' }));
  }, []);
}

function useModulesList() {
  return useMemo(() => {
    const excludedPrefixes = ['OS_', 'BM_'];
    return Object.values(modules)
      .filter(m => !excludedPrefixes.some(pre => m['Module Code'].startsWith(pre)))
      .map(m => ({ id: m['Module Code'], label: m['Module Title'], kind: 'module' }));
  }, []);
}

function useTasksList() {
  return useMemo(() => {
    const items = [];
    // Common tasks
    Object.values(commonTasks).forEach(t => items.push({ id: `common:${t.id}`, label: t.name, kind: 'task', meta: { description: t.description } }));
    // Specialized tasks (flatten)
    Object.entries(specializedTasks).forEach(([mod, group]) => {
      Object.values(group).forEach(t => items.push({ id: `spec:${mod}:${t.id}`, label: `${t.name} (${mod})`, kind: 'task', meta: { module: mod, description: t.description } }));
    });
    return items;
  }, []);
}

function AgentToolsList() {
  // Agent tools (capabilities), not data sources
  return [
    { id: 'web_search', label: 'Web Search', kind: 'tool', meta: { description: 'Search the web (Ollama/Brave/DuckDuckGo)' } },
    { id: 'rag_query', label: 'RAG Query', kind: 'tool', meta: { description: 'Query module knowledge base' } },
    { id: 'rag_upsert', label: 'RAG Upsert', kind: 'tool', meta: { description: 'Add notes to module knowledge base' } },
    { id: 'create_document', label: 'Create Document (Archiva)', kind: 'tool', meta: { description: 'Create an Archiva entry' } },
    { id: 'image_generation', label: 'Image Generation', kind: 'tool', meta: { description: 'Use Image Booth to generate visuals' } },
    { id: 'invite_agent', label: 'Invite Assistant', kind: 'tool', meta: { description: 'Bring a module assistant into the chat' } },
  ];
}

function SourcesList() {
  // External sources/connectors
  return [
    { id: 'github', label: 'GitHub', kind: 'source' },
    { id: 'notion', label: 'Notion', kind: 'source' },
    { id: 'figma', label: 'Figma', kind: 'source' },
    { id: 'googledrive', label: 'Google Drive', kind: 'source' },
    { id: 'googlephotos', label: 'Google Photos', kind: 'source' },
    { id: 'googlecalendar', label: 'Google Calendar', kind: 'source' },
    { id: 'gmail', label: 'Gmail', kind: 'source' },
    { id: 'openai', label: 'OpenAI', kind: 'source' },
    { id: 'claude', label: 'Claude', kind: 'source' },
    { id: 'gemini', label: 'Gemini', kind: 'source' },
    { id: 'ollama', label: 'Ollama', kind: 'source' },
  ];
}

function WorkflowsList() {
  // Read built-in and custom workflows in components when needed
  const custom = useStore.use.customWorkflows?.() || {};
  // Built-in list kept in Workflows app; here we only enable dragging existing ones by id
  const builtIn = []; // Kept minimal; can be connected later to lib/workflows if needed
  return [...builtIn, ...Object.values(custom).map(w => ({ id: w.id, label: w.title, kind: 'workflow' }))];
}

const ACCORDION_SECTIONS = [
  { id: 'modules', title: 'Modules' },
  { id: 'assistants', title: 'Assistants' },
  { id: 'tasks', title: 'Tasks' },
  { id: 'tools', title: 'Tools (Agent)' },
  { id: 'sources', title: 'Sources' },
  { id: 'workflows', title: 'Workflows' },
  { id: 'connectors', title: 'Connectors' },
];

function DraggableItem({ item }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/x-planner', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };
  return (
    <div className="planner-item" draggable onDragStart={onDragStart} title={item.label}>
      <span className="icon">{item.icon || 'drag_indicator'}</span>
      <span className="label">{item.label}</span>
    </div>
  );
}

export default function PlannerSidebar() {
  const [open, setOpen] = useState({ modules: true, assistants: true, tasks: false, tools: false, workflows: false, connectors: false });

  const modulesList = useModulesList();
  const assistants = useAssistants();
  const tasks = useTasksList();
  const tools = AgentToolsList();
  const sources = SourcesList();
  const workflows = WorkflowsList();
  const connectors = [
    { id: 'connector:sequence', label: 'Sequence', kind: 'connector' },
    { id: 'connector:parallel', label: 'Parallel', kind: 'connector' },
    { id: 'connector:decision', label: 'Decision', kind: 'connector' },
    { id: 'connector:loop', label: 'Loop', kind: 'connector' },
    { id: 'connector:trigger', label: 'Trigger', kind: 'connector' },
  ];

  const sectionData = {
    modules: modulesList,
    assistants,
    tasks,
    tools,
    sources,
    workflows,
    connectors,
  };

  return (
    <div className="planner-sidebar">
      {ACCORDION_SECTIONS.map(sec => (
        <div key={sec.id} className="accordion-section">
          <button className="accordion-header" onClick={() => setOpen(s => ({ ...s, [sec.id]: !s[sec.id] }))}>
            <span className="icon">{open[sec.id] ? 'expand_more' : 'chevron_right'}</span>
            <span className="title">{sec.title}</span>
          </button>
          {open[sec.id] && (
            <div className="accordion-body">
              {sectionData[sec.id].length === 0 ? (
                <div className="empty">No items</div>
              ) : (
                sectionData[sec.id].map(item => (
                  <DraggableItem key={`${item.kind}:${item.id}`} item={item} />
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
