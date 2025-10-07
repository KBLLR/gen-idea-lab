/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import 'immer'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import { createSelectorFunctions } from 'auto-zustand-selectors-hook'

import { modules } from './modules'
import { getResourceManager } from './services/ResourceManager.js'
import { DEFAULT_IMAGE_MODELS, ALWAYS_AVAILABLE_IMAGE_PROVIDERS } from './imageProviders.js'
import tasksSlice from './tasksSlice.js'

import { createAuthSlice } from '../../apps/shared/state/authSlice.js'
import { createServiceConnectionSlice } from '../../apps/shared/state/serviceConnectionSlice.js'
import { createAppSwitchingSlice } from '../../apps/shared/state/appSwitchingSlice.js'

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

  didInit: false,
  isWelcomeScreenOpen: true,
  isSettingsOpen: false,
  isSystemInfoOpen: false,
  isLiveVoiceChatOpen: false,
  theme: 'dark',
  accentTheme: 'azure',

  // Glass Dock state
  dockPosition: { x: 20, y: typeof window !== 'undefined' ? (window.innerHeight - 100) : 20 },
  dockDimensions: { width: 0, height: 0 },
  dockMode: 'chat', // 'chat' | 'node'
  activeNodeId: null,
  currentNodeConfig: null,

  // Glass Dock setters (top-level so components can access directly or via actions proxy)
  setDockPosition: (pos) => set((state) => { state.dockPosition = pos }),
  setDockDimensions: (dims) => set((state) => { state.dockDimensions = dims }),

  // Module state (Idea Lab)
  modules: modules,
  activeModuleId: null,

  // Assistant state
  isAssistantLoading: false,
  assistantHistories: {},
  showModuleChat: false,

  // Orchestrator Chat State
  isOrchestratorOpen: false,
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

  // Workflow State
  workflowHistory: {},
  activeWorkflow: null,
  workflowStep: 0,
  selectedWorkflow: null,

  // Layout
  rightColumnWidth: 520,
  leftColumnWidth: 280,

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

  // Resource Management State
  resourceManager: getResourceManager(),
  loadedResourceIds: new Set(),
  moduleKnowledgeCache: {},
  showKnowledgeSection: false,
  showGallery: false,

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

    // App switching
    setActiveApp: (...args) => get().setActiveApp(...args),

    // Local UI actions
    setIsOrchestratorOpen: (open) => set((state) => {
      state.isOrchestratorOpen = open
      if (open) state.activeApp = 'ideaLab'
    }),
    setIsSystemInfoOpen: (open) => set((state) => { state.isSystemInfoOpen = open }),
    setRightColumnWidth: (w) => set((state) => { state.rightColumnWidth = w }),
    setLeftColumnWidth: (w) => set((state) => { state.leftColumnWidth = w }),
    setIsLiveVoiceChatOpen: (open) => set((state) => { state.isLiveVoiceChatOpen = open }),

    // Knowledge pane
    toggleKnowledgeSection: (...args) => get().toggleKnowledgeSection(...args),
    setShowKnowledgeSection: (...args) => get().setShowKnowledgeSection(...args),

    // Glass Dock
    setDockPosition: (...args) => get().setDockPosition(...args),
    setDockDimensions: (...args) => get().setDockDimensions(...args),
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
