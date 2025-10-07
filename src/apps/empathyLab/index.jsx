import React, { useEffect } from 'react';
import useStore from '@store';
import EmpathyLab from './components/EmpathyLab.jsx';
import EmpathyLabSidebar from './components/EmpathyLabSidebar.jsx';
import { useLeftPane } from '@shared/lib/layoutSlots';

export default function EmpathyLabApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();

  useEffect(() => {
    setActiveApp('empathyLab');
    setLeftPane(<EmpathyLabSidebar />);
    return () => clearLeftPane();
  }, [setActiveApp]);

  return <EmpathyLab />;
}
