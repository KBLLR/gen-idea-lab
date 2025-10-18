/**
 * @file ideaLabActions - Idea Lab module and agent selection
 * @license SPDX-License-Identifier: Apache-2.0
 */
import useStore from '@store';
import { getAssistantResponse } from '@apps/ideaLab/lib/assistant.js';
import { personalities } from '@shared/lib/assistant/personalities.js';

const get = useStore.getState;
const set = useStore.setState;

/**
 * Resource type identifier
 * @typedef {string} ResourceType
 */

/**
 * Select or deselect an Idea Lab module/agent
 * @param {string} moduleId - Module identifier to select
 * @returns {void}
 */
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

/**
 * Update a module's resource URL
 * @param {string} moduleId - Module identifier
 * @param {ResourceType} resourceType - Type of resource to update
 * @param {string} url - New URL for the resource
 * @returns {void}
 */
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
