import React, { useRef, useState } from 'react';
import VideoFrame from './VideoFrame.jsx';
import RecordingIndicator from './RecordingIndicator.jsx';

export default {
  title: 'EmpathyLab/VideoFrame',
  component: VideoFrame,
  parameters: { layout: 'centered' }
};

export const Placeholder = () => {
  const v = useRef(null), c = useRef(null), o = useRef(null);
  return (
    <div style={{ width: 640 }}>
      <VideoFrame videoRef={v} canvasRef={c} overlayCanvasRef={o} active={false} />
    </div>
  );
};

export const WithRecordingIndicator = () => {
  const v = useRef(null), c = useRef(null), o = useRef(null);
  return (
    <div style={{ width: 640 }}>
      <VideoFrame videoRef={v} canvasRef={c} overlayCanvasRef={o} active>
        <RecordingIndicator active />
      </VideoFrame>
    </div>
  );
};

