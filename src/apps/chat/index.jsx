import React, { useEffect } from 'react';
import useStore from '@store';
import Chat from './components/Chat.jsx';
import ChatSidebar from './components/ChatSidebar.jsx';
import AssistantsBar from './components/AssistantsBar.jsx';
import { useLeftPane, useRightPane } from '@shared/lib/layoutSlots';
import TabbedRightPane from '@shared/lib/TabbedRightPane.jsx'
import Gallery from './components/Gallery.jsx'

export default function ChatContent() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();
  const { setRightPane, clearRightPane } = useRightPane();

  useEffect(() => {
    setActiveApp('chat');
    setLeftPane(<AssistantsBar />);
    setRightPane(
      <TabbedRightPane
        initial="gallery"
        tabs={[
          { id: 'gallery', label: 'Gallery', icon: '🖼️', title: 'Gallery', render: () => <Gallery /> },
          { id: 'notes', label: 'Notes', icon: '📝', title: 'Notes', render: () => <ChatSidebar /> },
        ]}
      />
    );
    return () => { clearRightPane(); clearLeftPane(); };
  }, [setActiveApp, setLeftPane, clearLeftPane, setRightPane, clearRightPane]);

  return <Chat />;
}
