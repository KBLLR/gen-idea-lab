import React from 'react';
import GlassDock from '../src/ui/organisms/GlassDock';
import { FaMicrophone, FaEye, FaClosedCaptioning, FaCommentDots } from 'react-icons/fa';

// Mock useStore and other hooks/dependencies for Storybook
const mockUseStore = (initialState) => {
  const store = {
    state: initialState,
    actions: {
      setIsOrchestratorOpen: () => console.log('setIsOrchestratorOpen'),
      setIsSettingsOpen: () => console.log('setIsSettingsOpen'),
      setIsSystemInfoOpen: () => console.log('setIsSystemInfoOpen'),
      setIsLiveVoiceChatOpen: () => console.log('setIsLiveVoiceChatOpen'),
      setActiveApp: () => console.log('setActiveApp'),
      setDockPosition: () => console.log('setDockPosition'),
      setDockDimensions: () => console.log('setDockDimensions'),
      returnToChat: () => console.log('returnToChat'),
    },
    activeApp: 'ideaLab',
    activeModuleId: null,
    isLiveVoiceChatOpen: false,
    orchestratorNarration: 'Orchestrator narration example...',
    dockMode: 'chat',
    activeNodeId: null,
    currentNodeConfig: null,
    isAuthenticated: true,
    ...initialState,
  };
  return (selector) => selector(store);
};

// Mock react-router-dom's useNavigate
const mockUseNavigate = () => () => console.log('navigate');

// Mock useLiveAPI
const mockUseLiveAPI = () => ({
  client: null,
  setConfig: () => {},
  connect: () => console.log('Live API connect'),
  disconnect: () => console.log('Live API disconnect'),
  connected: false,
  volume: 0,
});

// Mock voiceCommands and enhancedVoiceSystem
const mockVoiceSystem = {
  isSupported: true,
  onStart: () => {},
  onEnd: () => {},
  onError: () => {},
  onResult: () => {},
  onPersonalityChange: () => {},
  startListening: () => console.log('startListening'),
  stopListening: () => console.log('stopListening'),
};

// Mock AudioRecorder
class MockAudioRecorder {
  constructor() {
    this.events = {};
  }
  on(event, callback) {
    this.events[event] = callback;
  }
  start() {
    console.log('AudioRecorder start');
  }
  stop() {
    console.log('AudioRecorder stop');
  }
}

// Mock voiceFunctionManager
const mockVoiceFunctionManager = {
  executeFunction: () => Promise.resolve({ success: true, message: 'Mock function executed' }),
  getAllAvailableTools: () => Promise.resolve([]),
};

// Mock getVoicePersonality
const mockGetVoicePersonality = () => ({ name: 'Default', description: 'A helpful assistant.' });

// Mock getAppPath
const mockGetAppPath = (appName) => `/${appName}`;

// Replace actual imports with mocks for Storybook
jest.mock('react-router-dom', () => ({
  useNavigate: mockUseNavigate,
}));
jest.mock('../../lib/store', () => ({ default: mockUseStore }));
jest.mock('../../lib/voiceCommands', () => ({ voiceCommands: mockVoiceSystem }));
jest.mock('../../lib/voice/enhancedVoiceSystem', () => ({ enhancedVoiceSystem: mockVoiceSystem }));
jest.mock('../../lib/voice/voicePersonalities', () => ({ getVoicePersonality: mockGetVoicePersonality }));
jest.mock('../../lib/voice/voiceFunctionManager', () => ({ voiceFunctionManager: mockVoiceFunctionManager }));
jest.mock('../../lib/voice', () => ({
  useLiveAPI: mockUseLiveAPI,
  AudioRecorder: MockAudioRecorder,
  AVAILABLE_VOICES: ['alloy', 'echo'],
  DEFAULT_VOICE: 'alloy',
}));
jest.mock('../../shared/lib/routes', () => ({
  getAppPath: mockGetAppPath,
}));

export default {
  title: 'Organisms/GlassDock',
  component: GlassDock,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    // These props are internal state, but we can simulate their effect for stories
    isMinimized: { control: 'boolean' },
    isLiveVoiceChatOpen: { control: 'boolean' },
    isScreenAware: { control: 'boolean' },
    showSubtitles: { control: 'boolean' },
    dockMode: { control: { type: 'select', options: ['chat', 'node'] } },
  },
};

