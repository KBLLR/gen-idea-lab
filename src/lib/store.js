

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

const store = immer((set, get) => ({
  didInit: false,
  isWelcomeScreenOpen: true,
  isSettingsOpen: false,
  theme: 'dark',

  // Authentication state
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,

  // Service connections state
  connectedServices: {},
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
  assistantHistories: {},

  // Orchestrator Chat State
  isOrchestratorLoading: false,
  orchestratorModel: 'gemini-2.0-flash-exp', // Default orchestrator model
  workflowAutoTitleModel: 'gemma3:4b-it-qat', // Default model for workflow auto-titling
  orchestratorHistory: [
    {
      role: 'model',
      parts: [{ text: "I am the Orchestrator. How can we start building your next project? You can select a module on the left and I can invite its agent to help us." }]
    }
  ],

  // Floating Orchestrator State
  isFloatingOrchestratorOpen: false,
  floatingOrchestratorPosition: { x: 20, y: 20 },
  orchestratorHasConversation: false, // Track if user has started chatting

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

  // Archiva State
  archivaEntries: {}, // Store entries by ID
  activeEntryId: null,
  
  // Orchestrator Saved Sessions
  orchestratorSavedSessions: [], // Array of { id, title, createdAt, model, history }
  
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
      state.connectedServices = services;
    }),

    updateServiceConnection: (serviceId, connectionInfo) => set((state) => {
      state.connectedServices[serviceId] = connectionInfo;
    }),

    removeServiceConnection: (serviceId) => set((state) => {
      delete state.connectedServices[serviceId];
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
          throw new Error(error.error || 'Failed to connect service');
        }

        const result = await response.json();

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
        }

        return result;
      } catch (error) {
        console.error(`Failed to connect ${serviceId}:`, error);
        throw error;
      }
    },

    disconnectService: async (serviceId) => {
      try {
        const response = await fetch(`/api/services/${serviceId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to disconnect service');
        }

        // Update local state
        set((state) => {
          delete state.connectedServices[serviceId];
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
          set((state) => {
            state.connectedServices = services;
          });
        }
      } catch (error) {
        console.error('Failed to fetch connected services:', error);
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

        return await response.json();
      } catch (error) {
        console.error(`Failed to test ${serviceId} connection:`, error);
        throw error;
      }
    },

    // UI Actions
    setIsSettingsOpen: (open) => set((state) => {
      state.isSettingsOpen = open;
    }),

    setActiveApp: (app) => set((state) => {
      state.activeApp = app;
    }),

    setTheme: (theme) => set((state) => {
      state.theme = theme;
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

    // Floating Orchestrator actions
    toggleFloatingOrchestrator: () => set((state) => {
      state.isFloatingOrchestratorOpen = !state.isFloatingOrchestratorOpen;
    }),

    setFloatingOrchestratorPosition: (position) => set((state) => {
      state.floatingOrchestratorPosition = position;
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
        orchestratorHistory: state.orchestratorHistory,
        orchestratorModel: state.orchestratorModel,
        workflowAutoTitleModel: state.workflowAutoTitleModel,
        orchestratorHasConversation: state.orchestratorHasConversation,
        orchestratorSavedSessions: state.orchestratorSavedSessions,
        floatingOrchestratorPosition: state.floatingOrchestratorPosition,
        assistantHistories: state.assistantHistories,
        archivaEntries: state.archivaEntries,
        connectedServices: state.connectedServices,
        serviceCredentials: state.serviceCredentials,
        selectedWorkflow: state.selectedWorkflow,
        rightColumnWidth: state.rightColumnWidth,
        leftColumnWidth: state.leftColumnWidth,
        plannerGraph: state.plannerGraph,
        customWorkflows: state.customWorkflows,
        // Don't persist authentication state for security
      })
    })
  )
)
