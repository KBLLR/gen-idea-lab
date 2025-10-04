/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

const DEFAULT_ICON_COLORS = {
  timer: '#42a5f5',
  speed: '#26c6da',
  memory: '#7e57c2',
  face: '#66bb6a',
  accessibility: '#ffa726',
  back_hand: '#ef5350',
  gesture: '#26a69a',
  data_usage: '#5c6bc0',
};

export default function StatCard({ icon, value, label, variant = 'solid', className = '', iconColor, ...rest }) {
  const cls = variant === 'glass' ? 'stat-card stat-card--glass' : 'stat-card';
  const color = iconColor || (icon && DEFAULT_ICON_COLORS[icon]) || 'var(--color-accent)';
  return (
    <div className={`${cls} ${className}`} {...rest}>
      <div className="stat-top">
        {icon && (
          <span className="icon stat-icon" style={{ color }}>
            {icon}
          </span>
        )}
        {value !== undefined && <div className="stat-value">{value}</div>}
      </div>
      {label && <div className="stat-bottom stat-label">{label}</div>}
    </div>
  );
}
