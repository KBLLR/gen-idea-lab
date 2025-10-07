import React from 'react';
import PlannerSidebar from './PlannerSidebar.jsx';
import useStore from '../lib/store';

export default {
  title: 'Planner/Sidebar',
  component: PlannerSidebar,
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Planner sidebar with accordion sections (topics, tasks, tools, Google services, sources, etc.).' } }
  },
  decorators: [
    (Story) => {
      // Provide a tall container to showcase scrolling sections
      return (
        <div style={{ width: 320, height: 640, overflow: 'auto', border: '1px solid var(--border-color, #333)' }}>
          <Story />
        </div>
      );
    }
  ]
};

const seedConnections = (overrides = {}) => ({
  googleDrive: { connected: true, status: 'connected' },
  googlePhotos: { connected: false, status: 'disconnected' },
  googleCalendar: { connected: true, status: 'connected' },
  gmail: { connected: true, status: 'connected' },
  github: { connected: true, status: 'connected' },
  notion: { connected: false, status: 'disconnected' },
  ...overrides,
});

export const Default = {
  render: () => {
    useStore.setState({ connectedServices: seedConnections() });
    return <PlannerSidebar />;
  }
};

export const Minimal_NoConnections = {
  render: () => {
    useStore.setState({ connectedServices: {} });
    return <PlannerSidebar />;
  }
};

export const Emphasize_Google_And_Sources = {
  render: () => {
    useStore.setState({ connectedServices: seedConnections({ github: { connected: false, status: 'disconnected' } }) });
    return <PlannerSidebar />;
  },
  parameters: {
    docs: { description: { story: 'Use this story to manually expand “Google Services” and “Sources” to verify connection badges and Connect CTAs.' } }
  }
};

