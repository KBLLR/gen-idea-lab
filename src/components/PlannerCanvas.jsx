/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useStore from '../lib/store';
import { modules } from '../lib/modules';
import { specializedTasks } from '../lib/assistant/tasks';
import { extractCompleteContext } from '../lib/contextExtraction';
import ReactFlow, { Background, Controls, MiniMap, ReactFlowProvider, addEdge, useEdgesState, useNodesState, useReactFlow, Handle, Position } from 'reactflow';
import NodeConfigModal from './NodeConfigModal';
import 'reactflow/dist/style.css';
import '../styles/components/planner.css';

const nodeStyles = {
  module: { className: 'node-card node-module' },
  assistant: { className: 'node-card node-assistant' },
  task: { className: 'node-card node-task' },
  tool: { className: 'node-card node-tool' },
  workflow: { className: 'node-card node-workflow' },
  connector: { className: 'node-card node-connector' },
  source: { className: 'node-card node-source' },
  'model-provider': { className: 'node-card node-model-provider' },
  'app-state-snapshot': { className: 'node-card node-app-state-snapshot' },
  'image-canvas': { className: 'node-card node-image-canvas' },
  'audio-player': { className: 'node-card node-audio-player' },
  'text-renderer': { className: 'node-card node-text-renderer' },
  'file-uploader': { className: 'node-card node-file-uploader' },
  'google-calendar': { className: 'node-card node-google-calendar' },
  'google-drive': { className: 'node-card node-google-drive' },
  'google-photos': { className: 'node-card node-google-photos' },
  'gmail': { className: 'node-card node-gmail' },
};

const normalizeNodesForComparison = (nodes = []) =>
  nodes.map(({
    positionAbsolute,
    dragging,
    selected,
    width,
    height,
    measured,
    z,
    ...rest
  }) => ({ ...rest }));

const normalizeEdgesForComparison = (edges = []) =>
  edges.map(({ selected, ...rest }) => ({ ...rest }));

