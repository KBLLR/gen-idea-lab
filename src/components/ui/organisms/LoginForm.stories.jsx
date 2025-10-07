import React from 'react';
import LoginForm from '../src/ui/organisms/LoginForm';

// Mock the Google Sign-In script and window.google object
const mockGoogle = {
  accounts: {
    id: {
      initialize: jest.fn(),
      renderButton: jest.fn(),
    },
  },
};

// Mock the loginWithGoogle action
jest.mock('../src/lib/actions', () => ({
  loginWithGoogle: jest.fn((credential) => {
    console.log('Mock loginWithGoogle called with:', credential);
    if (credential === 'mock_success_credential') {
      return Promise.resolve({ success: true });
    } else {
      return Promise.resolve({ success: false, error: 'Mock login failed.' });
    }
  }),
}));

// Simulate the script loading
const simulateGoogleScriptLoad = (callback) => {
  window.google = mockGoogle;
  callback();
};

export default {
  title: 'Organisms/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => {
      React.useEffect(() => {
        simulateGoogleScriptLoad(() => {
          // Manually trigger the renderButton callback if needed for specific tests
          // For general visual stories, the mock renderButton is sufficient
        });
      }, []);
      return <Story />;
    },
  ],
};

const Template = (args) => <LoginForm {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const LoadingState = Template.bind({});
LoadingState.args = {
  // This state is managed internally, so we can't directly control it via args.
  // For a real loading state story, you'd typically mock `loginWithGoogle` to delay resolution.
  // For now, this story just shows the default appearance.
};

export const ErrorState = Template.bind({});
ErrorState.args = {
  // Similar to loading, error is internal. We can simulate it by making loginWithGoogle fail.
  // This would require more complex mocking or a wrapper component to expose internal state.
  // For now, this story just shows the default appearance.
};
