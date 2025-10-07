/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useResourceManager } from '@shared/hooks/useResourceManager.js';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';

// Simple virtualized list component
function VirtualizedList({ items, renderItem, itemHeight = 80, containerHeight = 400, loadMore }) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(
    visibleStartIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStartIndex, visibleEndIndex);

  const handleScroll = useCallback((e) => {
    const scrollTop = e.target.scrollTop;
    setScrollTop(scrollTop);

    // Load more items when near bottom
    if (loadMore && scrollTop + containerHeight >= items.length * itemHeight - 200) {
      loadMore();
    }
  }, [itemHeight, containerHeight, items.length, loadMore]);

  return (
    <div
      className="virtualized-list"
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      {/* Spacer for items before visible range */}
      {visibleStartIndex > 0 && (
        <div style={{ height: visibleStartIndex * itemHeight }} />
      )}

      {/* Visible items */}
      {visibleItems.map((item, index) => (
        <div
          key={item.id || visibleStartIndex + index}
          style={{ height: itemHeight }}
          className="virtualized-item"
        >
          {renderItem(item, visibleStartIndex + index)}
        </div>
      ))}

      {/* Spacer for items after visible range */}
      {visibleEndIndex < items.length && (
        <div style={{ height: (items.length - visibleEndIndex) * itemHeight }} />
      )}
    </div>
  );
}

// Resource card components for different types
function ChatResourceCard({ item, resource, isLoading, onExpand }) {
  return (
    <div className="resource-card chat-card">
      <div className="resource-header">
        <div className="resource-title">{item.title || 'Chat Session'}</div>
        <div className="resource-meta">
          <span className="resource-date">
            {new Date(item.timestamp || item.createdAt).toLocaleDateString()}
          </span>
          <span className="resource-type">Chat</span>
        </div>
      </div>

      {item.preview && (
        <div className="resource-preview">{item.preview}</div>
      )}

      {resource && (
        <div className="resource-content">
          <div className="chat-messages">
            {resource.messages?.slice(-2).map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <strong>{msg.role}:</strong> {msg.content?.substring(0, 100)}...
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="resource-actions">
        <button
          className="btn-expand"
          onClick={onExpand}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : resource ? 'View Full' : 'Load'}
        </button>
      </div>
    </div>
  );
}

function WorkflowResourceCard({ item, resource, isLoading, onExpand }) {
  return (
    <div className="resource-card workflow-card">
      <div className="resource-header">
        <div className="resource-title">{item.title}</div>
        <div className="resource-meta">
          <span className="resource-status" data-status={item.status}>
            {item.status || 'unknown'}
          </span>
          <span className="resource-type">Workflow</span>
        </div>
      </div>

      {item.description && (
        <div className="resource-preview">{item.description}</div>
      )}

      {resource && (
        <div className="resource-content">
          <div className="workflow-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${item.progress || 0}%` }}
              />
            </div>
            <span className="progress-text">{resource.steps?.length || 0} steps</span>
          </div>
        </div>
      )}

      <div className="resource-actions">
        <button
          className="btn-expand"
          onClick={onExpand}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : resource ? 'View Details' : 'Load'}
        </button>
      </div>
    </div>
  );
}

function DocumentationResourceCard({ item, resource, isLoading, onExpand }) {
  return (
    <div className="resource-card documentation-card">
      <div className="resource-header">
        <div className="resource-title">{item.title}</div>
        <div className="resource-meta">
          <span className="resource-source">{item.source || 'Manual'}</span>
          <span className="resource-type">Docs</span>
        </div>
      </div>

      {item.preview && (
        <div className="resource-preview">{item.preview}</div>
      )}

      {resource && (
        <div className="resource-content">
          <div className="documentation-content">
            {resource.format === 'markdown' ? (
              <ReactMarkdown>{resource.content?.substring(0, 200)}...</ReactMarkdown>
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(resource.content?.substring(0, 200) + '...')
                }}
              />
            )}
          </div>
        </div>
      )}

      <div className="resource-actions">
        <button
          className="btn-expand"
          onClick={onExpand}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : resource ? 'Read More' : 'Load'}
        </button>
      </div>
    </div>
  );
}

// Main knowledge section component
export default function ModuleKnowledgeSection({ moduleId }) {
  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const {
    indexes,
    isIndexLoading,
    loadResource,
    getResourceFromCache,
    isResourceLoading,
    searchResources,
    getMemoryStats
  } = useResourceManager(moduleId);

  const activeIndex = indexes[activeTab] || { recent: [], items: [], total: 0, loading: true };

  // Combine recent and other items, removing duplicates
  const allItems = useMemo(() => {
    const recentIds = new Set((activeIndex.recent || []).map(item => item.id));
    const otherItems = (activeIndex.items || []).filter(item => !recentIds.has(item.id));
    return [...(activeIndex.recent || []), ...otherItems];
  }, [activeIndex]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const results = await searchResources(searchQuery, [activeTab]);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, activeTab, searchResources, isSearching]);

  const handleResourceExpand = useCallback(async (resourceType, resourceId) => {
    try {
      await loadResource(resourceType, resourceId);
    } catch (error) {
      console.error('Failed to load resource:', error);
    }
  }, [loadResource]);

  const renderResourceCard = useCallback((item) => {
    const resource = getResourceFromCache(activeTab, item.id);
    const loading = isResourceLoading(activeTab, item.id);

    const commonProps = {
      item,
      resource,
      isLoading: loading,
      onExpand: () => handleResourceExpand(activeTab, item.id)
    };

    switch (activeTab) {
      case 'chats':
        return <ChatResourceCard {...commonProps} />;
      case 'workflows':
        return <WorkflowResourceCard {...commonProps} />;
      case 'documentation':
        return <DocumentationResourceCard {...commonProps} />;
      default:
        return <div className="resource-card">Unknown resource type</div>;
    }
  }, [activeTab, getResourceFromCache, isResourceLoading, handleResourceExpand]);

  const displayItems = searchResults.length > 0 ? searchResults : allItems;

  if (!moduleId) {
    return (
      <div className="knowledge-section empty">
        <span className="icon">school</span>
        <p>Select a module to view its knowledge base</p>
      </div>
    );
  }

  return (
    <div className="knowledge-section">
      {/* Header */}
      <div className="knowledge-header">
        <h3>Module Knowledge Base</h3>
        <div className="knowledge-stats">
          {Object.entries(indexes).map(([type, index]) => (
            <span key={type} className="stat">
              {type}: {index.total || 0}
            </span>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="knowledge-search">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className="search-btn"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <span className="icon">hourglass_empty</span>
            ) : (
              <span className="icon">search</span>
            )}
          </button>
        </div>
        {searchResults.length > 0 && (
          <button
            className="clear-search"
            onClick={() => { setSearchQuery(''); setSearchResults([]); }}
          >
            Clear search
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="knowledge-tabs">
        {['chats', 'workflows', 'documentation'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            disabled={indexes[tab]?.loading}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {indexes[tab]?.total > 0 && (
              <span className="tab-count">{indexes[tab].total}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="knowledge-content">
        {isIndexLoading ? (
          <div className="loading-state">
            <span className="icon">hourglass_empty</span>
            <p>Loading knowledge base...</p>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="empty-state">
            <span className="icon">inventory_2</span>
            <p>No {activeTab} found</p>
            {searchQuery && <p>Try a different search term</p>}
          </div>
        ) : (
          <VirtualizedList
            items={displayItems}
            renderItem={renderResourceCard}
            itemHeight={120}
            containerHeight={500}
          />
        )}
      </div>
    </div>
  );
}