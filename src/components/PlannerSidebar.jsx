/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import useStore from '../lib/store';
import { personalities } from '../lib/assistant/personalities';
import { commonTasks, specializedTasks } from '../lib/assistant/tasks';
import { modules } from '../lib/modules';
import { templates as archivaTemplates } from '../lib/archiva/templates';
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

function SourcesList(connectedServices) {
  // External data sources/connectors
  return [
    { id: 'github', label: 'GitHub', kind: 'source', connected: connectedServices?.github?.connected || false },
    { id: 'notion', label: 'Notion', kind: 'source', connected: connectedServices?.notion?.connected || false },
    { id: 'figma', label: 'Figma', kind: 'source', connected: connectedServices?.figma?.connected || false },
    { id: 'googledrive', label: 'Google Drive', kind: 'source', connected: connectedServices?.googledrive?.connected || false },
    { id: 'googlephotos', label: 'Google Photos', kind: 'source', connected: connectedServices?.googlephotos?.connected || false },
    { id: 'googlecalendar', label: 'Google Calendar', kind: 'source', connected: connectedServices?.googlecalendar?.connected || false },
    { id: 'gmail', label: 'Gmail', kind: 'source', connected: connectedServices?.gmail?.connected || false },
  ];
}

function ModelProvidersList(connectedServices) {
  // AI model providers
  return [
    { id: 'openai', label: 'OpenAI', kind: 'model-provider', icon: 'smart_toy', connected: connectedServices?.openai?.connected || false },
    { id: 'claude', label: 'Claude', kind: 'model-provider', icon: 'psychology', connected: connectedServices?.claude?.connected || false },
    { id: 'gemini', label: 'Gemini', kind: 'model-provider', icon: 'auto_awesome', connected: true }, // Built-in, always connected
    { id: 'ollama', label: 'Ollama', kind: 'model-provider', icon: 'computer', connected: connectedServices?.ollama?.connected || false },
  ];
}

function WorkflowsList(customWorkflows) {
  // Read built-in and custom workflows in components when needed
  const custom = customWorkflows || {};
  // Built-in list kept in Workflows app; here we only enable dragging existing ones by id
  const builtIn = []; // Kept minimal; can be connected later to lib/workflows if needed
  return [...builtIn, ...Object.values(custom).map(w => ({ id: w.id, label: w.title, kind: 'workflow' }))];
}

function ArchivAITemplatesList() {
  // Convert ArchivAI templates to draggable items
  return Object.entries(archivaTemplates).map(([key, template]) => ({
    id: key,
    label: template.name,
    kind: 'archiva-template',
    icon: getTemplateIcon(template.type),
    templateType: template.type,
    purpose: template.purpose,
    fields: template.fields
  }));
}

function getTemplateIcon(type) {
  switch (type) {
    case 'Reflective': return 'lightbulb';
    case 'Technical': return 'code';
    case 'Creative': return 'palette';
    default: return 'description';
  }
}

const ACCORDION_SECTIONS = [
  { id: 'modules', title: 'Modules' },
  { id: 'assistants', title: 'Assistants' },
  { id: 'tasks', title: 'Tasks' },
  { id: 'tools', title: 'Tools (Agent)' },
  { id: 'sources', title: 'Sources' },
  { id: 'model-providers', title: 'Model Providers' },
  { id: 'workflows', title: 'Workflows' },
  { id: 'archiva-templates', title: 'ArchivAI Templates' },
  { id: 'connectors', title: 'Connectors' },
];

function DraggableItem({ item }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/x-planner', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const showConnectionStatus = item.kind === 'source' || item.kind === 'model-provider';

  return (
    <div className="planner-item" draggable onDragStart={onDragStart} title={item.label}>
      <span className="icon">{item.icon || 'drag_indicator'}</span>
      <span className="label">{item.label}</span>
      {showConnectionStatus && (
        <span className={`connection-status ${item.connected ? 'connected' : 'disconnected'}`}
              title={item.connected ? 'Connected' : 'Disconnected'}>
        </span>
      )}
    </div>
  );
}

export default function PlannerSidebar() {
  const [open, setOpen] = useState({ modules: true, assistants: true, tasks: false, tools: false, sources: false, 'model-providers': false, workflows: false, connectors: false });
  const connectedServices = useStore.use.connectedServices();
  const customWorkflows = useStore.use.customWorkflows?.() || {};

  const modulesList = useModulesList();
  const assistants = useAssistants();
  const tasks = useTasksList();
  const tools = AgentToolsList();
  const sources = SourcesList(connectedServices);
  const modelProviders = ModelProvidersList(connectedServices);
  const workflows = WorkflowsList(customWorkflows);
  const connectors = [
    { id: 'connector:sequence', label: 'Sequence', kind: 'connector' },
    { id: 'connector:parallel', label: 'Parallel', kind: 'connector' },
    { id: 'connector:decision', label: 'Decision', kind: 'connector' },
    { id: 'connector:loop', label: 'Loop', kind: 'connector' },
    { id: 'connector:trigger', label: 'Trigger', kind: 'connector' },
  ];

  const archivaTemplates = ArchivAITemplatesList();

  const sectionData = {
    modules: modulesList,
    assistants,
    tasks,
    tools,
    sources,
    'model-providers': modelProviders,
    workflows,
    'archiva-templates': archivaTemplates,
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
