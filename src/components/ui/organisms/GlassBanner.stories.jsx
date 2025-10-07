import React, { useState } from 'react';
import GlassBanner from './GlassBanner.jsx';

export default {
  title: 'UI/GlassBanner',
  component: GlassBanner,
  parameters: { layout: 'centered' }
};

export const Basic = () => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ position: 'relative', width: 600, height: 360, border: '1px dashed var(--border-secondary)' }}>
      <GlassBanner title="Your Privacy Matters" visible={open} onClose={() => setOpen(false)}>
        All AI processing happens locally in your browser. No video or images are sent to servers. Session data is automatically deleted when you close this tab.
      </GlassBanner>
    </div>
  );
};

