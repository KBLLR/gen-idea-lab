import React from 'react';
import BoothHeader from '../src/ui/organisms/BoothHeader';
import { FaRobot } from 'react-icons/fa'; // Example icon

export default {
  title: 'Organisms/BoothHeader',
  component: BoothHeader,
  argTypes: {
    icon: { control: 'object' },
    title: { control: 'text' },
    typeText: { control: 'text' },
    status: { control: { type: 'select', options: ['ready', 'pending', 'error', 'offline', 'custom status'] } },
    description: { control: 'text' },
    children: { control: 'text' },
    actions: { control: 'object' },
    align: { control: { type: 'select', options: ['top', 'center', 'bottom'] } },
  },
};

const Template = (args) => <BoothHeader {...args} />;

export const Default = Template.bind({});
Default.args = {
  icon: <FaRobot />,
  title: 'My Awesome Booth',
  typeText: 'AI Assistant',
  status: 'ready',
  description: 'This is a description of the booth and its capabilities.',
  children: 'Additional content can go here.',
  actions: <button type="button">Configure</button>,
  align: 'top',
};

export const PendingStatus = Template.bind({});
PendingStatus.args = {
  icon: <FaRobot />,
  title: 'Processing Booth',
  typeText: 'Image Generator',
  status: 'pending',
  description: 'Your request is being processed.',
  align: 'center',
};

export const NoIconNoTypeText = Template.bind({});
NoIconNoTypeText.args = {
  title: 'Simple Booth',
  status: 'offline',
  description: 'This booth is currently offline.',
  align: 'bottom',
};

export const WithCustomActions = Template.bind({});
WithCustomActions.args = {
  title: 'Custom Actions',
  typeText: 'Workflow',
  status: 'ready',
  actions: (
    <>
      <button type="button">Start</button>
      <button type="button">Stop</button>
    </>
  ),
};
