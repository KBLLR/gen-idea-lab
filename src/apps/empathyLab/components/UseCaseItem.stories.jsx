import React from 'react';
import UseCaseItem from './UseCaseItem.jsx';

export default {
  title: 'EmpathyLab/UseCaseItem',
  component: UseCaseItem,
  parameters: { layout: 'centered' }
};

export const Examples = () => (
  <div style={{ width: 420, display: 'grid', gap: 8 }}>
    <UseCaseItem icon="psychology" title="UX Research" description="Test prototypes with emotion and gaze tracking" />
    <UseCaseItem icon="co_present" title="Presentation Training" description="Practice public speaking with AI feedback" />
  </div>
);

