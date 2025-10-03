/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export default function GlassBanner({ title, children, visible = true, onClose }) {
  if (!visible) return null;
  return (
    <div className="glass-banner-overlay" role="region" aria-label={title}>
      <div className="glass-banner">
        <button className="glass-banner-close" onClick={onClose} aria-label="Close privacy notice" type="button">
          <span className="icon">close</span>
        </button>
        <div className="glass-banner-title">{title}</div>
        <div className="glass-banner-body">{children}</div>
      </div>
    </div>
  );
}

