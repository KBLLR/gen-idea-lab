import React, { useState } from 'react';
import ConsentItem from './ConsentItem.jsx';

export default {
  title: 'EmpathyLab/ConsentItem',
  component: ConsentItem,
  parameters: { layout: 'centered' }
};

export const Default = () => {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{ width: 420 }}>
      <ConsentItem
        checked={checked}
        onChange={() => setChecked(c => !c)}
        icon="face"
        title="Face Detection"
        description="Detect face landmarks to analyze expression"
      />
    </div>
  );
};

