import React, { useState, useRef, useEffect } from 'react';
import { Panel } from '@ui';
import Button from '../../../components/ui/atoms/Button';
import CharacterLabHeader from './CharacterLabHeader.jsx';
import ModelViewer from './ModelViewer.jsx';
import useStore from '@store';

export default function CharacterLabCenter({ showGallery, onToggleGallery }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [characterHeight, setCharacterHeight] = useState(1.7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Connect to store
  const submitRiggingTask = useStore.use.submitRiggingTask();
  const selectedTaskId = useStore.use.selectedTaskId();
  const getSelectedTask = useStore.use.getSelectedTask();
  const getModelUrl = useStore.use.getModelUrl();
  const stopPolling = useStore.use.stopPolling();

  const selectedTask = getSelectedTask();
  const modelUrl = selectedTaskId ? getModelUrl(selectedTaskId) : null;

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.glb')) {
      setSelectedFile(file);
    } else {
      alert('Please select a valid .glb file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.glb')) {
      setSelectedFile(file);
    } else {
      alert('Please drop a valid .glb file');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRig = async () => {
    if (!selectedFile || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await submitRiggingTask(selectedFile, { characterHeight });
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to submit rigging task:', error);
      alert('Failed to submit rigging task: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="character-lab-root">
      <CharacterLabHeader showGallery={showGallery} onToggleGallery={onToggleGallery} />
      <div className="character-lab-content">
        <Panel title="Upload 3D Model" variant="input">
          <div
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {selectedFile ? (
              <div className="file-selected">
                <span className="material-icons-round">check_circle</span>
                <p>{selectedFile.name}</p>
                <p className="file-size">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="upload-prompt">
                <span className="material-icons-round">cloud_upload</span>
                <p>Drag & drop a .glb file here</p>
                <p className="upload-hint">or click to browse</p>
              </div>
            )}
          </div>

          <div className="upload-controls">
            <div className="upload-settings">
              <label>
                Character Height (meters):
                <input
                  type="number"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={characterHeight}
                  onChange={(e) => setCharacterHeight(parseFloat(e.target.value))}
                />
              </label>
            </div>

            <Button
              onClick={handleRig}
              disabled={!selectedFile || isSubmitting}
            >
              <span className="material-icons-round">
                {isSubmitting ? 'hourglass_empty' : 'animation'}
              </span>
              {isSubmitting ? 'Submitting...' : 'Start Rigging'}
            </Button>
          </div>
        </Panel>

        <Panel title="Preview" variant="output">
          {selectedTask && selectedTask.status === 'SUCCEEDED' && modelUrl ? (
            <div className="model-viewer-container">
              <ModelViewer
                src={modelUrl}
                alt={selectedTask.name}
                autoRotate={true}
                cameraControls={true}
                ar={true}
                className="character-model-viewer"
                onLoad={() => console.log('Model loaded:', selectedTask.name)}
                onError={(error) => console.error('Model viewer error:', error)}
              />
              <div className="model-info">
                <span className="material-icons-round">check_circle</span>
                <p className="model-name">{selectedTask.name}</p>
              </div>
            </div>
          ) : selectedTask && selectedTask.status === 'IN_PROGRESS' ? (
            <div className="viewer-placeholder">
              <span className="material-icons-round rotating">sync</span>
              <p>Rigging in progress...</p>
              <p className="viewer-hint">{selectedTask.progress}% complete</p>
            </div>
          ) : selectedTask && selectedTask.status === 'FAILED' ? (
            <div className="viewer-placeholder error">
              <span className="material-icons-round">error</span>
              <p>Rigging failed</p>
              <p className="viewer-hint">{selectedTask.error || 'Unknown error'}</p>
            </div>
          ) : (
            <div className="viewer-placeholder">
              <span className="material-icons-round">view_in_ar</span>
              <p>Select a completed task to preview</p>
              <p className="viewer-hint">Upload and rig a character to get started</p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
