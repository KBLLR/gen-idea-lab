import React from 'react';
import { Panel } from '@ui';

export default function TemplateCenter() {
  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <Panel title="Template Center">
        <p>This is the center content area. Use layout slots to provide left/right panes.</p>
      </Panel>
    </div>
  );
}