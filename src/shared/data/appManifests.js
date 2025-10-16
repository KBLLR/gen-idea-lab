/**
 * App Manifests - Centralized metadata for all micro-apps
 * Used by Dashboard, AppSwitcher, and navigation components
 */

export const APP_MANIFESTS = {
  idealab: {
    id: 'idealab',
    name: 'Idea Lab',
    shortName: 'Idea Lab',
    description: 'AI-powered idea generation and module management workspace',
    longDescription: 'Generate, develop, and manage project ideas with AI assistance. Create modules, explore concepts, and organize your creative work.',
    icon: 'lightbulb',
    color: '#FFB74D',
    category: 'Productivity',
    route: '/idealab',
    requiredServices: [],
    optionalServices: ['openai', 'google', 'notion'],
    features: [
      'AI-powered idea generation',
      'Module creation and management',
      'Knowledge base integration',
      'Collaborative brainstorming'
    ],
    tags: ['AI', 'Productivity', 'Ideation'],
    status: 'stable',
  },

  chat: {
    id: 'chat',
    name: 'Chat',
    shortName: 'Chat',
    description: 'Multi-model AI chat with context-aware conversations',
    longDescription: 'Chat with multiple AI models (GPT, Claude, Gemini) in a unified interface. Supports module-specific agents, web search, and context management.',
    icon: 'chat_bubble',
    color: '#42A5F5',
    category: 'AI & Communication',
    route: '/chat',
    requiredServices: [],
    optionalServices: ['openai', 'google', 'anthropic'],
    features: [
      'Multi-model support (GPT, Claude, Gemini)',
      'Module-specific AI agents',
      'Web search integration',
      'Context-aware responses'
    ],
    tags: ['AI', 'Chat', 'Collaboration'],
    status: 'stable',
  },

  imagebooth: {
    id: 'imagebooth',
    name: 'Image Booth',
    shortName: 'Images',
    description: 'AI image generation with multiple models and styles',
    longDescription: 'Generate images using DALL-E, Stable Diffusion, and other AI models. Support for various styles, aspect ratios, and batch generation.',
    icon: 'photo_library',
    color: '#AB47BC',
    category: 'Creative',
    route: '/imagebooth',
    requiredServices: [],
    optionalServices: ['openai', 'stability'],
    features: [
      'Multiple AI models (DALL-E, SD)',
      'Style presets and customization',
      'Batch generation',
      'Image history and gallery'
    ],
    tags: ['AI', 'Image Generation', 'Creative'],
    status: 'stable',
  },

  archiva: {
    id: 'archiva',
    name: 'Archiva',
    shortName: 'Archiva',
    description: 'Document management and knowledge organization',
    longDescription: 'Organize, search, and manage your documents with AI-powered categorization, tagging, and semantic search capabilities.',
    icon: 'folder_open',
    color: '#66BB6A',
    category: 'Productivity',
    route: '/archiva',
    requiredServices: [],
    optionalServices: ['googleDrive', 'notion'],
    features: [
      'AI-powered document categorization',
      'Semantic search',
      'Tag management',
      'Integration with cloud storage'
    ],
    tags: ['Productivity', 'Organization', 'Search'],
    status: 'stable',
  },

  planner: {
    id: 'planner',
    name: 'Planner',
    shortName: 'Planner',
    description: 'Visual workflow and project planning canvas',
    longDescription: 'Plan projects, create workflows, and organize tasks with an intuitive drag-and-drop canvas. Supports mind maps, flowcharts, and task boards.',
    icon: 'account_tree',
    color: '#26A69A',
    category: 'Productivity',
    route: '/planner',
    requiredServices: [],
    optionalServices: ['googleDrive', 'notion', 'github'],
    features: [
      'Visual workflow designer',
      'Drag-and-drop canvas',
      'Task organization',
      'Export to various formats'
    ],
    tags: ['Productivity', 'Planning', 'Visual'],
    status: 'stable',
  },

  workflows: {
    id: 'workflows',
    name: 'Workflows',
    shortName: 'Workflows',
    description: 'Automation and workflow orchestration',
    longDescription: 'Create and manage automated workflows with visual flow builder. Connect services, trigger actions, and streamline repetitive tasks.',
    icon: 'workflow',
    color: '#5C6BC0',
    category: 'Automation',
    route: '/workflows',
    requiredServices: [],
    optionalServices: ['github', 'notion', 'googleDrive'],
    features: [
      'Visual flow builder',
      'Service integrations',
      'Trigger-based automation',
      'Workflow templates'
    ],
    tags: ['Automation', 'Productivity', 'Integration'],
    status: 'stable',
  },

  calendarai: {
    id: 'calendarai',
    name: 'Calendar AI',
    shortName: 'Calendar',
    description: 'AI-enhanced calendar and scheduling assistant',
    longDescription: 'Manage your schedule with AI assistance. Get smart suggestions for meeting times, event planning, and time management optimization.',
    icon: 'calendar_today',
    color: '#EF5350',
    category: 'Productivity',
    route: '/calendarai',
    requiredServices: [],
    optionalServices: ['googleCalendar', 'gmail'],
    features: [
      'AI scheduling suggestions',
      'Event management',
      'Calendar synchronization',
      'Smart reminders'
    ],
    tags: ['Productivity', 'Scheduling', 'AI'],
    status: 'stable',
  },

  empathylab: {
    id: 'empathylab',
    name: 'Empathy Lab',
    shortName: 'Empathy',
    description: 'Emotion AI and empathic interaction workspace',
    longDescription: 'Explore emotion AI with real-time facial expression analysis, voice emotion detection, and empathic conversation interfaces.',
    icon: 'emoji_emotions',
    color: '#FF7043',
    category: 'AI & Research',
    route: '/empathylab',
    requiredServices: [],
    optionalServices: ['hume'],
    features: [
      'Real-time emotion detection',
      'Voice analysis',
      'Webcam-based expression tracking',
      'Empathic AI conversations'
    ],
    tags: ['AI', 'Emotion', 'Research'],
    status: 'beta',
  },

  gesturelab: {
    id: 'gesturelab',
    name: 'Gesture Lab',
    shortName: 'Gestures',
    description: 'Hand gesture recognition and interaction playground',
    longDescription: 'Experiment with hand gesture controls using MediaPipe. Draw, navigate, and interact with UI using hand movements and gestures.',
    icon: 'back_hand',
    color: '#FFA726',
    category: 'AI & Research',
    route: '/gesturelab',
    requiredServices: [],
    optionalServices: [],
    features: [
      'Real-time hand tracking',
      'Gesture-based drawing',
      '3D hand visualization',
      'UI control experiments'
    ],
    tags: ['AI', 'Gesture', 'Interaction'],
    status: 'beta',
  },

  kanban: {
    id: 'kanban',
    name: 'Kanban',
    shortName: 'Kanban',
    description: 'Agile task board with drag-and-drop workflow',
    longDescription: 'Organize tasks with a visual Kanban board. Supports custom lanes, drag-and-drop, task assignment, and progress tracking.',
    icon: 'view_kanban',
    color: '#78909C',
    category: 'Productivity',
    route: '/kanban',
    requiredServices: [],
    optionalServices: ['github', 'notion'],
    features: [
      'Drag-and-drop task management',
      'Custom workflow lanes',
      'Task assignment',
      'Progress tracking'
    ],
    tags: ['Productivity', 'Agile', 'Project Management'],
    status: 'stable',
  },

  characterlab: {
    id: 'characterlab',
    name: 'Character Lab',
    shortName: 'Character',
    description: '3D character rigging and model optimization',
    longDescription: 'Auto-rig 3D characters with Meshy AI, optimize GLB files, and import models from Google Drive. Includes advanced gltf-transform pipeline.',
    icon: 'view_in_ar',
    color: '#9575CD',
    category: '3D & Creative',
    route: '/characterlab',
    requiredServices: [],
    optionalServices: ['googleDrive'],
    features: [
      'AI-powered auto-rigging (Meshy)',
      'GLB optimization (70-90% reduction)',
      'Google Drive import/export',
      '3D model gallery'
    ],
    tags: ['3D', 'Character', 'Optimization'],
    status: 'beta',
  },
};

