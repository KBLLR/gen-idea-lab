/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { voiceCommands } from '../lib/voiceCommands';
import useStore from '../lib/store';
import '../styles/components/voice-command.css';

export default function VoiceCommand() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [lastCommand, setLastCommand] = useState('');
  const [status, setStatus] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const timeoutRef = useRef(null);

  const setIsSettingsOpen = useStore((state) => state.actions.setIsSettingsOpen);
  const setIsOrchestratorOpen = useStore((state) => state.actions.setIsOrchestratorOpen);
  const setActiveApp = useStore((state) => state.actions.setActiveApp);

  useEffect(() => {
    // Check if voice commands are supported
    setIsSupported(voiceCommands.isSupported);

    // Setup voice command callbacks
    voiceCommands.onStart = () => {
      setIsListening(true);
      setStatus('Listening...');
    };

    voiceCommands.onEnd = () => {
      setIsListening(false);
      setStatus('');
    };

    voiceCommands.onResult = (result, confidence) => {
      setLastCommand(result);
      setStatus(`Heard: "${result}" (${Math.round(confidence * 100)}%)`);

      // Clear status after 3 seconds
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setStatus(''), 3000);
    };

    voiceCommands.onError = (error) => {
      setIsListening(false);
      setStatus(`Error: ${error}`);

      // Clear error after 5 seconds
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setStatus(''), 5000);
    };

    // Setup permission change handler
    voiceCommands.onPermissionChange = (status) => {
      setPermissionStatus(status);
      setHasPermission(status === 'granted');

      if (status === 'denied') {
        setStatus('Microphone permission denied. Please allow access to use voice commands.');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setStatus(''), 5000);
      }
    };

    // Initialize permission state
    setHasPermission(voiceCommands.hasPermission);
    setPermissionStatus(voiceCommands.hasPermission ? 'granted' : 'unknown');

    // Setup voice command event listeners
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
        case 'open-app-switcher':
          // Trigger app switcher somehow
          break;
        case 'create-workflow':
          // Navigate to planner and trigger new workflow
          setActiveApp('planner');
          break;
        case 'run-workflow':
          // Trigger workflow execution
          break;
        case 'show-university-data':
          // Show university components in planner
          setActiveApp('planner');
          break;
        default:
          console.log('Unknown voice command action:', action);
      }
    };

    window.addEventListener('voice-command', handleVoiceCommand);

    return () => {
      window.removeEventListener('voice-command', handleVoiceCommand);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [setIsSettingsOpen, setIsOrchestratorOpen, setActiveApp]);

  const toggleListening = async () => {
    if (isListening) {
      voiceCommands.stopListening();
    } else {
      const started = await voiceCommands.startListening();
      if (!started) {
        setStatus('Failed to start voice recognition');
      }
    }
  };

  const toggleCommandsList = () => {
    setShowCommands(!showCommands);
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  const availableCommands = voiceCommands.getAvailableCommands();

  return (
    <div className="voice-command">
      <div
        className={`voice-button ${isListening ? 'listening' : ''}`}
        onClick={toggleListening}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title="Voice Commands"
      >
        <span className="icon">
          {isListening ? 'mic' : 'mic_none'}
        </span>

        {isListening && (
          <div className="listening-animation">
            <div className="pulse"></div>
            <div className="pulse"></div>
            <div className="pulse"></div>
          </div>
        )}
      </div>

      {showTooltip && !isListening && (
        <div className="voice-tooltip">
          {permissionStatus === 'denied' ? (
            <>
              <p>Microphone access required</p>
              <p>Click to grant permission</p>
            </>
          ) : permissionStatus === 'granted' ? (
            <>
              <p>Click to start voice commands</p>
              <p>Say "help" for available commands</p>
            </>
          ) : (
            <>
              <p>Click to enable voice commands</p>
              <p>Microphone permission will be requested</p>
            </>
          )}
        </div>
      )}

      {status && (
        <div className={`voice-status ${status.startsWith('Error') ? 'error' : ''}`}>
          {status}
        </div>
      )}

      <button
        className="commands-toggle"
        onClick={toggleCommandsList}
        title="Show voice commands"
      >
        <span className="icon">help</span>
      </button>

      {showCommands && (
        <div className="commands-list">
          <div className="commands-header">
            <h3>Available Voice Commands</h3>
            <button onClick={toggleCommandsList}>
              <span className="icon">close</span>
            </button>
          </div>
          <div className="commands-content">
            <div className="command-category">
              <h4>Navigation</h4>
              <ul>
                <li>"Go to planner" - Open planner app</li>
                <li>"Go to archiva" - Open archiva app</li>
                <li>"Go to idea lab" - Open idea lab app</li>
                <li>"Go to booth" - Open image booth app</li>
                <li>"Go to workflows" - Open workflows app</li>
                <li>"Go home" - Return to idea lab</li>
              </ul>
            </div>

            <div className="command-category">
              <h4>Actions</h4>
              <ul>
                <li>"Open settings" - Show settings modal</li>
                <li>"Start chat" - Open assistant chat</li>
                <li>"New workflow" - Create new workflow</li>
                <li>"Show university" - View university data</li>
              </ul>
            </div>

            <div className="command-category">
              <h4>Control</h4>
              <ul>
                <li>"Help" - Show this help</li>
                <li>"Stop listening" - Turn off voice commands</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {lastCommand && (
        <div className="last-command">
          Last: "{lastCommand}"
        </div>
      )}
    </div>
  );
}