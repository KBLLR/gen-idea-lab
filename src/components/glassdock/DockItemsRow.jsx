/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export default function DockItemsRow({
  items = [],
  isVoiceListening,
  onClickItem,
  onRemoveItem,
  getIconFallback
}) {
  return (
    <div className="dock-container">
      {items.map((item) => (
        <div
          key={item.id}
          className={`dock-item ${item.type} ${item.isActive ? 'active' : ''} ${item.type === 'voice' && isVoiceListening ? 'listening' : ''}`}
          onClick={() => onClickItem?.(item)}
          title={item.status || item.label}
        >
          <span className="icon" aria-label={item.label}>
            {getIconFallback ? getIconFallback(item.icon) : item.icon}
          </span>

          {item.type === 'voice' && isVoiceListening && (
            <div className="listening-animation">
              <div className="pulse"></div>
              <div className="pulse"></div>
              <div className="pulse"></div>
            </div>
          )}

          {((item.type === 'navigation' && item.isActive) || (item.type === 'voice' && item.isActive)) && (
            <div className="active-indicator" />
          )}

          <button
            className="remove-item"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveItem?.(item.id);
            }}
            title={`Remove ${item.label}`}
          >
            <span className="icon" aria-label="Remove">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}

