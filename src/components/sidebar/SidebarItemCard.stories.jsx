import React from 'react';
import SidebarItemCard from './SidebarItemCard.jsx';

export default {
  title: 'Sidebar/ItemCard',
  component: SidebarItemCard,
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'Base sidebar card with inline icon + text. Use across sidebars.' } }
  }
};

export const Basic = {
  args: {
    icon: 'lightbulb',
    label: 'Ideas',
  }
};

export const WithCount = {
  args: {
    icon: 'event',
    label: 'Upcoming Events',
    count: 3,
  }
};

export const Active = {
  args: {
    icon: 'psychology',
    label: 'AI & Machine Learning',
    active: true,
  }
};

export const LongLabelTruncation = {
  args: {
    icon: 'folder',
    label: 'A very long label that should gracefully truncate in the available width',
  },
  decorators: [(Story) => (
    <div style={{ width: 220 }}>
      <Story />
    </div>
  )]
};

