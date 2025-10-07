import React from 'react';
import BoothHeader from '@components/ui/organisms/BoothHeader.jsx';

const ChatHeader = () => {
  return (
    <BoothHeader
      icon="chat"
      title="Chat"
      typeText="Multi-agent chat"
      status="ready"
      description="Chat with module assistants, orchestrator, and other agents."
      actions={
        <button>New Chat</button>
      }
    />
  );
};

export default ChatHeader;
