import React, { useEffect, useState } from 'react';

export default function ModelGallery() {
  const [galleryModels, setGalleryModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGallery = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/rigging/gallery');

      if (!response.ok) {
        throw new Error('Failed to fetch gallery');
      }

      const data = await response.json();
      setGalleryModels(data.models);
      setError(null);
    } catch (err) {
      console.error('Error fetching gallery:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleDelete = async (modelId) => {
    if (!confirm('Delete this model from gallery?')) return;

    try {
      const response = await fetch(`/api/rigging/gallery/${modelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setGalleryModels(prev => prev.filter(m => m.id !== modelId));
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete model');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="gallery-root">
        <div className="gallery-loading">
          <span className="material-icons-round rotating">sync</span>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gallery-root">
        <div className="gallery-error">
          <span className="material-icons-round">error</span>
          <p>{error}</p>
          <button onClick={fetchGallery} className="retry-button">
            <span className="material-icons-round">refresh</span>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-root">
      <div className="gallery-header">
        <h3>Gallery ({galleryModels.length})</h3>
        <button onClick={fetchGallery} className="refresh-gallery-btn" title="Refresh">
          <span className="material-icons-round">refresh</span>
        </button>
      </div>

      {galleryModels.length === 0 ? (
        <div className="gallery-empty">
          <span className="material-icons-round">collections</span>
          <p>No models yet</p>
        </div>
      ) : (
        <div className="gallery-list">
          {galleryModels.map((model) => (
            <div key={model.id} className="gallery-item">
              <div className="gallery-item-preview">
                <model-viewer
                  src={model.modelUrl}
                  alt={model.name}
                  auto-rotate
                  camera-controls
                  loading="lazy"
                  style={{ width: '100%', height: '120px', background: 'var(--color-surface)' }}
                />
              </div>

              <div className="gallery-item-info">
                <h4 className="model-name">{model.name}</h4>
                <div className="model-meta">
                  <span className="meta-item">
                    <span className="material-icons-round">schedule</span>
                    {formatDate(model.completedAt)}
                  </span>
                  <span className="meta-item">
                    <span className="material-icons-round">data_usage</span>
                    {formatBytes(model.optimizedSize)}
                  </span>
                  {model.savingsPercent && (
                    <span className="meta-item savings">
                      <span className="material-icons-round">compress</span>
                      {model.savingsPercent}%
                    </span>
                  )}
                </div>
              </div>

              <div className="gallery-item-actions">
                <button
                  className="item-action-btn"
                  title="Download"
                  onClick={() => window.open(model.modelUrl, '_blank')}
                >
                  <span className="material-icons-round">download</span>
                </button>
                <button
                  className="item-action-btn danger"
                  title="Delete"
                  onClick={() => handleDelete(model.id)}
                >
                  <span className="material-icons-round">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
