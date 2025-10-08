import React, { useEffect } from 'react';
import useStore from '@store';
import CalendarAI from './components/CalendarAI.jsx';
import CalendarAISidebar from './components/CalendarAISidebar.jsx';
import CalendarRightPane from './components/CalendarRightPane.jsx';
import { useLeftPane, useRightPane } from '@shared/lib/layoutSlots';

export default function CalendarAIApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();
  const { setRightPane, clearRightPane } = useRightPane();

  useEffect(() => {
    setActiveApp('calendarAI');
    setLeftPane(<CalendarAISidebar />);
    // Do NOT set right pane by default. Users can toggle it from header actions.
    return () => { clearLeftPane(); clearRightPane(); };
  }, [setActiveApp]);

  return <CalendarAI />;
}
