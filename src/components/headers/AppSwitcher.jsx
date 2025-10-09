
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '@store';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAppPath } from '@routes';
import { prefetchApp } from '@shared/lib/prefetch';
import { startTransition } from 'react';

const apps = [
  { id: 'ideaLab', title: 'Academic Mods' },
  { id: 'chat', title: 'Chat' },
  { id: 'mindmap', title: 'Mind Map' },
  { id: 'imageBooth', title: 'VizGen Booth' },
  { id: 'archiva', title: 'ArchivAI' },
  { id: 'workflows', title: 'Workflows' },
  { id: 'planner', title: 'PlannerAI' },
  { id: 'kanban', title: 'Kanban' },
  { id: 'calendarAI', title: 'CalendarAI' },
  { id: 'empathyLab', title: 'EmpathyLab' },
  { id: 'gestureLab', title: 'GestureLab' },
];

export default function AppSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeApp = useStore.use.activeApp();
  const actions = useStore.use.actions();

  const currentIndex = Math.max(0, apps.findIndex(app => app.id === activeApp));

  async function handleSwitch(to) {
    const from = useStore.getState().activeApp;
    actions.startAppSwitch(from, to);
    try {
      actions.logStep('prefetch bundle');
      prefetchApp(to);
      actions.logStep('warm services');
      // Placeholder for lightweight warmups
      startTransition(() => {
        actions.setActiveApp(to);
        navigate(getAppPath(to));
      });
      actions.logStep('rendering…');
      await new Promise(r => setTimeout(r, 300));
      actions.finishAppSwitch();
    } catch (e) {
      actions.failAppSwitch(e);
    }
  }

  const go = (direction) => {
    const nextIndex = direction === 'next'
      ? (currentIndex + 1) % apps.length
      : (currentIndex - 1 + apps.length) % apps.length;
    const next = apps[nextIndex];
    handleSwitch(next.id);
  };

  const title = apps[currentIndex]?.title || 'GenBooth';

  return (
    <div className="app-switcher">
      <button
        className="switch-btn icon"
        onClick={() => go('prev')}
        onMouseEnter={() => prefetchApp(apps[(currentIndex - 1 + apps.length) % apps.length].id)}
        onFocus={() => prefetchApp(apps[(currentIndex - 1 + apps.length) % apps.length].id)}
        title="Previous App"
      >
        chevron_left
      </button>
      <h1 className="app-title">{title}</h1>
      <button
        className="switch-btn icon"
        onClick={() => go('next')}
        onMouseEnter={() => prefetchApp(apps[(currentIndex + 1) % apps.length].id)}
        onFocus={() => prefetchApp(apps[(currentIndex + 1) % apps.length].id)}
        title="Next App"
      >
        chevron_right
      </button>
    </div>
  );
}
