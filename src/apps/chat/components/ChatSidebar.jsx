import React, { useState, useEffect, useMemo } from 'react';
import { SidebarItemCard, Button } from '@ui';
import useStore from '@store';
import mockChats from '../data/mock-chats.json';

// Middle-only content for Chat notes (no header/footer)
// This component is intended to be rendered inside the global sidebar shell
// via the Left/Right pane slots (header = AppSwitcher, footer = UserBar).
const ChatSidebar = () => {
  const savedChats = useStore.use.moduleAssistantSavedChats();
  const activeModuleId = useStore.use.activeModuleId();
  const [useMockData, setUseMockData] = useState(false);
  const [filterText, setFilterText] = useState('');

  // Load mock data on mount if no saved chats exist or ?mock=1 in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mock') === '1' || Object.keys(savedChats).length === 0) {
      setUseMockData(true);
    }
  }, []);

  // Group chats by module
  const chatsByModule = useMemo(() => {
    if (useMockData) {
      // Group mock chats by moduleId
      return mockChats.reduce((acc, chat) => {
        if (!acc[chat.moduleId]) {
          acc[chat.moduleId] = [];
        }
        acc[chat.moduleId].push(chat);
        return acc;
      }, {});
    }
    return savedChats;
  }, [useMockData, savedChats]);

  // Filter chats
  const filteredChatsByModule = useMemo(() => {
    if (!filterText) return chatsByModule;

    const filtered = {};
    Object.entries(chatsByModule).forEach(([moduleId, chats]) => {
      const matchedChats = chats.filter(chat =>
        chat.title.toLowerCase().includes(filterText.toLowerCase()) ||
        chat.tags?.some(tag => tag.toLowerCase().includes(filterText.toLowerCase()))
      );
      if (matchedChats.length > 0) {
        filtered[moduleId] = matchedChats;
      }
    });
    return filtered;
  }, [chatsByModule, filterText]);

  const handleToggleMockData = () => {
    setUseMockData(!useMockData);
  };

  return (
    <div className="chat-notes">
      <div className="chat-controls" style={{ marginBottom: 12 }}>
        <div className="chat-filter" style={{ marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Filter chats..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--color-surface-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
        <Button
          onClick={handleToggleMockData}
          variant="outline"
          size="sm"
          style={{ width: '100%' }}
          aria-label={useMockData ? 'Switch to saved chats' : 'Use sample data'}
        >
          {useMockData ? '📋 Saved Chats' : '🎲 Sample Data'}
        </Button>
      </div>
      <div className="chat-list">
        {Object.keys(filteredChatsByModule).length === 0 ? (
          <div style={{ padding: '16px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            {filterText ? 'No chats match your filter' : useMockData ? 'No sample chats available' : 'No saved chats yet'}
          </div>
        ) : (
          Object.entries(filteredChatsByModule).map(([moduleId, chats]) => (
            <div key={moduleId} style={{ marginBottom: 16 }}>
              <h4 style={{
                margin: '8px 0',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {moduleId}
              </h4>
              {chats.map((chat) => (
                <SidebarItemCard
                  key={chat.id}
                  label={chat.title}
                  subtitle={chat.tags?.slice(0, 2).join(' ')}
                  active={false}
                  onClick={() => {
                    console.log('Opening chat:', chat.id);
                    // TODO: Load chat messages into main view
                  }}
                  style={{ marginBottom: 4 }}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
