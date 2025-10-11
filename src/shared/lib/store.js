/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import 'immer'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import { createSelectorFunctions } from 'auto-zustand-selectors-hook'

import { modules } from '@apps/ideaLab/lib/modules.js'
import { getResourceManager } from './services/ResourceManager.js'
import { DEFAULT_IMAGE_MODELS, ALWAYS_AVAILABLE_IMAGE_PROVIDERS } from './imageProviders.js'
import tasksSlice from './tasksSlice.js'

import { createAuthSlice } from '@shared/state/authSlice.js'
import { createServiceConnectionSlice } from '@shared/state/serviceConnectionSlice.js'
import { createAppSwitchingSlice } from '@shared/state/appSwitchingSlice.js'
import { createRiggingTasksSlice } from '@shared/state/riggingTasksSlice.js'

const IMAGE_PROVIDER_PRIORITY = ['gemini', 'openai', 'drawthings']

function resolveImageProvider(currentProvider, connectedServices = {}) {
  const normalizedCurrent = currentProvider || 'gemini'
  if (
    ALWAYS_AVAILABLE_IMAGE_PROVIDERS.has(normalizedCurrent) ||
    connectedServices[normalizedCurrent]?.connected
  ) {
    return normalizedCurrent
  }
  for (const provider of IMAGE_PROVIDER_PRIORITY) {
    if (
      ALWAYS_AVAILABLE_IMAGE_PROVIDERS.has(provider) ||
      connectedServices[provider]?.connected
    ) {
      return provider
    }
  }
  return 'gemini'
}

function syncImageProviderState(state, { forceModelReset = false } = {}) {
  const previousProvider = state.imageProvider
  const resolvedProvider = resolveImageProvider(previousProvider, state.connectedServices)
  state.imageProvider = resolvedProvider
  const providerChanged = previousProvider !== resolvedProvider
  if (providerChanged || forceModelReset || state.imageModel === undefined) {
    state.imageModel = DEFAULT_IMAGE_MODELS[resolvedProvider] ?? null
  }
}

