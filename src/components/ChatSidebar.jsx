import React from 'react';
import AppSwitcher from './AppSwitcher';
import UserBar from './UserBar';
import SidebarItemCard from './sidebar/SidebarItemCard';
import useStore from '../lib/store';

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
