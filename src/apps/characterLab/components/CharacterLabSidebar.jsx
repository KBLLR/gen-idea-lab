import React, { useState } from 'react';
import { SidebarItemCard } from '@ui';
import useStore from '@store';
import DriveImportPanel from './DriveImportPanel';

export default function CharacterLabSidebar() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'drive'

  // Connect to store
  const tasks = useStore.use.riggingTasks();
  const selectedTaskId = useStore.use.selectedTaskId();
  const setSelectedTaskId = useStore.use.setSelectedTaskId();
  const removeRiggingTask = useStore.use.removeRiggingTask();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'check_circle';
      case 'IN_PROGRESS':
        return 'sync';
      case 'FAILED':
        return 'error';
      case 'PENDING':
      default:
        return 'schedule';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'var(--color-success, #4caf50)';
      case 'IN_PROGRESS':
        return 'var(--color-accent, #2196f3)';
      case 'FAILED':
        return 'var(--color-error, #f44336)';
      case 'PENDING':
      default:
        return 'var(--color-text-secondary, #999)';
    }
  };

  const handleViewTask = (taskId) => {
    setSelectedTaskId(taskId);
  };

  const handleDownloadFBX = async (taskId, taskName) => {
    try {
      const response = await fetch(`/api/rigging/download/${taskId}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = taskName.replace('.glb', '_rigged.fbx');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download FBX:', error);
      alert('Failed to download FBX file');
    }
  };

  const handleRemoveTask = (taskId) => {
    if (confirm('Are you sure you want to remove this task?')) {
      removeRiggingTask(taskId);
    }
  };

  const handleDriveImportComplete = (data) => {
    // Optionally switch to queue tab to see the new model
    console.log('Import complete:', data);
  };

  return (
    <div className="character-lab-sidebar">
      {/* Sidebar Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          <span className="material-icons-round">format_list_bulleted</span>
          <span>Queue</span>
          {tasks.length > 0 && <span className="tab-badge">{tasks.length}</span>}
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'drive' ? 'active' : ''}`}
          onClick={() => setActiveTab('drive')}
        >
          <span className="material-icons-round">cloud_download</span>
          <span>Drive Import</span>
        </button>
      </div>

      {/* Rigging Queue Tab */}
      {activeTab === 'queue' && (
        <>
          <div className="sidebar-header">
            <h3>Rigging Queue</h3>
            <span className="task-count">{tasks.length}</span>
          </div>

          <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons-round">inbox</span>
            <p>No rigging tasks yet</p>
            <p className="empty-hint">Upload a character to get started</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`task-card ${selectedTaskId === task.id ? 'selected' : ''}`}
              onClick={() => task.status === 'SUCCEEDED' && handleViewTask(task.id)}
              style={{ cursor: task.status === 'SUCCEEDED' ? 'pointer' : 'default' }}
            >
              <div className="task-header">
                <span
                  className="material-icons-round task-status-icon"
                  style={{ color: getStatusColor(task.status) }}
                >
                  {getStatusIcon(task.status)}
                </span>
                <span className="task-name">{task.name}</span>
              </div>

              {task.status === 'IN_PROGRESS' && (
                <div className="task-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="progress-text">{task.progress}%</span>
                </div>
              )}

              {task.status === 'SUCCEEDED' && (
                <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="task-action-btn"
                    title="Download FBX"
                    onClick={() => handleDownloadFBX(task.id, task.name)}
                  >
                    <span className="material-icons-round">download</span>
                  </button>
                  <button
                    className="task-action-btn"
                    title="View in 3D"
                    onClick={() => handleViewTask(task.id)}
                  >
                    <span className="material-icons-round">visibility</span>
                  </button>
                  <button
                    className="task-action-btn task-action-remove"
                    title="Remove task"
                    onClick={() => handleRemoveTask(task.id)}
                  >
                    <span className="material-icons-round">close</span>
                  </button>
                </div>
              )}

              {task.status === 'FAILED' && (
                <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="task-action-btn task-action-remove"
                    title="Remove task"
                    onClick={() => handleRemoveTask(task.id)}
                  >
                    <span className="material-icons-round">close</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
          </div>
        </>
      )}

      {/* Drive Import Tab */}
      {activeTab === 'drive' && (
        <DriveImportPanel onImportComplete={handleDriveImportComplete} />
      )}
    </div>
  );
}
