import React, { useEffect } from 'react';
import useStore from '@store';
import BoothViewer from './components/BoothViewer.jsx';
import ModeSelector from './components/ModeSelector.jsx';

export default function ImageBoothApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;

  useEffect(() => {
    setActiveApp('imageBooth');
  }, [setActiveApp]);

  return (
    <>
      <ModeSelector />
      <BoothViewer />
    </>
  );
}