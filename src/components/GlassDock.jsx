/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import useStore from '../lib/store';
import { voiceCommands } from '../lib/voiceCommands';
import '../styles/components/glass-dock.css';

const DOCK_ITEM_SIZE = 56;
const DOCK_PADDING = 12;
const DOCK_GAP = 8;

export default function GlassDock() {
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [dockItems, setDockItems] = useState([]);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const dockRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 });

  // Store actions
  const setIsOrchestratorOpen = useStore((state) => state.actions.setIsOrchestratorOpen);
  const setIsSettingsOpen = useStore((state) => state.actions.setIsSettingsOpen);
  const setActiveApp = useStore((state) => state.actions.setActiveApp);
  const activeApp = useStore((state) => state.activeApp);

  // Setup voice commands
  useEffect(() => {
    if (!voiceCommands.isSupported) return;

    voiceCommands.onStart = () => {
      setIsVoiceListening(true);
      setVoiceStatus('Listening...');
    };

    voiceCommands.onEnd = () => {
      setIsVoiceListening(false);
      setVoiceStatus('');
    };

    voiceCommands.onError = (error) => {
      setIsVoiceListening(false);
      setVoiceStatus(`Error: ${error}`);
      setTimeout(() => setVoiceStatus(''), 3000);
    };

    voiceCommands.onResult = (result, confidence) => {
      setVoiceStatus(`Heard: "${result}" (${Math.round(confidence * 100)}%)`);
      setTimeout(() => setVoiceStatus(''), 2000);
    };

    // Setup voice command event listener
    const handleVoiceCommand = (event) => {
      const { action, data } = event.detail;
      switch (action) {
        case 'switch-app':
          setActiveApp(data);
          break;
        case 'open-settings':
          setIsSettingsOpen(true);
          break;
        case 'open-chat':
          setIsOrchestratorOpen(true);
          break;
        case 'show-help':
          alert(data);
          break;
        default:
          console.log('Unknown voice command action:', action);
      }
    };

    window.addEventListener('voice-command', handleVoiceCommand);

    return () => {
      window.removeEventListener('voice-command', handleVoiceCommand);
    };
  }, [setActiveApp, setIsOrchestratorOpen, setIsSettingsOpen]);

  // Toggle voice listening
  const toggleVoiceListening = async () => {
    if (isVoiceListening) {
      voiceCommands.stopListening();
    } else {
      await voiceCommands.startListening();
    }
  };

  // Initialize dock items
  useEffect(() => {
    const items = [
      {
        id: 'orchestrator',
        icon: 'smart_toy',
        label: 'Assistant',
        action: () => setIsOrchestratorOpen(true),
        type: 'action'
      },
      {
        id: 'voice',
        icon: isVoiceListening ? 'mic' : 'mic_none',
        label: 'Voice Commands',
        action: toggleVoiceListening,
        type: 'voice',
        isActive: isVoiceListening,
        status: voiceStatus
      },
      {
        id: 'ideaLab',
        icon: 'lightbulb',
        label: 'Idea Lab',
        action: () => setActiveApp('ideaLab'),
        type: 'navigation',
        isActive: activeApp === 'ideaLab'
      },
      {
        id: 'planner',
        icon: 'account_tree',
        label: 'Planner',
        action: () => setActiveApp('planner'),
        type: 'navigation',
        isActive: activeApp === 'planner'
      },
      {
        id: 'archiva',
        icon: 'inventory_2',
        label: 'Archiva',
        action: () => setActiveApp('archiva'),
        type: 'navigation',
        isActive: activeApp === 'archiva'
      },
      {
        id: 'booth',
        icon: 'photo_camera',
        label: 'Image Booth',
        action: () => setActiveApp('imageBooth'),
        type: 'navigation',
        isActive: activeApp === 'imageBooth'
      },
      {
        id: 'workflows',
        icon: 'workflow',
        label: 'Workflows',
        action: () => setActiveApp('workflows'),
        type: 'navigation',
        isActive: activeApp === 'workflows'
      },
      {
        id: 'settings',
        icon: 'settings',
        label: 'Settings',
        action: () => setIsSettingsOpen(true),
        type: 'action'
      }
    ];
    setDockItems(items);
  }, [activeApp, setActiveApp, setIsOrchestratorOpen, setIsSettingsOpen]);

  // Calculate dock dimensions
  const getDockDimensions = useCallback(() => {
    const visibleItems = dockItems.filter(item => item.visible !== false);
    const width = visibleItems.length * DOCK_ITEM_SIZE + (visibleItems.length - 1) * DOCK_GAP + (DOCK_PADDING * 2);
    const height = DOCK_ITEM_SIZE + (DOCK_PADDING * 2);
    return { width, height };
  }, [dockItems]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const { width, height } = getDockDimensions();
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;

      setPosition(prev => ({
        x: Math.min(prev.x, maxX),
        y: Math.min(prev.y, maxY)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getDockDimensions]);

  // Drag handlers
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.dock-item')) return; // Don't drag when clicking items

    setIsDragging(true);
    const rect = dockRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const { width, height } = getDockDimensions();
    const newX = Math.max(0, Math.min(e.clientX - dragRef.current.offsetX, window.innerWidth - width));
    const newY = Math.max(0, Math.min(e.clientY - dragRef.current.offsetY, window.innerHeight - height));

    setPosition({ x: newX, y: newY });
  }, [isDragging, getDockDimensions]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Attach global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Auto-hide/show dock
  useEffect(() => {
    let hideTimeout;

    const handleMouseMove = (e) => {
      const { width, height } = getDockDimensions();
      const dockRect = {
        left: position.x,
        top: position.y,
        right: position.x + width,
        bottom: position.y + height
      };

      // Check if mouse is near dock (with some padding)
      const padding = 50;
      const isNearDock = (
        e.clientX >= dockRect.left - padding &&
        e.clientX <= dockRect.right + padding &&
        e.clientY >= dockRect.top - padding &&
        e.clientY <= dockRect.bottom + padding
      );

      clearTimeout(hideTimeout);

      if (isNearDock) {
        setIsVisible(true);
      } else {
        hideTimeout = setTimeout(() => {
          setIsVisible(false);
        }, 2000);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hideTimeout);
    };
  }, [position, getDockDimensions]);

  const handleItemClick = (item) => {
    if (item.action) {
      item.action();
    }
  };

  const removeItem = (itemId) => {
    setDockItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, visible: false } : item
    ));
  };

  const addItem = (itemId) => {
    setDockItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, visible: true } : item
    ));
  };

  const { width, height } = getDockDimensions();
  const visibleItems = dockItems.filter(item => item.visible !== false);

  if (!isVisible) return null;

  return (
    <div
      ref={dockRef}
      className={`glass-dock ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
        height: `${height}px`
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="dock-container">
        {visibleItems.map((item, index) => (
          <div
            key={item.id}
            className={`dock-item ${item.type} ${item.isActive ? 'active' : ''}`}
            onClick={() => handleItemClick(item)}
            title={item.label}
          >
            {item.component === 'VoiceCommand' ? (
              <div className="voice-command-dock">
                <span className="icon">mic</span>
              </div>
            ) : (
              <span className="icon">{item.icon}</span>
            )}

            {item.type === 'navigation' && item.isActive && (
              <div className="active-indicator" />
            )}

            <button
              className="remove-item"
              onClick={(e) => {
                e.stopPropagation();
                removeItem(item.id);
              }}
              title={`Remove ${item.label}`}
            >
              <span className="icon">close</span>
            </button>
          </div>
        ))}
      </div>

      <div className="dock-handle">
        <span className="icon">drag_indicator</span>
      </div>
    </div>
  );
}