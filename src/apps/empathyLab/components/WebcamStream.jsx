/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useRef, useEffect } from 'react';
import useHumanWebcam from '@shared/hooks/useHumanWebcam.js';
import RecordingIndicator from '@components/ui/atoms/RecordingIndicator.jsx';

/**
 * WebcamStream - Glass component for Human AI webcam streaming
 * Self-contained webcam viewer with Human library integration
 */
export default function WebcamStream({
  consent = {},
  isActive = false,
  onResults,
  onError,
  onStatusChange,
  showOverlays = true,
  drawOverlays,
  className = ''
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  const {
    start,
    stop,
    isLoading,
    isModelReady,
    isTracking,
    error,
    loadingStatus,
    fps,
    tensors
  } = useHumanWebcam({
    consent,
    videoRef,
    canvasRef,
    overlayCanvasRef,
    onResults: (human, result, interpolated, { overlayCtx }) => {
      if (onResults) {
        onResults(human, result, interpolated);
      }

      if (showOverlays && overlayCtx && drawOverlays) {
        drawOverlays(interpolated, overlayCtx);
      }
    },
    onStatus: (status) => {
      if (onStatusChange) {
        onStatusChange(status);
      }
    },
    onError: (err) => {
      if (onError) {
        onError(err);
      }
    }
  });

  // Auto-start/stop based on isActive prop
  useEffect(() => {
    if (isActive && !isTracking && !isLoading) {
      start();
    } else if (!isActive && isTracking) {
      stop();
    }
  }, [isActive, isTracking, isLoading, start, stop]);

  return (
    <div className={`webcam-stream ${className}`}>
      {/* Hidden video element */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        playsInline
        muted
        autoPlay
      />

      {/* Main canvas for video frames */}
      <canvas ref={canvasRef} className="webcam-canvas" />

      {/* Overlay canvas for detection results */}
      <canvas ref={overlayCanvasRef} className="webcam-overlay" />

      {/* Recording indicator */}
      {isTracking && <RecordingIndicator active={true} />}

      {/* Loading overlay */}
      {isLoading && (
        <div className="webcam-loading">
          <div className="loading-spinner"></div>
          <p>{loadingStatus || 'Loading...'}</p>
        </div>
      )}

      {/* Placeholder when inactive */}
      {!isTracking && !isLoading && (
        <div className="webcam-placeholder">
          <span className="icon">videocam_off</span>
          <p>Configure privacy settings and start tracking</p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="webcam-error">
          <span className="icon">error</span>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
