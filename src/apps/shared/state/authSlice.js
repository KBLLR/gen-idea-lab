/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const createAuthSlice = (set, get) => ({
  // Authentication state
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,

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
});
