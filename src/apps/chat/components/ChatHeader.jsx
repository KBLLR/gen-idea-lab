import React from 'react';
import BoothHeader from '@components/ui/organisms/BoothHeader.jsx';
import { ActionBar } from '@ui';
import { useNavigate } from 'react-router-dom';
import { getAppPath } from '@routes';
import useStore from '@store';

const ChatHeader = ({ showGallery, onToggleGallery, showMindmap, onToggleMindmap }) => {
  const navigate = useNavigate();
  const actions = useStore.use.actions();
  const activeModuleId = useStore.use.activeModuleId();

  const handleNewChat = () => {
    actions.startNewChat(activeModuleId);
  };

  const handleExportChat = () => {
    // TODO: Export chat as JSON/Markdown
    console.log('Export chat clicked');
  };

  return (
    <BoothHeader
      icon="chat"
      title="Multi-Agent Chat"
      typeText="AI Collaboration Hub"
      status="ready"
      description="Collaborate with specialized AI assistants. Drag avatars to invite them into the conversation."
      align="top"
      actions={
        <ActionBar
          separators
          items={[
            { id: 'new', icon: 'add', label: 'New Chat', onClick: handleNewChat },
            { id: 'mindmap', icon: 'account_tree', label: showMindmap ? 'Hide Mind Map' : 'Show Mind Map', onClick: onToggleMindmap },
            { id: 'export', icon: 'download', label: 'Export Chat', onClick: handleExportChat },
            { id: 'gallery', icon: 'collections', label: showGallery ? 'Hide Gallery' : 'Show Gallery', onClick: onToggleGallery },
          ]}
          aria-label="Chat actions"
        />
      }
    />
  );
};

export default ChatHeader;
