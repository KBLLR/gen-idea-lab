import React from 'react';
import ModuleSelector from './ModuleSelector';
import useStore from '../lib/store';

export default {
  title: 'Components/ModuleSelector',
  component: ModuleSelector,
};

const Template = (args) => <ModuleSelector {...args} />;

export const Default = Template.bind({});
Default.args = {};

Default.decorators = [
  (Story) => {
    useStore.setState({ activeModuleId: 'DS_17' });
    return <Story />;
  },
];
