import React, { useState, useEffect } from 'react';
import useStore from '@store';
import { APP_MANIFESTS, getCategories } from '@shared/data/appManifests.js';
import AppCard from './components/AppCard.jsx';
import ServiceStatusWidget from './components/ServiceStatusWidget.jsx';
import UserInfoCard from './components/UserInfoCard.jsx';
import './styles/dashboard.css';

/**
 * Dashboard - Home page with app launcher and service overview
 * Serves as the main entry point after authentication
 */
export default function Dashboard() {
  const user = useStore(s => s.user);
  const showToast = useStore(s => s.actions?.showToast);
  const fetchConnectedServices = useStore(s => s.actions?.fetchConnectedServices);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const categories = getCategories();

  // Show toast notification if redirected after service connection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const success = params.get('success');
    const error = params.get('error');
    const errorService = params.get('errorService');

    // Clean URL immediately
    if (connected || error) {
      window.history.replaceState({}, '', '/');
    }

    if (success === 'connected' && connected) {
      // Format service name nicely (e.g., googleDrive -> Google Drive)
      const serviceName = connected
        .replace(/([A-Z])/g, ' $1') // Add space before capitals
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim();
      showToast?.(`${serviceName} connected successfully!`, 'success', 5000);

      // Refresh service status to update UI immediately
      fetchConnectedServices?.();
    }

    if (error && errorService) {
      // Format service name nicely
      const serviceName = errorService
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();

      // Map error codes to user-friendly messages
      const errorMessages = {
        oauth_error: `Failed to connect ${serviceName}. Please try again.`,
        missing_params: `Connection to ${serviceName} was incomplete. Please try again.`,
        invalid_state: `Invalid connection state for ${serviceName}. Please try again.`,
        token_exchange: `Failed to exchange tokens with ${serviceName}. Check your OAuth configuration.`,
        callback_error: `An error occurred while connecting to ${serviceName}. Please try again.`,
      };

      const message = errorMessages[error] || `Failed to connect ${serviceName}. Error: ${error}`;
      showToast?.(message, 'error', 7000);
    }
  }, [showToast, fetchConnectedServices]);

  const getFilteredApps = () => {
    const apps = Object.values(APP_MANIFESTS);

    if (selectedCategory === 'all') {
      return apps;
    }

    return apps.filter(app => app.category === selectedCategory);
  };

  const filteredApps = getFilteredApps();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard-root">
      {/* Header Section */}
      <header className="dashboard-header">
        <div className="dashboard-welcome">
          <h1 className="dashboard-title">
            {getGreeting()}{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="dashboard-subtitle">
            What would you like to work on today?
          </p>
        </div>

        <UserInfoCard />
      </header>

      <div className="dashboard-content">
        {/* Left Column: App Launcher */}
        <div className="dashboard-main">
          {/* Category Filter */}
          <div className="dashboard-filters">
            <button
              className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <span className="material-icons-round">apps</span>
              All Apps
            </button>
            {categories.map(category => (
              <button
                key={category}
                className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* App Grid */}
          <div className="dashboard-app-grid">
            {filteredApps.map(app => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>

          {filteredApps.length === 0 && (
            <div className="dashboard-empty">
              <span className="material-icons-round">search_off</span>
              <p>No apps found in this category</p>
            </div>
          )}
        </div>

        {/* Right Column: Service Status & Quick Actions */}
        <aside className="dashboard-sidebar">
          <ServiceStatusWidget />

          {/* Quick Stats */}
          <div className="dashboard-stats">
            <h3 className="stats-title">
              <span className="material-icons-round">bar_chart</span>
              Quick Stats
            </h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{Object.keys(APP_MANIFESTS).length}</div>
                <div className="stat-label">Apps Available</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {Object.values(APP_MANIFESTS).filter(a => a.status === 'stable').length}
                </div>
                <div className="stat-label">Stable</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {Object.values(APP_MANIFESTS).filter(a => a.status === 'beta').length}
                </div>
                <div className="stat-label">Beta</div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="dashboard-quick-links">
            <h3 className="quick-links-title">
              <span className="material-icons-round">link</span>
              Quick Actions
            </h3>
            <div className="quick-links-list">
              <a href="/idealab" className="quick-link-item">
                <span className="material-icons-round">lightbulb</span>
                Generate New Idea
              </a>
              <a href="/chat" className="quick-link-item">
                <span className="material-icons-round">chat_bubble</span>
                Start AI Chat
              </a>
              <a href="/imagebooth" className="quick-link-item">
                <span className="material-icons-round">photo_library</span>
                Generate Images
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
