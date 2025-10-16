import React from 'react';
import { useNavigate } from 'react-router-dom';
import { hasRequiredServices, getMissingServices } from '@shared/data/appManifests.js';
import useStore from '@store';

/**
 * AppCard - Individual app launcher card for the Dashboard
 * Shows app icon, name, description, and connection requirements
 */
export default function AppCard({ app }) {
  const navigate = useNavigate();
  const connectedServices = useStore(s => s.connectedServices || {});

  const hasRequired = hasRequiredServices(app.id, connectedServices);
  const missingServices = getMissingServices(app.id, connectedServices);
  const canLaunch = hasRequired;

  const handleClick = () => {
    if (canLaunch) {
      navigate(app.route);
    }
  };

  const getStatusBadge = () => {
    if (app.status === 'beta') {
      return <span className="app-card-badge beta">Beta</span>;
    }
    if (app.status === 'alpha') {
      return <span className="app-card-badge alpha">Alpha</span>;
    }
    return null;
  };

  return (
    <div
      className={`app-card ${!canLaunch ? 'disabled' : ''}`}
      onClick={handleClick}
      style={{ '--app-color': app.color }}
    >
      <div className="app-card-icon-wrapper">
        <span className="material-icons-round app-card-icon" style={{ color: app.color }}>
          {app.icon}
        </span>
        {getStatusBadge()}
      </div>

      <div className="app-card-content">
        <h3 className="app-card-title">{app.name}</h3>
        <p className="app-card-description">{app.description}</p>

        {app.features && app.features.length > 0 && (
          <ul className="app-card-features">
            {app.features.slice(0, 2).map((feature, idx) => (
              <li key={idx}>
                <span className="material-icons-round">check</span>
                {feature}
              </li>
            ))}
          </ul>
        )}

        {!canLaunch && missingServices.length > 0 && (
          <div className="app-card-warning">
            <span className="material-icons-round">warning</span>
            <span>Requires: {missingServices.join(', ')}</span>
          </div>
        )}
      </div>

      <div className="app-card-footer">
        <div className="app-card-tags">
          {app.tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="app-card-tag">{tag}</span>
          ))}
        </div>
        <button className="app-card-launch" disabled={!canLaunch}>
          <span className="material-icons-round">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
