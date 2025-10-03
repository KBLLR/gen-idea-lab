import React from 'react';
import { DraggableItem } from './PlannerSidebar.jsx';
import useStore from '../lib/store';
import '../styles/components/planner.css';

export default {
  title: 'Planner/DraggableItem',
  component: DraggableItem,
  parameters: {
    layout: 'centered',
    docs: { description: { component: 'Planner sidebar item with connection status and quick connect CTA.' } }
  },
  decorators: [
    (Story, context) => {
      // Seed minimal store state for connection badges/CTAs
      const { connectedServices, serviceConfig } = context.args || {};
      useStore.setState({
        connectedServices: connectedServices || {},
        serviceConfig: serviceConfig || {},
      });
      return (
        <div style={{ width: 300 }}>
          <Story />
        </div>
      );
    }
  ]
};

export const Source_Disconnected = {
  args: {
    item: { id: 'github', label: 'GitHub', kind: 'source', icon: 'code', connected: false },
    connectedServices: {},
  }
};

export const Source_Connected = {
  args: {
    item: { id: 'github', label: 'GitHub', kind: 'source', icon: 'code', connected: true },
    connectedServices: { github: { connected: true, status: 'connected' } },
  }
};

export const GoogleDrive_Connected = {
  args: {
    item: { id: 'google-drive', label: 'Drive Files', kind: 'google-drive', icon: 'cloud', connected: true },
    connectedServices: { googleDrive: { connected: true, status: 'connected' } },
  }
};

export const ModelProvider_Disconnected = {
  args: {
    item: { id: 'openai', label: 'OpenAI', kind: 'model-provider', icon: 'smart_toy', connected: false },
    connectedServices: {},
    // Mark as configured to avoid opening Settings automatically in demo
    serviceConfig: { openai: { configured: true } }
  }
};

