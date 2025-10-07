/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export default function ConsentItem({ checked, onChange, icon, title, description, disabled }) {
  return (
    <label className="consent-item">
      <div className="consent-header">
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
        {icon ? <span className="icon">{icon}</span> : null}
        <strong>{title}</strong>
      </div>
      {description ? <p className="consent-description">{description}</p> : null}
    </label>
  );
}

