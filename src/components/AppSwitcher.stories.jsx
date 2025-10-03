import React from 'react';
import AppSwitcher from './AppSwitcher.jsx';
import useStore from '../lib/store.js';
import { switchApp } from '../lib/actions.js';

export default {
  title: 'Layout/AppSwitcher',
  component: AppSwitcher,
  parameters: { layout: 'centered' }
};

export const Default = {
  render: () => {
    // Set an initial app; rely on real store/actions (no mocks)
    useStore.setState((s) => { s.activeApp = 'archiva'; });
    return (
      <div style={{ padding: 16 }}>
        <AppSwitcher />
        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
          Active: {useStore.getState().activeApp}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={() => { switchApp('prev'); }}>Prev (action)</button>
          <button onClick={() => { switchApp('next'); }}>Next (action)</button>
        </div>
      </div>
    );
  }
};

