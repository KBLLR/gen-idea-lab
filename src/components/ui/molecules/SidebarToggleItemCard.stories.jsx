import React from 'react';
import SidebarToggleItemCard from '../src/ui/molecules/SidebarToggleItemCard';
import { FaBell } from 'react-icons/fa'; // Example icon

export default {
  title: 'Molecules/SidebarToggleItemCard',
  component: SidebarToggleItemCard,
  argTypes: {
    icon: { control: 'object' },
    label: { control: 'text' },
    checked: { control: 'boolean' },
    onChange: { action: 'changed' },
    description: { control: 'text' },
    title: { control: 'text' },
    tooltip: { control: 'boolean' },
  },
};

const Template = (args) => <SidebarToggleItemCard {...args} />;

export const Default = Template.bind({});
Default.args = {
  icon: <FaBell />,
  label: 'Enable Notifications',
  checked: true,
  description: 'Receive alerts for important updates.',
};

export const Unchecked = Template.bind({});
Unchecked.args = {
  icon: <FaBell />,
  label: 'Disable Notifications',
  checked: false,
  description: 'Do not receive any alerts.',
};

export const WithTooltip = Template.bind({});
WithTooltip.args = {
  icon: <FaBell />,
  label: 'Show Tooltip',
  checked: true,
  tooltip: true,
  description: 'This description should not show if tooltip is true.',
};
