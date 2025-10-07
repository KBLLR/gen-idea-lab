import React from 'react';
import { DraggableItem } from './PlannerSidebar.jsx';
import useStore from '../lib/store';
import '../styles/components/planner.css';

export default {
  title: 'Planner/ServiceStates',
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'Showcases Planner items with Connect CTA (disconnected) and status dots (connected/disconnected).' } }
  }
};

export const OAuthAndApiKeyExamples = () => {
  // Seed store with service connection states
  useStore.setState({
    connectedServices: {
      googleDrive: { connected: true, status: 'connected' },
      github: { connected: false, status: 'disconnected' },
      openai: { connected: false, status: 'disconnected' },
    },
    serviceConfig: {
      openai: { configured: true },
      github: { configured: true },
    }
  });

  const items = [
    { id: 'github', label: 'GitHub', kind: 'source', icon: 'code', connected: false },
    { id: 'google-drive', label: 'Drive Files', kind: 'google-drive', icon: 'cloud', connected: true },
    { id: 'openai', label: 'OpenAI', kind: 'model-provider', icon: 'smart_toy', connected: false },
  ];

  return (
    <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => (
        <DraggableItem key={item.id} item={item} />
      ))}
      <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 10 }}>
        Note: Clicking Connect in Storybook will not complete OAuth; it’s a UI demonstration.
      </p>
    </div>
  );
};

