import React, { useState } from 'react';
import RecordingIndicator from './RecordingIndicator.jsx';

export default {
  title: 'EmpathyLab/RecordingIndicator',
  component: RecordingIndicator,
  parameters: { layout: 'centered' }
};

export const Active = () => (
  <div style={{ position: 'relative', width: 480, height: 270, background: '#0b0d13', borderRadius: 8 }}>
    <RecordingIndicator active />
  </div>
);

export const Toggle = () => {
  const [active, setActive] = useState(false);
  return (
    <div style={{ position: 'relative', width: 480, height: 270, background: '#0b0d13', borderRadius: 8 }}>
      <RecordingIndicator active={active} />
      <button style={{ position: 'absolute', right: 12, bottom: 12 }} onClick={() => setActive(a => !a)}>
        Toggle
      </button>
    </div>
  );
};

