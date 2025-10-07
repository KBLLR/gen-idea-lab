import React, { useState, useEffect } from 'react';
import VoiceCommand from '../src/ui/organisms/VoiceCommand';

// Mock react-router-dom's useNavigate
const mockUseNavigate = () => () => console.log('navigate');

// Mock useStore
const mockUseStore = (initialState) => {
  const store = {
    state: initialState,
    actions: {
      setIsSettingsOpen: jest.fn(),
      setIsOrchestratorOpen: jest.fn(),
      setActiveApp: jest.fn(),
    },
    ...initialState,
  };
  return (selector) => selector(store);
};

// Mock voiceCommands utility
const mockVoiceCommands = {
  isSupported: true,
  hasPermission: true,
  onStart: () => {},
  onEnd: () => {},
  onResult: () => {},
  onError: () => {},
  onPermissionChange: () => {},
  startListening: jest.fn(() => Promise.resolve(true)),
  stopListening: jest.fn(),
  getAvailableCommands: () => [
    { command: 'Go to planner', description: 'Open planner app' },
    { command: 'Open settings', description: 'Show settings modal' },
    { command: 'Help', description: 'Show this help' },
  ],
};

// Replace actual imports with mocks for Storybook
jest.mock('react-router-dom', () => ({
  useNavigate: mockUseNavigate,
}));
jest.mock('../src/lib/voiceCommands', () => ({
  voiceCommands: mockVoiceCommands,
}));
jest.mock('../src/lib/store', () => ({ default: mockUseStore }));

export default {
  title: 'Organisms/VoiceCommand',
  component: VoiceCommand,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    isListening: { control: 'boolean' },
    isSupported: { control: 'boolean' },
    hasPermission: { control: 'boolean' },
    permissionStatus: { control: { type: 'select', options: ['granted', 'denied', 'unknown'] } },
    lastCommand: { control: 'text' },
    status: { control: 'text' },
    showTooltip: { control: 'boolean' },
    showCommands: { control: 'boolean' },
  },
};

const Template = (args) => {
  // Temporarily override mocks for this story
  mockVoiceCommands.isSupported = args.isSupported;
  mockVoiceCommands.hasPermission = args.hasPermission;
  mockVoiceCommands.startListening.mockImplementation(() => {
    if (args.hasPermission) {
      args.isListening = true; // Simulate listening state change
      return Promise.resolve(true);
    } else {
      args.isListening = false;
      return Promise.resolve(false);
    }
  });
  mockVoiceCommands.stopListening.mockImplementation(() => {
    args.isListening = false; // Simulate listening state change
  });

  // Simulate internal state for Storybook controls
  const [isListening, setIsListening] = useState(args.isListening);
  const [hasPermission, setHasPermission] = useState(args.hasPermission);
  const [permissionStatus, setPermissionStatus] = useState(args.permissionStatus);
  const [status, setStatus] = useState(args.status);
  const [showTooltip, setShowTooltip] = useState(args.showTooltip);
  const [showCommands, setShowCommands] = useState(args.showCommands);

  useEffect(() => {
    setIsListening(args.isListening);
    setHasPermission(args.hasPermission);
    setPermissionStatus(args.permissionStatus);
    setStatus(args.status);
    setShowTooltip(args.showTooltip);
    setShowCommands(args.showCommands);
  }, [args]);

  // Override the component's internal state setters to reflect arg changes
  const ComponentWithMockedState = () => {
    const originalUseState = React.useState;
    React.useState = (initialValue) => {
      if (initialValue === args.isListening) return [isListening, setIsListening];
      if (initialValue === args.hasPermission) return [hasPermission, setHasPermission];
      if (initialValue === args.permissionStatus) return [permissionStatus, setPermissionStatus];
      if (initialValue === args.status) return [status, setStatus];
      if (initialValue === args.showTooltip) return [showTooltip, setShowTooltip];
      if (initialValue === args.showCommands) return [showCommands, setShowCommands];
      return originalUseState(initialValue);
    };

    const component = <VoiceCommand />;
    React.useState = originalUseState; // Restore original useState
    return component;
  };

  return <ComponentWithMockedState />;
};

export const Default = Template.bind({});
Default.args = {
  isListening: false,
  isSupported: true,
  hasPermission: true,
  permissionStatus: 'granted',
  lastCommand: '',
  status: '',
  showTooltip: false,
  showCommands: false,
};

export const Listening = Template.bind({});
Listening.args = {
  ...Default.args,
  isListening: true,
  status: 'Listening...',
};

export const PermissionDenied = Template.bind({});
PermissionDenied.args = {
  ...Default.args,
  hasPermission: false,
  permissionStatus: 'denied',
  showTooltip: true,
  status: 'Microphone permission denied. Please allow access to use voice commands.',
};

export const ShowCommandsList = Template.bind({});
ShowCommandsList.args = {
  ...Default.args,
  showCommands: true,
};

export const WithLastCommand = Template.bind({});
WithLastCommand.args = {
  ...Default.args,
  lastCommand: 'Go to planner',
  status: 'Heard: "Go to planner" (95%)',
};
