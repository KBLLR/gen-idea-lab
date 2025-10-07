import React, { useRef } from 'react';
import VideoFrame from '../src/ui/organisms/VideoFrame';

export default {
  title: 'Organisms/VideoFrame',
  component: VideoFrame,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    active: { control: 'boolean' },
    error: { control: 'boolean' },
    placeholder: { control: 'text' },
    children: { control: 'text' },
  },
};

const Template = (args) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  return (
    <div style={{ width: '640px', height: '480px', border: '1px solid #ccc' }}>
      <VideoFrame
        videoRef={videoRef}
        canvasRef={canvasRef}
        overlayCanvasRef={overlayCanvasRef}
        {...args}
      />
    </div>
  );
};

export const DefaultPlaceholder = Template.bind({});
DefaultPlaceholder.args = {
  active: false,
  error: false,
  placeholder: 'Configure privacy settings and click "Start Tracking"',
};

export const ActiveNoError = Template.bind({});
ActiveNoError.args = {
  active: true,
  error: false,
  placeholder: 'This placeholder should not be visible',
};

export const ErrorState = Template.bind({});
ErrorState.args = {
  active: false,
  error: true,
  placeholder: 'An error occurred while loading the video feed.',
};

export const CustomChildren = Template.bind({});
CustomChildren.args = {
  active: false,
  error: false,
  placeholder: 'Custom content below:',
  children: <div style={{ position: 'absolute', bottom: 10, left: 10, color: 'white', background: 'rgba(0,0,0,0.5)', padding: '5px' }}>Custom Overlay Content</div>,
};
