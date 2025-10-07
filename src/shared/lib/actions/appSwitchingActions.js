/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../store';

const set = useStore.setState;

// Order must match AppSwitcher for prev/next to align with displayed title
const apps = ['ideaLab', 'chat', 'imageBooth', 'archiva', 'workflows', 'planner', 'calendarAI', 'empathyLab', 'gestureLab'];

// --- App Switching Actions ---
export const switchApp = (direction) => {
  set(state => {
    const currentIndex = apps.indexOf(state.activeApp);
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % apps.length;
    } else {
      nextIndex = (currentIndex - 1 + apps.length) % apps.length;
    }

    const newApp = apps[nextIndex];
    state.activeApp = newApp;
  });
};
