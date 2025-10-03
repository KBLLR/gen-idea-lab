import React, { useState } from 'react';
import SidebarToggleItemCard from './SidebarToggleItemCard.jsx';

export default {
  title: 'Sidebar/ItemCardToggle',
  component: SidebarToggleItemCard,
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'Sidebar item with a trailing toggle switch.' } }
  }
};

export const Off = () => {
  const [on, setOn] = useState(false);
  return (
    <div style={{ width: 280 }}>
      <SidebarToggleItemCard icon="face" label="Face Detection" checked={on} onChange={setOn} description="Detect faces for session awareness" />
    </div>
  );
};

export const On = () => {
  const [on, setOn] = useState(true);
  return (
    <div style={{ width: 280 }}>
      <SidebarToggleItemCard icon="psychology" label="Emotion Analysis" checked={on} onChange={setOn} description="Analyze voice expressions for emotions" />
    </div>
  );
};

