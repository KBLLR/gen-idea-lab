import React from 'react';
import ChatHeader from './ChatHeader';
import AssistantsBar from './AssistantsBar';
import ModuleAgentsChat from './ModuleAgentsChat';
import Gallery from './Gallery';
import useStore from '@store';
import c from 'clsx';

const Chat = () => {
  const showGallery = useStore.use.showGallery();

  return (
    <div className={c('chat-app-container', { 'three-column': showGallery })}>
      <div className="chat-main-content">
        <ChatHeader />
        <AssistantsBar />
        <ModuleAgentsChat />
      </div>
      {showGallery && <Gallery />}
    </div>
  );
};

export default Chat;
