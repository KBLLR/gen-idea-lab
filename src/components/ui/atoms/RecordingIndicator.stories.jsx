import React from 'react';
import RecordingIndicator from '../src/ui/atoms/RecordingIndicator';

export default {
  title: 'Atoms/RecordingIndicator',
  component: RecordingIndicator,
  argTypes: {
    active: { control: 'boolean' },
    label: { control: 'text' },
  },
};

const Template = (args) => <RecordingIndicator {...args} />;

export const Default = Template.bind({});
Default.args = {
  active: true,
  label: 'Tracking Active',
};

export const Inactive = Template.bind({});
Inactive.args = {
  active: false,
  label: 'Tracking Inactive',
};

export const CustomLabel = Template.bind({});
CustomLabel.args = {
  active: true,
  label: 'Recording in Progress',
};
