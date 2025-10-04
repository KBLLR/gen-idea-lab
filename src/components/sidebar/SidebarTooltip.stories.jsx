import React, { useState } from 'react';
import SidebarTooltip from './SidebarTooltip.jsx';

export default {
  title: 'Sidebar/Tooltip',
  component: SidebarTooltip,
  parameters: { layout: 'padded' }
};

export const FollowsCursor = () => {
  const [state, setState] = useState({ open: false, x: 120, y: 120, text: 'Tooltip content' });
  return (
    <div
      style={{ height: 240, border: '1px dashed var(--border-secondary)', position: 'relative' }}
      onMouseEnter={(e) => setState(s => ({ ...s, open: true }))}
      onMouseMove={(e) => setState({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Tooltip content' })}
      onMouseLeave={() => setState({ open: false, x: 0, y: 0, text: '' })}
    >
      <p style={{ padding: 16 }}>Hover anywhere here to see the tooltip follow the cursor.</p>
      <SidebarTooltip {...state} placement="right" />
    </div>
  );
};

