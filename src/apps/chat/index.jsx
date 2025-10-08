import React, { useEffect, useState } from 'react';
import useStore from '@store';
import Chat from './components/Chat.jsx';
import ChatSidebar from './components/ChatSidebar.jsx';
import { useLeftPane, useRightPane } from '@shared/lib/layoutSlots';
import Gallery from './components/Gallery.jsx'

export default function ChatContent() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();
  const { setRightPane, clearRightPane } = useRightPane();
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    setActiveApp('chat');
    // Left pane = Chat history sidebar
    setLeftPane(<ChatSidebar />);
    return () => { clearRightPane(); clearLeftPane(); };
  }, [setActiveApp, setLeftPane, clearLeftPane, clearRightPane]);

  // Handle gallery toggle
  useEffect(() => {
    if (showGallery) {
      setRightPane(<Gallery />);
    } else {
      clearRightPane();
    }
  }, [showGallery, setRightPane, clearRightPane]);

  return <Chat showGallery={showGallery} onToggleGallery={() => setShowGallery(!showGallery)} />;
}
