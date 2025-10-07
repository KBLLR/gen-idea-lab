/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export default function VideoFrame({
  videoRef,
  canvasRef,
  overlayCanvasRef,
  active,
  error,
  placeholder = 'Configure privacy settings and click "Start Tracking"',
  children
}) {
  return (
    <div className="video-container">
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas ref={canvasRef} className="video-canvas" />
      <canvas ref={overlayCanvasRef} className="overlay-canvas" />
      {children}
      {!active && !error && (
        <div className="placeholder">
          <span className="icon">videocam_off</span>
          <p>{placeholder}</p>
        </div>
      )}
    </div>
  );
}

