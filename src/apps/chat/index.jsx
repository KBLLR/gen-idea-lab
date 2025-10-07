import React, { useEffect } from 'react';
import useStore from '@store';
import Chat from './components/Chat.jsx';
import ChatSidebar from './components/ChatSidebar.jsx';
import { useRightPane } from '@shared/lib/layoutSlots';
import TabbedRightPane from '@shared/lib/TabbedRightPane.jsx'
import Gallery from './components/Gallery.jsx'

export default function ChatContent() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setRightPane, clearRightPane } = useRightPane();

  useEffect(() => {
    setActiveApp('chat');
    setRightPane(
      <TabbedRightPane
        initial="gallery"
        tabs={[
          { id: 'gallery', label: 'Gallery', icon: '🖼️', title: 'Gallery', render: () => <Gallery /> },
          { id: 'notes', label: 'Notes', icon: '📝', title: 'Notes', render: () => <ChatSidebar /> },
        ]}
      />
    );
    return () => clearRightPane();
  }, [setActiveApp, setRightPane, clearRightPane]);

  return <Chat />;
}
