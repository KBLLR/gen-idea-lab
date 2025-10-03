import React from 'react';
import SidebarCategoryItem from './SidebarCategoryItem.jsx';

export default {
  title: 'Sidebar/CategoryItem',
  component: SidebarCategoryItem,
  parameters: { layout: 'centered' }
};

export const Default = {
  args: { icon: 'today', label: 'Today', count: 2, active: false }
};

export const Active = {
  args: { icon: 'history', label: 'Past', count: 12, active: true }
};

