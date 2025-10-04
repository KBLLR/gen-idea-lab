/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useRef, useState } from 'react';

/**
 * ImageViewer
 * A simple, reusable viewer that can render either a static image or a live camera feed.
 * - mode: 'image' | 'camera'
 * - For camera mode, you may pass video/canvas refs used by detection pipelines.
 * - If no canvas refs are provided, the component will display the <video> element directly.
 */
export default function ImageViewer({
  mode = 'image',
  src,
  className = '',
  style,
  // Camera-specific
  videoRef: externalVideoRef,
  canvasRef,
  overlayCanvasRef,
  autoStart = false,
  constraints = { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } },
  mirrored = false,
  onStreamStart,
  onStreamStop,
  // Placeholder control
  active = true,
  error,
  placeholder = 'No source',
  children
}) {
  const internalVideoRef = useRef(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const [started, setStarted] = useState(false);

  // Auto-start camera feed if requested and in camera mode
  useEffect(() => {
    let currentStream;
    let cancelled = false;

    async function startCamera() {
      if (mode !== 'camera' || !autoStart) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) return;
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStarted(true);
        }
        onStreamStart && onStreamStart(stream);
      } catch (e) {
        console.error('Failed to start camera:', e);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        onStreamStop && onStreamStop();
      }
    };
  }, [mode, autoStart, constraints, onStreamStart, onStreamStop, videoRef]);

  const isCamera = mode === 'camera';
  const showCanvases = isCamera && (canvasRef || overlayCanvasRef);

  // Mirroring style for camera when showing video directly
  const videoStyle = mirrored ? { transform: 'scaleX(-1)' } : undefined;

  return (
    <div className={`image-content ${className}`} style={style}>
      {!isCamera && src && (
        <img src={src} alt="Viewer" />
      )}

      {isCamera && (
        <div className="video-container" style={{ position: 'relative' }}>
          {/* If canvases are used by the pipeline, keep the <video> hidden */}
          <video
            ref={videoRef}
            style={showCanvases ? { display: 'none' } : videoStyle}
            playsInline
            muted
          />
          {canvasRef && <canvas ref={canvasRef} className="video-canvas" />}
          {overlayCanvasRef && <canvas ref={overlayCanvasRef} className="overlay-canvas" />}
          {children}
          {!active && !error && (
            <div className="placeholder">
              <span className="icon">videocam_off</span>
              <p>{placeholder}</p>
            </div>
          )}
        </div>
      )}

      {!active && !isCamera && (
        <div className="placeholder">
          <span className="icon">image_not_supported</span>
          <p>{placeholder}</p>
        </div>
      )}
    </div>
  );
}

