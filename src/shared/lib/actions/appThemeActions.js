/**
 * @file appThemeActions - Theme switching actions
 * @license SPDX-License-Identifier: Apache-2.0
 */
import useStore from '../store';

const set = useStore.setState;

/**
 * Toggle between light and dark theme
 * @returns {void}
 */
export const toggleTheme = () => {
  set(state => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
  });
};
