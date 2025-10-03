import ActionBar from './ActionBar.jsx';

export default {
  title: 'UI/ActionBar',
  component: ActionBar
};

export const Default = () => (
  <ActionBar
    items={[
      { key: 'settings', icon: 'settings', title: 'Settings', onClick: () => {} },
      { key: 'theme', icon: 'light_mode', title: 'Switch to light mode', onClick: () => {} },
      { key: 'logout', icon: 'logout', title: 'Logout', variant: 'danger', onClick: () => {} },
    ]}
  />
);

