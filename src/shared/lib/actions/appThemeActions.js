/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../store';

const set = useStore.setState;

// --- App Theme Actions ---
export const toggleTheme = () => {
  set(state => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
  });
};
