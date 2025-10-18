/**
 * @file appSwitchingSlice - App navigation state management
 * @license SPDX-License-Identifier: Apache-2.0
 */

/**
 * Available app identifiers
 * @typedef {'ideaLab'|'imageBooth'|'archiva'|'planner'|'workflows'|'calendarAI'|'empathyLab'|'gestureLab'|'kanban'|'home'} AppId
 */

/**
 * App switching slice state
 * @typedef {Object} AppSwitchingSliceState
 * @property {AppId} activeApp - Currently active app identifier
 */

/**
 * App switching slice actions
 * @typedef {Object} AppSwitchingSliceActions
 * @property {(app: AppId) => void} setActiveApp - Set the currently active app
 */

/**
 * @typedef {AppSwitchingSliceState & AppSwitchingSliceActions} AppSwitchingSlice
 */

/**
 * Create app switching slice for Zustand store
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 * @returns {AppSwitchingSlice} App switching slice state and actions
 */
export const createAppSwitchingSlice = (set, get) => ({
  // App switcher state
  activeApp: 'ideaLab', // 'ideaLab', 'imageBooth', 'archiva', 'planner' or 'workflows'

  // App switching actions
  setActiveApp: (app) => set((state) => {
    state.activeApp = app;
  }),
});
