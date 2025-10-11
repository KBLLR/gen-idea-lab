import React from 'react';
import CharacterLabCenter from './components/CharacterLab.jsx';
import CharacterLabSidebar from './components/CharacterLabSidebar.jsx';
import './styles/character-lab.css';

export default {
  title: 'Apps/CharacterLab',
  parameters: { layout: 'fullscreen' }
};

export const Preview = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: '100vh', background: 'var(--color-bg, #121212)' }}>
    <div style={{ padding: 12, borderRight: '1px solid var(--color-surface-border, #333)', background: 'var(--color-surface, #1e1e1e)' }}>
      <CharacterLabSidebar />
    </div>
    <div>
      <CharacterLabCenter />
    </div>
  </div>
);

export const CenterOnly = () => (
  <div style={{ height: '100vh', background: 'var(--color-bg, #121212)' }}>
    <CharacterLabCenter />
  </div>
);

export const SidebarOnly = () => (
  <div style={{ width: '280px', height: '100vh', padding: 12, background: 'var(--color-surface, #1e1e1e)' }}>
    <CharacterLabSidebar />
  </div>
);
