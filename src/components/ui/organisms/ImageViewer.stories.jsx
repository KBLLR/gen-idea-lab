/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useRef } from 'react';
import ImageViewer from './ImageViewer.jsx';

export default {
  title: 'UI/ImageViewer',
  component: ImageViewer,
};

const SAMPLE_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#9cf"/><stop offset="100%" stop-color="#39f"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="24" fill="#fff">Sample Image</text></svg>`
  );

export const ImageMode = () => (
  <div style={{ maxWidth: 680 }}>
    <ImageViewer mode="image" src={SAMPLE_IMG} />
  </div>
);

export const CameraPlaceholder = () => (
  <div style={{ maxWidth: 680 }}>
    <ImageViewer
      mode="camera"
      active={false}
      placeholder="Grant camera permission to start preview"
    />
  </div>
);

export const CameraOverlayMock = () => {
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  useEffect(() => {
    const ctx = overlayCanvasRef.current?.getContext?.('2d');
    if (!ctx) return;
    let t = 0;
    const id = setInterval(() => {
      const c = overlayCanvasRef.current;
      if (!c) return;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
      ctx.lineWidth = 4;
      const w = Math.max(40, 40 + 20 * Math.sin(t / 6));
      const h = w * 0.75;
      ctx.strokeRect(40 + (t % 40), 40, w, h);
      t++;
    }, 120);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ maxWidth: 680 }}>
      <ImageViewer
        mode="camera"
        // No autoStart in Storybook; we simply show the canvases
        canvasRef={canvasRef}
        overlayCanvasRef={overlayCanvasRef}
        active={false}
        placeholder="Canvas overlay demo"
      />
    </div>
  );
};

