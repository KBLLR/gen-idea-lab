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
    { id: 'app_state_snapshot', label: 'App State Snapshot', kind: 'tool', icon: 'save', meta: { description: 'Capture current application state for workflow context' } },
  ];
}

function SourcesList(connectedServices) {
  // External data sources/connectors
  return [
    { id: 'github', label: 'GitHub', kind: 'source', icon: 'code', connected: connectedServices?.github?.connected || false },
    { id: 'notion', label: 'Notion', kind: 'source', icon: 'description', connected: connectedServices?.notion?.connected || false },
    { id: 'figma', label: 'Figma', kind: 'source', icon: 'design_services', connected: connectedServices?.figma?.connected || false },
    // Note: Google integrations are listed under "Google Services" panels, not here.
  ];
}

function GoogleServicesList(connectedServices) {
  // Interactive Google service components for workflows
  return [
    { id: 'google-calendar', label: 'Calendar Events', kind: 'google-calendar', icon: 'event', connected: connectedServices?.googleCalendar?.connected || false, meta: { description: 'View and manage calendar events in workflows' } },
    { id: 'google-drive', label: 'Drive Files', kind: 'google-drive', icon: 'cloud', connected: connectedServices?.googleDrive?.connected || false, meta: { description: 'Browse and access Google Drive files' } },
    { id: 'google-photos', label: 'Photo Albums', kind: 'google-photos', icon: 'photo_library', connected: connectedServices?.googlePhotos?.connected || false, meta: { description: 'View Google Photos albums and images' } },
    { id: 'gmail', label: 'Email Messages', kind: 'gmail', icon: 'email', connected: connectedServices?.gmail?.connected || false, meta: { description: 'View and manage Gmail messages' } },
  ];
}

function UniversityServicesList(connectedServices) {
  // University (CODE University Learning Platform) components for workflows
  return [
    { id: 'university-student', label: 'Student Profile', kind: 'university-student', icon: 'person', connected: connectedServices?.university?.connected || false, meta: { description: 'View student information, program, and semester details' } },
    { id: 'university-courses', label: 'Courses & Grades', kind: 'university-courses', icon: 'school', connected: connectedServices?.university?.connected || false, meta: { description: 'Access course enrollments, grades, and assignments' } },
  ];
}

