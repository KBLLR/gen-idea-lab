/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '@store';
import { getAssistantResponse } from '@apps/ideaLab/lib/assistant.js';
import { personalities } from '@shared/lib/assistant/personalities.js';

const get = useStore.getState;
const set = useStore.setState;

// --- Idea Lab Actions (now primarily for selecting an agent) ---

export const selectModule = (moduleId) => {
  set(state => {
    // If the same module is clicked again, deselect it
    if (state.activeModuleId === moduleId) {
      state.activeModuleId = null;
    } else {
      state.activeModuleId = moduleId;
      // Initialize assistant history if it doesn't exist
      if (!state.assistantHistories[moduleId]) {
        const personality = personalities[moduleId];
        state.assistantHistories[moduleId] = [{ role: 'model', responseText: personality.initialMessage }];
      }
    }
  });
};

export const updateModuleResourceUrl = (moduleId, resourceType, url) => {
  set(state => {
    const module = state.modules[moduleId];
    if (module && module.resources) {
      const resource = module.resources.find(r => r.type === resourceType);
      if (resource) {
        resource.url = url;
      }
    }
  });
};
