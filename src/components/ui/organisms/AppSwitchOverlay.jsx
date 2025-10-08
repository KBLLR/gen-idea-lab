import useStore from '@store';
import React from 'react';
import { createPortal } from 'react-dom';
import './appswitch-overlay.css';

export default function AppSwitchOverlay() {
  const status = useStore.use.appTransition().status;
  const logs = useStore.use.appTransition().logs;
  const to = useStore.use.appTransition().to;
  if (status === 'idle' || status === 'ready') return null;
  const lastTwo = logs.slice(-2);
  return createPortal(
    <div className="appswitch-overlay" role="status" aria-live="polite">
      <div className="appswitch-card">
        <div className="spinner" aria-hidden />
        <div className="copy">
          <h3>Loading {to}…</h3>
          <pre>{lastTwo.map(l => l.m).join('\n')}</pre>
        </div>
      </div>
    </div>,
    typeof document !== 'undefined' ? document.body : undefined
  );
}