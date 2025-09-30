/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import useStore from '../lib/store';
import { voiceCommands } from '../lib/voiceCommands';
import '../styles/components/system-info-modal.css';

export default function SystemInfoModal({ isOpen, onClose }) {
  const [systemData, setSystemData] = useState(null);
  const connectedServices = useStore((state) => state.connectedServices);
  const activeApp = useStore((state) => state.activeApp);
  const orchestratorModel = useStore((state) => state.orchestratorModel);
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    if (isOpen) {
      // Gather system information
      const data = {
        voiceCommands: {
          isSupported: voiceCommands.isSupported,
          hasPermission: voiceCommands.hasPermission,
          isListening: voiceCommands.isListening,
          availableCommands: voiceCommands.getAvailableCommands()
        },
        connectedServices: connectedServices || {},
        currentApp: activeApp,
        orchestratorModel: orchestratorModel,
        theme: theme,
        browser: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          pixelDepth: window.screen.pixelDepth
        },
        window: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        },
        timestamp: new Date().toISOString()
      };
      setSystemData(data);
    }
  }, [isOpen, connectedServices, activeApp, orchestratorModel, theme]);

  if (!isOpen || !systemData) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="system-info-modal-backdrop" onClick={handleBackdropClick}>
      <div className="system-info-modal">
        <div className="modal-header">
          <h2>
            <span className="icon">info</span>
            System Information
          </h2>
          <button className="close-button" onClick={onClose}>
            <span className="icon">close</span>
          </button>
        </div>

        <div className="modal-content">
          {/* Voice Commands Section */}
          <div className="info-section">
            <h3>
              <span className="icon">mic</span>
              Voice Commands
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Supported:</span>
                <span className={`status ${systemData.voiceCommands.isSupported ? 'success' : 'error'}`}>
                  {systemData.voiceCommands.isSupported ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Permission:</span>
                <span className={`status ${systemData.voiceCommands.hasPermission ? 'success' : 'warning'}`}>
                  {systemData.voiceCommands.hasPermission ? 'Granted' : 'Not granted'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Currently Listening:</span>
                <span className={`status ${systemData.voiceCommands.isListening ? 'success' : 'neutral'}`}>
                  {systemData.voiceCommands.isListening ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="info-item full-width">
                <span className="label">Available Commands ({systemData.voiceCommands.availableCommands.length}):</span>
                <div className="commands-list">
                  {systemData.voiceCommands.availableCommands.slice(0, 10).map((command, index) => (
                    <span key={index} className="command-tag">"{command}"</span>
                  ))}
                  {systemData.voiceCommands.availableCommands.length > 10 && (
                    <span className="command-tag">+{systemData.voiceCommands.availableCommands.length - 10} more</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Connected Services Section */}
          <div className="info-section">
            <h3>
              <span className="icon">cloud</span>
              Connected Services
            </h3>
            <div className="info-grid">
              {Object.keys(systemData.connectedServices).length > 0 ? (
                Object.entries(systemData.connectedServices).map(([service, data]) => (
                  <div key={service} className="info-item">
                    <span className="label">{service}:</span>
                    <span className="status success">Connected</span>
                    {data.connectedAt && (
                      <span className="timestamp">
                        {new Date(data.connectedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="info-item full-width">
                  <span className="status neutral">No services connected</span>
                </div>
              )}
            </div>
          </div>

          {/* Application State Section */}
          <div className="info-section">
            <h3>
              <span className="icon">apps</span>
              Application State
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Current App:</span>
                <span className="value">{systemData.currentApp}</span>
              </div>
              <div className="info-item">
                <span className="label">Orchestrator Model:</span>
                <span className="value">{systemData.orchestratorModel}</span>
              </div>
              <div className="info-item">
                <span className="label">Theme:</span>
                <span className="value">{systemData.theme}</span>
              </div>
              <div className="info-item">
                <span className="label">Online Status:</span>
                <span className={`status ${systemData.browser.onLine ? 'success' : 'error'}`}>
                  {systemData.browser.onLine ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Browser Information Section */}
          <div className="info-section">
            <h3>
              <span className="icon">web</span>
              Browser Information
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Language:</span>
                <span className="value">{systemData.browser.language}</span>
              </div>
              <div className="info-item">
                <span className="label">Platform:</span>
                <span className="value">{systemData.browser.platform}</span>
              </div>
              <div className="info-item">
                <span className="label">Cookies:</span>
                <span className={`status ${systemData.browser.cookieEnabled ? 'success' : 'error'}`}>
                  {systemData.browser.cookieEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Screen Resolution:</span>
                <span className="value">{systemData.screen.width} × {systemData.screen.height}</span>
              </div>
              <div className="info-item">
                <span className="label">Window Size:</span>
                <span className="value">{systemData.window.innerWidth} × {systemData.window.innerHeight}</span>
              </div>
              <div className="info-item">
                <span className="label">Pixel Ratio:</span>
                <span className="value">{systemData.window.devicePixelRatio}x</span>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="info-footer">
            <span className="timestamp">Generated: {new Date(systemData.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}