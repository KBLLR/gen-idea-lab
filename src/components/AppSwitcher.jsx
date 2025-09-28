
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../lib/store';
import { switchApp } from '../lib/actions';

const apps = [
  { id: 'ideaLab', title: 'Gen Project Idea Lab' },
  { id: 'imageBooth', title: 'Gen Image Booth' },
  { id: 'archiva', title: 'ArchivaAI' },
];

export default function AppSwitcher() {
  const activeApp = useStore.use.activeApp();
  const currentIndex = apps.findIndex(app => app.id === activeApp);

  return (
    <div className="app-switcher">
      <button className="switch-btn icon" onClick={() => switchApp('prev')} title="Previous App">
        chevron_left
      </button>
      <h1 className="app-title">{apps[currentIndex].title}</h1>
      <button className="switch-btn icon" onClick={() => switchApp('next')} title="Next App">
        chevron_right
      </button>
    </div>
  );
}
