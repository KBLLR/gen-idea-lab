import React from 'react';
import AppSwitcher from '@components/headers/AppSwitcher.jsx';
import UserBar from '@components/ui/organisms/UserBar.jsx';
import { SidebarItemCard } from '@ui';
import useStore from '@store';

const ChatSidebar = () => {
  const savedChats = useStore.use.moduleAssistantSavedChats();
  const activeModuleId = useStore.use.activeModuleId();

  return (
    <div className="left-column">
      <AppSwitcher />
      <div className="left-column-content">
        <div className="chat-filter">
          <input type="text" placeholder="Filter chats..." />
        </div>
        <div className="chat-list">
          {Object.entries(savedChats).map(([moduleId, chats]) => (
            <div key={moduleId}>
              <h4>{moduleId}</h4>
              {chats.map(chat => (
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
      <UserBar />
    </div>
  );
};

export default ChatSidebar;