function LabelNode({ data }) {
  // Apply connector-specific styling
  const getConnectorClass = () => {
    if (data.connectorType === 'loop') return 'loop-connector';
    if (data.connectorType === 'trigger') return 'trigger-connector';
    return '';
  };

  // Extract state from data (idle | processing | complete | error)
  const state = data.state || 'idle';
  const error = data.error;

  // Get state-specific styling
  const getStateColor = () => {
    switch (state) {
      case 'processing': return '#3b82f6'; // blue
      case 'complete': return '#10b981'; // green
      case 'error': return '#ef4444'; // red
      default: return null; // no special color for idle
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case 'processing': return 'pending';
      case 'complete': return 'check_circle';
      case 'error': return 'error';
      default: return null;
    }
  };

  const connectorClass = getConnectorClass();
  const stateClass = state !== 'idle' ? `node-state-${state}` : '';
  const nodeClass = `${data.className} ${connectorClass} ${stateClass}`.trim();
  const stateColor = getStateColor();
  const stateIcon = getStateIcon();

  return (
    <div className={nodeClass} style={stateColor ? { borderColor: stateColor } : {}}>
      {/* Input handle on the left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      <div className="node-title">
        {data.label}
        {stateIcon && (
          <span className="icon" style={{ color: stateColor, marginLeft: '8px', fontSize: '16px' }}>
            {stateIcon}
          </span>
        )}
        {state === 'processing' && <span className="state-indicator processing-spinner"></span>}
      </div>
      {data.sub && <div className="node-sub">{data.sub}</div>}
      {data.description && <div className="node-description">{data.description}</div>}

      {/* Error display */}
      {state === 'error' && error && (
        <div className="node-error">
          <span className="icon" style={{ color: '#ef4444' }}>error</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {/* Connector badge */}
      {data.connectorType && data.connectorType !== 'none' && (
        <div className="connector-badge">{data.connectorType}</div>
      )}

      {/* Output handle on the right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
}

export default function PlannerCanvas(props) {
  return (
    <ReactFlowProvider>
      <PlannerCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

// Create a context for sharing setNodes function and canvas ref
const NodeUpdateContext = React.createContext();

function ModelProviderNode({ data, id }) {
  const [contextMenu, setContextMenu] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const { updateNode, canvasRef } = React.useContext(NodeUpdateContext);
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();

  const handleDoubleClick = useCallback(async (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Ensure the node is not in selected state for double-click to work
    if (event.detail === 2) { // Verify it's actually a double-click

    // Fetch available models from the unified endpoint
    let models = [];
    try {
      const response = await fetch('/api/models', { credentials: 'include' });
      if (response.ok) {
        const responseData = await response.json();
        const allModels = responseData.models || [];
        // Filter models by this provider
        const providerModels = allModels.filter(m =>
          m.provider.toLowerCase() === data.providerId.toLowerCase()
        );
        models = providerModels.map(m => ({
          id: m.id,
          name: m.name,
          description: `${m.provider} - ${m.category}`
        }));
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }

    setAvailableModels(models);

    // Get the canvas container bounds to position relative to it
    const canvasElement = canvasRef?.current;
    if (canvasElement) {
      const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const screenPosition = flowToScreenPosition(flowPosition);
      const canvasRect = canvasElement.getBoundingClientRect();

      setContextMenu({
        x: screenPosition.x - canvasRect.left + 2,
        y: screenPosition.y - canvasRect.top + 2,
        positionType: 'absolute',
      });
    } else {
      setContextMenu({
        x: event.clientX + 2,
        y: event.clientY + 2,
        positionType: 'fixed',
      });
    }
    } // Close the event.detail === 2 check
  }, [data, screenToFlowPosition, flowToScreenPosition, canvasRef]);

  const handleModelSelect = useCallback((model) => {
    if (updateNode) {
      updateNode(id, {
        selectedModel: model,
        sub: `Model: ${model.name}${model.description ? ` (${model.description})` : ''}`
      });
    }
    setContextMenu(null);
  }, [id, updateNode]);

  const handleClickOutside = useCallback((event) => {
    if (contextMenu && !event.target.closest('.context-menu')) {
      setContextMenu(null);
    }
  }, [contextMenu]);

  // Close context menu on outside click
  useEffect(() => {
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu, handleClickOutside]);

  const portalTarget = contextMenu?.positionType === 'absolute' ? canvasRef?.current : null;

  const menuContent = contextMenu ? (
    <div
      className="context-menu"
      style={{
        position: contextMenu.positionType === 'absolute' ? 'absolute' : 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        zIndex: 1000,
      }}
    >
      <div className="context-menu-header">Select Model</div>
      {availableModels.length === 0 ? (
        <div className="context-menu-item disabled">No models available</div>
      ) : (
        availableModels.map((model) => (
          <div
            key={model.id}
            className="context-menu-item"
            onClick={() => handleModelSelect(model)}
          >
            <div className="model-name">{model.name}</div>
            {model.description && (
              <div className="model-description">{model.description}</div>
            )}
          </div>
        ))
      )}
    </div>
  ) : null;

  const renderedMenu = contextMenu
    ? portalTarget
      ? createPortal(menuContent, portalTarget)
      : menuContent
    : null;

  return (
    <div className={data.className} onDoubleClick={handleDoubleClick}>
      {/* Input handle on the left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      <div className="node-title">{data.label}</div>
      {data.sub && <div className="node-sub">{data.sub}</div>}

      {/* Output handle on the right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />
      {renderedMenu}
    </div>
  );
}

// ArchivAI Template Node Component
function ArchivAITemplateNode({ data, id }) {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [templateData, setTemplateData] = useState({});
  const [outputFormat, setOutputFormat] = useState('markdown');
  const { updateNode } = React.useContext(NodeUpdateContext);

  const templateFields = data.fields || [];

  const handleConfigure = useCallback(() => {
    setIsConfiguring(true);
  }, []);

  const handleSave = useCallback(() => {
    // Update node with configuration
    updateNode(id, {
      ...data,
      configured: true,
      templateData,
      outputFormat,
      sub: `${data.templateType} • ${outputFormat.toUpperCase()}`
    });
    setIsConfiguring(false);
  }, [id, data, templateData, outputFormat, updateNode]);

  const handleCancel = useCallback(() => {
    setIsConfiguring(false);
  }, []);

  return (
    <div className={`${data.className} node-archiva-template`}>
      {/* Input handle on the left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      <div className="node-title">{data.label}</div>
      {data.sub && <div className="node-sub">{data.sub}</div>}

      {!data.configured && (
        <div className="node-config-prompt">
          <button onClick={handleConfigure} className="btn-configure">
            <span className="icon">settings</span>
            Configure Template
          </button>
        </div>
      )}

      {/* Output handle on the right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      {/* Configuration Modal */}
      {isConfiguring && (
        <div className="template-config-modal">
          <div className="config-header">
            <h3>Configure {data.label}</h3>
            <p>{data.purpose}</p>
          </div>

          <div className="config-body">
            <div className="config-section">
              <label>Output Format:</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="format-select"
              >
                <option value="markdown">Markdown (.md)</option>
                <option value="html">HTML (.html)</option>
              </select>
            </div>

            <div className="config-section">
              <label>Template Fields:</label>
              <div className="fields-preview">
                {templateFields.slice(0, 5).map((field, index) => (
                  <div key={index} className="field-preview">
                    <span className="field-name">{field.label}</span>
                    <span className="field-type">{field.field_type}</span>
                  </div>
                ))}
                {templateFields.length > 5 && (
                  <div className="field-preview">
                    <span className="field-more">+ {templateFields.length - 5} more fields</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="config-actions">
            <button onClick={handleCancel} className="btn-cancel">Cancel</button>
            <button onClick={handleSave} className="btn-save">Save Configuration</button>
          </div>
        </div>
      )}
    </div>
  );
}

// App State Snapshot Node Component
function AppStateSnapshotNode({ data, id }) {
  const [snapshotData, setSnapshotData] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { updateNode } = React.useContext(NodeUpdateContext);

  const captureAppState = useCallback(async () => {
    setIsCapturing(true);

    try {
      // Use the comprehensive context extraction utility
      const snapshot = extractCompleteContext();

      setSnapshotData(snapshot);

      // Update node with snapshot preview
      updateNode(id, {
        ...data,
        captured: true,
        snapshotData: snapshot,
        sub: `Captured ${new Date().toLocaleTimeString()} • ${snapshot.workflow.activeApp || 'No active app'}`
      });

    } catch (error) {
      console.error('Failed to capture app state:', error);
      updateNode(id, {
        ...data,
        sub: 'Capture failed - please try again'
      });
    } finally {
      setIsCapturing(false);
    }
  }, [id, data, updateNode]);

  return (
    <div className={`${data.className} node-app-state-snapshot`}>
      {/* Input handle on the left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      <div className="node-title">
        <span className="icon">save</span>
        {data.label}
      </div>

      {data.sub && <div className="node-sub">{data.sub}</div>}

      {!data.captured && (
        <div className="node-action-button">
          <button
            onClick={captureAppState}
            className="btn-capture"
            disabled={isCapturing}
          >
            <span className="icon">{isCapturing ? 'hourglass_empty' : 'photo_camera'}</span>
            {isCapturing ? 'Capturing...' : 'Capture State'}
          </button>
        </div>
      )}

      {data.captured && snapshotData && (
        <div className="snapshot-preview">
          <div className="snapshot-info">
            <div className="info-line">
              <span className="info-label">App:</span>
              <span className="info-value">{snapshotData.workflow?.activeApp || 'None'}</span>
            </div>
            {snapshotData.module?.module && (
              <div className="info-line">
                <span className="info-label">Module:</span>
                <span className="info-value">{snapshotData.module.module.code}</span>
              </div>
            )}
            <div className="info-line">
              <span className="info-label">Services:</span>
              <span className="info-value">{snapshotData.workflow?.connectedServices?.length || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Output handle on the right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
}

// Image Canvas Node Component
function ImageCanvasNode({ data, id }) {
  const [imageData, setImageData] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const { updateNode } = React.useContext(NodeUpdateContext);

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target.result;
        setImageData(imageDataUrl);
        updateNode(id, {
          ...data,
          hasImage: true,
          imageData: imageDataUrl,
          sub: `Image loaded • ${file.name}`
        });
      };
      reader.readAsDataURL(file);
    }
  }, [id, data, updateNode]);

  const handleZoomToggle = useCallback(() => {
    setIsZoomed(!isZoomed);
    setScale(isZoomed ? 1 : 2);
  }, [isZoomed]);

  const handleDownload = useCallback(() => {
    if (imageData) {
      const link = document.createElement('a');
      link.href = imageData;
      link.download = 'canvas-image.png';
      link.click();
    }
  }, [imageData]);

  return (
    <div className={`${data.className} node-image-canvas`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      <div className="node-title">
        <span className="icon">image</span>
        {data.label}
      </div>

      {data.sub && <div className="node-sub">{data.sub}</div>}

      <div className="image-canvas-content">
        {!imageData && (
          <div className="image-upload-area">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id={`image-upload-${id}`}
            />
            <label htmlFor={`image-upload-${id}`} className="upload-label">
              <span className="icon">cloud_upload</span>
              <span>Upload Image</span>
            </label>
          </div>
        )}

        {imageData && (
          <div className="image-display">
            <div className="image-controls">
              <button onClick={handleZoomToggle} className="btn-icon" title="Toggle Zoom">
                <span className="icon">{isZoomed ? 'zoom_out' : 'zoom_in'}</span>
              </button>
              <button onClick={handleDownload} className="btn-icon" title="Download">
                <span className="icon">download</span>
              </button>
            </div>
            <div className="image-container" style={{ transform: `scale(${scale})` }}>
              <img src={imageData} alt="Canvas content" />
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
}

// Audio Player Node Component
function AudioPlayerNode({ data, id }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const { updateNode } = React.useContext(NodeUpdateContext);

  const handleAudioUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      updateNode(id, {
        ...data,
        hasAudio: true,
        audioUrl: url,
        sub: `Audio loaded • ${file.name}`
      });
    }
  }, [id, data, updateNode]);

  const togglePlayback = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const formatTime = useCallback((time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className={`${data.className} node-audio-player`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      <div className="node-title">
        <span className="icon">volume_up</span>
        {data.label}
      </div>

      {data.sub && <div className="node-sub">{data.sub}</div>}

      <div className="audio-player-content">
        {!audioUrl && (
          <div className="audio-upload-area">
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              style={{ display: 'none' }}
              id={`audio-upload-${id}`}
            />
            <label htmlFor={`audio-upload-${id}`} className="upload-label">
              <span className="icon">audiotrack</span>
              <span>Upload Audio</span>
            </label>
          </div>
        )}

        {audioUrl && (
          <div className="audio-player">
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            />

            <div className="audio-controls">
              <button onClick={togglePlayback} className="btn-play">
                <span className="icon">{isPlaying ? 'pause' : 'play_arrow'}</span>
              </button>

              <div className="audio-info">
                <div className="time-display">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
}

// Text Renderer Node Component
function TextRendererNode({ data, id }) {
  const [textContent, setTextContent] = useState('');
  const [renderMode, setRenderMode] = useState('markdown');
  const [isEditing, setIsEditing] = useState(false);
  const { updateNode } = React.useContext(NodeUpdateContext);

  const handleTextChange = useCallback((e) => {
    const newText = e.target.value;
    setTextContent(newText);
    updateNode(id, {
      ...data,
      textContent: newText,
      sub: `${renderMode} • ${newText.length} chars`
    });
  }, [id, data, updateNode, renderMode]);

  const handleModeChange = useCallback((mode) => {
    setRenderMode(mode);
    updateNode(id, {
      ...data,
      renderMode: mode,
      sub: `${mode} • ${textContent.length} chars`
    });
  }, [id, data, updateNode, textContent]);

  const renderContent = useCallback(() => {
    if (!textContent) return <div className="placeholder">Enter text content...</div>;

    switch (renderMode) {
      case 'markdown':
        // Simple markdown rendering for demo
        return (
          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{
              __html: textContent
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>')
            }}
          />
        );
      case 'code':
        return <pre className="code-content"><code>{textContent}</code></pre>;
      case 'plain':
      default:
        return <div className="plain-content">{textContent}</div>;
    }
  }, [textContent, renderMode]);

  return (
    <div className={`${data.className} node-text-renderer`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      <div className="node-title">
        <span className="icon">article</span>
        {data.label}
      </div>

      {data.sub && <div className="node-sub">{data.sub}</div>}

      <div className="text-renderer-content">
        <div className="text-controls">
          <div className="render-mode-tabs">
            {['plain', 'markdown', 'code'].map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`mode-tab ${renderMode === mode ? 'active' : ''}`}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-icon"
            title="Toggle Edit"
          >
            <span className="icon">{isEditing ? 'visibility' : 'edit'}</span>
          </button>
        </div>

        {isEditing ? (
          <textarea
            value={textContent}
            onChange={handleTextChange}
            placeholder="Enter your text content here..."
            className="text-input"
            rows={4}
          />
        ) : (
          <div className="text-display">
            {renderContent()}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
}

// File Uploader Node Component
function FileUploaderNode({ data, id }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const { updateNode } = React.useContext(NodeUpdateContext);

  const handleFileUpload = useCallback((files) => {
    const fileArray = Array.from(files);
    const newFiles = fileArray.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      url: URL.createObjectURL(file)
    }));

    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    updateNode(id, {
      ...data,
      files: updatedFiles,
      sub: `${updatedFiles.length} files uploaded`
    });
  }, [uploadedFiles, id, data, updateNode]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  }, [handleFileUpload]);

  const handleInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleRemoveFile = useCallback((index) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    updateNode(id, {
      ...data,
      files: updatedFiles,
      sub: `${updatedFiles.length} files uploaded`
    });
  }, [uploadedFiles, id, data, updateNode]);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className={`${data.className} node-file-uploader`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />

      <div className="node-title">
        <span className="icon">cloud_upload</span>
        {data.label}
      </div>

      {data.sub && <div className="node-sub">{data.sub}</div>}

      <div className="file-uploader-content">
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={handleInputChange}
            style={{ display: 'none' }}
            id={`file-upload-${id}`}
          />
          <label htmlFor={`file-upload-${id}`} className="upload-label">
            <span className="icon">add_circle</span>
            <span>Drop files or click to upload</span>
          </label>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="file-list">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="btn-remove"
                  title="Remove file"
                >
                  <span className="icon">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
}

// Google Calendar Node Component
function GoogleCalendarNode({ data, id }) {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPromptConfig, setShowPromptConfig] = useState(false);
  const [promptInstructions, setPromptInstructions] = useState(data.promptInstructions || 'Analyze my calendar events and suggest optimal scheduling for new meetings. Focus on finding gaps and avoiding conflicts.');
  const { updateNode } = React.useContext(NodeUpdateContext);
  // Optimized: specific selector to prevent unnecessary re-renders
  const isConnected = useStore(useCallback((state) => state.connectedServices?.googleCalendar?.connected, []));

  const fetchCalendarEvents = useCallback(async (date) => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      // TODO: Implement calendar API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      const mockEvents = [
        { id: 1, title: 'Team Meeting', time: '10:00 AM', duration: '1h' },
        { id: 2, title: 'Project Review', time: '2:00 PM', duration: '30m' }
      ];
      setEvents(mockEvents);
      updateNode(id, { ...data, events: mockEvents, lastUpdated: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, id, data, updateNode]);

  useEffect(() => {
    fetchCalendarEvents(selectedDate);
  }, [selectedDate, fetchCalendarEvents]);

  const handleDoubleClick = (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    setShowPromptConfig(true);
  };

  const savePromptInstructions = () => {
    updateNode(id, { ...data, promptInstructions });
    setShowPromptConfig(false);
  };

  return (
    <div className="node-card node-google-calendar" onDoubleClick={handleDoubleClick}>
      <Handle type="target" position={Position.Left} style={{ background: '#ea4335' }} />

      <div className="node-header">
        <span className="node-icon" style={{ color: '#ea4335' }}>event</span>
        <div className="node-title">Google Calendar</div>
        {data.promptInstructions && <span className="prompt-indicator">💬</span>}
      </div>

      {showPromptConfig && (
        <div className="prompt-config-modal">
          <div className="prompt-config-header">
            <h4>Calendar Instructions</h4>
            <button onClick={() => setShowPromptConfig(false)} className="close-btn">×</button>
          </div>
          <textarea
            value={promptInstructions}
            onChange={(e) => setPromptInstructions(e.target.value)}
            placeholder="Enter instructions for how the AI should interact with your calendar..."
            className="prompt-textarea"
            rows={4}
          />
          <div className="prompt-config-actions">
            <button onClick={savePromptInstructions} className="save-btn">Save Instructions</button>
            <button onClick={() => setShowPromptConfig(false)} className="cancel-btn">Cancel</button>
          </div>
        </div>
      )}

      {isConnected ? (
        <div className="calendar-content">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />

          {isLoading ? (
            <div className="loading">Loading events...</div>
          ) : (
            <div className="events-list">
              {events.length > 0 ? (
                events.map(event => (
                  <div key={event.id} className="event-item">
                    <span className="event-time">{event.time}</span>
                    <span className="event-title">{event.title}</span>
                    <span className="event-duration">{event.duration}</span>
                  </div>
                ))
              ) : (
                <div className="no-events">No events for this date</div>
              )}
            </div>
          )}

          <button onClick={() => fetchCalendarEvents(selectedDate)} className="refresh-btn">
            <span className="icon">refresh</span>
          </button>
        </div>
      ) : (
        <div className="not-connected">
          <span className="icon">warning</span>
          Calendar not connected
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: '#ea4335' }} />
      <div className="resize-handle"></div>
    </div>
  );
}

// Google Drive Node Component
function GoogleDriveNode({ data, id }) {
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('root');
  const [isLoading, setIsLoading] = useState(false);
  const [showSourceConfig, setShowSourceConfig] = useState(false);
  const [folderSearchTerm, setFolderSearchTerm] = useState('');
  const [folderResults, setFolderResults] = useState([]);
  const [showPromptConfig, setShowPromptConfig] = useState(false);
  const [promptInstructions, setPromptInstructions] = useState(data.promptInstructions || 'Help me organize my Google Drive files. Suggest folder structures and identify duplicate or outdated files that can be cleaned up.');
  const { updateNode } = React.useContext(NodeUpdateContext);
  // Optimized: specific selector to prevent unnecessary re-renders
  const isConnected = useStore(useCallback((state) => state.connectedServices?.googleDrive?.connected, []));

  const fetchDriveFiles = useCallback(async (folderId = 'root') => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ folderId });
      const response = await fetch(`/api/services/googleDrive/files?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Drive API error');
      }
      const payload = await response.json();
      const list = (payload.files || []).map(f => ({
        id: f.id,
        name: f.name,
        type: f.kind === 'folder' ? 'folder' : 'file',
        icon: f.kind === 'folder' ? 'folder' : (f.mimeType?.startsWith('image/') ? 'image' : 'description'),
        size: f.size,
        webViewLink: f.webViewLink,
      }));
      setFiles(list);
      updateNode(id, { ...data, files: list, currentFolder: folderId, lastUpdated: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to fetch Drive files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, id, data, updateNode]);

  useEffect(() => {
    fetchDriveFiles(currentFolder);
  }, [currentFolder, fetchDriveFiles]);

  const handleDoubleClick = (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    setShowSourceConfig(true);
  };

  const searchFolders = useCallback(async () => {
    if (!isConnected) return;
    try {
      const params = new URLSearchParams({ q: folderSearchTerm });
      const res = await fetch(`/api/services/googleDrive/files?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) {
        console.warn('Drive search failed');
        setFolderResults([]);
        return;
      }
      const json = await res.json();
      const onlyFolders = (json.files || []).filter(f => (f.mimeType || '').includes('application/vnd.google-apps.folder'));
      setFolderResults(onlyFolders);
    } catch (e) {
      console.error('Drive folder search error:', e);
      setFolderResults([]);
    }
  }, [folderSearchTerm, isConnected]);

  const savePromptInstructions = () => {
    updateNode(id, { ...data, promptInstructions });
    setShowPromptConfig(false);
  };

  return (
    <div className="node-card node-google-drive" onDoubleClick={handleDoubleClick}>
      <Handle type="target" position={Position.Left} style={{ background: '#4285f4' }} />

      <div className="node-header">
        <span className="node-icon" style={{ color: '#4285f4' }}>cloud</span>
        <div className="node-title">Google Drive</div>
        {data.promptInstructions && <span className="prompt-indicator">💬</span>}
      </div>

      {showSourceConfig && (
        <div className="prompt-config-modal">
          <div className="prompt-config-header">
            <h4>Select Drive Source</h4>
            <button onClick={() => setShowSourceConfig(false)} className="close-btn">×</button>
          </div>
          <div className="source-config-body">
            <div className="input-row">
              <button
                className="save-btn"
                onClick={() => {
                  setCurrentFolder('root');
                  updateNode(id, { ...data, currentFolder: 'root', sub: 'My Drive (root)' });
                  setShowSourceConfig(false);
                }}
              >
                Use My Drive (root)
              </button>
            </div>
            <div className="input-row" style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={folderSearchTerm}
                onChange={(e) => setFolderSearchTerm(e.target.value)}
                placeholder="Search folders by name..."
                className="prompt-textarea"
                style={{ minHeight: 0, height: 36 }}
              />
              <button className="save-btn" onClick={searchFolders}>Search</button>
            </div>
            <div className="files-list">
              {folderResults.map(f => (
                <div key={f.id} className="file-item" onClick={() => {
                  setCurrentFolder(f.id);
                  updateNode(id, { ...data, currentFolder: f.id, sub: `Folder: ${f.name}` });
                  setShowSourceConfig(false);
                }}>
                  <span className="file-icon icon">folder</span>
                  <div className="file-info">
                    <span className="file-name">{f.name}</span>
                  </div>
                </div>
              ))}
              {folderResults.length === 0 && (
                <div className="no-events">Search for a folder to select as source</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPromptConfig && (
        <div className="prompt-config-modal">
          <div className="prompt-config-header">
            <h4>Drive Instructions</h4>
            <button onClick={() => setShowPromptConfig(false)} className="close-btn">×</button>
          </div>
          <textarea
            value={promptInstructions}
            onChange={(e) => setPromptInstructions(e.target.value)}
            placeholder="Enter instructions for how the AI should interact with your Google Drive..."
            className="prompt-textarea"
            rows={4}
          />
          <div className="prompt-config-actions">
            <button onClick={savePromptInstructions} className="save-btn">Save Instructions</button>
            <button onClick={() => setShowPromptConfig(false)} className="cancel-btn">Cancel</button>
          </div>
        </div>
      )}

      {isConnected ? (
        <div className="drive-content">
          {isLoading ? (
            <div className="loading">Loading files...</div>
          ) : (
            <div className="files-list">
              {files.map(file => (
                <div key={file.id} className="file-item" onClick={() => file.type === 'folder' ? setCurrentFolder(file.id) : (file.webViewLink && window.open(file.webViewLink, '_blank'))} title={file.webViewLink ? 'Open in Drive' : ''}>
                  <span className="file-icon icon">{file.icon}</span>
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    {file.size && <span className="file-size">{file.size}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="drive-actions">
            <button onClick={() => fetchDriveFiles(currentFolder)} className="refresh-btn">
              <span className="icon">refresh</span>
            </button>
            {currentFolder !== 'root' && (
              <button onClick={() => setCurrentFolder('root')} className="back-btn">
                <span className="icon">arrow_back</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="not-connected">
          <span className="icon">warning</span>
          Drive not connected
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: '#4285f4' }} />
      <div className="resize-handle"></div>
    </div>
  );
}

// Google Photos Node Component
function GooglePhotosNode({ data, id }) {
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSourceConfig, setShowSourceConfig] = useState(false);
  const [showPromptConfig, setShowPromptConfig] = useState(false);
  const [promptInstructions, setPromptInstructions] = useState(data.promptInstructions || 'Help me organize my photo collection. Identify similar photos, suggest albums to create, and find the best photos from events or trips.');
  const { updateNode } = React.useContext(NodeUpdateContext);
  // Optimized: specific selector to prevent unnecessary re-renders
  const isConnected = useStore(useCallback((state) => state.connectedServices?.googlePhotos?.connected, []));

  const fetchAlbums = useCallback(async () => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/services/googlePhotos/albums', { credentials: 'include' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Photos API error');
      }
      const payload = await response.json();
      setAlbums(payload.albums || []);
      updateNode(id, { ...data, albums: payload.albums || [], lastUpdated: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to fetch albums:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, id, data, updateNode]);

  const fetchPhotos = useCallback(async (albumId) => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ albumId });
      const response = await fetch(`/api/services/googlePhotos/mediaItems?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Photos API error');
      }
      const payload = await response.json();
      const list = (payload.mediaItems || []).map(m => ({ id: m.id, url: `${m.baseUrl}=w400-h400`, title: m.filename }));
      setPhotos(list);
      updateNode(id, { ...data, photos: list, selectedAlbum: albumId, lastUpdated: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, id, data, updateNode]);

  useEffect(() => {
    if (selectedAlbum) {
      fetchPhotos(selectedAlbum);
    } else {
      fetchAlbums();
    }
  }, [selectedAlbum, fetchPhotos, fetchAlbums]);

  const handleDoubleClick = (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    setShowSourceConfig(true);
    fetchAlbums();
  };

  const savePromptInstructions = () => {
    updateNode(id, { ...data, promptInstructions });
    setShowPromptConfig(false);
  };

  return (
    <div className="node-card node-google-photos" onDoubleClick={handleDoubleClick}>
      <Handle type="target" position={Position.Left} style={{ background: '#fbbc04' }} />

      <div className="node-header">
        <span className="node-icon" style={{ color: '#fbbc04' }}>photo_library</span>
        <div className="node-title">Google Photos</div>
        {data.promptInstructions && <span className="prompt-indicator">💬</span>}
      </div>

      {showSourceConfig && (
        <div className="prompt-config-modal">
          <div className="prompt-config-header">
            <h4>Select Album</h4>
            <button onClick={() => setShowSourceConfig(false)} className="close-btn">×</button>
          </div>
          <div className="albums-list">
            {albums.length === 0 && <div className="loading">Loading albums...</div>}
            {albums.map(album => (
              <div key={album.id} className="album-item" onClick={() => {
                setSelectedAlbum(album.id);
                updateNode(id, { ...data, selectedAlbum: album.id, sub: `Album: ${album.title}` });
                setShowSourceConfig(false);
              }}>
                <span className="album-icon icon">photo_album</span>
                <div className="album-info">
                  <span className="album-title">{album.title}</span>
                  <span className="album-count">{album.count} photos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPromptConfig && (
        <div className="prompt-config-modal">
          <div className="prompt-config-header">
            <h4>Photos Instructions</h4>
            <button onClick={() => setShowPromptConfig(false)} className="close-btn">×</button>
          </div>
          <textarea
            value={promptInstructions}
            onChange={(e) => setPromptInstructions(e.target.value)}
            placeholder="Enter instructions for how the AI should interact with your Google Photos..."
            className="prompt-textarea"
            rows={4}
          />
          <div className="prompt-config-actions">
            <button onClick={savePromptInstructions} className="save-btn">Save Instructions</button>
            <button onClick={() => setShowPromptConfig(false)} className="cancel-btn">Cancel</button>
          </div>
        </div>
      )}

      {isConnected ? (
        <div className="photos-content">
          {selectedAlbum ? (
            <div className="photos-view">
              <button onClick={() => setSelectedAlbum(null)} className="back-btn">
                <span className="icon">arrow_back</span> Back to albums
              </button>
              {isLoading ? (
                <div className="loading">Loading photos...</div>
              ) : (
                <div className="photos-grid">
                  {photos.map(photo => (
                    <div key={photo.id} className="photo-item">
                      <img src={photo.url} alt={photo.title} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="albums-view">
              {isLoading ? (
                <div className="loading">Loading albums...</div>
              ) : (
                <div className="albums-list">
                  {albums.map(album => (
                    <div key={album.id} className="album-item" onClick={() => setSelectedAlbum(album.id)}>
                      <span className="album-icon icon">photo_album</span>
                      <div className="album-info">
                        <span className="album-title">{album.title}</span>
                        <span className="album-count">{album.count} photos</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="not-connected">
          <span className="icon">warning</span>
          Photos not connected
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: '#fbbc04' }} />
      <div className="resize-handle"></div>
    </div>
  );
}

// Gmail Node Component
function GmailNode({ data, id }) {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSourceConfig, setShowSourceConfig] = useState(false);
  const [labelValue, setLabelValue] = useState(data.gmailLabelIds || 'INBOX');
  const [queryValue, setQueryValue] = useState(data.gmailQuery || '');
  const [showPromptConfig, setShowPromptConfig] = useState(false);
  const [promptInstructions, setPromptInstructions] = useState(data.promptInstructions || 'Help me manage my email efficiently. Prioritize important messages, suggest responses, and identify emails that need follow-up action.');
  const { updateNode } = React.useContext(NodeUpdateContext);
  // Optimized: specific selector to prevent unnecessary re-renders
  const isConnected = useStore(useCallback((state) => state.connectedServices?.gmail?.connected, []));

  const fetchMessages = useCallback(async () => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ maxResults: '10', labelIds: labelValue || 'INBOX', q: queryValue || '' });
      const response = await fetch(`/api/services/gmail/messages?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Gmail API error');
      }
      const payload = await response.json();
      const list = (payload.messages || []).map(m => ({
        id: m.id,
        subject: m.subject,
        sender: m.from,
        preview: m.snippet,
        unread: !!m.unread,
        date: m.date,
      }));
      setMessages(list);
      updateNode(id, { ...data, messages: list, unreadCount: list.filter(m => m.unread).length, lastUpdated: new Date().toISOString(), gmailLabelIds: labelValue, gmailQuery: queryValue });
    } catch (error) {
      console.error('Failed to fetch Gmail messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, id, data, updateNode, labelValue, queryValue]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleDoubleClick = (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    setShowSourceConfig(true);
  };

  const savePromptInstructions = () => {
    updateNode(id, { ...data, promptInstructions });
    setShowPromptConfig(false);
  };

  return (
    <div className="node-card node-gmail" onDoubleClick={handleDoubleClick}>
      <Handle type="target" position={Position.Left} style={{ background: '#34a853' }} />

      <div className="node-header">
        <span className="node-icon" style={{ color: '#34a853' }}>email</span>
        <div className="node-title">Gmail</div>
        {data.unreadCount > 0 && <span className="unread-badge">{data.unreadCount}</span>}
        {data.promptInstructions && <span className="prompt-indicator">💬</span>}
      </div>

      {showSourceConfig && (
        <div className="prompt-config-modal">
          <div className="prompt-config-header">
            <h4>Select Mail Source</h4>
            <button onClick={() => setShowSourceConfig(false)} className="close-btn">×</button>
          </div>
          <div className="prompt-config-body">
            <div className="input-row">
              <label style={{ marginRight: 8 }}>Label</label>
              <select value={labelValue} onChange={(e) => setLabelValue(e.target.value)}>
                <option value="INBOX">INBOX</option>
                <option value="STARRED">STARRED</option>
                <option value="UNREAD">UNREAD</option>
                <option value="IMPORTANT">IMPORTANT</option>
                <option value="SENT">SENT</option>
              </select>
            </div>
            <div className="input-row" style={{ marginTop: 8 }}>
              <label style={{ marginRight: 8 }}>Query</label>
              <input
                type="text"
                value={queryValue}
                onChange={(e) => setQueryValue(e.target.value)}
                placeholder="from:boss subject:report is:unread"
              />
            </div>
            <div className="prompt-config-actions">
              <button
                className="save-btn"
                onClick={() => {
                  updateNode(id, { ...data, gmailLabelIds: labelValue, gmailQuery: queryValue });
                  setShowSourceConfig(false);
                  setTimeout(() => fetchMessages(), 0);
                }}
              >
                Apply
              </button>
              <button onClick={() => setShowSourceConfig(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showPromptConfig && (
        <div className="prompt-config-modal">
          <div className="prompt-config-header">
            <h4>Gmail Instructions</h4>
            <button onClick={() => setShowPromptConfig(false)} className="close-btn">×</button>
          </div>
          <textarea
            value={promptInstructions}
            onChange={(e) => setPromptInstructions(e.target.value)}
            placeholder="Enter instructions for how the AI should interact with your Gmail..."
            className="prompt-textarea"
            rows={4}
          />
          <div className="prompt-config-actions">
            <button onClick={savePromptInstructions} className="save-btn">Save Instructions</button>
            <button onClick={() => setShowPromptConfig(false)} className="cancel-btn">Cancel</button>
          </div>
        </div>
      )}

      {isConnected ? (
        <div className="gmail-content">
          {selectedMessage ? (
            <div className="message-view">
              <button onClick={() => setSelectedMessage(null)} className="back-btn">
                <span className="icon">arrow_back</span> Back to inbox
              </button>
              <div className="message-details">
                <h4>{selectedMessage.subject}</h4>
                <p className="sender">From: {selectedMessage.sender}</p>
                <p className="preview">{selectedMessage.preview}</p>
              </div>
            </div>
          ) : (
            <div className="messages-view">
              {isLoading ? (
                <div className="loading">Loading messages...</div>
              ) : (
                <div className="messages-list">
                  {messages.map(message => (
                    <div key={message.id} className={`message-item ${message.unread ? 'unread' : ''}`} onClick={() => setSelectedMessage(message)}>
                      <div className="message-sender">{message.sender}</div>
                      <div className="message-subject">{message.subject}</div>
                      <div className="message-preview">{message.preview}</div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={fetchMessages} className="refresh-btn">
                <span className="icon">refresh</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="not-connected">
          <span className="icon">warning</span>
          Gmail not connected
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: '#34a853' }} />
      <div className="resize-handle"></div>
    </div>
  );
}

// University Student Data Node Component
function UniversityStudentNode({ data, id }) {
  const [studentData, setStudentData] = useState(null);
  const [showPromptConfig, setShowPromptConfig] = useState(false);
  const [promptInstructions, setPromptInstructions] = useState(data.promptInstructions || 'Analyze my academic progress and suggest areas for improvement. Focus on course performance, assignment completion, and semester planning.');
  const [isLoading, setIsLoading] = useState(false);
  const { updateNode } = React.useContext(NodeUpdateContext);
  // Optimized: specific selector to prevent unnecessary re-renders
  const isConnected = useStore(useCallback((state) => state.connectedServices?.university?.connected, []));

  const fetchStudentData = useCallback(async () => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/university/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query studentData {
            me {
              firstName
              lastName
              email
              studentId
              program
              semester
              enrollments {
                course {
                  name
                  code
                  credits
                }
                grade
                status
              }
            }
          }`,
          operationName: 'studentData'
        })
      });

      const data = await response.json();
      if (data.data?.me) {
        setStudentData(data.data.me);
        updateNode(id, { ...data, studentData: data.data.me, lastUpdated: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Failed to fetch student data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, id, updateNode]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleDoubleClick = () => {
    setShowPromptConfig(true);
  };

  const savePromptInstructions = () => {
    updateNode(id, { ...data, promptInstructions });
    setShowPromptConfig(false);
  };

  return (
    <div className="node-card node-university-student" onDoubleClick={handleDoubleClick}>
      <Handle type="target" position={Position.Left} style={{ background: '#ff6b35' }} />

      <div className="node-header">
        <span className="node-icon" style={{ color: '#ff6b35' }}>school</span>
        <div className="node-title">Student Profile</div>
        {data.promptInstructions && <span className="prompt-indicator">💬</span>}
      </div>

      {showPromptConfig && (
        <div className="prompt-config-modal">
          <div className="prompt-config-header">
            <h4>Student Data Instructions</h4>
            <button onClick={() => setShowPromptConfig(false)} className="close-btn">×</button>
          </div>
          <textarea
            value={promptInstructions}
            onChange={(e) => setPromptInstructions(e.target.value)}
            placeholder="Enter instructions for how the AI should analyze your student data..."
            className="prompt-textarea"
            rows={4}
          />
          <div className="prompt-config-actions">
            <button onClick={savePromptInstructions} className="save-btn">Save Instructions</button>
            <button onClick={() => setShowPromptConfig(false)} className="cancel-btn">Cancel</button>
          </div>
        </div>
      )}

      {isConnected ? (
        <div className="university-content">
          {isLoading ? (
            <div className="loading">Loading student data...</div>
          ) : studentData ? (
            <div className="student-profile">
              <div className="student-info">
                <h4>{studentData.firstName} {studentData.lastName}</h4>
                <p>ID: {studentData.studentId}</p>
                <p>{studentData.program} - Semester {studentData.semester}</p>
              </div>

              <div className="courses-summary">
                <h5>Current Courses ({studentData.enrollments?.length || 0})</h5>
                {studentData.enrollments?.slice(0, 3).map((enrollment, index) => (
                  <div key={index} className="course-item">
                    <span className="course-code">{enrollment.course.code}</span>
                    <span className="course-name">{enrollment.course.name}</span>
                    <span className="course-grade">{enrollment.grade || 'In Progress'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-data">No student data available</div>
          )}

          <button onClick={fetchStudentData} className="refresh-btn">
            <span className="icon">refresh</span>
          </button>
        </div>
      ) : (
        <div className="not-connected">
          <span className="icon">warning</span>
          University not connected
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: '#ff6b35' }} />
      <div className="resize-handle"></div>
    </div>
  );
}

// University Courses Node Component
function UniversityCoursesNode({ data, id }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showPromptConfig, setShowPromptConfig] = useState(false);
  const [promptInstructions, setPromptInstructions] = useState(data.promptInstructions || 'Analyze my course performance and suggest study strategies. Focus on improving grades and time management for assignments.');
  const [isLoading, setIsLoading] = useState(false);
  const { updateNode } = React.useContext(NodeUpdateContext);
  // Optimized: specific selector to prevent unnecessary re-renders
  const isConnected = useStore(useCallback((state) => state.connectedServices?.university?.connected, []));

  const fetchCourses = useCallback(async () => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/university/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query studentCourses {
            me {
              enrollments {
                course {
                  id
                  name
                  code
                  credits
                  semester
                  instructor {
                    firstName
                    lastName
                  }
                }
                grade
                status
              }
            }
          }`,
          operationName: 'studentCourses'
        })
      });

      const data = await response.json();
      if (data.data?.me?.enrollments) {
        setCourses(data.data.me.enrollments);
        updateNode(id, { ...data, courses: data.data.me.enrollments, lastUpdated: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, id, updateNode]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDoubleClick = () => {
    setShowPromptConfig(true);
  };

  const savePromptInstructions = () => {
    updateNode(id, { ...data, promptInstructions });
    setShowPromptConfig(false);
  };

  return (
    <div className="node-card node-university-courses" onDoubleClick={handleDoubleClick}>
      <Handle type="target" position={Position.Left} style={{ background: '#4a90e2' }} />

      <div className="node-header">
        <span className="node-icon" style={{ color: '#4a90e2' }}>book</span>
        <div className="node-title">Course Enrollments</div>
        {data.promptInstructions && <span className="prompt-indicator">💬</span>}
      </div>

      {showPromptConfig && (
        <div className="prompt-config-modal">
          <div className="prompt-config-header">
            <h4>Courses Instructions</h4>
            <button onClick={() => setShowPromptConfig(false)} className="close-btn">×</button>
          </div>
          <textarea
            value={promptInstructions}
            onChange={(e) => setPromptInstructions(e.target.value)}
            placeholder="Enter instructions for how the AI should analyze your course data..."
            className="prompt-textarea"
            rows={4}
          />
          <div className="prompt-config-actions">
            <button onClick={savePromptInstructions} className="save-btn">Save Instructions</button>
            <button onClick={() => setShowPromptConfig(false)} className="cancel-btn">Cancel</button>
          </div>
        </div>
      )}

      {isConnected ? (
        <div className="university-content">
          {isLoading ? (
            <div className="loading">Loading courses...</div>
          ) : (
            <div className="courses-list">
              {courses.map((enrollment, index) => (
                <div key={index} className="course-enrollment" onClick={() => setSelectedCourse(enrollment)}>
                  <div className="course-header">
                    <span className="course-code">{enrollment.course.code}</span>
                    <span className="course-credits">{enrollment.course.credits} ECTS</span>
                  </div>
                  <div className="course-name">{enrollment.course.name}</div>
                  <div className="course-details">
                    <span className="instructor">
                      {enrollment.course.instructor?.firstName} {enrollment.course.instructor?.lastName}
                    </span>
                    <span className="grade">{enrollment.grade || enrollment.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={fetchCourses} className="refresh-btn">
            <span className="icon">refresh</span>
          </button>
        </div>
      ) : (
        <div className="not-connected">
          <span className="icon">warning</span>
          University not connected
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: '#4a90e2' }} />
      <div className="resize-handle"></div>
    </div>
  );
}

// AI Agent Node Component (Orchestrator as Node)
function AIAgentNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeName, setNodeName] = useState(data.nodeName || 'AI Agent');
  const { updateNode } = React.useContext(NodeUpdateContext);
  const setNodes = useStore.use.actions().setNodes;

  // Extract ports from data
  const inputs = data.inputs || [];
  const outputs = data.outputs || [];
  const settings = data.settings || {};
  const state = data.state || 'idle'; // idle | processing | complete | error
  const error = data.error;

  // Get state styling
  const getStateColor = () => {
    switch (state) {
      case 'processing': return '#3b82f6'; // blue
      case 'complete': return '#10b981'; // green
      case 'error': return '#ef4444'; // red
      default: return '#9333ea'; // purple (idle)
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case 'processing': return 'pending';
      case 'complete': return 'check_circle';
      case 'error': return 'error';
      default: return 'psychology';
    }
  };

  const handleNameChange = useCallback((e) => {
    setNodeName(e.target.value);
  }, []);

  const handleNameBlur = useCallback(() => {
    setIsEditing(false);
    updateNode(id, { nodeName });
  }, [id, nodeName, updateNode]);

  const handleNameKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      updateNode(id, { nodeName });
    }
  }, [id, nodeName, updateNode]);

  const handleEdit = useCallback(() => {
    // Switch back to node mode in GlassDock to edit configuration
    const store = useStore.getState();
    store.actions.becomePlannerNode({
      nodeName,
      inputs,
      outputs,
      settings,
      nodeId: id, // Pass existing ID for editing
    });
  }, [id, nodeName, inputs, outputs, settings]);

  const handleDelete = useCallback(() => {
    // Remove this node from the canvas
    useStore.setState((state) => {
      const plannerGraph = state.plannerGraph || { nodes: [], edges: [] };
      plannerGraph.nodes = plannerGraph.nodes.filter(n => n.id !== id);
      // Also remove any edges connected to this node
      plannerGraph.edges = plannerGraph.edges.filter(
        e => e.source !== id && e.target !== id
      );
    });
  }, [id]);

  return (
    <div className={`node-card node-ai-agent node-state-${state}`} style={{ borderColor: getStateColor() }}>
      {/* Input handles (left side) */}
      {inputs.map((input, index) => (
        <Handle
          key={`input-${index}`}
          type="target"
          position={Position.Left}
          id={input.id || `input-${index}`}
          style={{
            background: getStateColor(),
            width: 10,
            height: 10,
            border: '2px solid #fff',
            top: `${(100 / (inputs.length + 1)) * (index + 1)}%`,
          }}
          title={input.label || input.name}
        />
      ))}

      <div className="node-header ai-agent-header">
        <span className="node-icon" style={{ color: getStateColor() }}>{getStateIcon()}</span>
        {state === 'processing' && <span className="state-indicator processing-spinner"></span>}
        {isEditing ? (
          <input
            type="text"
            value={nodeName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyPress={handleNameKeyPress}
            className="node-name-input"
            autoFocus
          />
        ) : (
          <div
            className="node-title"
            onDoubleClick={() => setIsEditing(true)}
            title="Double-click to edit name"
          >
            {nodeName}
          </div>
        )}
      </div>

      {/* Port labels */}
      <div className="ai-agent-ports">
        {inputs.length > 0 && (
          <div className="ports-section">
            <div className="ports-label">Inputs:</div>
            {inputs.map((input, index) => (
              <div key={`input-label-${index}`} className="port-item">
                {input.label || input.name || `Input ${index + 1}`}
              </div>
            ))}
          </div>
        )}
        {outputs.length > 0 && (
          <div className="ports-section">
            <div className="ports-label">Outputs:</div>
            {outputs.map((output, index) => (
              <div key={`output-label-${index}`} className="port-item">
                {output.label || output.name || `Output ${index + 1}`}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings indicator */}
      {settings && Object.keys(settings).length > 0 && (
        <div className="ai-agent-settings">
          <span className="icon" style={{ fontSize: '14px' }}>settings</span>
          <span className="settings-text">
            {settings.screenAwareness && 'Screen • '}
            {settings.conversationHistory && 'History • '}
            {settings.maxTokens && `${settings.maxTokens} tokens`}
          </span>
        </div>
      )}

      {/* Error display */}
      {state === 'error' && error && (
        <div className="ai-agent-error">
          <span className="icon" style={{ color: '#ef4444' }}>error</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="ai-agent-actions">
        <button onClick={handleEdit} className="btn-icon" title="Edit Configuration" disabled={state === 'processing'}>
          <span className="icon">edit</span>
        </button>
        <button onClick={handleDelete} className="btn-icon btn-delete" title="Delete Node" disabled={state === 'processing'}>
          <span className="icon">delete</span>
        </button>
      </div>

      {/* Output handles (right side) */}
      {outputs.map((output, index) => (
        <Handle
          key={`output-${index}`}
          type="source"
          position={Position.Right}
          id={output.id || `output-${index}`}
          style={{
            background: getStateColor(),
            width: 10,
            height: 10,
            border: '2px solid #fff',
            top: `${(100 / (outputs.length + 1)) * (index + 1)}%`,
          }}
          title={output.label || output.name}
        />
      ))}
    </div>
  );
}

const nodeTypes = {
  default: LabelNode,
  'model-provider': ModelProviderNode,
  'archiva-template': ArchivAITemplateNode,
  'app-state-snapshot': AppStateSnapshotNode,
  'image-canvas': ImageCanvasNode,
  'audio-player': AudioPlayerNode,
  'text-renderer': TextRendererNode,
  'file-uploader': FileUploaderNode,
  'google-calendar': GoogleCalendarNode,
  'google-drive': GoogleDriveNode,
  'google-photos': GooglePhotosNode,
  'gmail': GmailNode,
  'university-student': UniversityStudentNode,
  'university-courses': UniversityCoursesNode,
  'ai-agent': AIAgentNode,
};

// Note: nodeStyles now include source and model-provider

function PlannerCanvasInner() {
  const persisted = useStore.use.plannerGraph?.() || { nodes: [], edges: [] };
  const [nodes, setNodes, onNodesChange] = useNodesState(persisted.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(persisted.edges || []);
  const [workflowTitle, setWorkflowTitle] = useState(persisted.title || '');
  const [hasHydrated, setHasHydrated] = useState(() => useStore.persist?.hasHydrated?.() ?? true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [titleError, setTitleError] = useState(null);
  const [configModalNode, setConfigModalNode] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const setActiveApp = useStore.use.actions().setActiveApp;
  const addCustomWorkflow = useStore.use.actions().addCustomWorkflow;
  const workflowAutoTitleModel = useStore.use.workflowAutoTitleModel();
  const { screenToFlowPosition } = useReactFlow();

  const rfRef = useRef(null);
  const fileInputRef = useRef(null);

  const persistedNodes = persisted?.nodes ?? [];
  const persistedEdges = persisted?.edges ?? [];
  const persistedTitle = persisted?.title ?? '';

  // Optimized: Use hash function instead of JSON.stringify for large graphs (10x faster)
  const currentGraphSignature = useMemo(
    () => {
      const nodeHash = nodes.reduce((acc, n) =>
        acc + n.id + n.type + (n.position?.x || 0) + (n.position?.y || 0), ''
      );
      const edgeHash = edges.reduce((acc, e) =>
        acc + e.source + e.target, ''
      );
      return `${nodeHash}|${edgeHash}|${workflowTitle || ''}`;
    },
    [nodes, edges, workflowTitle]
  );

  const persistedGraphSignature = useMemo(
    () => {
      const nodeHash = persistedNodes.reduce((acc, n) =>
        acc + n.id + n.type + (n.position?.x || 0) + (n.position?.y || 0), ''
      );
      const edgeHash = persistedEdges.reduce((acc, e) =>
        acc + e.source + e.target, ''
      );
      return `${nodeHash}|${edgeHash}|${persistedTitle || ''}`;
    },
    [persistedNodes, persistedEdges, persistedTitle]
  );

  useEffect(() => {
    const persistApi = useStore.persist;
    if (!persistApi?.onFinishHydration) {
      return;
    }

    const unsubscribe = persistApi.onFinishHydration(() => {
      setHasHydrated(true);
    });

    if (persistApi.hasHydrated?.()) {
      setHasHydrated(true);
    }

    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    if (currentGraphSignature === persistedGraphSignature) {
      return;
    }

    setNodes(persistedNodes.map((node) => ({ ...node })));
    setEdges(persistedEdges.map((edge) => ({ ...edge })));
    setWorkflowTitle(persistedTitle);
  }, [
    hasHydrated
    // Only depend on hasHydrated to prevent infinite loops
    // The signature comparison already handles changes
  ]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  // Handle node clicks to manage selection state
  const onNodeClick = useCallback((event, node) => {
    // Allow normal selection behavior, but ensure double-click works
  }, []);

  // Handle double-click for node configuration
  const onNodeDoubleClick = useCallback((event, node) => {
    // Nodes with their own double-click overlays should not open the generic config modal
    const skipTypes = new Set([
      'model-provider',
      'archiva-template',
      'google-calendar',
      'google-drive',
      'google-photos',
      'gmail',
    ]);
    if (skipTypes.has(node.type)) return;

    setConfigModalNode(node);
    setIsConfigModalOpen(true);
  }, []);

  // Handle configuration save
  const handleConfigSave = useCallback((updatedNode) => {
    setNodes(nds => nds.map(n => n.id === updatedNode.id ? updatedNode : n));
    setConfigModalNode(null);
    setIsConfigModalOpen(false);
  }, []);

  // Handle configuration modal close
  const handleConfigClose = useCallback(() => {
    setConfigModalNode(null);
    setIsConfigModalOpen(false);
  }, []);

  // Add a canvas click handler to deselect nodes
  const onPaneClick = useCallback(() => {
    setNodes((nds) => nds.map((node) => ({ ...node, selected: false })));
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData('application/x-planner');
    if (!payload) return;
    const item = JSON.parse(payload);

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

    let nid;
    let connectorType;
    if (item.kind === 'connector') {
      const [, subtypeRaw = ''] = item.id.split(':');
      connectorType = subtypeRaw || 'sequence';
      nid = `connector:${connectorType}:${Date.now()}`;
    } else {
      const baseId = `${item.kind}:${item.id}`;
      nid = `${baseId}:${Date.now()}`;
    }
    const styleClass = (nodeStyles[item.kind] || {}).className || 'node-card';

    // Determine subtext for modules
    let subText = item.meta?.description;
    if (item.kind === 'module') {
      const mod = Object.values(modules).find(m => m['Module Code'] === item.id);
      if (mod) {
        const qual = (mod['Qualification Objectives'] || []).join('; ');
        const key = mod['Key Contents / Topics'] || '';
        const prereq = mod['Prerequisites'] || '';
        subText = [`Objectives: ${qual}`, `Key: ${key}`, prereq ? `Prerequisites: ${prereq}` : '']
          .filter(Boolean)
          .join('\n');
      }
    }

    // Add the dropped node
    const nodeType = item.kind === 'model-provider' ? 'model-provider' :
                     item.kind === 'archiva-template' ? 'archiva-template' :
                     (item.kind === 'tool' && item.id === 'app_state_snapshot') ? 'app-state-snapshot' :
                     item.kind === 'image-canvas' ? 'image-canvas' :
                     item.kind === 'audio-player' ? 'audio-player' :
                     item.kind === 'text-renderer' ? 'text-renderer' :
                     item.kind === 'file-uploader' ? 'file-uploader' : 'default';
    setNodes((nds) => nds.concat({
      id: nid,
      type: nodeType,
      position,
      data: {
        label: item.label,
        className: styleClass,
        sub: subText || (item.kind === 'archiva-template' ? `${item.templateType} Template` : undefined),
        kind: item.kind,
        providerId: item.id, // Store the provider ID for model providers
        ...(connectorType ? { connectorType } : {}),
        // ArchivAI template specific data
        ...(item.kind === 'archiva-template' && {
          templateType: item.templateType,
          purpose: item.purpose,
          fields: item.fields,
          configured: false,
        }),
      },
    }));

    // If it's an assistant, auto-add its specialized tasks and connect
    if (item.kind === 'assistant') {
      const modCode = item.id;
      const spec = specializedTasks[modCode] || {};
      const createdTaskNodes = [];
      const now = Date.now();
      let i = 0;
      Object.values(spec).forEach(t => {
        const tnid = `task:${modCode}:${t.id}:${now + i}`;
        const tpos = { x: position.x + 240, y: position.y + i * 100 };
        createdTaskNodes.push({
          id: tnid,
          type: 'default',
          position: tpos,
          data: { label: t.name, className: (nodeStyles['task']||{}).className || 'node-card', sub: t.description }
        });
        i++;
      });
      if (createdTaskNodes.length) {
        setNodes((nds) => nds.concat(createdTaskNodes));
        // Connect assistant to each task node
        const newEdges = createdTaskNodes.map(tn => ({ id: `e_${nid}_${tn.id}`, source: nid, target: tn.id }));
        setEdges((eds) => eds.concat(newEdges));
      }
    }
  }, [screenToFlowPosition]);

  const clear = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, []);

  const buildWorkflowFromGraph = useCallback(() => {
    // Identify tasks and connectors
    const taskNodes = nodes.filter(n => n.id.startsWith('task'))
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
    const connectors = nodes.filter(
      (n) => n?.data?.kind === 'connector' || n.id.startsWith('connector')
    );

    const assistantNode = nodes.find(n => n.id.startsWith('assistant'));
    const moduleNode = nodes.find(n => n.id.startsWith('module'));

    const title = moduleNode?.data?.label || assistantNode?.data?.label || 'Planned Workflow';
    const category = moduleNode ? 'module_assistant' : 'orchestrator';
    const moduleId = moduleNode ? moduleNode.id.split(':')[1] : null;

    // Build dependency maps from connectors and direct task->task edges
    const parentsByTask = {}; // taskId -> [{ parentId, type, group }]
    const parallelGroupByTask = {}; // taskId -> groupId
    const decisionGroupByTask = {}; // taskId -> groupId

    function addParent(childId, parentId, type, group) {
      parentsByTask[childId] = parentsByTask[childId] || [];
      parentsByTask[childId].push({ parentId, type, group });
    }

    // Direct task->task edges treated as sequence
    edges.forEach(e => {
      if (e.source?.startsWith('task') && e.target?.startsWith('task')) {
        addParent(e.target, e.source, 'sequence', null);
      }
    });

    // Connector-based dependencies
    const seqPairs = []; // for consolidation
    connectors.forEach(cn => {
      const idParts = cn.id.split(':');
      let fallbackType = '';
      if (idParts[0] === 'connector') {
        if (idParts[1] && idParts[1] !== 'connector') {
          fallbackType = idParts[1];
        } else if (idParts.length > 2) {
          fallbackType = idParts[2];
        }
      }
      const kind = (cn.data?.connectorType || fallbackType || '').toLowerCase();
      const groupId = cn.id;
      const upstream = edges
        .filter(e => e.target === cn.id && e.source?.startsWith('task'))
        .map(e => e.source);
      const downstream = edges
        .filter(e => e.source === cn.id && e.target?.startsWith('task'))
        .map(e => e.target);

      if (kind === 'sequence') {
        downstream.forEach(d => upstream.forEach(u => { addParent(d, u, 'sequence', groupId); seqPairs.push([u,d]); }));
      } else if (kind === 'parallel') {
        downstream.forEach(d => {
          parallelGroupByTask[d] = groupId;
          upstream.forEach(u => addParent(d, u, 'parallel', groupId));
        });
      } else if (kind === 'decision') {
        downstream.forEach(d => {
          decisionGroupByTask[d] = groupId;
          upstream.forEach(u => addParent(d, u, 'decision', groupId));
        });
      }
    });

    // Build sequence graph for consolidation
    const seqEdges = new Set();
    edges.forEach(e => { if (e.source?.startsWith('task') && e.target?.startsWith('task')) seqEdges.add(`${e.source}->${e.target}`); });
    seqPairs.forEach(([u,d]) => seqEdges.add(`${u}->${d}`));

    const seqChildren = {}; // id -> [child]
    const seqInDeg = {}; // id -> count
    taskNodes.forEach(n => { seqChildren[n.id] = []; seqInDeg[n.id] = 0; });
    Array.from(seqEdges).forEach(s => {
      const [u,d] = s.split('->');
      if (!seqChildren[u]) seqChildren[u] = [];
      seqChildren[u].push(d);
      seqInDeg[d] = (seqInDeg[d] || 0) + 1;
    });

    const visited = new Set();
    const steps = [];

    // Helper to collect tools/resources for a set of task ids
    function collectTR(taskIds) {
      const seenTool = new Map();
      const resources = [];
      const tools = [];
      taskIds.forEach(tid => {
        const connectedEdges = edges.filter(e => e.source === tid || e.target === tid);
        const connectedNodes = connectedEdges
          .map(e => (e.source === tid ? e.target : e.source))
          .map(id => nodes.find(nn => nn.id === id))
          .filter(Boolean);
        connectedNodes.filter(nn => nn.id.startsWith('tool')).forEach(tn => {
          const key = tn.id.split(':')[1];
          if (!seenTool.has(key)) { seenTool.set(key, true); tools.push({ id: key, title: tn.data?.label }); }
        });
        connectedNodes.filter(nn => nn.id.startsWith('source')).forEach(sn => {
          resources.push({ type: 'source', title: sn.data?.label });
        });
      });
      return { tools, resources };
    }

    // Build consolidated steps
    taskNodes.forEach((n, idx) => {
      if (visited.has(n.id)) return;
      const start = (seqInDeg[n.id] || 0) === 1 ? null : n.id;
      if (!start) return; // not a chain start

      // Walk forward while single-child and child has inDeg==1
      const chain = [n.id];
      let cur = n.id;
      while (seqChildren[cur] && seqChildren[cur].length === 1) {
        const next = seqChildren[cur][0];
        if ((seqInDeg[next] || 0) !== 1) break;
        chain.push(next);
        cur = next;
      }
      chain.forEach(id => visited.add(id));

      // Flow metadata from first node
      const parents = (parentsByTask[chain[0]] || []).map(p => p.parentId);
      const flow = {};
      if (parents.length) flow.dependsOn = parents;
      // Group tags: union across chain
      chain.forEach(tid => {
        if (parallelGroupByTask[tid]) flow.parallelGroup = parallelGroupByTask[tid];
        if (decisionGroupByTask[tid]) flow.decisionGroup = decisionGroupByTask[tid];
      });

      // Tools/resources union across chain
      const { tools, resources } = collectTR(chain);

      if (chain.length > 1) {
        const promptChain = chain.map((tid, i) => {
          const node = nodes.find(nn => nn.id === tid);
          return { id: `pc_${steps.length+1}_${i+1}`, prompt: node?.data?.label || tid, dependsOn: i > 0 ? (nodes.find(nn => nn.id === chain[i-1])?.data?.label) : undefined };
        });
        steps.push({
          id: `step_${steps.length+1}`,
          title: nodes.find(nn => nn.id === chain[chain.length-1])?.data?.label || 'Prompt Chain',
          type: 'prompt_chain',
          promptChain,
          guidance: {
            explanation: nodes.find(nn => nn.id === chain[chain.length-1])?.data?.sub || 'Planned chain',
            ...(tools.length ? { tools } : {}),
            ...(resources.length ? { resources } : {}),
            ...(Object.keys(flow).length ? { flow } : {}),
          },
        });
      } else {
        const node = nodes.find(nn => nn.id === n.id);
        steps.push({
          id: `step_${steps.length+1}`,
          title: node?.data?.label || 'Task',
          type: 'interactive',
          guidance: {
            explanation: node?.data?.sub || 'Planned task',
            ...(tools.length ? { tools } : {}),
            ...(resources.length ? { resources } : {}),
            ...(Object.keys(flow).length ? { flow } : {}),
          },
        });
      }
    });

    // Add any remaining tasks not part of a chain start (e.g. isolated single with inDeg==1 but no parent start)
    taskNodes.forEach(n => {
      if (visited.has(n.id)) return;
      const node = nodes.find(nn => nn.id === n.id);
      const { tools, resources } = collectTR([n.id]);
      const parents = (parentsByTask[n.id] || []).map(p => p.parentId);
      const flow = {};
      if (parents.length) flow.dependsOn = parents;
      if (parallelGroupByTask[n.id]) flow.parallelGroup = parallelGroupByTask[n.id];
      if (decisionGroupByTask[n.id]) flow.decisionGroup = decisionGroupByTask[n.id];
      steps.push({
        id: `step_${steps.length+1}`,
        title: node?.data?.label || 'Task',
        type: 'interactive',
        guidance: {
          explanation: node?.data?.sub || 'Planned task',
          ...(tools.length ? { tools } : {}),
          ...(resources.length ? { resources } : {}),
          ...(Object.keys(flow).length ? { flow } : {}),
        },
      });
      visited.add(n.id);
    });

    const id = `custom_${Date.now()}`;
    return {
      id,
      title,
      description: 'Generated from PlannerAI canvas',
      moduleId: category === 'module_assistant' ? moduleId : null,
      category,
      difficulty: 'intermediate',
      estimatedTime: '30-60 minutes',
      metadata: { tags: ['planner', 'custom'] },
      steps,
    };
  }, [nodes, edges]);

  const onSave = useCallback(() => {
    const wf = buildWorkflowFromGraph();
    addCustomWorkflow(wf);
    // Navigate to workflows app to review
    setActiveApp('workflows');
  }, [buildWorkflowFromGraph, addCustomWorkflow, setActiveApp]);

  const setOrchestratorNarration = useStore((state) => state.actions.setOrchestratorNarration);

  const onRunWorkflow = useCallback(async () => {
    if (isExecuting) return;

    setIsExecuting(true);

    try {
      // Callback to display orchestrator narration with voice
      const addOrchestratorMessage = (message) => {
        console.log(`[Orchestrator] ${message}`);

        // Update store so Glass Dock can display it
        setOrchestratorNarration(message);

        // Use Web Speech API for text-to-speech
        if ('speechSynthesis' in window) {
          // Cancel any ongoing speech to avoid overlap
          window.speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(message);
          utterance.rate = 1.1; // Slightly faster for better flow
          utterance.pitch = 1.0;
          utterance.volume = 0.9;

          // Get voices (may need a small delay for them to load)
          const getVoiceAndSpeak = () => {
            const voices = window.speechSynthesis.getVoices();

            if (voices.length === 0) {
              // Voices not loaded yet, wait for them
              window.speechSynthesis.addEventListener('voiceschanged', () => {
                getVoiceAndSpeak();
              }, { once: true });
              return;
            }

            // Try to find a good voice (prefer female, English)
            const preferredVoice = voices.find(v =>
              v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha'))
            ) || voices.find(v => v.lang.startsWith('en'));

            if (preferredVoice) {
              utterance.voice = preferredVoice;
            }

            window.speechSynthesis.speak(utterance);
          };

          getVoiceAndSpeak();
        }
      };

      // Import the workflow execution engine
      const { executeWorkflow } = await import('../lib/workflowEngine');
      await executeWorkflow(nodes, edges, setNodes, addOrchestratorMessage);
    } catch (error) {
      console.error('Workflow execution failed:', error);
      alert(`Workflow execution failed: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, edges, isExecuting, setNodes, setOrchestratorNarration]);

  const onExport = useCallback(() => {
    const data = { version: 1, nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planner-graph-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const onImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onImportFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
          alert('Invalid planner graph JSON. Expecting { nodes: [], edges: [] }.');
          return;
        }
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
      } catch (err) {
        alert('Failed to parse JSON: ' + (err?.message || 'unknown error'));
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  }, []);

  // Function to update node data
  const updateNode = useCallback((nodeId, updates) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, []);

  // Handle title editing
  const handleTitleDoubleClick = useCallback(() => {
    setIsEditingTitle(true);
  }, []);

  const handleTitleChange = useCallback((e) => {
    setWorkflowTitle(e.target.value);
    setTitleError(null);
  }, []);

  const handleTitleBlur = useCallback(() => {
    setIsEditingTitle(false);
  }, []);

  const handleTitleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
    }
  }, []);

  // AI naming function
  const generateAITitle = useCallback(async () => {
    if (isGeneratingTitle) return; // Prevent double-clicks

    const previousTitle = workflowTitle;

    try {
      console.log('Generating AI title...');
      setIsGeneratingTitle(true);
      setTitleError(null);

      const flowData = { nodes, edges };

      // Show loading state
      setWorkflowTitle('Generating title...');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: workflowAutoTitleModel,
          messages: [{
            role: 'user',
            content: `Analyze this workflow/flow data and suggest a concise, descriptive title (2-4 words max). Return only the title, no explanation: ${JSON.stringify(flowData, null, 2)}`
          }]
        }),
        credentials: 'include'
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API response:', data);

        // Try different possible response formats
        let suggestedTitle = data.content || data.response || data.message || data.text;

        if (suggestedTitle) {
          suggestedTitle = suggestedTitle.replace(/['"]/g, '').trim();
          console.log('Suggested title:', suggestedTitle);
          setWorkflowTitle(suggestedTitle);
          setTitleError(null);
        } else {
          console.warn('No title in response:', data);
          setWorkflowTitle('AI Generated Flow');
          setTitleError(null);
        }
      } else {
        console.error('API error:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        setWorkflowTitle(previousTitle);
        setTitleError('Unable to generate a new title. Please try again.');
      }
    } catch (error) {
      console.error('Failed to generate AI title:', error);
      setWorkflowTitle(previousTitle);
      setTitleError('Unable to generate a new title. Please try again.');
    } finally {
      setIsGeneratingTitle(false);
    }
  }, [nodes, edges, isGeneratingTitle, workflowAutoTitleModel, workflowTitle]);

  // Persist planner graph on each change
  useEffect(() => {
    const actions = useStore.getState().actions;
    if (actions && actions.setPlannerGraph) {
      actions.setPlannerGraph({ nodes, edges, title: workflowTitle });
    }
  }, [nodes, edges, workflowTitle]);

  return (
    <div className="planner-canvas-container">
      {/* Workflow Title in upper left corner */}
      <div className="workflow-title-container">
        <div className="workflow-title-row">
          {isEditingTitle ? (
            <input
              type="text"
              value={workflowTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyPress={handleTitleKeyPress}
              placeholder="Title your Flow"
              className="workflow-title-input"
              autoFocus
            />
          ) : (
            <div
              className="workflow-title-display"
              onDoubleClick={handleTitleDoubleClick}
            >
              {workflowTitle || 'Title your Flow'}
            </div>
          )}
          <button
            className="btn btn-ai-title"
            onClick={generateAITitle}
            disabled={isGeneratingTitle}
            title={isGeneratingTitle ? "Generating title..." : "Generate title with AI"}
          >
            <span className="icon">{isGeneratingTitle ? 'hourglass_empty' : 'auto_awesome'}</span>
          </button>
        </div>
        {titleError && (
          <div className="workflow-title-error">{titleError}</div>
        )}
      </div>

      <div className="planner-toolbar">
        <button className="btn btn-success btn-sm" onClick={onRunWorkflow} disabled={isExecuting}>
          <span className="icon">{isExecuting ? 'pending' : 'play_arrow'}</span>
          {isExecuting ? 'Running...' : 'Run Workflow'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={clear}>
          <span className="icon">delete</span> Clear
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onExport}>
          <span className="icon">download</span> Export JSON
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onImportClick}>
          <span className="icon">upload</span> Import JSON
        </button>
        <button className="btn btn-primary btn-sm" onClick={onSave}>
          <span className="icon">save</span> Save as Workflow
        </button>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={onImportFileChange}
        />
      </div>
      <div className="planner-canvas" ref={rfRef}>
        <NodeUpdateContext.Provider value={{ updateNode, canvasRef: rfRef }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            // Performance optimizations
            onlyRenderVisibleElements={true}
            minZoom={0.1}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            zoomOnDoubleClick={false}
            // Prevent accidental zoom on scroll for large graphs
            zoomOnScroll={true}
            panOnScroll={false}
          >
            <MiniMap
              nodeColor={(node) => '#4a90e2'}
              nodeBorderRadius={2}
              maskColor="rgba(0, 0, 0, 0.1)"
              pannable={false}
              zoomable={false}
            />
            <Controls />
            <Background gap={16} />
          </ReactFlow>

          {/* Node Configuration Modal */}
          <NodeConfigModal
            node={configModalNode}
            isOpen={isConfigModalOpen}
            onSave={handleConfigSave}
            onClose={handleConfigClose}
          />
        </NodeUpdateContext.Provider>
      </div>
    </div>
  );
}
