import React from 'react';
import ServiceTile from '../src/ui/molecules/ServiceTile';
import { FaGoogle } from 'react-icons/fa'; // Example icon

export default {
  title: 'Molecules/ServiceTile',
  component: ServiceTile,
  argTypes: {
    service: {
      control: 'object',
      description: 'Service object containing icon, name, and color',
    },
    isConnected: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
};

const Template = (args) => <ServiceTile {...args} />;

export const Connected = Template.bind({});
Connected.args = {
  service: {
    icon: FaGoogle,
    name: 'Google',
    color: '#4285F4',
  },
  isConnected: true,
};

export const Disconnected = Template.bind({});
Disconnected.args = {
  service: {
    icon: FaGoogle,
    name: 'Google',
    color: '#4285F4',
  },
  isConnected: false,
};

export const CustomService = Template.bind({});
CustomService.args = {
  service: {
    icon: ({ size, style }) => <span style={{ ...style, fontSize: size }}>🚀</span>, // Custom icon
    name: 'Custom Service',
    color: '#FF5733',
  },
  isConnected: true,
};
