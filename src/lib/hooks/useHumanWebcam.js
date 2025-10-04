/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useHumanWebcam
 * Encapsulates Human library init + webcam stream + detect loop.
 * - Uses requestVideoFrameCallback when available, otherwise requestAnimationFrame.
 * - Exposes device enumeration and switching.
 */
export default function useHumanWebcam({
  consent = {},
  videoRef,
  canvasRef,
  overlayCanvasRef,
  deviceId,
  constraintsBase,
  onResults, // (human, result, interpolated, ctxs)
  onStatus,  // (message)
  onError    // (error)
} = {}) {
  const humanRef = useRef(null);
  const rafRef = useRef(null);
  const rvfcRef = useRef(null);
  const streamRef = useRef(null);
  const onResultsRef = useRef(onResults);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [fps, setFps] = useState(0);
  const [tensors, setTensors] = useState(0);
  const [devices, setDevices] = useState([]);

  const status = useCallback((msg) => {
    setLoadingStatus(msg || '');
    onStatus && onStatus(msg || '');
  }, [onStatus]);

  const handleError = useCallback((e) => {
    const message = e?.message || String(e);
    setError(message);
    onError && onError(e);
  }, [onError]);

  const enumerateVideoDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const list = await navigator.mediaDevices.enumerateDevices();
      const cams = list.filter((d) => d.kind === 'videoinput');
      setDevices(cams);
    } catch (e) {
      // non-fatal; often requires prior permission
    }
  }, []);

  // Keep onResultsRef updated with latest callback
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  // Build Human config from consent
  const buildHumanConfig = useCallback(() => ({
    backend: 'webgl',
    modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models',
    async: true,
    warmup: 'face',
    face: {
      enabled: !!consent.faceDetection,
      detector: { rotation: true, maxDetected: 5, skipFrames: 0, return: true },
      mesh: { enabled: true },
      iris: { enabled: !!consent.gazeTracking },
      description: { enabled: false },
      emotion: { enabled: !!consent.emotionAnalysis, minConfidence: 0.3 },
      age: { enabled: false },
      gender: { enabled: false }
    },
    body: { enabled: !!consent.bodyTracking, maxDetected: 1, minConfidence: 0.3 },
    hand: { enabled: !!consent.handTracking, landmarks: true, minConfidence: 0.3, maxDetected: 2 },
    gesture: { enabled: !!consent.handTracking },
    segmentation: { enabled: false },
    filter: { enabled: true, equalization: false, flip: false }
  }), [consent]);

  const stopLoop = useCallback(() => {
    if (rvfcRef.current && videoRef?.current?.cancelVideoFrameCallback) {
      try { videoRef.current.cancelVideoFrameCallback(rvfcRef.current); } catch {}
      rvfcRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [videoRef]);

  const stop = useCallback(() => {
    stopLoop();
    if (streamRef.current) {
      try { streamRef.current.getTracks().forEach((t) => t.stop()); } catch {}
      streamRef.current = null;
    }
    if (videoRef?.current) {
      try { videoRef.current.srcObject = null; } catch {}
    }
    // Clear canvases
    if (canvasRef?.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (overlayCanvasRef?.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
    setIsTracking(false);
    setIsLoading(false);
  }, [stopLoop, videoRef, canvasRef, overlayCanvasRef]);

  const loopWithRVFC = useCallback((human) => {
    const v = videoRef.current;
    if (!v) return;
    const cb = async () => {
      try {
        const result = await human.detect(v);
        const interpolated = human.next(result);
        // FPS
        if (result.performance?.total) {
          const cur = 1000 / result.performance.total;
          setFps((prev) => Math.round(cur));
        }
        // Memory tensors
        const memoryInfo = human.tf?.engine().memory();
        if (memoryInfo?.numTensors !== undefined) setTensors(memoryInfo.numTensors);

        const ctx = canvasRef?.current?.getContext ? canvasRef.current.getContext('2d') : null;
        if (ctx) {
          ctx.drawImage(v, 0, 0);
        }
        const overlayCtx = overlayCanvasRef?.current?.getContext ? overlayCanvasRef.current.getContext('2d') : null;
        if (overlayCtx) {
          overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
        onResultsRef.current && onResultsRef.current(human, result, interpolated, { ctx, overlayCtx, video: v });
      } catch (e) {
        // swallow per-frame errors to keep loop alive
      }
      rvfcRef.current = v.requestVideoFrameCallback(frameCb);
    };
    const frameCb = () => { cb(); };
    rvfcRef.current = v.requestVideoFrameCallback(frameCb);
  }, [canvasRef, overlayCanvasRef, videoRef]);

  const loopWithRAF = useCallback((human) => {
    const v = videoRef.current;
    if (!v) return;
    const step = async () => {
      try {
        const result = await human.detect(v);
        const interpolated = human.next(result);
        if (result.performance?.total) {
          const cur = 1000 / result.performance.total;
          setFps((prev) => Math.round(cur));
        }
        const memoryInfo = human.tf?.engine().memory();
        if (memoryInfo?.numTensors !== undefined) setTensors(memoryInfo.numTensors);

        const ctx = canvasRef?.current?.getContext ? canvasRef.current.getContext('2d') : null;
        if (ctx) ctx.drawImage(v, 0, 0);
        const overlayCtx = overlayCanvasRef?.current?.getContext ? overlayCanvasRef.current.getContext('2d') : null;
        if (overlayCtx) overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        onResultsRef.current && onResultsRef.current(human, result, interpolated, { ctx, overlayCtx, video: v });
      } catch (e) {}
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [canvasRef, overlayCanvasRef, videoRef]);

  const start = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (!humanRef.current) {
        status('Importing Human library...');
        const Human = (await import('@vladmandic/human')).default;
        status('Configuring detection models...');
        humanRef.current = new Human(buildHumanConfig());
        status('Downloading AI models from CDN (5-20MB)...');
        await humanRef.current.load();
        status('Warming up TensorFlow backend...');
        await humanRef.current.warmup();
        status('');
        setIsModelReady(true);
      }

      // Enumerate devices (requires permission on some browsers)
      await enumerateVideoDevices();

      // Build constraints
      const base = constraintsBase || { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } };
      const cons = JSON.parse(JSON.stringify(base));
      if (deviceId) {
        cons.video = cons.video || {};
        cons.video.deviceId = { exact: deviceId };
        delete cons.video.facingMode;
      }

      status('Starting webcam...');
      const stream = await navigator.mediaDevices.getUserMedia(cons);
      streamRef.current = stream;
      if (videoRef?.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Size canvases to video
      if (videoRef?.current && canvasRef?.current && overlayCanvasRef?.current) {
        const { videoWidth, videoHeight } = videoRef.current;
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        overlayCanvasRef.current.width = videoWidth;
        overlayCanvasRef.current.height = videoHeight;
      }

      setIsTracking(true);

      // Start loop
      const human = humanRef.current;
      if (videoRef?.current?.requestVideoFrameCallback) {
        loopWithRVFC(human);
      } else {
        loopWithRAF(human);
      }

    } catch (e) {
      handleError(e);
      status('');
    } finally {
      setIsLoading(false);
    }
  }, [buildHumanConfig, canvasRef, constraintsBase, deviceId, enumerateVideoDevices, handleError, loopWithRAF, loopWithRVFC, overlayCanvasRef, status, videoRef]);

  // Cleanup on unmount
  useEffect(() => () => {
    stop();
  }, [stop]);

  return {
    start,
    stop,
    isLoading,
    isModelReady,
    isTracking,
    error,
    loadingStatus,
    fps,
    tensors,
    devices,
    refreshDevices: enumerateVideoDevices
  };
}

