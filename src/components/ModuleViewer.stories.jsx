import React from 'react';
import ModuleViewer from './ModuleViewer';
import useStore from '../lib/store';

export default {
  title: 'Components/ModuleViewer',
  component: ModuleViewer,
};

const Template = (args) => <ModuleViewer {...args} />;

export const Default = Template.bind({});
Default.args = {};

Default.decorators = [
  (Story) => {
    useStore.setState({ 
      activeModuleId: 'DS_17',
      modules: {
        DS_17: {
          'Module Code': 'DS_17',
          'Module Title': 'Design Systems',
          'ECTS Credits': '5',
          'Contact Time (hours)': '60',
          'Module Type': 'Project',
          'Module Coordinator': 'Prof. Dr. Max Mustermann',
          'Key Contents / Topics': 'Design tokens, component libraries, documentation, design systems thinking',
          'Qualification Objectives': [
            'Understand the principles of design systems',
            'Create and maintain a design system',
            'Use a design system to build a product',
          ],
          resources: [
            { type: 'figma', url: '' },
            { type: 'github', url: '' },
            { type: 'notion', url: '' },
          ],
        },
      },
      personalities: {
        DS_17: {
          name: 'Designer',
          title: 'Your creative partner',
          icon: 'palette',
        },
      },
      connectedServices: {
        figma: { connected: true },
        github: { connected: false },
        notion: { connected: true },
      },
      showKnowledgeSection: false,
      actions: {
        toggleKnowledgeSection: () => useStore.setState({ showKnowledgeSection: !useStore.getState().showKnowledgeSection }),
        updateModuleResourceUrl: () => {},
      },
    });
    return <Story />;
  },
];
