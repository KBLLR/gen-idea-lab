/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import WebcamStream from './WebcamStream.jsx';

export default {
  title: 'Empathy/WebcamStream',
  component: WebcamStream,
};

const consentAll = {
  faceDetection: true,
  gazeTracking: true,
  bodyTracking: false,
  handTracking: false,
  emotionAnalysis: true,
};

export const Inactive = () => (
  <div style={{ maxWidth: 920 }}>
    <WebcamStream consent={consentAll} isActive={false} />
  </div>
);

export const ActiveRequiresPermission = () => {
  const [active, setActive] = useState(false);
  return (
    <div style={{ maxWidth: 920 }}>
      <p style={{ marginBottom: 12 }}>
        This story requests camera access when you toggle it on.
      </p>
      <button onClick={() => setActive(!active)}>
        {active ? 'Stop' : 'Start'} Webcam
      </button>
      <div style={{ marginTop: 12 }}>
        <WebcamStream
          consent={consentAll}
          isActive={active}
          showOverlays
          drawOverlays={(res, ctx) => {
            if (res?.face?.[0]?.box) {
              const [x, y, w, h] = res.face[0].box;
              ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
              ctx.lineWidth = 3;
              ctx.strokeRect(x, y, w, h);
            }
          }}
        />
      </div>
    </div>
  );
};

