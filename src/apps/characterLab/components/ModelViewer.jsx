/**
 * @file ModelViewer - React wrapper for Google Model Viewer web component
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import '@google/model-viewer';
import { handleAsyncError } from '@shared/lib/errorHandler.js';

/**
 * React wrapper for Google Model Viewer web component
 * Displays 3D GLB/glTF models with built-in controls and AR support
 *
 * @param {string} src - URL to the GLB/glTF model
 * @param {string} alt - Alt text for accessibility
 * @param {string} poster - Optional poster image URL
 * @param {boolean} autoRotate - Enable auto-rotation
 * @param {boolean} cameraControls - Enable camera controls
 * @param {string} environmentImage - HDR environment map URL
 * @param {string} skyboxImage - Skybox image URL
 * @param {string} animationName - Name of animation to play
 * @param {boolean} autoPlay - Auto-play animations
 * @param {Function} onLoad - Callback when model loads
 * @param {Function} onError - Callback on error
 */
export default function ModelViewer({
  src,
  alt = '3D model',
  poster,
  autoRotate = true,
  cameraControls = true,
  environmentImage = 'neutral',
  skyboxImage,
  animationName,
  autoPlay = true,
  loading = 'eager',
  reveal = 'auto',
  ar = true,
  arModes = 'webxr scene-viewer quick-look',
  onLoad,
  onError,
  className = '',
}) {
  const modelViewerRef = useRef(null);

  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const handleLoad = () => {
      console.log('Model loaded successfully');
      onLoad?.();
    };

    const handleError = (event) => {
      handleAsyncError(event.detail, {
        context: 'Model Viewer component',
        showToast: false, // Let parent component decide whether to show toast
        silent: false // But log to console for debugging
      });
      onError?.(event.detail);
    };

    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);

    return () => {
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
    };
  }, [onLoad, onError]);

  // Play specific animation if provided
  useEffect(() => {
    if (animationName && modelViewerRef.current) {
      const viewer = modelViewerRef.current;
      // Wait for model to load before playing animation
      viewer.addEventListener('load', () => {
        const animations = viewer.availableAnimations;
        if (animations?.includes(animationName)) {
          viewer.animationName = animationName;
          if (autoPlay) {
            viewer.play();
          }
        }
      }, { once: true });
    }
  }, [animationName, autoPlay]);

  return (
    <model-viewer
      ref={modelViewerRef}
      class={`model-viewer ${className}`}
      src={src}
      alt={alt}
      poster={poster}
      auto-rotate={autoRotate ? '' : undefined}
      camera-controls={cameraControls ? '' : undefined}
      environment-image={environmentImage}
      skybox-image={skyboxImage}
      loading={loading}
      reveal={reveal}
      ar={ar ? '' : undefined}
      ar-modes={arModes}
      shadow-intensity="1"
      shadow-softness="0.5"
      tone-mapping="neutral"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
      }}
    >
      <div className="model-viewer-loading" slot="poster">
        <div className="spinner">
          <span className="material-icons-round rotating">3d_rotation</span>
        </div>
        <p>Loading 3D model...</p>
      </div>

      {ar && (
        <button
          slot="ar-button"
          className="model-viewer-ar-button"
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            padding: '12px 20px',
            background: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <span className="material-icons-round">view_in_ar</span>
          View in AR
        </button>
      )}

      <div className="model-viewer-progress-bar" slot="progress-bar">
        <div className="progress-bar-container" style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255,255,255,0.1)',
          position: 'absolute',
          bottom: '0',
        }}>
          <div className="progress-bar-fill" style={{
            height: '100%',
            background: 'var(--color-accent)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </model-viewer>
  );
}
