

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
import { personalities } from './assistant/personalities'
import { getResourceManager } from './services/ResourceManager.js'
import { DEFAULT_IMAGE_MODELS, ALWAYS_AVAILABLE_IMAGE_PROVIDERS } from './imageProviders.js'

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

const store = immer((set, get) => ({
  didInit: false,
  isWelcomeScreenOpen: true,
  isSettingsOpen: false,
  isSystemInfoOpen: false,
  isLiveVoiceChatOpen: false,
  theme: 'dark',
  accentTheme: 'azure',

  // Glass Dock state
  dockPosition: { x: 20, y: window.innerHeight - 100 },
  dockDimensions: { width: 0, height: 0 },
  dockMode: 'chat', // 'chat' | 'node'
  activeNodeId: null,
  currentNodeConfig: null,

  // Authentication state
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,

  // Service connections state
  // connectedServices[serviceId] shape:
  // { connected: boolean, status: 'connected'|'disconnected'|'connecting'|'error', info?: any, lastChecked?: string, error?: string }
  connectedServices: {},
  // Service configuration readiness (env vars on server)
  serviceConfig: {},
  // Service credentials (stored separately from connection status)
  serviceCredentials: {},

  // App switcher state
  activeApp: 'ideaLab', // 'ideaLab', 'imageBooth', 'archiva', 'planner' or 'workflows'

  // Module state (Idea Lab)
  modules: modules,
  activeModuleId: null,

  // Assistant state (for individual module floating chat)
  isAssistantOpen: false,
  isAssistantLoading: false,
  assistantHistories: {}, // Keep lightweight for now, migrate gradually
  showModuleChat: false, // Control visibility of third column module agents chat

  // Orchestrator Chat State
  isOrchestratorOpen: false,
  isOrchestratorLoading: false,
  orchestratorModel: 'gemini-2.0-flash-exp', // Default orchestrator model
  workflowAutoTitleModel: 'gemma3:4b-it-qat', // Default model for workflow auto-titling
  orchestratorHistory: [
    {
      role: 'model',
      parts: [{ text: "I am the Orchestrator. How can we start building your next project? You can select a module on the left and I can invite its agent to help us." }]
    }
  ],

  orchestratorHasConversation: false, // Track if user has started chatting

  // Orchestrator Narration (for workflow execution commentary)
  orchestratorNarration: '', // Current narration message
  orchestratorNarrationHistory: [], // Array of narration messages

  // Workflow State
  workflowHistory: {}, // Track completed and in-progress workflows
  activeWorkflow: null, // Currently running workflow
  workflowStep: 0, // Current step in active workflow
  selectedWorkflow: null, // Currently selected workflow for editing

  // Planner State
  plannerGraph: { nodes: [], edges: [] },
  customWorkflows: {},

  // Layout
  rightColumnWidth: 520, // px, default width for right column in three-column layout
  leftColumnWidth: 280, // px, default width for left column

  // Image Booth state
  activeModeKey: 'banana',
  inputImage: null,
  outputImage: null,
  isGenerating: false,
  generationError: null,
  imageProvider: 'gemini',
  imageModel: DEFAULT_IMAGE_MODELS.gemini,

  // Archiva State
  archivaEntries: {}, // Store entries by ID
  activeEntryId: null,
  selectedTemplateForPreview: null, // For ArchivAI template preview

  // EmpathyLab State
  empathyLab: {
    consent: {
      faceDetection: false,
      emotionAnalysis: false,
      bodyTracking: false,
      handTracking: false,
      gazeTracking: false,
      dataExport: false
    },
    selectedHumeConfigId: null,
    isModelLoaded: false,
    overlays: {
      // General toggles
      drawBoxes: true,
      drawPoints: true,
      drawPolygons: true,
      drawLabels: true,
      // Face-specific
      drawFaceMesh: false,
      drawIris: false,
      drawGaze: true,
      drawAttention: false,
      // Body-specific
      drawBodySkeleton: true,
      drawBodyPoints: true,
      // Hand-specific
      drawHandSkeleton: true,
      drawHandPoints: true,
      // Advanced overlays
      showGazeOverlay: false,
      showEmotionFusion: true
    }
  },

  // Assistant Chat Settings
  assistantModel: 'gemini-2.5-flash',
  assistantSystemPrompts: {}, // per-module override: { [moduleId]: string }
  moduleAssistantSavedChats: {}, // { [moduleId]: Array<{ id, title, createdAt, model, messages }> }

  // GestureLab State
  gestureLab: {
    mode: 'whiteboard', // 'whiteboard' | '3d'
    examples: {
      Whiteboard: true,
      '3D Navigation': false,
      'UI Control': false,
    }
  },

  // Orchestrator Saved Sessions
  orchestratorSavedSessions: [], // Array of { id, title, createdAt, model, history }

  // Resource Management State (for scalable knowledge base)
  resourceManager: getResourceManager(),
  loadedResourceIds: new Set(), // Track what resources are currently loaded in UI
  moduleKnowledgeCache: {}, // Lightweight cache for module knowledge indexes
  showKnowledgeSection: false, // Toggle for knowledge section visibility
  
  // Actions
  actions: {
    // Authentication actions
    setUser: (user) => set((state) => {
      state.user = user;
      state.isAuthenticated = !!user;
      state.isCheckingAuth = false;
    }),

    logout: () => set((state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isCheckingAuth = false;
    }),

    setCheckingAuth: (checking) => set((state) => {
      state.isCheckingAuth = checking;
    }),

    // Service management actions
    setConnectedServices: (services) => set((state) => {
      const now = new Date().toISOString();
      const next = {};
      for (const [id, data] of Object.entries(services || {})) {
        next[id] = {
          connected: !!data?.connected,
          status: data?.connected ? 'connected' : 'disconnected',
          info: data?.info || null,
          lastChecked: now,
          error: null,
        };
      }
      state.connectedServices = next;
      syncImageProviderState(state);
    }),

    updateServiceConnection: (serviceId, connectionInfo) => set((state) => {
      state.connectedServices[serviceId] = {
        ...(state.connectedServices[serviceId] || {}),
        ...connectionInfo,
      };
      syncImageProviderState(state);
    }),

    removeServiceConnection: (serviceId) => set((state) => {
      delete state.connectedServices[serviceId];
      syncImageProviderState(state, { forceModelReset: true });
    }),

    // Store service credentials separately from connection status
    storeServiceCredentials: (serviceId, credentials) => set((state) => {
      state.serviceCredentials[serviceId] = {
        ...credentials,
        storedAt: new Date().toISOString()
      };
    }),

    // Toggle service on/off using stored credentials
    toggleService: async (serviceId, enabled) => {
      const credentials = get().serviceCredentials[serviceId];
      if (!credentials) {
        throw new Error('No stored credentials found for this service');
      }

      try {
        if (enabled) {
          // Re-enable service using stored credentials
          const response = await fetch(`/api/services/${serviceId}/connect`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to enable service');
          }

          const result = await response.json();

          if (result.authUrl) {
            window.location.href = result.authUrl;
            return;
          }

          if (result.success) {
            set((state) => {
              state.connectedServices[serviceId] = {
                connected: true,
                info: result.info || { name: serviceId }
              };
              syncImageProviderState(state);
            });
          }
        } else {
          // Disable service (but keep credentials)
          const response = await fetch(`/api/services/${serviceId}`, {
            method: 'DELETE',
            credentials: 'include'
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to disable service');
          }

          set((state) => {
            state.connectedServices[serviceId] = {
              connected: false,
              info: null
            };
            syncImageProviderState(state, { forceModelReset: true });
          });
        }
      } catch (error) {
        console.error(`Failed to toggle ${serviceId}:`, error);
        throw error;
      }
    },

    // Service connection API calls
    connectService: async (serviceId, credentials) => {
      try {
        // mark as connecting for optimistic UI
        set((state) => {
          state.connectedServices[serviceId] = {
            ...(state.connectedServices[serviceId] || {}),
            status: 'connecting',
            error: null,
          };
        });
        const response = await fetch(`/api/services/${serviceId}/connect`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials)
        });

        if (!response.ok) {
          let errorMessage = `Failed to connect service (${response.status})`;
          try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } catch (e) {
            // Response body might be empty or not JSON
            const text = await response.text().catch(() => '');
            if (text) errorMessage = text;
          }
          set((state) => {
            state.connectedServices[serviceId] = {
              ...(state.connectedServices[serviceId] || {}),
              status: 'error',
              error: errorMessage,
            };
          });
          throw new Error(errorMessage);
        }

        let result;
        try {
          result = await response.json();
        } catch (e) {
          // Empty or invalid JSON response
          result = { success: false, error: 'Invalid response from service' };
        }

        // For OAuth services, redirect to auth URL
        if (result.authUrl) {
          window.location.href = result.authUrl;
          return;
        }

        // For API key/URL services, update the connection immediately
        if (result.success) {
          // Store credentials for future use
          get().actions.storeServiceCredentials(serviceId, credentials);
          // Refresh connected services
          await get().actions.fetchConnectedServices();
          set((state) => {
            state.connectedServices[serviceId] = {
              ...(state.connectedServices[serviceId] || {}),
              status: 'connected',
              error: null,
            };
          });
        }

        return result;
      } catch (error) {
        console.error(`Failed to connect ${serviceId}:`, error);
        set((state) => {
          state.connectedServices[serviceId] = {
            ...(state.connectedServices[serviceId] || {}),
            status: 'error',
            error: error.message,
          };
        });
        throw error;
      }
    },

    disconnectService: async (serviceId) => {
      try {
        set((state) => {
          state.connectedServices[serviceId] = {
            ...(state.connectedServices[serviceId] || {}),
            status: 'connecting',
            error: null,
          };
        });
        const response = await fetch(`/api/services/${serviceId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json();
          set((state) => {
            state.connectedServices[serviceId] = {
              ...(state.connectedServices[serviceId] || {}),
              status: 'error',
              error: error.error || 'Failed to disconnect service',
            };
          });
          throw new Error(error.error || 'Failed to disconnect service');
        }

        // Update local state
        set((state) => {
          state.connectedServices[serviceId] = {
            connected: false,
            status: 'disconnected',
            info: null,
            lastChecked: new Date().toISOString(),
            error: null,
          };
        });

        return await response.json();
      } catch (error) {
        console.error(`Failed to disconnect ${serviceId}:`, error);
        throw error;
      }
    },

    fetchConnectedServices: async () => {
      try {
        const response = await fetch('/api/services', {
          credentials: 'include'
        });

        if (response.ok) {
          const services = await response.json();
          const now = new Date().toISOString();
          set((state) => {
            for (const [id, data] of Object.entries(services || {})) {
              state.connectedServices[id] = {
                connected: !!data?.connected,
                status: data?.connected ? 'connected' : 'disconnected',
                info: data?.info || null,
                lastChecked: now,
                error: null,
              };
            }
            syncImageProviderState(state);
          });
        }
      } catch (error) {
        console.error('Failed to fetch connected services:', error);
      }
    },

    fetchServiceConfig: async () => {
      try {
        const response = await fetch('/api/services/config', {
          credentials: 'include'
        });
        if (response.ok) {
          const config = await response.json();
          set((state) => {
            state.serviceConfig = config || {};
          });
        }
      } catch (error) {
        console.error('Failed to fetch service configuration:', error);
      }
    },

    testServiceConnection: async (serviceId) => {
      try {
        const response = await fetch(`/api/services/${serviceId}/test`, {
          method: 'POST',
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Connection test failed');
        }

        const result = await response.json();
        set((state) => {
          state.connectedServices[serviceId] = {
            ...(state.connectedServices[serviceId] || {}),
            status: 'connected',
            info: {
              ...(state.connectedServices[serviceId]?.info || {}),
              ...(result.info || {}),
            },
            lastChecked: new Date().toISOString(),
            error: null,
          };
        });
        return result;
      } catch (error) {
        console.error(`Failed to test ${serviceId} connection:`, error);
        set((state) => {
          state.connectedServices[serviceId] = {
            ...(state.connectedServices[serviceId] || {}),
            status: 'error',
            error: error.message,
            lastChecked: new Date().toISOString(),
          };
        });
        throw error;
      }
    },

    // UI Actions
    setIsOrchestratorOpen: (open) => set((state) => {
      state.isOrchestratorOpen = open;

      if (open) {
        // Ensure the main module agents chat is visible when opened from global UI controls
        state.activeApp = 'ideaLab';
      }
    }),

    // GestureLab actions
    setGestureLabMode: (mode) => set((state) => {
      state.gestureLab.mode = mode;
      // sync examples toggles
      const ex = state.gestureLab.examples;
      ex.Whiteboard = mode === 'whiteboard';
      ex['3D Navigation'] = mode === '3d';
      ex['UI Control'] = false;
    }),

    setGestureLabExample: (key, enabled) => set((state) => {
      // Only one example active at a time
      Object.keys(state.gestureLab.examples).forEach(k => state.gestureLab.examples[k] = false);
      state.gestureLab.examples[key] = !!enabled;
      // map example to mode
      if (key === 'Whiteboard' && enabled) state.gestureLab.mode = 'whiteboard';
      if (key === '3D Navigation' && enabled) state.gestureLab.mode = '3d';
      if (key === 'UI Control' && enabled) state.gestureLab.mode = 'ui';
    }),

    setOrchestratorNarration: (message) => set((state) => {
      state.orchestratorNarration = message;
      if (message) {
        state.orchestratorNarrationHistory.push({
          message,
          timestamp: Date.now()
        });
        // Keep only last 50 messages
        if (state.orchestratorNarrationHistory.length > 50) {
          state.orchestratorNarrationHistory = state.orchestratorNarrationHistory.slice(-50);
        }
      }
    }),

    clearOrchestratorNarration: () => set((state) => {
      state.orchestratorNarration = '';
      state.orchestratorNarrationHistory = [];
    }),

    setIsSettingsOpen: (open) => set((state) => {
      state.isSettingsOpen = open;
    }),

    // Assistant settings
    setAssistantModel: (model) => set((state) => { state.assistantModel = model || 'gemini-2.5-flash'; }),
    setAssistantSystemPrompt: (moduleId, text) => set((state) => {
      if (!moduleId) return;
      state.assistantSystemPrompts[moduleId] = text || '';
    }),

    saveAssistantChat: (title) => set((state) => {
      const moduleId = state.activeModuleId;
      if (!moduleId) return;
      const history = state.assistantHistories[moduleId] || [];
      if (!state.moduleAssistantSavedChats[moduleId]) state.moduleAssistantSavedChats[moduleId] = [];
      state.moduleAssistantSavedChats[moduleId].push({
        id: String(Date.now()),
        title: title || `Chat ${new Date().toLocaleString()}`,
        createdAt: new Date().toISOString(),
        model: state.assistantModel,
        messages: [...history]
      });
    }),

    setIsSystemInfoOpen: (open) => set((state) => {
      state.isSystemInfoOpen = open;
    }),

    setIsLiveVoiceChatOpen: (open) => set((state) => {
      state.isLiveVoiceChatOpen = open;
    }),

    setDockPosition: (position) => set((state) => {
      state.dockPosition = position;
    }),

    setDockDimensions: (dimensions) => set((state) => {
      state.dockDimensions = dimensions;
    }),

    // Dock mode actions
    setDockMode: (mode) => set((state) => {
      state.dockMode = mode;
    }),

    setActiveNodeId: (id) => set((state) => {
      state.activeNodeId = id;
    }),

    setCurrentNodeConfig: (config) => set((state) => {
      state.currentNodeConfig = config;
    }),

    becomePlannerNode: (config) => {
      // If editing existing node, use the provided nodeId, otherwise create new one
      const nodeId = config.nodeId || `ai-agent-${Date.now()}`;
      const isNewNode = !config.nodeId;

      set((state) => {
        state.dockMode = 'node';
        state.activeNodeId = nodeId;
        state.currentNodeConfig = config;
        state.activeApp = 'planner'; // Switch to planner app

        // Add node to planner graph if it's a new node
        if (isNewNode) {
          // Ensure plannerGraph exists
          if (!state.plannerGraph) {
            state.plannerGraph = { nodes: [], edges: [], title: '' };
          }

          // Calculate position - center of visible area or offset from existing nodes
          const existingNodes = state.plannerGraph.nodes || [];
          let xPos = 100;
          let yPos = 100;

          // If there are existing nodes, offset from the last one
          if (existingNodes.length > 0) {
            const lastNode = existingNodes[existingNodes.length - 1];
            xPos = (lastNode.position?.x || 100) + 250;
            yPos = lastNode.position?.y || 100;
          }

          // Create the new AI agent node
          const newNode = {
            id: nodeId,
            type: 'ai-agent',
            position: { x: xPos, y: yPos },
            data: {
              nodeName: config.nodeName || 'AI Agent',
              inputs: config.inputs || [],
              outputs: config.outputs || [],
              settings: config.settings || {},
              state: 'idle', // idle | processing | complete | error
              result: null,
              error: null,
            },
          };

          // Use immer's push directly on state
          state.plannerGraph.nodes.push(newNode);
        }
      });

      return nodeId;
    },

    returnToChat: () => set((state) => {
      state.dockMode = 'chat';
      state.activeNodeId = null;
      state.currentNodeConfig = null;
    }),

    setImageProvider: (provider) => set((state) => {
      state.imageProvider = provider || 'gemini';
      state.imageModel = DEFAULT_IMAGE_MODELS[state.imageProvider] ?? null;
    }),

    setImageModel: (model) => set((state) => {
      const next = (model ?? '').trim();
      state.imageModel = next || null;
      if (!next) {
        state.imageModel = DEFAULT_IMAGE_MODELS[state.imageProvider] ?? null;
      }
    }),

    setActiveApp: (app) => set((state) => {
      state.activeApp = app;
    }),

    setTheme: (theme) => set((state) => {
      state.theme = theme;
    }),

    setAccentTheme: (name) => set((state) => {
      state.accentTheme = name || 'azure';
      try {
        const apply = (accent) => {
          const id = 'accent-theme-style';
          let tag = document.getElementById(id);
          if (!tag) {
            tag = document.createElement('style');
            tag.id = id;
            document.head.appendChild(tag);
          }
          const css = `:root{--text-accent:${accent.dark};--border-accent:${accent.dark};--bg-button-primary:${accent.dark}} [data-theme="light"]{--text-accent:${accent.light};--border-accent:${accent.light};--bg-button-primary:${accent.light}}`;
          tag.textContent = css;
        };

        const ACCENTS = {
          azure:   { dark: '#1e88e5', light: '#1e88e5' },
          emerald: { dark: '#10b981', light: '#059669' },
          amber:   { dark: '#f59e0b', light: '#d97706' },
          violet:  { dark: '#8b5cf6', light: '#7c3aed' },
          rose:    { dark: '#ef4444', light: '#dc2626' },
          teal:    { dark: '#14b8a6', light: '#0d9488' },
          indigo:  { dark: '#6366f1', light: '#4f46e5' },
          magenta: { dark: '#d946ef', light: '#c026d3' },
          cyan:    { dark: '#06b6d4', light: '#0891b2' },
          lime:    { dark: '#84cc16', light: '#65a30d' },
        };

        const sel = ACCENTS[state.accentTheme] || ACCENTS.azure;
        apply(sel);
      } catch (e) {
        // ignore if document is not available (SSR or tests)
      }
    }),

    // Workflow actions
    setSelectedWorkflow: (workflow) => set((state) => {
      state.selectedWorkflow = workflow;
    }),

    // Planner actions
    setPlannerGraph: (graph) => set((state) => {
      state.plannerGraph = graph || { nodes: [], edges: [] };
    }),

    addCustomWorkflow: (wf) => set((state) => {
      if (!wf || !wf.id) return;
      state.customWorkflows[wf.id] = wf;
    }),

    deleteCustomWorkflow: (id) => set((state) => {
      delete state.customWorkflows[id];
    }),

    // Layout actions
    setRightColumnWidth: (width) => set((state) => {
      state.rightColumnWidth = width;
    }),

    setLeftColumnWidth: (width) => set((state) => {
      state.leftColumnWidth = width;
    }),

    setOrchestratorModel: (model) => set((state) => {
      state.orchestratorModel = model;
    }),

    setWorkflowAutoTitleModel: (model) => set((state) => {
      state.workflowAutoTitleModel = model;
    }),

    setOrchestratorHasConversation: (hasConversation) => set((state) => {
      state.orchestratorHasConversation = hasConversation;
    }),

    clearOrchestratorHistory: () => set((state) => {
      state.orchestratorHistory = [
        {
          role: 'model',
          parts: [{ text: "I am the Orchestrator. How can we start building your next project? You can select a module on the left and I can invite its agent to help us." }]
        }
      ];
      state.orchestratorHasConversation = false;
    }),

    // Resource Management Actions
    toggleKnowledgeSection: () => set((state) => {
      state.showKnowledgeSection = !state.showKnowledgeSection;
    }),

    setShowKnowledgeSection: (show) => set((state) => {
      state.showKnowledgeSection = show;
    }),

    // Module lifecycle - preload and cleanup resources
    setActiveModuleId: (moduleId) => set((state) => {
      // Cleanup previous module resources
      if (state.activeModuleId && state.activeModuleId !== moduleId) {
        state.resourceManager.evictModuleResources(state.activeModuleId);
        state.loadedResourceIds.clear();
      }

      state.activeModuleId = moduleId;

      // Preload resources for new module in background
      if (moduleId) {
        state.resourceManager.preloadRecentResources(moduleId).catch(error => {
          console.warn('Failed to preload resources:', error);
        });
      }
    }),

    // Add documentation entry to knowledge base
    addDocumentationEntry: async (moduleId, entry) => {
      try {
        const response = await fetch(`/api/modules/${moduleId}/resources/documentation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
          credentials: 'include'
        });

        if (response.ok) {
          // Invalidate cache to force refresh
          const indexKey = `index:${moduleId}:documentation`;
          get().resourceManager.indexes.delete(indexKey);
        }

        return response.ok;
      } catch (error) {
        console.error('Failed to add documentation entry:', error);
        return false;
      }
    },

    // Add workflow entry to knowledge base
    addWorkflowEntry: async (moduleId, workflow) => {
      try {
        const response = await fetch(`/api/modules/${moduleId}/resources/workflows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workflow),
          credentials: 'include'
        });

        if (response.ok) {
          // Invalidate cache to force refresh
          const indexKey = `index:${moduleId}:workflows`;
          get().resourceManager.indexes.delete(indexKey);
        }

        return response.ok;
      } catch (error) {
        console.error('Failed to add workflow entry:', error);
        return false;
      }
    },

    // Add chat session to knowledge base
    addChatEntry: async (moduleId, chatSession) => {
      try {
        const response = await fetch(`/api/modules/${moduleId}/resources/chats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chatSession),
          credentials: 'include'
        });

        if (response.ok) {
          // Invalidate cache to force refresh
          const indexKey = `index:${moduleId}:chats`;
          get().resourceManager.indexes.delete(indexKey);
        }

        return response.ok;
      } catch (error) {
        console.error('Failed to add chat entry:', error);
        return false;
      }
    },

    // Get memory statistics for debugging/monitoring
    getResourceManagerStats: () => {
      return get().resourceManager.getMemoryStats();
    },

    // Force cleanup of resource manager (for debugging or memory pressure)
    cleanupResourceManager: () => {
      get().resourceManager.cleanup();
      set((state) => {
        state.loadedResourceIds.clear();
        state.moduleKnowledgeCache = {};
      });
    },

    // EmpathyLab Actions
    setEmpathyLabConsent: (consentKey, value) => set((state) => {
      state.empathyLab.consent[consentKey] = value;
    }),

    setEmpathyLabConsentAll: (consent) => set((state) => {
      state.empathyLab.consent = consent;
    }),

    setEmpathyLabHumeConfig: (configId) => set((state) => {
      state.empathyLab.selectedHumeConfigId = configId;
    }),

    setEmpathyLabModelLoaded: (loaded) => set((state) => {
      state.empathyLab.isModelLoaded = loaded;
    }),

    setEmpathyLabOverlay: (overlayKey, value) => set((state) => {
      // Initialize overlays object if it doesn't exist (for users with old persisted state)
      if (!state.empathyLab.overlays) {
        state.empathyLab.overlays = {
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
          showEmotionFusion: true
        };
      }
      state.empathyLab.overlays[overlayKey] = value;
    })
  }
}));

export default createSelectorFunctions(
  create(
    persist(store, {
      name: 'gembooth-ideahub-storage',
      partialize: state => ({
        // Persist relevant state across sessions
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
        // Don't persist: resourceManager (recreated fresh), loadedResourceIds (Set), moduleKnowledgeCache (managed)
        // Don't persist authentication state for security
      })
    })
  )
)
