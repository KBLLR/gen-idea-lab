/**
 * @file authSlice - Authentication state management
 * @license SPDX-License-Identifier: Apache-2.0
 */

/**
 * User object from authentication
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} email - User email address
 * @property {string} name - User display name
 * @property {string} [picture] - User profile picture URL
 * @property {string} [provider] - OAuth provider (e.g., 'google')
 */

/**
 * Authentication slice state
 * @typedef {Object} AuthSliceState
 * @property {User|null} user - Currently authenticated user, null if not logged in
 * @property {boolean} isAuthenticated - Whether user is authenticated
 * @property {boolean} isCheckingAuth - Whether auth status is being verified
 */

/**
 * Authentication slice actions
 * @typedef {Object} AuthSliceActions
 * @property {(user: User|null) => void} setUser - Set current user and update auth state
 * @property {() => void} logout - Clear user and reset auth state
 * @property {(checking: boolean) => void} setCheckingAuth - Set auth checking status
 */

/**
 * @typedef {AuthSliceState & AuthSliceActions} AuthSlice
 */

/**
 * Create auth slice for Zustand store
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 * @returns {AuthSlice} Auth slice state and actions
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
