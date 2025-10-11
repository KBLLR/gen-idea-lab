/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { Panel, Button, ActionBar } from '@ui';
import BoothHeader from '@components/ui/organisms/BoothHeader.jsx';
import { FilesetResolver, GestureRecognizer, DrawingUtils } from '@mediapipe/tasks-vision';
import useStore from '@store';
import StellarScene from '@apps/gestureLab/components/StellarScene.jsx';

const THUMB_TIP_INDEX = 4;
const INDEX_FINGER_TIP_INDEX = 8;
const SMOOTHING_FACTOR = 0.3;

export default function GestureLab() {
    const theme = useStore.use.theme();
    const videoRef = useRef(null);
    const landmarkCanvasRef = useRef(null);
    const strokeCanvasRef = useRef(null);
    const gestureRecognizerRef = useRef(null);
    const rafRef = useRef(null);
    const previousHandPositionsRef = useRef([]);
    const triggerPulseRef = useRef(null);
    const stellarRef = useRef(null);
    const stellarContainerRef = useRef(null);
    const uiContainerRef = useRef(null);
    const uiPointerRef = useRef({ x: 0, y: 0, isPinching: false, wasPinching: false });
    const [uiState, setUiState] = useState({ wifi: true, lights: false, music: false, volume: 50 });
    const [uiHoverKey, setUiHoverKey] = useState(null);
    const [uiPressedKey, setUiPressedKey] = useState(null);
    const [uiBounceKey, setUiBounceKey] = useState(null);

    const handleUiTap = useCallback((x, y, width, height) => {
        // Define simple boxes in percentages
        const boxes = [
            { key: 'wifi',   x: 0.08, y: 0.15, w: 0.22, h: 0.18 },
            { key: 'lights', x: 0.38, y: 0.15, w: 0.22, h: 0.18 },
            { key: 'music',  x: 0.68, y: 0.15, w: 0.22, h: 0.18 },
        ];
        const vol = { key: 'volume', x: 0.08, y: 0.50, w: 0.82, h: 0.14 };
        const nx = x / width, ny = y / height;
        for (const b of boxes) {
            if (nx >= b.x && nx <= b.x + b.w && ny >= b.y && ny <= b.y + b.h) {
                setUiState(s => ({ ...s, [b.key]: !s[b.key] }));
                return;
            }
        }
        if (nx >= vol.x && nx <= vol.x + vol.w && ny >= vol.y && ny <= vol.y + vol.h) {
            const rel = Math.max(0, Math.min(1, (nx - vol.x) / vol.w));
            const v = Math.round(rel * 100);
            setUiState(s => ({ ...s, volume: v }));
        }
    }, []);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState(null);
    const [currentGesture, setCurrentGesture] = useState('none');
    const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
    const dprRef = useRef(typeof window !== 'undefined' ? Math.max(1, Math.min(3, window.devicePixelRatio || 1)) : 1);
    const mode = useStore.use.gestureLab().mode;
    const setGestureLabMode = useStore.use.actions().setGestureLabMode;
    const [selectedGesture, setSelectedGesture] = useState('pinch'); // 'pinch' | 'fist' | 'twoHands' | 'openPalm'
    const [brushColor, setBrushColor] = useState('#00FFFF');
    const [brushSize, setBrushSize] = useState(4);
    const [eraserSize, setEraserSize] = useState(12);
    const brushColorRef = useRef('#00FFFF');
    const brushSizeRef = useRef(4);
    const eraserSizeRef = useRef(12);
    const uploadInputRef = useRef(null);
    const [gallery, setGallery] = useState([]);
    const [showGallery, setShowGallery] = useState(false);
    const [showStellarModal, setShowStellarModal] = useState(false);
    const fistStartTimeRef = useRef(null);
    const [fistSeconds, setFistSeconds] = useState(0);
    const [holdsRank, setHoldsRank] = useState([]); // last 5 longest holds

    const getLevelName = (strength) => {
        if (strength >= 2.8) return 'Supernova';
        if (strength >= 2.2) return 'Nova';
        if (strength >= 1.5) return 'Solar Flare';
        if (strength >= 1.0) return 'Rising Star';
        return 'Spark';
    };

    useEffect(() => { brushColorRef.current = brushColor; }, [brushColor]);
    useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);
    useEffect(() => { eraserSizeRef.current = eraserSize; }, [eraserSize]);

    // When switching to 3D and tracking isn't running, prompt user to start
    useEffect(() => {
        if (mode === '3d' && !isInitialized) {
            setShowStellarModal(true);
        }
    }, [mode, isInitialized]);

    const prevPointRef = useRef({ x: null, y: null });

    useEffect(() => {
        const getContainer = () => {
            return strokeCanvasRef.current?.parentElement || stellarContainerRef.current || document.body;
        };
        const applyCanvasDPR = () => {
            const sCanvas = strokeCanvasRef.current;
            const lCanvas = landmarkCanvasRef.current;
            const dpr = typeof window !== 'undefined' ? Math.max(1, Math.min(3, window.devicePixelRatio || 1)) : 1;
            dprRef.current = dpr;
            const container = getContainer();
            const wCss = container?.clientWidth || container?.offsetWidth || 0;
            const hCss = container?.clientHeight || container?.offsetHeight || 0;
            if (!wCss || !hCss) return;
            if (sCanvas) {
                sCanvas.width = Math.floor(wCss * dpr);
                sCanvas.height = Math.floor(hCss * dpr);
                sCanvas.style.width = '100%';
                sCanvas.style.height = '100%';
                const sctx = sCanvas.getContext('2d');
                if (sctx) { sctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
            }
            if (lCanvas) {
                lCanvas.width = Math.floor(wCss * dpr);
                lCanvas.height = Math.floor(hCss * dpr);
                lCanvas.style.width = '100%';
                lCanvas.style.height = '100%';
                const lctx = lCanvas.getContext('2d');
                if (lctx) { lctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
            }
        };
        const updateSize = () => {
            const container = getContainer();
            setCanvasSize({ width: container?.clientWidth || 0, height: container?.clientHeight || 0 });
            applyCanvasDPR();
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const prepareVideoStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { width: 1280, height: 720 }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Initialize recognizer after video metadata is ready (attach once)
                videoRef.current.addEventListener('loadedmetadata', () => {
                    initializeMediaPipe();
                }, { once: true });
                try { await videoRef.current.play?.(); } catch {}
            }
        } catch (err) {
            setError(`Camera access denied: ${err.message}`);
        }
    };

    const initializeMediaPipe = async () => {
        try {
            // Prepare recognizer using ESM import
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );
            const recognizer = await GestureRecognizer.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath:
                        'https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task',
                    delegate: 'GPU'
                },
                runningMode: 'VIDEO',
                numHands: 2
            });
            gestureRecognizerRef.current = recognizer;
            setIsInitialized(true);

            // Start RAF render loop
            let lastTime = -1;
            const loop = () => {
                const video = videoRef.current;
                const lCanvas = landmarkCanvasRef.current;
                const sCanvas = strokeCanvasRef.current;
                const lctx = lCanvas?.getContext('2d');
                const sctx = sCanvas?.getContext('2d');
                if (!video || !lCanvas || !lctx) {
                    rafRef.current = requestAnimationFrame(loop);
                    return;
                }
                // Skip until video has valid dimensions
                if (!video.videoWidth || !video.videoHeight) {
                    rafRef.current = requestAnimationFrame(loop);
                    return;
                }

                if (video.currentTime !== lastTime) {
                    lastTime = video.currentTime;
                    let result = null;
                    try {
                        result = recognizer.recognizeForVideo(video, performance.now());
                    } catch (e) {
                        // Guard against transient ROI/dimension errors; retry next frame.
                        // Optionally surface once.
                        if (!error) setError('Tracking error: retrying…');
                        rafRef.current = requestAnimationFrame(loop);
                        return;
                    }
                    if (error) setError(null);
                    // Clear overlay each frame
                    lctx.clearRect(0, 0, lCanvas.width, lCanvas.height);

                    if (result?.landmarks && result.landmarks.length > 0) {
                        result.landmarks.forEach((landmarks, i) => {
                            // Draw skeleton using DrawingUtils (theme-aware color; red in 3D mode)
                            const handColor = mode === '3d' ? '#ff3333' : (theme === 'light' ? '#000000' : '#FFFFFF');
                            const drawingUtils = new DrawingUtils(lctx);
                            drawingUtils.drawConnectors(
                                landmarks,
                                GestureRecognizer.HAND_CONNECTIONS,
                                { color: handColor, lineWidth: 3 }
                            );
                            drawingUtils.drawLandmarks(landmarks, { color: handColor, lineWidth: 1, radius: 3 });

                            // Whiteboard mode gestures
                            if (mode === 'whiteboard') {
                                const width = canvasSize.width;
                                const height = canvasSize.height;
                                const thumbTip = landmarks[THUMB_TIP_INDEX];
                                const indexTip = landmarks[INDEX_FINGER_TIP_INDEX];
                                if (thumbTip && indexTip && width > 0 && height > 0) {
                                    // Use normalized Euclidean distance for robust pinch detection
                                    const ndx = (thumbTip.x - indexTip.x);
                                    const ndy = (thumbTip.y - indexTip.y);
                                    const nDist = Math.hypot(ndx, ndy); // 0..~1
                                    const isPinching = nDist < 0.06; // ~6% of frame

                                    // Fist = stop drawing (no stroke updates)
                                    if (selectedGesture === 'fist') {
                                        setCurrentGesture('stop');
                                        prevPointRef.current = { x: null, y: null };
                                    }
                                    // Open Palm = erase (use pinch path as eraser handle)
                                    else if (selectedGesture === 'openPalm' && isPinching) {
                                        setCurrentGesture('erase');
                                        const x = (1 - indexTip.x) * width;
                                        const y = indexTip.y * height;
                                        drawLine(sctx, x, y, true);
                                    }
                                    // Pinch = draw
                                    else if (selectedGesture === 'pinch' && isPinching) {
                                        setCurrentGesture('pinch');
                                        const x = (1 - indexTip.x) * width;
                                        const y = indexTip.y * height;
                                        drawLine(sctx, x, y, false);
                                    }
                                    else {
                                        setCurrentGesture('none');
                                        prevPointRef.current = { x: null, y: null };
                                    }
                                }
                            }
                        });

                        // 3D mode gestures
                        if (mode === '3d') {
                            // Fist detection (all fingers curled)
                            const isFistDetected = result.landmarks.some(landmarks => {
                                const indexTip = landmarks[8], indexPIP = landmarks[6];
                                const middleTip = landmarks[12], middlePIP = landmarks[10];
                                const ringTip = landmarks[16], ringPIP = landmarks[14];
                                const pinkyTip = landmarks[20], pinkyPIP = landmarks[18];
                                return indexTip.y > indexPIP.y && middleTip.y > middlePIP.y &&
                                       ringTip.y > ringPIP.y && pinkyTip.y > pinkyPIP.y;
                            });

                            // Fist hold counter
                            if (isFistDetected) {
                                setCurrentGesture('fist');
                                if (fistStartTimeRef.current == null) {
                                    fistStartTimeRef.current = Date.now();
                                }
                                const secs = (Date.now() - fistStartTimeRef.current) / 1000;
                                setFistSeconds(secs);
                                // feed charge to stellar scene (for shaking)
                                stellarRef.current?.setCharge?.(secs);
                            } else if (fistStartTimeRef.current != null) {
                                // Released: compute strength and pulse
                                const dur = (Date.now() - fistStartTimeRef.current) / 1000;
                                const strength = Math.max(0.5, Math.min(3, dur / 1.2));
                                stellarRef.current?.pulse?.(strength);
                                stellarRef.current?.setCharge?.(0);
                                fistStartTimeRef.current = null;
                                setFistSeconds(0);
                                setCurrentGesture('none');

                                // Push to ranking and keep top 5 by duration
                                setHoldsRank((prev) => {
                                    const next = [...prev, { duration: dur, strength, level: getLevelName(strength), ts: Date.now() }];
                                    next.sort((a, b) => b.duration - a.duration);
                                    return next.slice(0, 5);
                                });
                            }

                            // Two-hand navigation
                            if (result.landmarks.length === 2) {
                                const hand1Center = result.landmarks[0][0];
                                const hand2Center = result.landmarks[1][0];
                                const currentPositions = [
                                    { x: hand1Center.x, y: hand1Center.y },
                                    { x: hand2Center.x, y: hand2Center.y }
                                ];

                                if (previousHandPositionsRef.current.length === 2) {
                                    const prevCenter = {
                                        x: (previousHandPositionsRef.current[0].x + previousHandPositionsRef.current[1].x) / 2,
                                        y: (previousHandPositionsRef.current[0].y + previousHandPositionsRef.current[1].y) / 2
                                    };
                                    const currentCenter = {
                                        x: (currentPositions[0].x + currentPositions[1].x) / 2,
                                        y: (currentPositions[0].y + currentPositions[1].y) / 2
                                    };

                                    const deltaX = currentCenter.x - prevCenter.x;
                                    const deltaY = currentCenter.y - prevCenter.y;
                                    if (Math.abs(deltaX) > 0.001 || Math.abs(deltaY) > 0.001) {
                                        // rotate stellar scene; scale deltas from normalized space
                                        stellarRef.current?.rotate?.(deltaX * lCanvas.width, deltaY * lCanvas.height);
                                        setCurrentGesture('two_hands');
                                    }
                                }
                                previousHandPositionsRef.current = currentPositions;
                            } else {
                                previousHandPositionsRef.current = [];
                            }
                        }
                        
                        // UI Control mode gestures
                        if (mode === 'ui') {
                            const width = canvasSize.width;
                            const height = canvasSize.height;
                            const thumbTip = result.landmarks[0]?.[THUMB_TIP_INDEX];
                            const indexTip = result.landmarks[0]?.[INDEX_FINGER_TIP_INDEX];
                            if (thumbTip && indexTip) {
                                const dx = Math.abs(thumbTip.x - indexTip.x) * width;
                                const dy = Math.abs(thumbTip.y - indexTip.y) * height;
                                const isPinching = dx < 50 && dy < 50;
                                // Overlay is mirrored via CSS; compute pointer in display coords
                                const px = indexTip.x * width;
                                const py = indexTip.y * height;
                                uiPointerRef.current.x = px;
                                uiPointerRef.current.y = py;
                                uiPointerRef.current.isPinching = isPinching;
                                // hover detection
                                const cont = uiContainerRef.current;
                                const contW = cont?.clientWidth || width;
                                const contH = cont?.clientHeight || height;
                                const displayX = contW - px; // mirror horizontally to match visual
                                const nx = displayX / contW;
                                const ny = py / contH;
                                const boxes = [
                                    { key: 'wifi',   x: 0.08, y: 0.15, w: 0.22, h: 0.18 },
                                    { key: 'lights', x: 0.38, y: 0.15, w: 0.22, h: 0.18 },
                                    { key: 'music',  x: 0.68, y: 0.15, w: 0.22, h: 0.18 },
                                ];
                                const vol = { key: 'volume', x: 0.08, y: 0.50, w: 0.82, h: 0.14 };
                                let hover = null;
                                for (const b of boxes) {
                                    if (nx >= b.x && nx <= b.x + b.w && ny >= b.y && ny <= b.h) { hover = b.key; break; }
                                }
                                if (!hover && nx >= vol.x && nx <= vol.x + vol.w && ny >= vol.y && ny <= vol.y + vol.h) hover = 'volume';
                                if (hover !== uiHoverKey) setUiHoverKey(hover);
                                // draw a small cursor
                                lctx.beginPath();
                                lctx.arc(px, py, 8, 0, Math.PI * 2);
                                lctx.strokeStyle = '#ffcc00';
                                lctx.lineWidth = 2;
                                lctx.stroke();

                                if (isPinching && !uiPointerRef.current.wasPinching) {
                                    const w = contW;
                                    const h = contH;
                                    setUiPressedKey(hover);
                                    handleUiTap(displayX, py, w, h);
                                }
                                if (!isPinching && uiPointerRef.current.wasPinching) {
                                    setUiPressedKey(null);
                                    // trigger bounce on last hovered control
                                    if (hover) {
                                        setUiBounceKey(hover);
                                        setTimeout(() => setUiBounceKey(null), 480);
                                    }
                                }
                                uiPointerRef.current.wasPinching = isPinching;
                            } else {
                                uiPointerRef.current.isPinching = false;
                                uiPointerRef.current.wasPinching = false;
                                setUiHoverKey(null);
                                setUiPressedKey(null);
                            }
                        }
                    } else {
                        previousHandPositionsRef.current = [];
                    }
                }

                rafRef.current = requestAnimationFrame(loop);
            };

            setIsInitialized(true);
            rafRef.current = requestAnimationFrame(loop);
        } catch (err) {
            setError(`MediaPipe initialization failed: ${err.message}`);
        }
    };

    // no dynamic loader needed with ESM import

    const drawLine = (ctx, x, y, erase = false) => {
        if (!ctx) {
            prevPointRef.current = { x: null, y: null };
            return;
        }
        if (prevPointRef.current.x == null || prevPointRef.current.y == null) {
            prevPointRef.current = { x, y };
            return;
        }

        const { x: px, y: py } = prevPointRef.current;
        const smoothedX = px + SMOOTHING_FACTOR * (x - px);
        const smoothedY = py + SMOOTHING_FACTOR * (y - py);

        const prevComposite = ctx.globalCompositeOperation;
        if (erase) {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = brushColorRef.current;
        }
        ctx.lineWidth = erase ? eraserSizeRef.current : brushSizeRef.current;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(smoothedX, smoothedY);
        ctx.stroke();
        ctx.globalCompositeOperation = prevComposite || 'source-over';

        prevPointRef.current = { x: smoothedX, y: smoothedY };
    };

    const stopTracking = useCallback(() => {
        try {
            // Stop camera tracks
            const stream = videoRef.current?.srcObject;
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
                videoRef.current.srcObject = null;
            }
            // Cancel RAF
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            // Close recognizer
            try { gestureRecognizerRef.current?.close?.(); } catch {}
            gestureRecognizerRef.current = null;
            // Clear canvases
            const lctx = landmarkCanvasRef.current?.getContext('2d');
            const sctx = strokeCanvasRef.current?.getContext('2d');
            const w = landmarkCanvasRef.current?.width || 0;
            const h = landmarkCanvasRef.current?.height || 0;
            if (lctx) lctx.clearRect(0, 0, w, h);
            if (sctx) sctx.clearRect(0, 0, w, h);
            prevPointRef.current = { x: null, y: null };
        } finally {
            setIsInitialized(false);
            setCurrentGesture('none');
        }
    }, []);

    const handleStart = useCallback(() => {
        setError(null);
        prepareVideoStream();
    }, []);

    const handleClear = () => {
                        const ctx = strokeCanvasRef.current?.getContext('2d');
        if (ctx) {
            const dpr = dprRef.current || 1;
            ctx.clearRect(0, 0, (canvasSize.width * dpr), (canvasSize.height * dpr));
        }
        prevPointRef.current = { x: null, y: null };
    };

    const handleSave = () => {
        const sCanvas = strokeCanvasRef.current;
        if (!sCanvas) return;
        const out = document.createElement('canvas');
        out.width = sCanvas.width; out.height = sCanvas.height;
        const octx = out.getContext('2d');
        // theme-aware background
        octx.fillStyle = theme === 'light' ? '#ffffff' : getComputedStyle(document.documentElement).getPropertyValue('--surface-secondary') || '#1a1a1a';
        octx.fillRect(0, 0, out.width, out.height);
        // draw strokes on top
        octx.drawImage(sCanvas, 0, 0);
        const dataUrl = out.toDataURL('image/png');
        // add to simple gallery
        setGallery((prev) => [dataUrl, ...prev].slice(0, 50));
        // download
        const a = document.createElement('a');
        a.href = dataUrl; a.download = `gesturelab-${Date.now()}.png`; a.click();
    };

    const fitContain = (imgW, imgH, boxW, boxH) => {
        const scale = Math.min(boxW / imgW, boxH / imgH);
        const w = imgW * scale; const h = imgH * scale;
        const x = (boxW - w) / 2; const y = (boxH - h) / 2;
        return { x, y, w, h };
    };

    const handleUploadClick = () => {
        uploadInputRef.current?.click();
    };

    const handleUploadChange = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
            const img = new Image();
            img.onload = () => {
                const ctx = strokeCanvasRef.current?.getContext('2d');
                if (!ctx) return;
                const { width, height } = ctx.canvas;
                // draw background image onto whiteboard beneath strokes
                const { x, y, w, h } = fitContain(img.width, img.height, width, height);
                ctx.save();
                // Put background image using source-over is fine; it's the base layer
                ctx.globalCompositeOperation = 'destination-over';
                ctx.drawImage(img, x, y, w, h);
                ctx.restore();
            };
            img.src = URL.createObjectURL(file);
        } finally {
            // reset input so same file can be selected again
            e.target.value = '';
        }
    };

    const handleOpenGallery = () => {
        setShowGallery(true);
    };

    // Map trigger pulse to stellar scene
    useEffect(() => {
        triggerPulseRef.current = () => {
            stellarRef.current?.pulse?.();
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => () => {
        stopTracking();
    }, [stopTracking]);

    // no draggable preview; we render only landmarks overlay + whiteboard

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Standard app header with actions in the right (third) slot */}
            <BoothHeader
                icon="gesture"
                title="GestureLab"
                typeText="Hand Tracking & Whiteboard"
                status={isInitialized ? (currentGesture === 'pinch' ? 'active' : 'ready') : 'idle'}
                description="Pinch index + thumb to draw. Uses MediaPipe Hands."
                align="top"
                actions={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Whiteboard gesture mode toggles (header no longer switches modes) */}
                        {mode === 'whiteboard' && (
                            <>
                                <Button
                                  variant={selectedGesture === 'pinch' ? 'primary' : 'secondary'}
                                  icon="gesture"
                                  onClick={() => setSelectedGesture('pinch')}
                                  aria-pressed={selectedGesture === 'pinch'}
                                  title="Pinch to draw"
                                  size="sm"
                                >Pinch</Button>
                        <Button
                          variant={selectedGesture === 'fist' ? 'primary' : 'secondary'}
                          icon="back_hand"
                          onClick={() => setSelectedGesture('fist')}
                          aria-pressed={selectedGesture === 'fist'}
                          title="Fist = Stop Drawing"
                          size="sm"
                        >Fist</Button>
                        <Button
                          variant={selectedGesture === 'twoHands' ? 'primary' : 'secondary'}
                          icon="pan_tool"
                          onClick={() => setSelectedGesture('twoHands')}
                          aria-pressed={selectedGesture === 'twoHands'}
                          title="Two Hands (reserved)"
                          size="sm"
                        >Two Hands</Button>
                        <Button
                          variant={selectedGesture === 'openPalm' ? 'primary' : 'secondary'}
                          icon="waving_hand"
                          onClick={() => setSelectedGesture('openPalm')}
                          aria-pressed={selectedGesture === 'openPalm'}
                          title="Open Palm = Eraser"
                          size="sm"
                        >Open Palm</Button>
                                <div style={{ width: 8 }} />
                            </>
                        )}

                        {!isInitialized ? (
                            <Button icon="play_arrow" onClick={handleStart} variant="primary">Start Tracking</Button>
                        ) : (
                            <>
                                <Button icon="stop" onClick={stopTracking} variant="secondary">Stop</Button>
                                <Button icon="refresh" onClick={handleClear} variant="secondary">Clear</Button>
                            </>
                        )}
                    </div>
                }
            >
                <div className="prompt-info">
                    <h4>Controls</h4>
                    <p className="prompt-text">Pinch gesture draws cyan strokes. Use Clear to reset.</p>
                </div>
            </BoothHeader>

            {/* Whiteboard mode: Drawing area */}
            {mode === 'whiteboard' && (
            <Panel
                title="Drawing Canvas"
                className="panel--fill"
                style={{ flex: 1, minHeight: 0 }}
                footer={(
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', width: '100%' }}>
                    {/* Palette */}
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Colors</span>
                    {['#FFFFFF','#000000','#00FFFF','#1e88e5','#66bb6a','#ffd54f','#ff5252','#9c27b0'].map(c => (
                      <button
                        key={c}
                        onClick={() => setBrushColor(c)}
                        title={c}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: c,
                          border: brushColor === c ? '2px solid var(--text-accent)' : '1px solid var(--border-secondary)'
                        }}
                      />
                    ))}
                    <div style={{ width: 16 }} />
                    {/* Brush sizes */}
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Brush</span>
                    {[2,4,6,10,16,24].map(s => (
                      <button
                        key={s}
                        onClick={() => setBrushSize(s)}
                        title={`Size ${s}`}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          border: brushSize === s ? '2px solid var(--text-accent)' : '1px solid var(--border-secondary)'
                        }}
                      >
                        <span style={{
                          display: 'block',
                          width: Math.max(4, Math.min(20, s)),
                          height: Math.max(4, Math.min(20, s)),
                          borderRadius: '50%',
                          background: 'var(--text-primary)'
                        }} />
                      </button>
                    ))}
                    <div style={{ width: 16 }} />
                    {/* Eraser sizes */}
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Eraser</span>
                    {[8,12,20].map(s => (
                      <button
                        key={`eraser-${s}`}
                        onClick={() => { setEraserSize(s); setSelectedGesture('openPalm'); }}
                        title={`Eraser ${s}`}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          border: (selectedGesture === 'openPalm' && eraserSize === s) ? '2px solid var(--text-accent)' : '1px solid var(--border-secondary)'
                        }}
                      >
                        <span className="icon" style={{ fontSize: 16, color: 'var(--text-primary)' }}>ink_eraser</span>
                      </button>
                    ))}
                    {/* Actions aligned right */}
                    <div style={{ marginLeft: 'auto' }}>
                      <ActionBar
                        aria-label="Canvas actions"
                        items={[
                          { id: 'save', label: 'Save', icon: 'save', onClick: handleSave },
                          { id: 'upload', label: 'Upload Background', icon: 'upload', onClick: handleUploadClick },
                          { id: 'gallery', label: 'Gallery', icon: 'photo_library', onClick: handleOpenGallery }
                        ]}
                      />
                    </div>
                  </div>
                )}
            >
                <div style={{ position: 'relative', width: '100%', height: '100%', background: theme === 'light' ? '#ffffff' : 'var(--surface-secondary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {/* Stroke canvas (drawing) */}
                    <canvas
                        ref={strokeCanvasRef}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%'
                        }}
                    />

                    {/* Landmark canvas (hand overlay) */}
                    <canvas
                        ref={landmarkCanvasRef}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 10,
                            transform: 'rotateY(180deg)'
                        }}
                    />

                    {/* Hidden video element (no camera preview; landmarks overlay only) */}
                    <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
                    {/* Hidden upload input */}
                    <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadChange} />

                    {/* Simple gallery overlay */}
                    {showGallery && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border-secondary)' }}>
                          <strong>Saved Drawings</strong>
                          <button className="action-btn" title="Close" onClick={() => setShowGallery(false)}><span className="icon">close</span></button>
                        </div>
                        <div style={{ padding: 12, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                          {gallery.length === 0 ? (
                            <div style={{ color: 'var(--text-secondary)' }}>No saved drawings yet. Use Save to add one.</div>
                          ) : gallery.map((src, i) => (
                            <div key={i} style={{ background: '#000', border: '1px solid var(--border-secondary)', borderRadius: 6, overflow: 'hidden' }}>
                              <img src={src} alt={`Saved ${i}`} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px' }}>
                                <button className="action-btn" title="Download" onClick={() => { const a = document.createElement('a'); a.href = src; a.download = `gesturelab-${i}.png`; a.click(); }}><span className="icon">download</span></button>
                                <button className="action-btn" title="Set as Background" onClick={() => {
                                  const img = new Image();
                                  img.onload = () => {
                                    const ctx = strokeCanvasRef.current?.getContext('2d'); if (!ctx) return;
                                    const { width, height } = ctx.canvas; const { x, y, w, h } = fitContain(img.width, img.height, width, height);
                                    ctx.save(); ctx.globalCompositeOperation = 'destination-over'; ctx.drawImage(img, x, y, w, h); ctx.restore();
                                  };
                                  img.src = src; setShowGallery(false);
                                }}><span className="icon">image</span></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {error && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            padding: '1rem',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-surface-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-text-primary)',
                            textAlign: 'center'
                        }}>
                            <span className="icon" style={{ fontSize: '2rem', color: '#ef5350' }}>
                                error
                            </span>
                            <p>{error}</p>
                        </div>
                    )}
                </div>
            </Panel>
            )}

            {/* UI Control mode */}
            {mode === 'ui' && (
              <Panel title="UI Control Lab" className="panel--fill" style={{ flex: 1, minHeight: 0 }}>
                <div ref={uiContainerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
                  {/* Components grid */}
                  <div className={`ui-tile ${uiHoverKey==='wifi' ? 'hover' : ''} ${uiPressedKey==='wifi' ? 'pressed' : ''} ${uiBounceKey==='wifi' ? 'bounce' : ''}`} style={{ position: 'absolute', left: '8%', top: '15%', width: '22%', height: '18%', borderRadius: 12, border: '1px solid var(--glass-panel-border)', background: 'var(--glass-panel-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
                    <span>Wi‑Fi</span>
                    <span className={`toggle-switch ${uiState.wifi ? 'active' : ''}`} />
                  </div>
                  <div className={`ui-tile ${uiHoverKey==='lights' ? 'hover' : ''} ${uiPressedKey==='lights' ? 'pressed' : ''} ${uiBounceKey==='lights' ? 'bounce' : ''}`} style={{ position: 'absolute', left: '38%', top: '15%', width: '22%', height: '18%', borderRadius: 12, border: '1px solid var(--glass-panel-border)', background: 'var(--glass-panel-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
                    <span>Lights</span>
                    <span className={`toggle-switch ${uiState.lights ? 'active' : ''}`} />
                  </div>
                  <div className={`ui-tile ${uiHoverKey==='music' ? 'hover' : ''} ${uiPressedKey==='music' ? 'pressed' : ''} ${uiBounceKey==='music' ? 'bounce' : ''}`} style={{ position: 'absolute', left: '68%', top: '15%', width: '22%', height: '18%', borderRadius: 12, border: '1px solid var(--glass-panel-border)', background: 'var(--glass-panel-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
                    <span>Music</span>
                    <span className={`toggle-switch ${uiState.music ? 'active' : ''}`} />
                  </div>
                  {/* Volume slider */}
                  <div className={`ui-tile ${uiHoverKey==='volume' ? 'hover' : ''} ${uiPressedKey==='volume' ? 'pressed' : ''} ${uiBounceKey==='volume' ? 'bounce' : ''}`} style={{ position: 'absolute', left: '8%', top: '50%', width: '82%', height: '14%', borderRadius: 12, border: '1px solid var(--glass-panel-border)', background: 'var(--glass-panel-bg)', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px' }}>
                    <span className="icon">volume_up</span>
                    <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.18)', borderRadius: 6, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${uiState.volume}%`, background: 'var(--text-accent)', borderRadius: 6 }} />
                      <div className={`ui-knob ${uiBounceKey==='volume' ? 'bounce' : ''}`} style={{ position: 'absolute', left: `calc(${uiState.volume}% - 7px)`, top: -3 }} />
                    </div>
                    <span>{uiState.volume}%</span>
                  </div>

                  {/* Landmarks overlay for UI */}
                  <canvas
                    ref={landmarkCanvasRef}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, transform: 'rotateY(180deg)' }}
                  />
                  {/* Hidden video element: required for MediaPipe */}
                  <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
                </div>
              </Panel>
            )}
            {mode === '3d' && (
              <Panel title="Stellar Visualization" className="panel--fill" style={{ flex: 1, minHeight: 0 }}>
                <div ref={stellarContainerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <StellarScene ref={stellarRef} />
                  {/* Landmark overlay above 3D */}
                  <canvas
                    ref={landmarkCanvasRef}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, transform: 'rotateY(180deg)' }}
                  />
                  {/* Rank overlay (top-left) */}
                  {holdsRank.length > 0 && (
                    <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 15, background: 'rgba(0,0,0,0.55)', border: '1px solid var(--glass-panel-border)', borderRadius: 8, padding: '8px 12px', color: '#fff', minWidth: 200 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Biggest Stars Rank</div>
                      <ol style={{ margin: 0, paddingLeft: 18 }}>
                        {holdsRank.map((h, i) => (
                          <li key={h.ts || i} style={{ margin: '2px 0' }}>
                            <span style={{ fontWeight: 600 }}>{h.level}</span>
                            <span style={{ opacity: 0.85 }}> — {h.duration.toFixed(1)}s</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {/* Fist hold counter */}
                  {fistSeconds > 0 && (
                    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 15, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-panel-border)', borderRadius: 8, padding: '6px 10px', color: '#fff' }}>
                      Charge: {fistSeconds.toFixed(1)}s
                    </div>
                  )}
                  {/* Hidden video element: required for MediaPipe frame source */}
                  <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

                  {/* Start modal for 3D demo */}
                  {showStellarModal && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                      <div style={{ background: 'var(--glass-panel-bg)', border: '1px solid var(--glass-panel-border)', boxShadow: 'var(--glass-panel-shadow)', backdropFilter: 'var(--glass-backdrop-filter)', borderRadius: 12, padding: 16, width: 420, maxWidth: '90%' }}>
                        <h3 style={{ margin: '0 0 8px' }}>Stellar Flare Demo</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                          This demo renders the 3D star and tracks your hands. Click Start to grant camera access (if needed), then:
                          <br/>– Make a Fist to trigger a stellar pulse.
                          <br/>– Move both hands together to rotate the star.
                        </p>
                        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button className="action-btn" onClick={() => setShowStellarModal(false)} title="Cancel"><span className="icon">close</span></button>
                          <button className="action-btn" onClick={async () => { if (!isInitialized) { await handleStart(); } setShowStellarModal(false); setTimeout(() => stellarRef.current?.pulse?.(), 400); }} title="Start"><span className="icon">play_arrow</span></button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            )}
        </div>
    );
}
