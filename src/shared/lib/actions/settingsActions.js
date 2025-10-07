/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../store';

const set = useStore.setState;

// Settings actions
export const toggleSettings = () => {
  set(state => {
    state.isSettingsOpen = !state.isSettingsOpen;
  });
};
