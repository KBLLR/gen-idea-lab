/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export default function MinimizedDock({ position, onOpen, title = 'Click to open Orchestrator' }) {
  return (
    <div
      className="glass-dock minimized"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: '64px', height: '64px' }}
      onClick={onOpen}
      title={title}
    >
      <div className="minimized-icon">
        <span className="icon">psychology</span>
      </div>
    </div>
  );
}

