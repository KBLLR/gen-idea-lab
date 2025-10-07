
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '@store';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAppPath } from '@routes';

const apps = [
  { id: 'ideaLab', title: 'Academic Mods' },
  { id: 'chat', title: 'Chat' },
  { id: 'imageBooth', title: 'VizGen Booth' },
  { id: 'archiva', title: 'ArchivAI' },
  { id: 'workflows', title: 'Workflows' },
  { id: 'planner', title: 'PlannerAI' },
  { id: 'calendarAI', title: 'CalendarAI' },
  { id: 'empathyLab', title: 'EmpathyLab' },
  { id: 'gestureLab', title: 'GestureLab' },
];

export default function AppSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeApp = useStore.use.activeApp();
  const setActiveApp = useStore.use.actions().setActiveApp;

  const currentIndex = Math.max(0, apps.findIndex(app => app.id === activeApp));

  const go = (direction) => {
    const nextIndex = direction === 'next'
      ? (currentIndex + 1) % apps.length
      : (currentIndex - 1 + apps.length) % apps.length;
    const next = apps[nextIndex];
    setActiveApp(next.id);
    navigate(getAppPath(next.id));
  };

  const title = apps[currentIndex]?.title || 'GenBooth';

  return (
    <div className="app-switcher">
      <button className="switch-btn icon" onClick={() => go('prev')} title="Previous App">
        chevron_left
      </button>
      <h1 className="app-title">{title}</h1>
      <button className="switch-btn icon" onClick={() => go('next')} title="Next App">
        chevron_right
      </button>
    </div>
  );
}
