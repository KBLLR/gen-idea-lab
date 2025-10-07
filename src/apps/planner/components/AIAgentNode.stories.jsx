import React from 'react';
import AIAgentNode from './AIAgentNode';

export default {
  title: 'Components/Planner/AIAgentNode',
  component: AIAgentNode,
};

const Template = (args) => <AIAgentNode {...args} />;

export const Default = Template.bind({});
Default.args = {
  data: {
    label: 'AI Agent',
    inputs: [
      { id: 'input1', label: 'Input 1' },
      { id: 'input2', label: 'Input 2' },
    ],
    outputs: [
      { id: 'output1', label: 'Output 1' },
      { id: 'output2', label: 'Output 2' },
    ],
  },
};