const storeImpl = (set, get) => ({
  // Shared tasks model
  ...tasksSlice(set, get),

  // Auth, service connections, and app switching slices (top-level for selectors)
  ...createAuthSlice(set, get),
  ...createServiceConnectionSlice(set, get),
  ...createAppSwitchingSlice(set, get),
  ...createRiggingTasksSlice(set, get),

  didInit: false,
  isWelcomeScreenOpen: true,
  isSettingsOpen: false,
  isSystemInfoOpen: false,
  isLiveVoiceChatOpen: false,

  // Consolidated UI flags
  ui: {
    isSettingsOpen: false,
  },
  theme: 'dark',
  accentTheme: 'azure',

  // Glass Dock state
  dockPosition: { x: 20, y: typeof window !== 'undefined' ? (window.innerHeight - 100) : 20 },
  dockDimensions: { width: 0, height: 0 },
  dockMode: 'chat', // 'chat' | 'node'
  dockMinimized: true, // Dock starts minimized (just orb)
  activeNodeId: null,
  currentNodeConfig: null,

  // Glass Dock setters (top-level so components can access directly or via actions proxy)
  setDockPosition: (pos) => set((state) => { state.dockPosition = pos }),
  setDockDimensions: (dims) => set((state) => { state.dockDimensions = dims }),
  setDockMinimized: (minimized) => set((state) => { state.dockMinimized = !!minimized }),

  // Theme actions
  setAccentTheme: (theme) => set((state) => { state.accentTheme = theme }),

  // Assistant chat actions
  setAssistantModel: (modelId) => set((state) => { state.assistantModel = modelId }),
  setAssistantSystemPrompt: (moduleId, prompt) => set((state) => {
    if (!state.assistantSystemPrompts) state.assistantSystemPrompts = {};
    state.assistantSystemPrompts[moduleId] = prompt;
  }),
  saveAssistantChat: (moduleId, chat) => set((state) => {
    if (!state.moduleAssistantSavedChats) state.moduleAssistantSavedChats = {};
    if (!state.moduleAssistantSavedChats[moduleId]) state.moduleAssistantSavedChats[moduleId] = [];
    state.moduleAssistantSavedChats[moduleId].push(chat);
  }),
  startNewChat: (moduleId) => set((state) => {
    const chatId = `chat_${moduleId || state.activeModuleId}_${Date.now()}`;
    state.activeChatId = chatId;
    console.log('[Chat] Started new chat:', chatId);
  }),
  loadChat: (chatId) => set((state) => {
    state.activeChatId = chatId;
    console.log('[Chat] Loaded chat:', chatId);
  }),

  // Planner/Workflow actions
  setNodes: (nodes) => set((state) => {
    if (!state.plannerGraph) state.plannerGraph = {};
    state.plannerGraph.nodes = nodes;
  }),
  addCustomWorkflow: (workflow) => set((state) => {
    if (!state.customWorkflows) state.customWorkflows = [];
    state.customWorkflows.push(workflow);
  }),
  setSelectedWorkflow: (workflowId) => set((state) => { state.selectedWorkflow = workflowId }),

  // GestureLab actions
  setGestureLabMode: (mode) => set((state) => {
    if (!state.gestureLab) state.gestureLab = { mode: 'whiteboard', examples: {} };
    state.gestureLab.mode = mode;
  }),
  setGestureLabExample: (exampleName, enabled) => set((state) => {
    if (!state.gestureLab?.examples) {
      state.gestureLab = { ...(state.gestureLab || {}), examples: {} };
    }
    state.gestureLab.examples[exampleName] = !!enabled;
  }),

  // EmpathyLab model loaded
  setEmpathyLabModelLoaded: (loaded) => set((state) => {
    if (!state.empathyLab) state.empathyLab = {};
    state.empathyLab.isModelLoaded = !!loaded;
  }),

  // Knowledge base writers
  addDocumentationEntry: (moduleId, entry) => set((state) => {
    if (!state.moduleKnowledgeCache) state.moduleKnowledgeCache = {};
    if (!state.moduleKnowledgeCache[moduleId]) state.moduleKnowledgeCache[moduleId] = { documentation: [], workflows: [], chats: [] };
    if (!state.moduleKnowledgeCache[moduleId].documentation) state.moduleKnowledgeCache[moduleId].documentation = [];
    state.moduleKnowledgeCache[moduleId].documentation.push(entry);
  }),
  addWorkflowEntry: (moduleId, entry) => set((state) => {
    if (!state.moduleKnowledgeCache) state.moduleKnowledgeCache = {};
    if (!state.moduleKnowledgeCache[moduleId]) state.moduleKnowledgeCache[moduleId] = { documentation: [], workflows: [], chats: [] };
    if (!state.moduleKnowledgeCache[moduleId].workflows) state.moduleKnowledgeCache[moduleId].workflows = [];
    state.moduleKnowledgeCache[moduleId].workflows.push(entry);
  }),
  addChatEntry: (moduleId, entry) => set((state) => {
    if (!state.moduleKnowledgeCache) state.moduleKnowledgeCache = {};
    if (!state.moduleKnowledgeCache[moduleId]) state.moduleKnowledgeCache[moduleId] = { documentation: [], workflows: [], chats: [] };
    if (!state.moduleKnowledgeCache[moduleId].chats) state.moduleKnowledgeCache[moduleId].chats = [];
    state.moduleKnowledgeCache[moduleId].chats.push(entry);
  }),

  // Module state (Idea Lab)
  modules: modules,
  activeModuleId: null,

  // Assistant state
  isAssistantLoading: false,
  assistantHistories: {},
  activeChatId: null, // Current active chat session ID
  showModuleChat: false,

  // Orchestrator Chat State (now handled by GlassDock)
  isOrchestratorLoading: false,
  orchestratorModel: 'gemini-2.0-flash-exp',
  workflowAutoTitleModel: 'gemma3:4b-it-qat',
  orchestratorHistory: [
    {
      role: 'model',
      parts: [{ text: 'I am the Orchestrator. How can we start building your next project? You can select a module on the left and I can invite its agent to help us.' }]
    }
  ],
  orchestratorHasConversation: false,
  orchestratorNarration: '',
  orchestratorNarrationHistory: [],
  setOrchestratorNarration: (message) => set((state) => {
    const text = String(message ?? '');
    state.orchestratorNarration = text;
    const history = Array.isArray(state.orchestratorNarrationHistory) ? state.orchestratorNarrationHistory : [];
    const entry = { t: Date.now(), text };
    const next = [...history, entry];
    state.orchestratorNarrationHistory = next.slice(Math.max(0, next.length - 50));
  }),

  // Workflow State
  workflowHistory: {},
  activeWorkflow: null,
  workflowStep: 0,
  selectedWorkflow: null,

  // Layout
  rightColumnWidth: 520,
  leftColumnWidth: 280,

  // Settings / Onboarding
  settings: {
    dismissedOnboarding: false,
  },
  // First-visit flags per app (controls initial welcome screens)
  firstVisit: {
    ideaLab: true,
    chat: true,
    workflows: true,
    planner: true,
    calendarAI: true,
    imageBooth: true,
    empathyLab: true,
    gestureLab: true,
    kanban: true,
  },

  // Image Booth state
  activeModeKey: 'banana',
  inputImage: null,
  outputImage: null,
  isGenerating: false,
  generationError: null,
  imageProvider: 'gemini',
  imageModel: DEFAULT_IMAGE_MODELS.gemini,

  // Archiva State
  archivaEntries: {},
  activeEntryId: null,
  selectedTemplateForPreview: null,

  // EmpathyLab State
  empathyLab: {
    consent: {
      faceDetection: false,
      emotionAnalysis: false,
      bodyTracking: false,
      handTracking: false,
      gazeTracking: false,
      dataExport: false,
    },
    selectedHumeConfigId: null,
    humeConfig: null,
    isModelLoaded: false,
    overlays: {
      drawBoxes: true,
      drawPoints: true,
      drawPolygons: true,
      drawLabels: true,
      drawFaceMesh: false,
      drawIris: false,
      drawGaze: true,
      drawAttention: false,
      drawBodySkeleton: true,
      drawBodyPoints: true,
      drawHandSkeleton: true,
      drawHandPoints: true,
      showGazeOverlay: false,
      showEmotionFusion: true,
    },
  },

  // EmpathyLab actions (top-level)
  setEmpathyLabConsent: (key, value) => set((state) => {
    if (!state.empathyLab?.consent) state.empathyLab.consent = {};
    state.empathyLab.consent[key] = !!value;
  }),
  setEmpathyLabConsentAll: (obj) => set((state) => {
    state.empathyLab.consent = { ...(state.empathyLab.consent || {}), ...obj };
  }),
  setEmpathyLabOverlay: (key, value) => set((state) => {
    if (!state.empathyLab?.overlays) state.empathyLab.overlays = {};
    state.empathyLab.overlays[key] = !!value;
  }),
  setEmpathyLabHumeConfig: (config) => set((state) => {
    state.empathyLab.humeConfig = config;
  }),

  // Assistant Chat Settings
  assistantModel: 'gemini-2.5-flash',
  assistantSystemPrompts: {},
  moduleAssistantSavedChats: {},

  // GestureLab State
  gestureLab: {
    mode: 'whiteboard',
    examples: {
      Whiteboard: true,
      '3D Navigation': false,
      'UI Control': false,
    },
  },

  // Orchestrator Saved Sessions
  orchestratorSavedSessions: [],

  // App transition UX
  appTransition: { status: 'idle', from: null, to: null, logs: [] },

  // Resource Management State
  resourceManager: getResourceManager(),
  loadedResourceIds: new Set(),
  moduleKnowledgeCache: {},
  showKnowledgeSection: false,
  showGallery: false,

  // Google service caches (prefetch-friendly)
  google: {
    drive: { files: [], nextPageToken: null, lastFetched: null },
    photos: { albums: [], nextPageToken: null, lastFetched: null },
    gmail: { messages: [], lastFetched: null },
  },

  // Settings modal controls (top-level for selectors and actions proxy)
  setIsSettingsOpen: (open) => set((state) => { state.isSettingsOpen = !!open; state.ui = state.ui || {}; state.ui.isSettingsOpen = !!open; }),
  openSettings: () => set((state) => { state.ui = state.ui || {}; state.ui.isSettingsOpen = true; state.isSettingsOpen = true; }),
  closeSettings: () => set((state) => { state.ui = state.ui || {}; state.ui.isSettingsOpen = false; state.isSettingsOpen = false; }),
  toggleSettings: () => set((state) => { state.ui = state.ui || {}; const next = !state.ui.isSettingsOpen; state.ui.isSettingsOpen = next; state.isSettingsOpen = next; }),
  // Workflow settings
  setWorkflowAutoTitleModel: (modelId) => set((state) => { state.workflowAutoTitleModel = modelId || ''; }),

  // Toggle right knowledge pane
  setShowKnowledgeSection: (show) => set((state) => { state.showKnowledgeSection = !!show }),
  toggleKnowledgeSection: () => set((state) => { state.showKnowledgeSection = !state.showKnowledgeSection }),

  // Actions (grouped proxies to top-level functions)
  actions: {
    // Auth
    setUser: (...args) => get().setUser(...args),
    logout: (...args) => get().logout(...args),
    setCheckingAuth: (...args) => get().setCheckingAuth(...args),

    // Service connections
    setConnectedServices: (...args) => get().setConnectedServices(...args),
    updateServiceConnection: (...args) => get().updateServiceConnection(...args),
    removeServiceConnection: (...args) => get().removeServiceConnection(...args),
    storeServiceCredentials: (...args) => get().storeServiceCredentials(...args),
    toggleService: (...args) => get().toggleService(...args),
    connectService: (...args) => get().connectService(...args),
    disconnectService: (...args) => get().disconnectService(...args),

    // Service config/connection fetchers
    fetchConnectedServices: (...args) => get().fetchConnectedServices(...args),
    fetchServiceConfig: (...args) => get().fetchServiceConfig(...args),

    // App switching
    setActiveApp: (...args) => get().setActiveApp(...args),
    startAppSwitch: (from, to) => set((s) => { s.appTransition = { status: 'starting', from, to, logs: [] }; }),
    logStep: (m) => set((s) => { s.appTransition.logs.push({ t: Date.now(), m }); }),
    finishAppSwitch: () => set((s) => { s.appTransition.status = 'ready'; }),
    failAppSwitch: (e) => set((s) => { s.appTransition.status = 'error'; s.appTransition.error = String(e); }),

    // Local UI actions
    setIsSystemInfoOpen: (open) => set((state) => { state.isSystemInfoOpen = open }),

    // Settings modal proxies
    setIsSettingsOpen: (...args) => get().setIsSettingsOpen(...args),
    openSettings: (...args) => get().openSettings(...args),
    closeSettings: (...args) => get().closeSettings(...args),
    toggleSettings: (...args) => get().toggleSettings(...args),
    setRightColumnWidth: (w) => set((state) => { state.rightColumnWidth = w }),
    setLeftColumnWidth: (w) => set((state) => { state.leftColumnWidth = w }),
    setIsLiveVoiceChatOpen: (open) => set((state) => { state.isLiveVoiceChatOpen = open }),

    // Settings
    setDismissedOnboarding: (val = true) => set((state) => { state.settings = state.settings || {}; state.settings.dismissedOnboarding = !!val; }),
    setWorkflowAutoTitleModel: (...args) => get().setWorkflowAutoTitleModel(...args),

    // Knowledge pane
    toggleKnowledgeSection: (...args) => get().toggleKnowledgeSection(...args),
    setShowKnowledgeSection: (...args) => get().setShowKnowledgeSection(...args),

    // EmpathyLab
    setEmpathyLabConsent: (...args) => get().setEmpathyLabConsent(...args),
    setEmpathyLabConsentAll: (...args) => get().setEmpathyLabConsentAll(...args),
    setEmpathyLabOverlay: (...args) => get().setEmpathyLabOverlay(...args),
    setEmpathyLabHumeConfig: (...args) => get().setEmpathyLabHumeConfig(...args),

    // Glass Dock
    setDockPosition: (...args) => get().setDockPosition(...args),
    setDockDimensions: (...args) => get().setDockDimensions(...args),
    setDockMinimized: (...args) => get().setDockMinimized(...args),
    expandDock: () => set((state) => { state.dockMinimized = false; }),

    // Theme
    setAccentTheme: (...args) => get().setAccentTheme(...args),

    // Assistant chat
    setAssistantModel: (...args) => get().setAssistantModel(...args),
    setAssistantSystemPrompt: (...args) => get().setAssistantSystemPrompt(...args),
    saveAssistantChat: (...args) => get().saveAssistantChat(...args),
    startNewChat: (...args) => get().startNewChat(...args),
    loadChat: (...args) => get().loadChat(...args),
    setOrchestratorNarration: (...args) => get().setOrchestratorNarration(...args),

    // Planner/Workflow
    setNodes: (...args) => get().setNodes(...args),
    addCustomWorkflow: (...args) => get().addCustomWorkflow(...args),
    setSelectedWorkflow: (...args) => get().setSelectedWorkflow(...args),

    // GestureLab
    setGestureLabMode: (...args) => get().setGestureLabMode(...args),
    setGestureLabExample: (...args) => get().setGestureLabExample(...args),

    // EmpathyLab model
    setEmpathyLabModelLoaded: (...args) => get().setEmpathyLabModelLoaded(...args),

    // Knowledge base
    addDocumentationEntry: (...args) => get().addDocumentationEntry(...args),
    addWorkflowEntry: (...args) => get().addWorkflowEntry(...args),
    addChatEntry: (...args) => get().addChatEntry(...args),
    // First-visit controls
    setFirstVisit: (appId, val) => set((state) => {
      state.firstVisit = state.firstVisit || {};
      state.firstVisit[appId] = !!val;
    }),
    dismissFirstVisit: (appId) => set((state) => {
      state.firstVisit = state.firstVisit || {};
      state.firstVisit[appId] = false;
    }),

    // Google services prefetchers
    fetchGoogleDriveFiles: async () => {
      try {
        const resp = await fetch('/api/services/googleDrive/files?folderId=root', { credentials: 'include' });
        if (!resp.ok) return;
        const data = await resp.json();
        set((state) => {
          state.google = state.google || {};
          state.google.drive = state.google.drive || {};
          state.google.drive.files = data.files || [];
          state.google.drive.nextPageToken = data.nextPageToken || null;
          state.google.drive.lastFetched = Date.now();
        });
      } catch (e) {
        console.warn('[store] fetchGoogleDriveFiles failed:', e?.message || e);
      }
    },
    fetchGooglePhotosAlbums: async () => {
      try {
        const resp = await fetch('/api/services/googlePhotos/albums', { credentials: 'include' });
        if (!resp.ok) return;
        const data = await resp.json();
        set((state) => {
          state.google = state.google || {};
          state.google.photos = state.google.photos || {};
          state.google.photos.albums = data.albums || [];
          state.google.photos.nextPageToken = data.nextPageToken || null;
          state.google.photos.lastFetched = Date.now();
        });
      } catch (e) {
        console.warn('[store] fetchGooglePhotosAlbums failed:', e?.message || e);
      }
    },
    fetchGmailMessages: async () => {
      try {
        const resp = await fetch('/api/services/gmail/messages?maxResults=10&labelIds=INBOX', { credentials: 'include' });
        if (!resp.ok) return;
        const data = await resp.json();
        set((state) => {
          state.google = state.google || {};
          state.google.gmail = state.google.gmail || {};
          state.google.gmail.messages = data.messages || [];
          state.google.gmail.lastFetched = Date.now();
        });
      } catch (e) {
        console.warn('[store] fetchGmailMessages failed:', e?.message || e);
      }
    },
  },
})

