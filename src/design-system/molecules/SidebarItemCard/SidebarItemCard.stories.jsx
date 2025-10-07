import { SidebarItemCard } from './SidebarItemCard';

export default { title: 'UI/Molecules/SidebarItemCard', component: SidebarItemCard, parameters: { layout: 'centered' } };

export const Basic = { args: { icon: '🧩', label: 'Index.js Assets' } };
export const Active = { args: { icon: '📚', label: 'Storybook', active: true, badge: '12' } };
export const WithRight = { args: { icon: '🧭', label: 'Per-App Tasks', rightSlot: <span>⌘K</span> } };