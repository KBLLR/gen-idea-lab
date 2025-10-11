import React, { useState, useEffect, useMemo } from 'react';
import useStore from '@store';
import { modules } from '@apps/ideaLab/lib/modules.js';
import mockChats from '../data/mock-chats.json';
import styles from './ChatSidebar.module.css';

const ChatSidebar = () => {
  const savedChats = useStore.use.moduleAssistantSavedChats();
  const activeModuleId = useStore.use.activeModuleId();
  const actions = useStore.use.actions();
  const [useMockData, setUseMockData] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterAssistant, setFilterAssistant] = useState('all');

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

  // Filter chats with multiple criteria
  const filteredChatsByModule = useMemo(() => {
    const filtered = {};

    Object.entries(chatsByModule).forEach(([moduleId, chats]) => {
      const matchedChats = chats.filter(chat => {
        // Text search
        if (filterText && !(
          chat.title.toLowerCase().includes(filterText.toLowerCase()) ||
          chat.tags?.some(tag => tag.toLowerCase().includes(filterText.toLowerCase()))
        )) return false;

        // Module filter
        if (filterModule !== 'all' && chat.moduleId !== filterModule) return false;

        // Assistant filter
        if (filterAssistant !== 'all' && chat.assistant !== filterAssistant) return false;

        return true;
      });

      if (matchedChats.length > 0) {
        filtered[moduleId] = matchedChats;
      }
    });

    return filtered;
  }, [chatsByModule, filterText, filterModule, filterAssistant]);

  // Get unique modules and assistants for filters
  const uniqueModules = useMemo(() => {
    const moduleSet = new Set();
    Object.keys(chatsByModule).forEach(moduleId => moduleSet.add(moduleId));
    return Array.from(moduleSet).sort();
  }, [chatsByModule]);

  const uniqueAssistants = useMemo(() => {
    const assistantSet = new Set();
    Object.values(chatsByModule).flat().forEach(chat => {
      if (chat.assistant) assistantSet.add(chat.assistant);
    });
    return Array.from(assistantSet).sort();
  }, [chatsByModule]);

  const totalChats = useMemo(() => {
    return Object.values(filteredChatsByModule).flat().length;
  }, [filteredChatsByModule]);

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={styles.root}>
      {/* Fixed Subheader */}
      <div className={styles.subheader}>
        <div className={styles.searchBox}>
          <span className="material-icons-round" style={{ fontSize: 18, color: '#999' }}>search</span>
          <input
            type="text"
            placeholder="Search chats..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Modules</option>
            {uniqueModules.map(moduleId => (
              <option key={moduleId} value={moduleId}>{moduleId}</option>
            ))}
          </select>

          <select
            value={filterAssistant}
            onChange={(e) => setFilterAssistant(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Assistants</option>
            {uniqueAssistants.map(assistant => (
              <option key={assistant} value={assistant}>{assistant}</option>
            ))}
          </select>
        </div>

        <div className={styles.statsBar}>
          <span>{totalChats} chat{totalChats !== 1 ? 's' : ''}</span>
          <button
            onClick={() => setUseMockData(!useMockData)}
            className={styles.toggleButton}
          >
            {useMockData ? 'Mock Data' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Scrollable Chat List */}
      <div className={styles.chatList}>
        {Object.keys(filteredChatsByModule).length === 0 ? (
          <div className={styles.emptyState}>
            <span className="material-icons-round" style={{ fontSize: 48, opacity: 0.3 }}>inbox</span>
            <p className={styles.emptyText}>
              {filterText ? 'No chats match your search' : useMockData ? 'No sample chats available' : 'No saved chats yet'}
            </p>
          </div>
        ) : (
          Object.entries(filteredChatsByModule).map(([moduleId, chats]) => (
            <div key={moduleId} className={styles.moduleGroup}>
              <div className={styles.moduleHeader}>
                <span className={styles.moduleCode}>{moduleId}</span>
                <span className={styles.moduleTitle}>
                  {modules[moduleId]?.['Module Title'] || 'Unknown Module'}
                </span>
                <span className={styles.chatCount}>{chats.length}</span>
              </div>

              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`${styles.chatCard} ${activeModuleId === chat.moduleId ? styles.active : ''}`}
                  onClick={() => {
                    console.log('Loading chat:', chat.id);
                    actions.loadChat(chat.id);
                  }}
                >
                  <div className={styles.chatHeader}>
                    <div className={styles.chatTitle}>{chat.title}</div>
                  </div>

                  <div className={styles.chatMeta}>
                    <span className={styles.assistant}>{chat.assistant}</span>
                    <span className={styles.model}>{chat.model}</span>
                    {chat.messageCount && (
                      <span className={styles.messageCount}>
                        <span className="material-icons-round" style={{ fontSize: 12 }}>chat_bubble</span>
                        {chat.messageCount}
                      </span>
                    )}
                  </div>

                  {chat.tags && chat.tags.length > 0 && (
                    <div className={styles.tags}>
                      {chat.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  )}

                  {chat.updatedAt && (
                    <div className={styles.timestamp}>
                      {formatTimestamp(chat.updatedAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
