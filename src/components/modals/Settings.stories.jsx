import React from 'react';
import Settings from '../src/ui/organisms/Settings';

export default {
  title: 'Organisms/Settings',
  component: Settings,
  parameters: {
    layout: 'fullscreen',
  },
};

const Template = (args) => <Settings {...args} />;

export const Default = Template.bind({});
Default.args = {};
