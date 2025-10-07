import React from 'react';
import SidebarCategoryItem from '../src/ui/molecules/SidebarCategoryItem';
import { FaFolder } from 'react-icons/fa'; // Example icon

export default {
  title: 'Molecules/SidebarCategoryItem',
  component: SidebarCategoryItem,
  argTypes: {
    icon: { control: 'object' },
    label: { control: 'text' },
    count: { control: 'number' },
    active: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
};

const Template = (args) => <SidebarCategoryItem {...args} />;

export const Default = Template.bind({});
Default.args = {
  icon: <FaFolder />,
  label: 'Category Name',
  count: 10,
  active: false,
};

export const Active = Template.bind({});
Active.args = {
  icon: <FaFolder />,
  label: 'Active Category',
  count: 5,
  active: true,
};

export const NoCount = Template.bind({});
NoCount.args = {
  icon: <FaFolder />,
  label: 'Category without Count',
  count: 0,
  active: false,
};
