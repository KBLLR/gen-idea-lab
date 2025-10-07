import React from 'react';
import ModuleAgentsChat from './ModuleAgentsChat';
import useStore from '../lib/store';

export default {
  title: 'Components/ModuleAgentsChat',
  component: ModuleAgentsChat,
};

const Template = (args) => <ModuleAgentsChat {...args} />;

export const Default = Template.bind({});
Default.args = {};

Default.decorators = [
  (Story) => {
    useStore.setState({
      activeModuleId: 'DS_17',
      assistantHistories: {
        DS_17: [
          { role: 'model', responseText: 'Hello! How can I help you with Design Systems today?' },
          { role: 'user', content: 'Can you explain the difference between a design system and a style guide?' },
        ],
      },
      isAssistantLoading: false,
      personalities: {
        DS_17: {
          name: 'Designer',
          title: 'Your creative partner',
          icon: 'palette',
        },
      },
      modulesBySemester: [
        [
          {
            'Module Code': 'SE_12',
            'Module Title': 'Software Engineering 2',
          },
        ],
      ],
      connectedServices: {
        ollama: { connected: true },
        openai: { connected: false },
        claude: { connected: true },
      },
      assistantModel: 'gemini-2.5-flash',
      assistantSystemPrompts: {},
      actions: {
        setAssistantModel: () => {},
        setAssistantSystemPrompt: () => {},
        saveAssistantChat: () => {},
      },
    });
    return <Story />;
  },
];
