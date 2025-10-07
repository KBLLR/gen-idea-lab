/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { modules } from '../../shared/lib/modules'; // Assuming modules is a shared resource

export const createIdeaLabSlice = (set, get) => ({
  // Module state (Idea Lab)
  modules: modules,
  activeModuleId: null,

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
});
