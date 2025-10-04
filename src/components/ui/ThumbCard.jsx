import React from 'react';

export default function ThumbCard({ imageSrc, icon, title, active, connected, onClick }) {
  return (
    <button type="button" className={`mode-item ${active ? 'active' : ''}`} onClick={onClick} title={title}>
      {imageSrc ? (
        <img src={imageSrc} alt={title} loading="lazy" />
      ) : (
        <div className="placeholder icon" style={{ display: 'grid', placeItems: 'center', height: 70, fontSize: 28 }}>
          {icon || <span className="icon">apps</span>}
        </div>
      )}
      <span>{title}</span>
      <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} aria-hidden="true" />
    </button>
  );
}
