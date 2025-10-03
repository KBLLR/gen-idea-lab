
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../lib/store';
import { switchApp } from '../lib/actions';

const apps = [
  { id: 'ideaLab', title: 'Academic Mods' },
  { id: 'imageBooth', title: 'VizGen Booth' },
  { id: 'archiva', title: 'ArchivAI' },
  { id: 'workflows', title: 'Workflows' },
  { id: 'planner', title: 'PlannerAI' },
  { id: 'calendarAI', title: 'CalendarAI' },
  { id: 'empathyLab', title: 'EmpathyLab' },
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
