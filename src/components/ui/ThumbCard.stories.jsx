import React from 'react';
import ThumbCard from './ThumbCard.jsx';

const Box = ({ children }) => (
  <div style={{ width: 600 }}>
    {children}
  </div>
);

export default {
  title: 'UI/ThumbCard',
  component: ThumbCard,
  decorators: [(Story) => <Box><Story /></Box>],
  parameters: { layout: 'padded' }
};

export const Basic = () => (
  <ThumbCard title="OpenAI" icon={<span className="icon" style={{ fontSize: 28 }}>smart_toy</span>} connected={false} onClick={() => {}} />
);

export const Connected = () => (
  <ThumbCard title="Google Drive" icon={<span className="icon" style={{ fontSize: 28, color: '#4285F4' }}>cloud</span>} connected onClick={() => {}} />
);

export const WithThumbnail = () => (
  <ThumbCard title="Mode X" imageSrc={null} icon={<span className="icon" style={{ fontSize: 28 }}>image</span>} connected={false} onClick={() => {}} />
);

export const GridDemo = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
    {['GitHub', 'Notion', 'Drive', 'Photos', 'Calendar', 'Gmail'].map((name, i) => (
      <ThumbCard
        key={name}
        title={name}
        icon={<span className="icon" style={{ fontSize: 28 }}>{i % 2 ? 'apps' : 'extension'}</span>}
        connected={i % 3 === 0}
        onClick={() => {}}
      />
    ))}
  </div>
);