const Template = (args) => {
  // Temporarily override useStore for this story
  const originalUseStore = require('../../lib/store').default;
  require('../../lib/store').default = mockUseStore(args);

  const originalUseNavigate = require('react-router-dom').useNavigate;
  require('react-router-dom').useNavigate = mockUseNavigate;

  const originalUseLiveAPI = require('../../lib/voice').useLiveAPI;
  require('../../lib/voice').useLiveAPI = mockUseLiveAPI;

  const originalVoiceCommands = require('../../lib/voiceCommands').voiceCommands;
  require('../../lib/voiceCommands').voiceCommands = mockVoiceSystem;

  const originalEnhancedVoiceSystem = require('../../lib/voice/enhancedVoiceSystem').enhancedVoiceSystem;
  require('../../lib/voice/enhancedVoiceSystem').enhancedVoiceSystem = mockVoiceSystem;

  const originalAudioRecorder = require('../../lib/voice').AudioRecorder;
  require('../../lib/voice').AudioRecorder = MockAudioRecorder;

  const originalVoiceFunctionManager = require('../../lib/voice/voiceFunctionManager').voiceFunctionManager;
  require('../../lib/voice/voiceFunctionManager').voiceFunctionManager = mockVoiceFunctionManager;

  const originalGetVoicePersonality = require('../../lib/voice/voicePersonalities').getVoicePersonality;
  require('../../lib/voice/voicePersonalities').getVoicePersonality = mockGetVoicePersonality;

  const originalGetAppPath = require('../../shared/lib/routes').getAppPath;
  require('../../shared/lib/routes').getAppPath = mockGetAppPath;

  const component = <GlassDock />;

  // Restore original mocks after rendering
  React.useEffect(() => {
    return () => {
      require('../../lib/store').default = originalUseStore;
      require('react-router-dom').useNavigate = originalUseNavigate;
      require('../../lib/voice').useLiveAPI = originalUseLiveAPI;
      require('../../lib/voiceCommands').voiceCommands = originalVoiceCommands;
      require('../../lib/voice/enhancedVoiceSystem').enhancedVoiceSystem = originalEnhancedVoiceSystem;
      require('../../lib/voice').AudioRecorder = originalAudioRecorder;
      require('../../lib/voice/voiceFunctionManager').voiceFunctionManager = originalVoiceFunctionManager;
      require('../../lib/voice/voicePersonalities').getVoicePersonality = originalGetVoicePersonality;
      require('../../shared/lib/routes').getAppPath = originalGetAppPath;
    };
  }, []);

  return component;
};

export const Default = Template.bind({});
Default.args = {
  isMinimized: false,
  isLiveVoiceChatOpen: false,
  isScreenAware: false,
  showSubtitles: false,
  dockMode: 'chat',
};

export const Minimized = Template.bind({});
Minimized.args = {
  isMinimized: true,
  isLiveVoiceChatOpen: false,
  isScreenAware: false,
  showSubtitles: false,
  dockMode: 'chat',
};

export const LiveVoiceChatOpen = Template.bind({});
LiveVoiceChatOpen.args = {
  isMinimized: false,
  isLiveVoiceChatOpen: true,
  isScreenAware: false,
  showSubtitles: false,
  dockMode: 'chat',
  // Simulate messages for voice chat
  messages: [
    { id: 1, role: 'user', content: 'Hello, how are you?', timestamp: Date.now() - 2000 },
    { id: 2, role: 'assistant', content: 'I am doing well, thank you! How can I help you today?', timestamp: Date.now() - 1000 },
  ],
  inputTranscript: 'Hello, how are you?',
  outputTranscript: 'I am doing well, thank you!',
};

export const ScreenAware = Template.bind({});
ScreenAware.args = {
  isMinimized: false,
  isLiveVoiceChatOpen: false,
  isScreenAware: true,
  showSubtitles: false,
  dockMode: 'chat',
};

export const WithSubtitles = Template.bind({});
WithSubtitles.args = {
  isMinimized: false,
  isLiveVoiceChatOpen: false,
  isScreenAware: false,
  showSubtitles: true,
  dockMode: 'chat',
  orchestratorNarration: 'This is an example of orchestrator narration being displayed as subtitles.',
};

export const NodeMode = Template.bind({});
NodeMode.args = {
  isMinimized: false,
  isLiveVoiceChatOpen: false,
  isScreenAware: false,
  showSubtitles: false,
  dockMode: 'node',
  activeNodeId: 'node-123',
  currentNodeConfig: { name: 'My Node', type: 'logic' },
};
