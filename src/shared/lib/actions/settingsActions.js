/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../store';

const set = useStore.setState;

// Settings actions
export const openSettings = () => {
  set((state) => {
    state.ui = state.ui || {};
    state.ui.isSettingsOpen = true;
    state.isSettingsOpen = true; // legacy sync
  });
};

export const closeSettings = () => {
  set((state) => {
    state.ui = state.ui || {};
    state.ui.isSettingsOpen = false;
    state.isSettingsOpen = false; // legacy sync
  });
};

export const toggleSettings = () => {
  set((state) => {
    state.ui = state.ui || {};
    const next = !state.ui.isSettingsOpen;
    state.ui.isSettingsOpen = next;
    state.isSettingsOpen = next; // legacy sync
  });
};
