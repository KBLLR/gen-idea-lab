import React from 'react';
import { SidebarItemCard } from '@ui';
import useStore from '@store';

// Middle-only content for Chat notes (no header/footer)
// This component is intended to be rendered inside the global sidebar shell
// via the Left/Right pane slots (header = AppSwitcher, footer = UserBar).
const ChatSidebar = () => {
  const savedChats = useStore.use.moduleAssistantSavedChats();
  const activeModuleId = useStore.use.activeModuleId();

  return (
    <div className="chat-notes">
      <div className="chat-filter" style={{ marginBottom: 8 }}>
        <input type="text" placeholder="Filter chats..." />
      </div>
      <div className="chat-list">
        {Object.entries(savedChats).map(([moduleId, chats]) => (
          <div key={moduleId}>
            <h4>{moduleId}</h4>
            {chats.map((chat) => (
              <SidebarItemCard
                key={chat.id}
                label={chat.title}
                active={activeModuleId === moduleId}
                onClick={() => {}}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
