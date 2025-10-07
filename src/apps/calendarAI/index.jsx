import React, { useEffect } from 'react';
import useStore from '@store';
import CalendarAI from './components/CalendarAI.jsx';
import CalendarAISidebar from './components/CalendarAISidebar.jsx';
import { useLeftPane } from '@shared/lib/layoutSlots';

export default function CalendarAIApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();

  useEffect(() => {
    setActiveApp('calendarAI');
    setLeftPane(<CalendarAISidebar />);
    return () => clearLeftPane();
  }, [setActiveApp]);

  return <CalendarAI />;
}
