// .storybook/preview.jsx
import React from 'react';
import '../src/design-system/tokens/index.css';
import '../src/design-system/utilities/index.css';
import AppProviders from '../src/AppProviders.jsx';

export const decorators = [
  (Story, context) => {
    const theme = context.globals.theme || 'light';
    const root = document.documentElement;
    root.classList.toggle('theme-dark', theme === 'dark');
    root.classList.toggle('theme-light', theme !== 'dark');
    return (
      <AppProviders>
        <Story />
      </AppProviders>
    );
  },
];

export const globalTypes = {
  theme: {
    name: 'Theme',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      items: [
        { value: 'light', title: 'Light' },
        { value: 'dark', title: 'Dark' },
      ],
    },
  },
};

export const parameters = {
  layout: 'centered',
  controls: { expanded: true },
};
