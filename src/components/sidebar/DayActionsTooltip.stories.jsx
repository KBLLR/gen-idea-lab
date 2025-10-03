import React from 'react';
import DayActionsTooltip from './DayActionsTooltip.jsx';

export default {
  title: 'Sidebar/DayActionsTooltip',
  component: DayActionsTooltip,
  parameters: { layout: 'centered' }
};

export const Default = {
  render: () => (
    <div style={{ position: 'relative', width: 360, height: 180, border: '1px dashed #444' }}>
      <div style={{ position: 'absolute', left: 40, top: 80, width: 32, height: 32, background: '#2a2a2a', borderRadius: 6 }} />
      <DayActionsTooltip
        style={{ position: 'absolute', left: 84, top: 96 }}
        onCreate={() => console.log('Create')}
        onSee={() => console.log('See')}
      />
    </div>
  )
};

