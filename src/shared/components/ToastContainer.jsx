import React from 'react';
import useStore from '@store';
import Toast from './Toast.jsx';
import './Toast.css';

/**
 * ToastContainer - Manages and displays all active toast notifications
 * Integrates with Zustand store for global toast management
 */
export default function ToastContainer() {
  const toasts = useStore(s => s.toasts || []);
  const removeToast = useStore(s => s.removeToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDismiss={removeToast}
        />
      ))}
    </div>
  );
}