function ModelProvidersList(connectedServices) {
  // AI model providers
  return [
    // Major commercial providers
    { id: 'openai', label: 'OpenAI', kind: 'model-provider', icon: 'smart_toy', connected: connectedServices?.openai?.connected || false },
    { id: 'claude', label: 'Claude', kind: 'model-provider', icon: 'psychology', connected: connectedServices?.claude?.connected || false },
    { id: 'gemini', label: 'Gemini', kind: 'model-provider', icon: 'auto_awesome', connected: true }, // Built-in, always connected

    // Open source and specialized providers
    { id: 'huggingface', label: 'Hugging Face', kind: 'model-provider', icon: 'hub', connected: connectedServices?.huggingface?.connected || false },
    { id: 'replicate', label: 'Replicate', kind: 'model-provider', icon: 'replay', connected: connectedServices?.replicate?.connected || false },
    { id: 'together', label: 'Together AI', kind: 'model-provider', icon: 'group_work', connected: connectedServices?.together?.connected || false },
    { id: 'mistral', label: 'Mistral AI', kind: 'model-provider', icon: 'air', connected: connectedServices?.mistral?.connected || false },
    { id: 'cohere', label: 'Cohere', kind: 'model-provider', icon: 'hub', connected: connectedServices?.cohere?.connected || false },

    // Self-hosted and local providers
    { id: 'ollama', label: 'Ollama', kind: 'model-provider', icon: 'computer', connected: connectedServices?.ollama?.connected || false },
    { id: 'vllm', label: 'vLLM', kind: 'model-provider', icon: 'dns', connected: connectedServices?.vllm?.connected || false },
    { id: 'localai', label: 'LocalAI', kind: 'model-provider', icon: 'home', connected: connectedServices?.localai?.connected || false },

    // Specialized providers
    { id: 'stability', label: 'Stability AI', kind: 'model-provider', icon: 'image', connected: connectedServices?.stability?.connected || false },
    { id: 'midjourney', label: 'Midjourney', kind: 'model-provider', icon: 'palette', connected: connectedServices?.midjourney?.connected || false },
    { id: 'runway', label: 'Runway ML', kind: 'model-provider', icon: 'movie', connected: connectedServices?.runway?.connected || false },
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

function MediaComponentsList() {
  // Interactive media and data handling components
  return [
    { id: 'image-canvas', label: 'Image Canvas', kind: 'image-canvas', icon: 'image', meta: { description: 'Display and interact with images - zoom, pan, download' } },
    { id: 'audio-player', label: 'Audio Player', kind: 'audio-player', icon: 'volume_up', meta: { description: 'Play audio files with controls and progress tracking' } },
    { id: 'text-renderer', label: 'Text Renderer', kind: 'text-renderer', icon: 'article', meta: { description: 'Display and edit text in multiple formats (markdown, code, plain)' } },
    { id: 'file-uploader', label: 'File Uploader', kind: 'file-uploader', icon: 'cloud_upload', meta: { description: 'Upload and manage multiple files with drag-and-drop support' } },
  ];
}

function TopicsList() {
  // Project topics and research areas
  // TODO: Connect to actual topics from store or database
  return [
    { id: 'topic-ai-ml', label: 'AI & Machine Learning', kind: 'topic', icon: 'psychology', meta: { description: 'Artificial intelligence and machine learning projects' } },
    { id: 'topic-web-dev', label: 'Web Development', kind: 'topic', icon: 'web', meta: { description: 'Web application development topics' } },
    { id: 'topic-data-science', label: 'Data Science', kind: 'topic', icon: 'analytics', meta: { description: 'Data analysis and visualization topics' } },
    { id: 'topic-design', label: 'Design & UX', kind: 'topic', icon: 'palette', meta: { description: 'User experience and interface design' } },
  ];
}

function IdeasList() {
  // Individual ideas and concepts
  // TODO: Connect to actual ideas from store or database
  return [
    { id: 'idea-chatbot', label: 'Build a chatbot', kind: 'idea', icon: 'chat', meta: { description: 'Create an intelligent conversational agent' } },
    { id: 'idea-dashboard', label: 'Analytics dashboard', kind: 'idea', icon: 'dashboard', meta: { description: 'Design a data visualization dashboard' } },
    { id: 'idea-mobile-app', label: 'Mobile app prototype', kind: 'idea', icon: 'phone_android', meta: { description: 'Prototype a mobile application' } },
  ];
}

const ACCORDION_SECTIONS = [
  { id: 'topics', title: 'Topics' },
  { id: 'ideas', title: 'Ideas' },
  { id: 'modules', title: 'Modules' },
  { id: 'assistants', title: 'Assistants' },
  { id: 'tasks', title: 'Tasks' },
  { id: 'tools', title: 'Tools (Agent)' },
  { id: 'media-components', title: 'Media Components' },
  { id: 'google-services', title: 'Google Services' },
  { id: 'university-services', title: '<CODE>' },
  { id: 'sources', title: 'Sources' },
  { id: 'model-providers', title: 'Model Providers' },
  { id: 'workflows', title: 'Workflows' },
  { id: 'archiva-templates', title: 'ArchivAI Templates' },
  { id: 'connectors', title: 'Connectors' },
];

function DraggableItem({ item }) {
  const connectService = useStore((state) => state.actions.connectService);
  const setIsSettingsOpen = useStore((state) => state.actions.setIsSettingsOpen);
  // Use generic selector to avoid HMR hook ordering issues
  const serviceConfig = useStore((state) => state.serviceConfig || {});

  const onDragStart = (e) => {
    e.dataTransfer.setData('application/x-planner', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const showConnectionStatus = item.kind === 'source' || item.kind === 'model-provider' || item.kind === 'google-calendar' || item.kind === 'google-drive' || item.kind === 'google-photos' || item.kind === 'gmail' || item.kind === 'university-student' || item.kind === 'university-courses';

  // Create data attributes for styling connected services
  const dataAttributes = {};
  if (showConnectionStatus) {
    dataAttributes['data-connected'] = item.connected ? 'true' : 'false';
    if (item.id) {
      dataAttributes['data-service'] = item.id;
    }
  }

  const normalizeServiceId = (id) => {
    const map = {
      googledrive: 'googleDrive',
      googlephotos: 'googlePhotos',
      googlecalendar: 'googleCalendar',
      'google-drive': 'googleDrive',
      'google-photos': 'googlePhotos',
      'google-calendar': 'googleCalendar',
    };
    return map[id] || id;
  };

  const handleQuickConnect = async (e) => {
    e.stopPropagation();
    // Try OAuth services directly; API-key services open Settings
    const serviceId = normalizeServiceId(item.id);
    const oauthServices = new Set(['github', 'notion', 'figma', 'googleDrive', 'googlePhotos', 'googleCalendar', 'gmail', 'university']);
    const apiKeyServices = new Set(['openai', 'claude', 'gemini']);

    const cfg = serviceConfig?.[serviceId];
    if (cfg && cfg.configured === false) {
      // Open settings where user can see missing env and instructions
      setIsSettingsOpen(true);
      return;
    }

    if (oauthServices.has(serviceId)) {
      try {
        await connectService(serviceId);
      } catch (err) {
        console.warn('Quick connect failed, opening Settings:', err?.message);
        setIsSettingsOpen(true);
      }
      return;
    }

    if (apiKeyServices.has(serviceId) || item.kind === 'model-provider') {
      setIsSettingsOpen(true);
    }
  };

  return (
    <div
      className="planner-item"
      draggable
      onDragStart={onDragStart}
      title={item.label}
      {...dataAttributes}
    >
      <span className="icon">{item.icon || 'drag_indicator'}</span>
      <span className="label">{item.label}</span>
      {showConnectionStatus && !item.connected && (
        <button className="connect-cta" onClick={handleQuickConnect} title="Connect this service">
          Connect
        </button>
      )}
      {showConnectionStatus && (
        <span className={`connection-status ${item.connected ? 'connected' : 'disconnected'}`}
              title={item.connected ? 'Connected' : 'Disconnected'}>
        </span>
      )}
    </div>
  );
}

export default function PlannerSidebar() {
  const [open, setOpen] = useState({
    topics: false,
    ideas: false,
    modules: false,
    assistants: false,
    tasks: false,
    tools: false,
    'media-components': false,
    'google-services': false,
    'university-services': false,
    sources: false,
    'model-providers': false,
    workflows: false,
    'archiva-templates': false,
    connectors: false
  });
  const connectedServices = useStore.use.connectedServices();
  const customWorkflows = useStore.use.customWorkflows?.() || {};

  const topics = TopicsList();
  const ideas = IdeasList();
  const modulesList = useModulesList();
  const assistants = useAssistants();
  const tasks = useTasksList();
  const tools = AgentToolsList();
  const mediaComponents = MediaComponentsList();
  const googleServices = GoogleServicesList(connectedServices);
  const universityServices = UniversityServicesList(connectedServices);
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
    topics,
    ideas,
    modules: modulesList,
    assistants,
    tasks,
    tools,
    'media-components': mediaComponents,
    'google-services': googleServices,
    'university-services': universityServices,
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
              {!sectionData[sec.id] || sectionData[sec.id].length === 0 ? (
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
