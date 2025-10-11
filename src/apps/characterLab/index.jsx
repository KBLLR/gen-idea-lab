import React, { useEffect, useState } from 'react';
import useStore from '@store';
import { useLeftPane, useRightPane } from '@shared/lib/layoutSlots';
import CharacterLabSidebar from './components/CharacterLabSidebar.jsx';
import CharacterLabCenter from './components/CharacterLab.jsx';
import ModelGallery from './components/ModelGallery.jsx';
import './styles/character-lab.css';

export default function CharacterLabApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();
  const { setRightPane, clearRightPane } = useRightPane();
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    setActiveApp('characterLab');
    setLeftPane(<CharacterLabSidebar />);

    // Toggle gallery in right pane
    if (showGallery) {
      setRightPane(<ModelGallery />);
    } else {
      clearRightPane();
    }

    return () => {
      clearLeftPane();
      clearRightPane();
    };
  }, [setActiveApp, setLeftPane, setRightPane, clearLeftPane, clearRightPane, showGallery]);

  return <CharacterLabCenter showGallery={showGallery} onToggleGallery={() => setShowGallery(!showGallery)} />;
}
