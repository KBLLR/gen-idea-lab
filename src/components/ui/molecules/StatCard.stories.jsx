import React from 'react';
import { StatCard } from '@ui';
import { FaClock, FaTachometerAlt, FaMemory } from 'react-icons/fa'; // Example icons

export default {
  title: 'Molecules/StatCard',
  component: StatCard,
  argTypes: {
    icon: {
      control: 'select',
      options: ['timer', 'speed', 'memory', <FaClock />, <FaTachometerAlt />, <FaMemory />],
      mapping: {
        timer: 'timer',
        speed: 'speed',
        memory: 'memory',
        '<FaClock />': <FaClock />,
        '<FaTachometerAlt />': <FaTachometerAlt />,
        '<FaMemory />': <FaMemory />,
      },
    },
    value: { control: 'text' },
    label: { control: 'text' },
    variant: { control: { type: 'select', options: ['solid', 'glass'] } },
    className: { control: 'text' },
    iconColor: { control: 'color' },
  },
};

const Template = (args) => <StatCard {...args} />;

export const Default = Template.bind({});
Default.args = {
  icon: 'timer',
  value: '12:34',
  label: 'Time Elapsed',
};

export const GlassVariant = Template.bind({});
GlassVariant.args = {
  icon: 'speed',
  value: '120 mph',
  label: 'Current Speed',
  variant: 'glass',
};

export const CustomIcon = Template.bind({});
CustomIcon.args = {
  icon: <FaMemory size={24} />,
  value: '8 GB',
  label: 'Memory Usage',
  iconColor: '#880e4f',
};

export const NoIcon = Template.bind({});
NoIcon.args = {
  value: '25',
  label: 'Tasks Completed',
};
