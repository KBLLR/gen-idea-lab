import React from 'react';
import UserBar from '../src/ui/organisms/UserBar';

// Mock useStore and actions
const mockUseStore = (initialState) => {
  const store = {
    state: initialState,
    use: {
      theme: () => initialState.theme,
      user: () => initialState.user,
      isAuthenticated: () => initialState.isAuthenticated,
    },
    actions: {
      setIsSettingsOpen: jest.fn(),
    },
    ...initialState,
  };
  return (selector) => selector(store);
};

const mockToggleTheme = jest.fn();
const mockLogout = jest.fn();

jest.mock('../../lib/store', () => ({ default: mockUseStore }));
jest.mock('../../lib/actions', () => ({
  toggleTheme: mockToggleTheme,
  logout: mockLogout,
}));

export default {
  title: 'Organisms/UserBar',
  component: UserBar,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    theme: { control: { type: 'select', options: ['light', 'dark'] } },
    isAuthenticated: { control: 'boolean' },
    userName: { control: 'text' },
    userEmail: { control: 'text' },
    userPicture: { control: 'text' },
  },
};

const Template = (args) => {
  // Temporarily override useStore for this story
  const originalUseStore = require('../../lib/store').default;
  require('../../lib/store').default = mockUseStore({
    theme: args.theme,
    user: args.isAuthenticated ? { name: args.userName, email: args.userEmail, picture: args.userPicture } : null,
    isAuthenticated: args.isAuthenticated,
  });

  const originalToggleTheme = require('../../lib/actions').toggleTheme;
  require('../../lib/actions').toggleTheme = mockToggleTheme;

  const originalLogout = require('../../lib/actions').logout;
  require('../../lib/actions').logout = mockLogout;

  const component = <UserBar />;

  // Restore original mocks after rendering
  React.useEffect(() => {
    return () => {
      require('../../lib/store').default = originalUseStore;
      require('../../lib/actions').toggleTheme = originalToggleTheme;
      require('../../lib/actions').logout = originalLogout;
    };
  }, []);

  return component;
};

export const LoggedInLight = Template.bind({});
LoggedInLight.args = {
  theme: 'light',
  isAuthenticated: true,
  userName: 'John Doe',
  userEmail: 'john.doe@example.com',
  userPicture: 'https://via.placeholder.com/30',
};

export const LoggedInDark = Template.bind({});
LoggedInDark.args = {
  theme: 'dark',
  isAuthenticated: true,
  userName: 'Jane Smith',
  userEmail: 'jane.smith@example.com',
  userPicture: 'https://via.placeholder.com/30/0000FF/FFFFFF?text=JS',
};

export const LoggedInNoPicture = Template.bind({});
LoggedInNoPicture.args = {
  theme: 'light',
  isAuthenticated: true,
  userName: 'Guest User',
  userEmail: 'guest@example.com',
  userPicture: null,
};

export const NotAuthenticated = Template.bind({});
NotAuthenticated.args = {
  isAuthenticated: false,
};
