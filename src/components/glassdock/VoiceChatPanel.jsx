/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import '../../styles/components/glass-dock.css';

export default function VoiceChatPanel({
  connected,
  recording,
  screenAware,
  selectedVoice,
  messages = [],
  width = 340,
  height = 420,
  inputTranscript,
  outputTranscript,
  endRef,
  onClose,
  onResizeStart
}) {
  return (
    <div
      className="voice-chat-section"
      onClick={(e) => e.stopPropagation()}
      style={{ width: `${width}px`, maxHeight: `${height}px` }}
    >
      <div className="voice-chat-header-minimal">
        <div className="status-light-container">
          <div className={`status-light ${connected ? 'online' : 'offline'}`}>
            {connected && <div className="status-pulse"></div>}
          </div>
        </div>
        <button className="icon-btn close-btn" onClick={onClose} title="Close & Disconnect" aria-label="Close and disconnect">
          <span className="icon">close</span>
        </button>
      </div>

      {/* System Messages Overlay (top) */}
      <div className="system-messages-overlay">
        {messages.filter(m => m.role === 'system').map((msg) => (
          <div key={msg.id} className="system-message-toast">{msg.content}</div>
        ))}
      </div>

      {/* Display Canvas */}
      <div className="voice-chat-canvas">
        {connected ? (
          <div className="voice-visualization">
            <div className="voice-waves-container">
              <div className="voice-waves">
                <div className={`wave ${recording ? 'active' : ''}`}></div>
                <div className={`wave ${recording ? 'active' : ''}`}></div>
                <div className={`wave ${recording ? 'active' : ''}`}></div>
                <div className={`wave ${recording ? 'active' : ''}`}></div>
                <div className={`wave ${recording ? 'active' : ''}`}></div>
              </div>
              {screenAware && (
                <>
                  <span className="awareness-plus">+</span>
                  <svg className="eye-icon blinking" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                  </svg>
                </>
              )}
            </div>
            <div className="voice-status-text">
              {recording ? 'Listening...' : 'Ready to listen'}
            </div>
          </div>
        ) : (
          <div className="voice-connect-prompt">
            <span className="icon">mic</span>
            <p>Click the dock icon to connect</p>
            <span className="voice-name">Voice: {selectedVoice}</span>
          </div>
        )}

        <div className="voice-chat-messages">
          {messages.filter(m => m.role !== 'system').map((msg) => (
            <div key={msg.id} className={`message message-${msg.role}`}>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
          {inputTranscript && !messages.find(m => m.content === inputTranscript) && (
            <div className="message message-user message-transcribing">
              <div className="message-content">{inputTranscript}</div>
            </div>
          )}
          {outputTranscript && (
            <div className="message message-assistant message-transcribing">
              <div className="message-content">{outputTranscript}</div>
            </div>
          )}
          {endRef ? <div ref={endRef} /> : null}
        </div>
      </div>

      {/* Resize handle */}
      <div className="voice-chat-resize-handle" onMouseDown={onResizeStart} title="Drag to resize">
        <span className="icon">open_in_full</span>
      </div>
    </div>
  );
}
