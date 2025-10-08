import React, { useEffect } from 'react';
import useStore from '@store';
import BoothViewer from './components/BoothViewer.jsx';
import ModeSelector from './components/ModeSelector.jsx';
import { useLeftPane } from '@shared/lib/layoutSlots';

export default function ImageBoothApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();

  useEffect(() => {
    setActiveApp('imageBooth');
    setLeftPane(<ModeSelector />);
    return () => clearLeftPane();
  }, [setActiveApp, setLeftPane, clearLeftPane]);

  // Center content only; sidebar is provided via left pane slot
  return <BoothViewer />;
}
