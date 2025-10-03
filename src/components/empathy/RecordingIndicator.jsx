/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export default function RecordingIndicator({ active, label = 'Tracking Active' }) {
  if (!active) return null;
  return (
    <div className="recording-indicator">
      <span className="recording-dot" />
      <span>{label}</span>
    </div>
  );
}

