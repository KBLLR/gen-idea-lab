import React from 'react';
import { DndContext } from '@dnd-kit/core';
import useStore from '@store';
import { personalities } from '@shared/lib/assistant/personalities.js';
import { sendAssistantMessage } from '@shared/lib/actions/assistantActions.js';
import ChatHeader from './ChatHeader';
import ModuleAssistantHeader from './ModuleAssistantHeader';
import AssistantAvatarDock from './AssistantAvatarDock';
import ModuleAgentsChat from './ModuleAgentsChat';
import './Chat.css';

const Chat = ({ showGallery, onToggleGallery }) => {
  const activeModuleId = useStore.use.activeModuleId();

  const handleDragEnd = (event) => {
    const { active, over } = event;

    // Check if dropped over chat area
    if (over && over.id === 'chat-drop-zone') {
      const droppedAssistant = active.data.current?.assistant;

      if (droppedAssistant && activeModuleId) {
        const activePersonality = personalities[activeModuleId];
        const invitedPersonality = droppedAssistant;

        // Create invite message
        const modules = useStore.getState().modules || {};
        const moduleTitle = modules[invitedPersonality.id]?.['Module Title'] || invitedPersonality.title;
        const inviteMessage = `@${activePersonality.name} would like to collaborate with @${invitedPersonality.name}. ${invitedPersonality.name}, please join this conversation and share your expertise on ${moduleTitle}.`;

        // Send the invite message
        sendAssistantMessage(inviteMessage);
      }
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="chat-app-container">
        <ChatHeader showGallery={showGallery} onToggleGallery={onToggleGallery} />
        <ModuleAssistantHeader />
        <AssistantAvatarDock />
        <div className="chat-main-content">
          <ModuleAgentsChat />
        </div>
      </div>
    </DndContext>
  );
};

export default Chat;
