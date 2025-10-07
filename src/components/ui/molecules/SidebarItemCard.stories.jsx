import React from 'react';
import { SidebarItemCard } from '@ui';
import { FaHome } from 'react-icons/fa'; // Example icon

export default {
  title: 'Molecules/SidebarItemCard',
  component: SidebarItemCard,
  argTypes: {
    icon: { control: 'object' },
    label: { control: 'text' },
    count: { control: 'number' },
    active: { control: 'boolean' },
    onClick: { action: 'clicked' },
    rightSlot: { control: 'object' },
    title: { control: 'text' },
    className: { control: 'text' },
    draggable: { control: 'boolean' },
    onDragStart: { action: 'dragged' },
  },
};

const Template = (args) => <SidebarItemCard {...args} />;

export const Default = Template.bind({});
Default.args = {
  icon: <FaHome />,
  label: 'Home',
  count: 5,
  active: false,
};

export const Active = Template.bind({});
Active.args = {
  icon: <FaHome />,
  label: 'Active Item',
  count: 3,
  active: true,
};

export const WithRightSlot = Template.bind({});
WithRightSlot.args = {
  icon: <FaHome />,
  label: 'Item with Slot',
  rightSlot: <span style={{ marginLeft: 'auto' }}>➡️</span>,
  active: false,
};

export const Draggable = Template.bind({});
Draggable.args = {
  icon: <FaHome />,
  label: 'Draggable Item',
  draggable: true,
  onDragStart: (e) => console.log('Drag started', e),
};
