import React, { useState } from 'react';
import DockItemsRow from './DockItemsRow.jsx';

export default {
  title: 'GlassDock/DockItemsRow',
  component: DockItemsRow,
  tags: ['component', 'a11y'],
  parameters: {
    viewport: { defaultViewport: 'responsive' }
  }
};

const sampleItems = [
  { id: 'nav-1', type: 'navigation', icon: 'apps', label: 'Apps', isActive: true },
  { id: 'voice-1', type: 'voice', icon: 'record_voice_over', label: 'Voice', isActive: true, status: 'Listening' },
  { id: 'tool-1', type: 'tool', icon: 'build', label: 'Tools', isActive: false },
];

export const Default = () => {
  const [items, setItems] = useState(sampleItems);
  const [listening, setListening] = useState(true);
  return (
    <div style={{ padding: 16 }}>
      <DockItemsRow
        items={items}
        isVoiceListening={listening}
        onClickItem={() => setListening((v) => !v)}
        onRemoveItem={(id) => setItems((arr) => arr.filter(i => i.id !== id))}
        getIconFallback={(icon) => icon}
      />
    </div>
  );
};

