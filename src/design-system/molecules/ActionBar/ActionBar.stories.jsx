import { ActionBar } from './ActionBar';

export default { title: 'UI/Molecules/ActionBar', component: ActionBar, parameters: { layout: 'centered' } };

const items = [
  { id: 'add', label: 'Add', icon: '➕' },
  { id: 'edit', label: 'Edit', icon: '✏️' },
  { id: 'del', label: 'Delete', icon: '🗑️', disabled: true },
];

export const Basic = { args: { items } };
export const Large = { args: { items, size: 'lg' } };