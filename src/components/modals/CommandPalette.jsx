/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '@store';
import { selectModule, toggleModuleChat } from "@shared/lib/actions";
import { modules, modulesByDiscipline } from "@shared/lib/modules";
import { getAppPath } from '@routes';

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const activeApp = useStore.use.activeApp();
  const activeModuleId = useStore.use.activeModuleId();
  const setActiveApp = useStore.use.actions().setActiveApp;
  const setIsLiveVoiceChatOpen = useStore.use.actions().setIsLiveVoiceChatOpen;
  const isLiveVoiceChatOpen = useStore.use.isLiveVoiceChatOpen();

  // Dev-only: render trace
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.debug('[CommandPalette] Rendered with isOpen:', isOpen);
  }

  // Define available commands
  const commands = [
    // App navigation
    {
      id: 'nav-idealab',
      label: 'Go to Idea Lab',
      icon: 'school',
      action: () => { setActiveApp('ideaLab'); navigate(getAppPath('ideaLab')); },
      keywords: ['idea', 'lab', 'modules', 'academic']
    },
    {
      id: 'nav-imagebooth',
      label: 'Go to Image Booth',
      icon: 'image',
      action: () => { setActiveApp('imageBooth'); navigate(getAppPath('imageBooth')); },
      keywords: ['image', 'booth', 'generate', 'ai']
    },
    {
      id: 'nav-archiva',
      label: 'Go to Archiva',
      icon: 'folder',
      action: () => { setActiveApp('archiva'); navigate(getAppPath('archiva')); },
      keywords: ['archive', 'archiva', 'documents', 'files']
    },
    {
      id: 'nav-planner',
      label: 'Go to Planner',
      icon: 'account_tree',
      action: () => { setActiveApp('planner'); navigate(getAppPath('planner')); },
      keywords: ['planner', 'workflow', 'graph', 'nodes']
    },
    {
      id: 'nav-workflows',
      label: 'Go to Workflows',
      icon: 'work',
      action: () => { setActiveApp('workflows'); navigate(getAppPath('workflows')); },
      keywords: ['workflows', 'tasks', 'automation']
    },

    // Voice commands
    {
      id: 'voice-toggle',
      label: isLiveVoiceChatOpen ? 'Close Voice Chat' : 'Open Voice Chat',
      icon: isLiveVoiceChatOpen ? 'mic_off' : 'mic',
      action: () => setIsLiveVoiceChatOpen(!isLiveVoiceChatOpen),
      keywords: ['voice', 'chat', 'speak', 'microphone', 'audio']
    },

    // Module chat toggle
    {
      id: 'module-chat-toggle',
      label: 'Toggle Module Chat',
      icon: 'chat',
      action: () => toggleModuleChat(),
      keywords: ['chat', 'module', 'assistant', 'toggle']
    },

    // Module selection commands
    ...Object.values(modules).map(module => ({
      id: `module-${module['Module Code']}`,
      label: `Open ${module['Module Title']}`,
      icon: 'school',
      action: () => {
        setActiveApp('ideaLab');
        selectModule(module['Module Code']);
        navigate(getAppPath('ideaLab'));
      },
      keywords: ['module', module['Module Title'].toLowerCase(), module['Module Code'].toLowerCase()]
    }))
  ];

  // Filter commands based on query
  const filteredCommands = commands.filter(cmd => {
    const searchText = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchText) ||
      cmd.keywords.some(kw => kw.includes(searchText))
    );
  });

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  const executeCommand = (command) => {
    command.action();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-header">
          <span className="icon search-icon">search</span>
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="keyboard-hint">
            <kbd>↑↓</kbd> Navigate <kbd>↵</kbd> Select <kbd>Esc</kbd> Close
          </div>
        </div>

        <div className="command-palette-results">
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">
              <span className="icon">search_off</span>
              <p>No commands found</p>
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <div
                key={command.id}
                className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => executeCommand(command)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="icon">{command.icon}</span>
                <span className="command-label">{command.label}</span>
              </div>
            ))
          )}
        </div>

        <div className="command-palette-footer">
          <div className="shortcut-hints">
            <span><kbd>⌘K</kbd> Command Palette</span>
            <span><kbd>⌘⇧V</kbd> Voice Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
