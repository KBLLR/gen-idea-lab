import React from 'react';
import SidebarTooltip from '../src/ui/atoms/SidebarTooltip';

export default {
  title: 'Atoms/SidebarTooltip',
  component: SidebarTooltip,
  argTypes: {
    text: { control: 'text' },
    content: { control: 'text' },
    x: { control: 'number' },
    y: { control: 'number' },
    visible: { control: 'boolean' },
    placement: { control: { type: 'select', options: ['top', 'right', 'bottom', 'left'] } },
  },
};

const Template = (args) => <SidebarTooltip {...args} />;

export const Default = Template.bind({});
Default.args = {
  text: 'Tooltip text',
  visible: true,
  x: 50,
  y: 50,
  placement: 'right',
};

export const WithContent = Template.bind({});
WithContent.args = {
  content: <div><strong>Custom Content</strong><p>This is some custom HTML content.</p></div>,
  visible: true,
  x: 100,
  y: 100,
  placement: 'bottom',
};

export const TopPlacement = Template.bind({});
TopPlacement.args = {
  text: 'Top Tooltip',
  visible: true,
  x: 150,
  y: 150,
  placement: 'top',
};
