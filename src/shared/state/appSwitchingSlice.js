/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const createAppSwitchingSlice = (set, get) => ({
  // App switcher state
  activeApp: 'ideaLab', // 'ideaLab', 'imageBooth', 'archiva', 'planner' or 'workflows'

  // App switching actions
  setActiveApp: (app) => set((state) => {
    state.activeApp = app;
  }),
});