import { createSelectors } from './createSelectors.js'

const baseStore = create(
  persist(
    immer(storeImpl),
    {
      name: 'gembooth-ideahub-storage',
      partialize: (state) => ({
        activeModuleId: state.activeModuleId,
        activeChatId: state.activeChatId,
        theme: state.theme,
        accentTheme: state.accentTheme,
        orchestratorHistory: state.orchestratorHistory,
        orchestratorModel: state.orchestratorModel,
        workflowAutoTitleModel: state.workflowAutoTitleModel,
        orchestratorHasConversation: state.orchestratorHasConversation,
        orchestratorSavedSessions: state.orchestratorSavedSessions,
        assistantHistories: state.assistantHistories,
        archivaEntries: state.archivaEntries,
        empathyLab: state.empathyLab,
        connectedServices: state.connectedServices,
        serviceCredentials: state.serviceCredentials,
        imageProvider: state.imageProvider,
        imageModel: state.imageModel,
        selectedWorkflow: state.selectedWorkflow,
        rightColumnWidth: state.rightColumnWidth,
        leftColumnWidth: state.leftColumnWidth,
        settings: state.settings,
        firstVisit: state.firstVisit,
        plannerGraph: state.plannerGraph,
        customWorkflows: state.customWorkflows,
        showKnowledgeSection: state.showKnowledgeSection,
      }),
    }
  )
)

// Keep auto-zustand-selectors-hook for derived .use if present, then restore per-key .use sugar
const useStore = createSelectors(createSelectorFunctions(baseStore))

export default useStore
export const storeApi = useStore
export { baseStore }
