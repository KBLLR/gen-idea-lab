import React, { useEffect, useState } from 'react';
import './Toast.css';

/**
 * Toast - Individual toast notification
 * @param {Object} props
 * @param {string} props.id - Unique identifier
 * @param {string} props.message - Toast message
 * @param {string} props.type - Toast type: 'success' | 'error' | 'info' | 'warning'
 * @param {number} props.duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
 * @param {Function} props.onDismiss - Callback when dismissed
 */
export default function Toast({ id, message, type = 'info', duration = 4000, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss?.(id);
    }, 300); // Match exit animation duration
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  return (
    <div
      className={`toast toast-${type} ${isVisible && !isExiting ? 'toast-visible' : ''} ${isExiting ? 'toast-exit' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-icon">
        <span className="material-icons-round">{getIcon()}</span>
      </div>
      <div className="toast-content">
        <p className="toast-message">{message}</p>
      </div>
      <button
        className="toast-dismiss-btn"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        <span className="material-icons-round">close</span>
      </button>
    </div>
  );
}
