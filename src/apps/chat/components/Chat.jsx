import React from 'react';
import ChatHeader from './ChatHeader';
import AssistantAvatarDock from './AssistantAvatarDock';
import ModuleAgentsChat from './ModuleAgentsChat';
import './Chat.css';

const Chat = ({ showGallery, onToggleGallery }) => {
  return (
    <div className="chat-app-container">
      <ChatHeader showGallery={showGallery} onToggleGallery={onToggleGallery} />
      <AssistantAvatarDock />
      <div className="chat-main-content">
        <ModuleAgentsChat />
      </div>
    </div>
  );
};

export default Chat;
