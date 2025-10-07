/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export default function BoothHeader({
  icon,
  title,
  typeText,
  status, // 'ready' | 'pending' | string
  description,
  children,
  actions,
  align = 'top'
}) {
  const alignItems = align === 'top' ? 'start' : align === 'bottom' ? 'end' : 'center';
  const statusClass = typeof status === 'string' ? status.toLowerCase() : '';
  const statusLabel = statusClass === 'ready' ? 'Ready' : (status || '');

  return (
    <div className="booth-header" style={{ alignItems }}>
      <div className="booth-title">
        <h1>
          {icon ? <span className="icon" aria-hidden="true">{icon}</span> : null}
          {title}
        </h1>
        {(typeText || status) && (
          <div className="mode-meta">
            {typeText ? <span className="mode-type">{typeText}</span> : null}
            {status ? <span className={`mode-status ${statusClass}`}>{statusLabel}</span> : null}
          </div>
        )}
      </div>

      <div className="booth-description">
        {description ? <p className="description-text">{description}</p> : null}
        {children}
      </div>

      {actions ? (
        <div className="booth-actions">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
