/**
 * @file DriveImportPanel - Google Drive 3D model import with optimization progress
 * @license SPDX-License-Identifier: Apache-2.0
 * @description Lists GLB files from Google Drive and imports them with real-time SSE streaming progress
 * MIGRATED: Now uses centralized API endpoints
 */

import React, { useEffect, useState } from 'react';
import useStore from '@store';
import { handleAsyncError } from '@shared/lib/errorHandler.js';
import { api } from '@shared/lib/dataLayer/endpoints.js';

/**
 * DriveImportPanel - Lists GLB files from Google Drive and imports them with real-time optimization progress
 * Shows each optimization step via SSE streaming
 */
export default function DriveImportPanel({ onImportComplete }) {
  const [driveModels, setDriveModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importingFileId, setImportingFileId] = useState(null);
  const [importProgress, setImportProgress] = useState(null);

  // Check if Google Drive is connected
  const connectedServices = useStore((s) => s.connectedServices);
  const isDriveConnected = connectedServices?.googleDrive?.connected || false;
  const connectService = useStore((s) => s.actions?.connectService);

  // Fetch available models from Drive
  const fetchDriveModels = async () => {
    try {
      setIsLoading(true);
      const data = await api.drive.models();
      setDriveModels(data.files || []);
      setError(null);
    } catch (err) {
      const errorMsg = handleAsyncError(err, {
        context: 'Fetching Google Drive models',
        showToast: true,
        fallbackMessage: 'Failed to load models from Google Drive. Please check your connection and try again.'
      }).message;
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isDriveConnected) {
      setIsLoading(false);
      setError('Google Drive not connected. Please connect your Drive account first.');
      return;
    }
    fetchDriveModels();
  }, [isDriveConnected]);

  // Import a model from Drive with SSE progress streaming
  const handleImport = async (fileId, fileName) => {
    setImportingFileId(fileId);
    setImportProgress({
      step: 'start',
      message: 'Starting import...',
      progress: 0,
    });

    try {
      const eventSource = new EventSource(`/api/drive/import/${fileId}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.step === 'error') {
          setError(data.message);
          setImportingFileId(null);
          setImportProgress(null);
          eventSource.close();
          return;
        }

        if (data.step === 'complete') {
          setImportProgress({
            ...data,
            progress: 100,
          });

          // Close connection and reset after a delay
          setTimeout(() => {
            eventSource.close();
            setImportingFileId(null);
            setImportProgress(null);

            // Refresh Drive list and notify parent
            fetchDriveModels();
            if (onImportComplete) {
              onImportComplete(data);
            }
          }, 2000);
          return;
        }

        // Update progress
        setImportProgress(data);
      };

      eventSource.onerror = (err) => {
        handleAsyncError(err, {
          context: 'Drive import SSE connection',
          showToast: true,
          fallbackMessage: 'Connection lost during import. Please try again.',
          severity: 'error'
        });
        setError('Connection lost. Please try again.');
        setImportingFileId(null);
        setImportProgress(null);
        eventSource.close();
      };
    } catch (err) {
      const errorMsg = handleAsyncError(err, {
        context: 'Importing Drive model',
        showToast: true,
        fallbackMessage: 'Failed to import model. Please try again.'
      }).message;
      setError(errorMsg);
      setImportingFileId(null);
      setImportProgress(null);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="drive-import-panel">
        <div className="drive-loading">
          <span className="material-icons-round rotating">sync</span>
          <p>Loading Drive models...</p>
        </div>
      </div>
    );
  }

  if (error && !importingFileId) {
    const handleConnectDrive = async () => {
      try {
        await connectService('googleDrive');
        // Connection state will update automatically via store, triggering a refetch
      } catch (err) {
        const errorMsg = handleAsyncError(err, {
          context: 'Connecting to Google Drive',
          showToast: true,
          fallbackMessage: 'Failed to connect to Google Drive. Please try again or check your settings.'
        }).message;
        setError(errorMsg);
      }
    };

    return (
      <div className="drive-import-panel">
        <div className="drive-error">
          <span className="material-icons-round">error</span>
          <p>{error}</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {!isDriveConnected ? (
              <button onClick={handleConnectDrive} className="retry-button">
                <span className="material-icons-round">link</span>
                Connect Drive
              </button>
            ) : (
              <button onClick={fetchDriveModels} className="retry-button">
                <span className="material-icons-round">refresh</span>
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="drive-import-panel">
      <div className="drive-header">
        <h3>Google Drive Models ({driveModels.length})</h3>
        <button onClick={fetchDriveModels} className="refresh-drive-btn" title="Refresh">
          <span className="material-icons-round">refresh</span>
        </button>
      </div>

      {/* Import Progress Display */}
      {importProgress && (
        <div className="import-progress-card">
          <div className="progress-header">
            <span className="material-icons-round rotating">sync</span>
            <h4>Importing & Optimizing</h4>
          </div>
          <div className="progress-message">{importProgress.message}</div>
          {importProgress.optimizationStep && (
            <div className="progress-step">{importProgress.optimizationStep}</div>
          )}
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${importProgress.progress || 0}%` }}
            />
          </div>
          <div className="progress-percent">{importProgress.progress || 0}%</div>

          {/* Show optimization results when complete */}
          {importProgress.step === 'complete' && (
            <div className="optimization-results">
              <div className="result-item">
                <span className="material-icons-round">compress</span>
                <span>{importProgress.savings}% size reduction</span>
              </div>
              <div className="result-item">
                <span className="material-icons-round">timer</span>
                <span>{(importProgress.duration / 1000).toFixed(1)}s</span>
              </div>
              <div className="result-item">
                <span className="material-icons-round">check_circle</span>
                <span>{importProgress.steps?.length || 11} optimization steps</span>
              </div>
            </div>
          )}
        </div>
      )}

      {driveModels.length === 0 ? (
        <div className="drive-empty">
          <span className="material-icons-round">folder_open</span>
          <p>No GLB models found in Drive folder</p>
        </div>
      ) : (
        <div className="drive-list">
          {driveModels.map((model) => (
            <div key={model.id} className="drive-item">
              <div className="drive-item-icon">
                <span className="material-icons-round">view_in_ar</span>
              </div>

              <div className="drive-item-info">
                <h4 className="model-name">{model.name}</h4>
                <div className="model-meta">
                  <span className="meta-item">
                    <span className="material-icons-round">schedule</span>
                    {formatDate(model.modifiedTime)}
                  </span>
                  <span className="meta-item">
                    <span className="material-icons-round">data_usage</span>
                    {formatBytes(model.size)}
                  </span>
                </div>
              </div>

              <div className="drive-item-actions">
                <button
                  className="import-button"
                  onClick={() => handleImport(model.id, model.name)}
                  disabled={importingFileId === model.id}
                  title="Import and optimize this model"
                >
                  {importingFileId === model.id ? (
                    <>
                      <span className="material-icons-round rotating">sync</span>
                      Importing...
                    </>
                  ) : (
                    <>
                      <span className="material-icons-round">download</span>
                      Import
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
