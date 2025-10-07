import React from 'react';
import SidebarSubheader from '../src/ui/molecules/SidebarSubheader';
import { FaCog, FaPlus } from 'react-icons/fa'; // Example icons

export default {
  title: 'Molecules/SidebarSubheader',
  component: SidebarSubheader,
  argTypes: {
    icon: { control: 'object' },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    rightSlot: { control: 'object' },
    actions: { control: 'array' },
  },
};

const Template = (args) => <SidebarSubheader {...args} />;

export const Default = Template.bind({});
Default.args = {
  icon: <FaCog />,
  title: 'Settings',
  subtitle: 'Manage your preferences',
};

export const WithRightSlot = Template.bind({});
WithRightSlot.args = {
  title: 'My Section',
  rightSlot: <button type="button">View All</button>,
};

export const WithActions = Template.bind({});
WithActions.args = {
  title: 'Actions',
  actions: [
    { id: 'add', icon: <FaPlus />, onClick: () => console.log('Add clicked'), label: 'Add' },
    { id: 'settings', icon: <FaCog />, onClick: () => console.log('Settings clicked'), label: 'Settings' },
  ],
};

export const OnlyTitle = Template.bind({});
OnlyTitle.args = {
  title: 'Just a Title',
};