/**
 * Get app manifest by ID
 */
export function getAppManifest(appId) {
  return APP_MANIFESTS[appId] || null;
}

/**
 * Get all apps in a category
 */
export function getAppsByCategory(category) {
  return Object.values(APP_MANIFESTS).filter(app => app.category === category);
}

/**
 * Get all unique categories
 */
export function getCategories() {
  const categories = [...new Set(Object.values(APP_MANIFESTS).map(app => app.category))];
  return categories.sort();
}

/**
 * Get apps that require a specific service
 */
export function getAppsByService(serviceId) {
  return Object.values(APP_MANIFESTS).filter(
    app => app.requiredServices.includes(serviceId) || app.optionalServices.includes(serviceId)
  );
}

/**
 * Check if app has all required services connected
 */
export function hasRequiredServices(appId, connectedServices = {}) {
  const manifest = getAppManifest(appId);
  if (!manifest) return false;

  return manifest.requiredServices.every(serviceId =>
    connectedServices[serviceId]?.connected === true
  );
}

/**
 * Get missing required services for an app
 */
export function getMissingServices(appId, connectedServices = {}) {
  const manifest = getAppManifest(appId);
  if (!manifest) return [];

  return manifest.requiredServices.filter(serviceId =>
    !connectedServices[serviceId]?.connected
  );
}
