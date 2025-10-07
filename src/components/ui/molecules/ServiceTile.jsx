import React from 'react';

export default function ServiceTile({ service, isConnected, onClick }) {
  const Icon = service.icon;
  return (
    <button type="button" className="service-tile" onClick={onClick} title={`Configure ${service.name}`}>
      <div className="service-tile-icon">
        <Icon size={20} style={{ color: service.color }} />
      </div>
      <div className="service-tile-name">{service.name}</div>
      <span className={`tile-status-dot ${isConnected ? 'connected' : 'disconnected'}`} aria-hidden="true" />
    </button>
  );
}

