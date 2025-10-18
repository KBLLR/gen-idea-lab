import React from 'react';
import useStore from '@store';
import { SiFigma, SiGithub, SiNotion, SiGoogledrive, SiOpenai, SiGoogle, SiGmail } from 'react-icons/si';
import { RiCalendarLine, RiImageLine } from 'react-icons/ri';

const SERVICE_ICONS = {
  github: SiGithub,
  notion: SiNotion,
  googleDrive: SiGoogledrive,
  googlePhotos: RiImageLine,
  googleCalendar: RiCalendarLine,
  gmail: SiGmail,
  figma: SiFigma,
  openai: SiOpenai,
  google: SiGoogle,
};

const SERVICE_NAMES = {
  github: 'GitHub',
  notion: 'Notion',
  googleDrive: 'Google Drive',
  googlePhotos: 'Google Photos',
  googleCalendar: 'Google Calendar',
  gmail: 'Gmail',
  figma: 'Figma',
  openai: 'OpenAI',
  google: 'Google AI',
  anthropic: 'Claude',
  hume: 'Hume AI',
};

/**
 * ServiceStatusWidget - Shows connected services overview
 * Displays connection status and quick access to settings
 */
export default function ServiceStatusWidget() {
  const connectedServices = useStore(s => s.connectedServices || {});
  const actions = useStore.use.actions();

  const services = Object.entries(connectedServices);
  const connectedCount = services.filter(([, data]) => data?.connected).length;
  const totalCount = services.length;

  const handleOpenSettings = () => {
    actions?.openSettings?.();
  };

  const handleToggleService = async (serviceId, isConnected) => {
    if (isConnected) {
      // Disconnect service
      if (confirm(`Disconnect ${SERVICE_NAMES[serviceId] || serviceId}?`)) {
        try {
          const response = await fetch(`/api/services/${serviceId}/disconnect`, {
            method: 'POST',
            credentials: 'include'
          });
          if (response.ok) {
            actions?.fetchConnectedServices?.();
          }
        } catch (error) {
          console.error('Failed to disconnect service:', error);
        }
      }
    } else {
      // Connect service - open OAuth flow
      window.location.href = `/api/services/${serviceId}/connect`;
    }
  };

  const getServiceIcon = (serviceId) => {
    const IconComponent = SERVICE_ICONS[serviceId];
    if (IconComponent) {
      return <IconComponent size={20} />;
    }
    return <span className="material-icons-round">cloud</span>;
  };

  return (
    <div className="service-status-widget">
      <div className="service-status-header">
        <div className="service-status-title">
          <span className="material-icons-round">link</span>
          <h3>Connected Services</h3>
        </div>
        <button className="service-status-settings-btn" onClick={handleOpenSettings} title="Manage Services">
          <span className="material-icons-round">settings</span>
        </button>
      </div>

      <div className="service-status-summary">
        <div className="service-status-count">
          <span className="count-value">{connectedCount}</span>
          <span className="count-label">/ {totalCount} connected</span>
        </div>
        <div className="service-status-progress">
          <div
            className="service-status-progress-bar"
            style={{ width: `${(connectedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="service-status-list">
        {services.map(([serviceId, data]) => (
          <div
            key={serviceId}
            className={`service-status-item ${data?.connected ? 'connected' : 'disconnected'}`}
          >
            <div className="service-status-item-icon">
              {getServiceIcon(serviceId)}
            </div>
            <div className="service-status-item-info">
              <span className="service-status-item-name">
                {SERVICE_NAMES[serviceId] || serviceId}
              </span>
              {data?.connected && data?.email && (
                <span className="service-status-item-email">{data.email}</span>
              )}
            </div>
            <div className="service-status-item-actions">
              <button
                className={`service-toggle-btn ${data?.connected ? 'disconnect' : 'connect'}`}
                onClick={() => handleToggleService(serviceId, data?.connected)}
                title={data?.connected ? 'Disconnect' : 'Connect'}
              >
                {data?.connected ? (
                  <>
                    <span className="material-icons-round">link_off</span>
                    <span className="btn-label">Disconnect</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons-round">link</span>
                    <span className="btn-label">Connect</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {connectedCount < totalCount && (
        <button className="service-status-connect-btn" onClick={handleOpenSettings}>
          <span className="material-icons-round">add</span>
          Connect More Services
        </button>
      )}
    </div>
  );
}
