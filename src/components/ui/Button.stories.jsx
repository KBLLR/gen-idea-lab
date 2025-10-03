import Button from './Button.jsx';

export default {
  title: 'UI/Button',
  component: Button,
  args: {
    children: 'Click me'
  }
};

export const Primary = {
  args: { variant: 'primary', icon: 'auto_awesome' }
};

export const Secondary = {
  args: { variant: 'secondary', icon: 'science' }
};

export const Ghost = {
  args: { variant: 'ghost', icon: 'open_in_new' }
};

