/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export default function StatCard({ icon, value, label, variant = 'solid', className = '', ...rest }) {
  const cls = variant === 'glass' ? 'stat-card stat-card--glass' : 'stat-card';
  return (
    <div className={`${cls} ${className}`} {...rest}>
      {icon && <span className="icon stat-icon">{icon}</span>}
      <div className="stat-content">
        {value !== undefined && <div className="stat-value">{value}</div>}
        {label && <div className="stat-label">{label}</div>}
      </div>
    </div>
  );
}

