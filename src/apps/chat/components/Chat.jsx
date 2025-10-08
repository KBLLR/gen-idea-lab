import React from 'react';
import ChatHeader from './ChatHeader';
import ModuleAgentsChat from './ModuleAgentsChat';

const Chat = ({ showGallery, onToggleGallery }) => {
  return (
    <div className="chat-app-container">
      <div className="chat-main-content">
        <ChatHeader showGallery={showGallery} onToggleGallery={onToggleGallery} />
        <ModuleAgentsChat />
      </div>
    </div>
  );
};

export default Chat;
