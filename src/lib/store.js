

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import 'immer'
import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {persist} from 'zustand/middleware'
import {createSelectorFunctions} from 'auto-zustand-selectors-hook'
import { modules } from './modules'
import { personalities } from './assistant/personalities'

const store = immer((set) => ({
  didInit: false,
  isWelcomeScreenOpen: true,
  theme: 'dark',
  
  // App switcher state
  activeApp: 'ideaLab', // 'ideaLab', 'imageBooth', or 'archiva'

  // Module state (Idea Lab)
  modules: modules,
  activeModuleId: null,

  // Assistant state (for individual module floating chat)
  isAssistantOpen: false,
  isAssistantLoading: false,
  assistantHistories: {},

  // Orchestrator Chat State
  isOrchestratorLoading: false,
  orchestratorHistory: [
    {
      role: 'model',
      parts: [{ text: "I am the Orchestrator. How can we start building your next project? You can select a module on the left and I can invite its agent to help us." }]
    }
  ],

  // Image Booth state
  activeModeKey: 'banana',
  inputImage: null,
  outputImage: null,
  isGenerating: false,
  generationError: null,

  // Archiva State
  archivaEntries: {}, // Store entries by ID
  activeEntryId: null,
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
        assistantHistories: state.assistantHistories,
        archivaEntries: state.archivaEntries,
      })
    })
  )
)