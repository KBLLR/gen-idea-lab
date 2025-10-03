import React from 'react';
import UserBar from './UserBar.jsx';
import useStore from '../lib/store.js';

export default {
  title: 'Layout/UserBar',
  component: UserBar,
  parameters: { layout: 'centered' }
};

export const AuthenticatedDark = {
  render: () => {
    useStore.setState((s) => {
      s.isAuthenticated = true;
      s.isCheckingAuth = false;
      s.theme = 'dark';
      s.user = { name: 'Alex Doe', email: 'alex@example.com', picture: '' };
    });
    return (
      <div style={{ width: 640 }}>
        <UserBar />
      </div>
    );
  }
};

export const AuthenticatedLight = {
  render: () => {
    useStore.setState((s) => {
      s.isAuthenticated = true;
      s.isCheckingAuth = false;
      s.theme = 'light';
      s.user = { name: 'Jamie Rivera', email: 'jamie@example.com', picture: '' };
    });
    return (
      <div style={{ width: 640 }}>
        <UserBar />
      </div>
    );
  }
};

