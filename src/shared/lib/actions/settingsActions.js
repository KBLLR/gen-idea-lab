/**
 * @file settingsActions - Settings modal control actions
 * @license SPDX-License-Identifier: Apache-2.0
 */
import useStore from '../store';

const set = useStore.setState;

/**
 * Open the settings modal
 * @returns {void}
 */
export const openSettings = () => {
  set((state) => {
    state.ui = state.ui || {};
    state.ui.isSettingsOpen = true;
    state.isSettingsOpen = true; // legacy sync
  });
};

/**
 * Close the settings modal
 * @returns {void}
 */
export const closeSettings = () => {
  set((state) => {
    state.ui = state.ui || {};
    state.ui.isSettingsOpen = false;
    state.isSettingsOpen = false; // legacy sync
  });
};

/**
 * Toggle settings modal open/closed
 * @returns {void}
 */
export const toggleSettings = () => {
  set((state) => {
    state.ui = state.ui || {};
    const next = !state.ui.isSettingsOpen;
    state.ui.isSettingsOpen = next;
    state.isSettingsOpen = next; // legacy sync
  });
};
