/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import useStore from '../lib/store';
import { voiceCommands } from '../lib/voiceCommands';
import { enhancedVoiceSystem } from '../lib/voice/enhancedVoiceSystem';
import { getVoicePersonality } from '../lib/voice/voicePersonalities';
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
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  const [isScreenAware, setIsScreenAware] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [currentPersonality, setCurrentPersonality] = useState(null);
  const [useEnhancedVoice, setUseEnhancedVoice] = useState(false);
  const [dockDimensions, setDockDimensions] = useState({ width: 0, height: 0 });
  const dockRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 });

  // Store actions
  const setIsOrchestratorOpen = useStore((state) => state.actions.setIsOrchestratorOpen);
  const setIsSettingsOpen = useStore((state) => state.actions.setIsSettingsOpen);
  const setIsSystemInfoOpen = useStore((state) => state.actions.setIsSystemInfoOpen);
  const setIsLiveVoiceChatOpen = useStore((state) => state.actions.setIsLiveVoiceChatOpen);
  const setActiveApp = useStore((state) => state.actions.setActiveApp);
  const activeApp = useStore((state) => state.activeApp);
  const activeModuleId = useStore((state) => state.activeModuleId);
  const isLiveVoiceChatOpen = useStore((state) => state.isLiveVoiceChatOpen);

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
        case 'show-system-info':
          setIsSystemInfoOpen(true);
          break;
        default:
          console.log('Unknown voice command action:', action);
      }
    };

    window.addEventListener('voice-command', handleVoiceCommand);

    return () => {
      window.removeEventListener('voice-command', handleVoiceCommand);
    };
  }, [setActiveApp, setIsOrchestratorOpen, setIsSettingsOpen, setIsSystemInfoOpen]);

  // Update current personality when module changes
  useEffect(() => {
    const context = { activeModuleId, activeApp, isOrchestrator: !activeModuleId };
    const personality = getVoicePersonality(context);
    setCurrentPersonality(personality);
  }, [activeModuleId, activeApp]);

  // Setup enhanced voice system
  useEffect(() => {
    if (!enhancedVoiceSystem.isSupported) return;

    enhancedVoiceSystem.onStart = () => {
      setIsVoiceListening(true);
      setVoiceStatus('Listening...');
    };

    enhancedVoiceSystem.onEnd = () => {
      setIsVoiceListening(false);
      setVoiceStatus('');
    };

    enhancedVoiceSystem.onError = (error) => {
      setIsVoiceListening(false);
      setVoiceStatus(`Error: ${error}`);
      setTimeout(() => setVoiceStatus(''), 3000);
    };

    enhancedVoiceSystem.onResult = (result, confidence) => {
      setVoiceStatus(`Processing: "${result}" (${Math.round(confidence * 100)}%)`);
      setTimeout(() => setVoiceStatus(''), 3000);
    };

    enhancedVoiceSystem.onPersonalityChange = (personality) => {
      setCurrentPersonality(personality);
      if (personality.name === 'Puck') {
        setVoiceStatus('🎭 Puck is here to help!');
      } else {
        setVoiceStatus(`🎓 ${personality.name} is ready to teach`);
      }
      setTimeout(() => setVoiceStatus(''), 2000);
    };

    return () => {
      // Cleanup would go here
    };
  }, []);

  // Toggle voice listening
  const toggleVoiceListening = async () => {
    if (isVoiceListening) {
      if (useEnhancedVoice) {
        enhancedVoiceSystem.stopListening();
      } else {
        voiceCommands.stopListening();
      }
    } else {
      if (useEnhancedVoice) {
        await enhancedVoiceSystem.startListening();
      } else {
        await voiceCommands.startListening();
      }
    }
  };

  // Toggle screen awareness
  const toggleScreenAwareness = () => {
    setIsScreenAware(!isScreenAware);
    // TODO: Implement screen capture/awareness functionality
    console.log('Screen awareness toggled:', !isScreenAware);
  };

  // Toggle subtitles display
  const toggleSubtitles = () => {
    setShowSubtitles(!showSubtitles);
  };

  // Initialize dock items
  useEffect(() => {
    const items = [
      {
        id: 'voice',
        icon: isVoiceListening ? 'mic' : 'mic_off',
        label: 'Voice Commands',
        action: toggleVoiceListening,
        secondaryAction: () => setShowVoiceCommands(!showVoiceCommands),
        type: 'voice',
        isActive: isVoiceListening,
        status: voiceStatus,
        hasSecondary: true
      },
      {
        id: 'live-voice-chat',
        icon: 'forum',
        label: 'Live Voice Chat (Gemini)',
        action: () => setIsLiveVoiceChatOpen(!isLiveVoiceChatOpen),
        type: 'action',
        isActive: isLiveVoiceChatOpen
      },
      {
        id: 'subtitles',
        icon: 'volume_up',
        label: 'Subtitles',
        action: toggleSubtitles,
        type: 'action',
        isActive: showSubtitles
      },
      {
        id: 'screen-aware',
        icon: isScreenAware ? 'visibility' : 'visibility_off',
        label: 'Screen Awareness',
        action: toggleScreenAwareness,
        type: 'action',
        isActive: isScreenAware
      }
    ];
    setDockItems(items);
  }, [isVoiceListening, voiceStatus, showSubtitles, isScreenAware, isLiveVoiceChatOpen]);

  // Calculate dock dimensions
  const getDockDimensions = useCallback(() => {
    const visibleItems = dockItems.filter(item => item.visible !== false);
    const width = visibleItems.length * DOCK_ITEM_SIZE + (visibleItems.length - 1) * DOCK_GAP + (DOCK_PADDING * 2);
    const baseHeight = DOCK_ITEM_SIZE + (DOCK_PADDING * 2);
    const subtitleHeight = showSubtitles ? 80 : 0; // Add height for subtitle area
    const height = baseHeight + subtitleHeight;
    return { width, height };
  }, [dockItems, showSubtitles]);

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

  const handleItemClick = (item, isSecondary = false) => {
    if (isSecondary && item.secondaryAction) {
      item.secondaryAction();
    } else if (item.action) {
      item.action();
    }
  };

  // Icon fallback mapping for better compatibility
  const getIconFallback = (iconName) => {
    const fallbacks = {
      'mic_off': 'mic_none',
      'build_circle': 'settings',
      'psychology': 'smart_toy',
      'inventory_2': 'archive'
    };
    return fallbacks[iconName] || iconName;
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
            className={`dock-item ${item.type} ${item.isActive ? 'active' : ''} ${item.type === 'voice' && isVoiceListening ? 'listening' : ''}`}
            onClick={() => handleItemClick(item)}
            title={item.status || item.label}
          >
            <span className="icon" aria-label={item.label}>
              {getIconFallback(item.icon)}
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
                removeItem(item.id);
              }}
              title={`Remove ${item.label}`}
            >
              <span className="icon" aria-label="Remove">close</span>
            </button>
          </div>
        ))}
      </div>

      <div className="dock-handle">
        <span className="icon">drag_indicator</span>
      </div>

      {voiceStatus && (
        <div className="voice-status-dock">
          {voiceStatus}
        </div>
      )}

      {showSubtitles && (
        <div className="subtitle-area">
          <div className="subtitle-text">
            Subtitles will appear here...
          </div>
        </div>
      )}

      {currentPersonality && (
        <div className="personality-indicator">
          <div className="personality-info">
            <span className="personality-name">
              {currentPersonality.name === 'Puck' ? '🎭 Puck' : `🎓 ${currentPersonality.name}`}
            </span>
            {currentPersonality.knowledge_base?.primary_domain && (
              <span className="personality-domain">
                {currentPersonality.knowledge_base.primary_domain}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}