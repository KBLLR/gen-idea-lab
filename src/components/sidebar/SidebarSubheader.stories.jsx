import React from 'react';
import SidebarSubheader from './SidebarSubheader.jsx';

export default {
  title: 'Sidebar/Subheader',
  component: SidebarSubheader,
  parameters: {
    layout: 'padded'
  }
};

export const Basic = {
  args: {
    icon: 'tune',
    title: 'Tracking Permissions',
    subtitle: 'Toggle capabilities used in the lab'
  }
};

export const WithAction = {
  render: () => (
    <SidebarSubheader
      icon="settings_voice"
      title="Presets"
      subtitle="Quick toggle sets"
      actions={[
        { key: 'research', title: 'Full Research', icon: 'science', onClick: () => {} },
        { key: 'presentation', title: 'Presentation', icon: 'co_present', onClick: () => {} },
        { key: 'minimal', title: 'Minimal', icon: 'visibility_off', onClick: () => {} },
      ]}
    />
  )
};
