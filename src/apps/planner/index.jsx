import React, { useEffect } from 'react';
import useStore from '@store';
import PlannerSidebar from './components/PlannerSidebar.jsx';
import PlannerCanvas from './components/PlannerCanvas.jsx';
import { useLeftPane, useRightPane } from '@shared/lib/layoutSlots';
import { Panel } from '@ui';

export default function PlannerApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();
  const { setRightPane, clearRightPane } = useRightPane();

  useEffect(() => {
    setActiveApp('planner');
    setLeftPane(<PlannerSidebar />);
    // No third-pane welcome; canvas becomes the main area
    return () => { clearLeftPane(); clearRightPane(); };
  }, [setActiveApp]);

  return <PlannerCanvas />;
}
