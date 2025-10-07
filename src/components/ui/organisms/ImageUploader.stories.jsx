import React from 'react';
import ImageUploader from '../src/ui/organisms/ImageUploader';

// Mock the dependencies
jest.mock('../src/lib/actions', () => ({
  setInputImage: jest.fn(),
}));
jest.mock('../src/lib/fileUtils', () => ({
  fileToBase64: jest.fn(() => Promise.resolve('data:image/png;base64,mocked_base64_image')),
}));

export default {
  title: 'Organisms/ImageUploader',
  component: ImageUploader,
  parameters: {
    layout: 'centered',
  },
};

const Template = (args) => <ImageUploader {...args} />;

export const Default = Template.bind({});
Default.args = {};
