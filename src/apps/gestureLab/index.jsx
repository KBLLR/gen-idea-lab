import React, { useEffect } from 'react';
import useStore from '@store';
import GestureLab from './components/GestureLab.jsx';
import GestureLabSidebar from './components/GestureLabSidebar.jsx';
import { useLeftPane } from '@shared/lib/layoutSlots';

export default function GestureLabApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();

  useEffect(() => {
    setActiveApp('gestureLab');
    setLeftPane(<GestureLabSidebar />);
    return () => clearLeftPane();
  }, [setActiveApp]);

  return <GestureLab />;
}
