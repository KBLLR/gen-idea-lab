import React from 'react';
import MinimizedDock from './MinimizedDock.jsx';

export default {
  title: 'GlassDock/MinimizedDock',
  component: MinimizedDock,
  tags: ['component'],
  parameters: {
    viewport: { defaultViewport: 'responsive' }
  }
};

export const Default = {
  args: {
    position: { x: 20, y: 20 },
    onOpen: () => {},
    title: 'Click to open Orchestrator'
  }
};

