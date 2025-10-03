/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import BoothHeader from './BoothHeader.jsx';
import Button from './ui/Button.jsx';
import Panel from './ui/Panel.jsx';
import FormField from './ui/FormField.jsx';
import VideoFrame from './empathy/VideoFrame.jsx';
import RecordingIndicator from './empathy/RecordingIndicator.jsx';
import HumeVoiceChat from './empathy/HumeVoiceChat.jsx';
import EmotionFusionDisplay from './empathy/EmotionFusionDisplay.jsx';
import GazeOverlay from './empathy/GazeOverlay.jsx';

export default function EmpathyLab() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const humanRef = useRef(null);
    const animationFrameRef = useRef(null);

    const [isTracking, setIsTracking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [sessionData, setSessionData] = useState([]);

    const [trackingMode, setTrackingMode] = useState('face'); // 'face', 'body', 'hands', 'all'
    const [showOverlays, setShowOverlays] = useState(true);
    const [showMesh, setShowMesh] = useState(false);

    // Performance monitoring
    const [fps, setFps] = useState(0);
    const [tensors, setTensors] = useState(0);
    const fpsHistoryRef = useRef([]);

    const [consent, setConsent] = useState({
        faceDetection: false,
        emotionAnalysis: false,
        bodyTracking: false,
        handTracking: false,
        gazeTracking: false
    });

    // Hume integration state
    const [humeEmotions, setHumeEmotions] = useState(null);
    const [selectedConfigId, setSelectedConfigId] = useState(null);

    // Multimodal layout state
    const [showVoiceChat, setShowVoiceChat] = useState(false);

    // Initialize Human library
    useEffect(() => {
        const initHuman = async () => {
            try {
                setIsLoading(true);

                // Dynamically import Human library
                const Human = (await import('@vladmandic/human')).default;

                const config = {
                    // Auto-detect best backend with fallback: webgpu > webgl > wasm > cpu
                    backend: 'webgl',
                    modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models',

                    // Performance optimizations
                    async: true,
                    warmup: 'face', // Warmup specific module for better first-run performance

                    face: {
                        enabled: consent.faceDetection,
                        detector: {
                            rotation: true,
                            maxDetected: 5, // Limit to 5 faces for performance
                            skipFrames: 0, // Process every frame
                            return: true
                        },
                        mesh: { enabled: true },
                        iris: { enabled: consent.gazeTracking },
                        description: { enabled: false }, // disable face recognition for privacy
                        emotion: {
                            enabled: consent.emotionAnalysis,
                            minConfidence: 0.3
                        },
                        age: { enabled: false },
                        gender: { enabled: false }
                    },

                    body: {
                        enabled: consent.bodyTracking,
                        maxDetected: 1, // Track single person for performance
                        minConfidence: 0.3
                    },

                    hand: {
                        enabled: consent.handTracking,
                        landmarks: true,
                        minConfidence: 0.3,
                        maxDetected: 2
                    },

                    gesture: {
                        enabled: consent.handTracking
                    },

                    segmentation: {
                        enabled: false
                    },

                    // Filter low-confidence results
                    filter: {
                        enabled: true,
                        equalization: false,
                        flip: false
                    }
                };

                humanRef.current = new Human(config);

                // Load models
                await humanRef.current.load();

                // Warmup for better first-run performance (recommended by docs)
                console.log('Human library loaded, warming up...');
                await humanRef.current.warmup();

                console.log('Human library ready:', humanRef.current.version);
            } catch (err) {
                console.error('Failed to initialize Human library:', err);
                setError('Failed to load AI models. Please refresh and try again.');
            } finally {
                setIsLoading(false);
            }
        };

        // Only initialize if any consent is given
        if (Object.values(consent).some(v => v)) {
            initHuman();
        }

        return () => {
            if (humanRef.current) {
                humanRef.current = null;
            }
        };
    }, [consent]);

    // Start webcam and tracking
    const startTracking = useCallback(async () => {
        if (!Object.values(consent).some(v => v)) {
            setError('Please enable at least one tracking option in Privacy Settings');
            return;
        }

        try {
            setError(null);
            setIsLoading(true);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            // Set canvas sizes to match video
            const { videoWidth, videoHeight } = videoRef.current;
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
            overlayCanvasRef.current.width = videoWidth;
            overlayCanvasRef.current.height = videoHeight;

            setIsTracking(true);
            setSessionStartTime(Date.now());
            setSessionData([]);

            detectLoop();
        } catch (err) {
            console.error('Failed to start webcam:', err);
            setError('Failed to access webcam. Please grant camera permissions.');
        } finally {
            setIsLoading(false);
        }
    }, [consent]);

    // Stop tracking
    const stopTracking = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        if (videoRef.current?.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }

        setIsTracking(false);
        setResults(null);
    }, []);

    // Main detection loop
    const detectLoop = useCallback(async () => {
        if (!isTracking || !humanRef.current || !videoRef.current) return;

        try {
            const result = await humanRef.current.detect(videoRef.current);

            // Use interpolation for smoother results
            const interpolated = humanRef.current.next(result);
            setResults(interpolated);

            // Performance monitoring
            if (result.performance?.total) {
                const currentFps = 1000 / result.performance.total;
                fpsHistoryRef.current.push(currentFps);
                if (fpsHistoryRef.current.length > 30) fpsHistoryRef.current.shift();
                const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
                setFps(Math.round(avgFps));
            }

            // Memory monitoring
            const memoryInfo = humanRef.current.tf?.engine().memory();
            if (memoryInfo?.numTensors !== undefined) {
                setTensors(memoryInfo.numTensors);
            }

            // Record session data
            const timestamp = Date.now() - sessionStartTime;
            const dataPoint = {
                timestamp,
                faceCount: interpolated.face?.length || 0,
                bodyCount: interpolated.body?.length || 0,
                handCount: interpolated.hand?.length || 0,
                gestureCount: interpolated.gesture?.length || 0,
                fps: Math.round(1000 / result.performance?.total || 0),
                tensors: memoryInfo?.numTensors || 0
            };

            // Add emotion data if available
            if (interpolated.face?.[0]?.emotion) {
                const topEmotion = interpolated.face[0].emotion[0];
                dataPoint.emotion = topEmotion.emotion;
                dataPoint.emotionScore = topEmotion.score;
            }

            // Add gaze data if available
            if (interpolated.face?.[0]?.rotation?.gaze) {
                dataPoint.gazeBearing = interpolated.face[0].rotation.gaze.bearing;
                dataPoint.gazeStrength = interpolated.face[0].rotation.gaze.strength;
            }

            setSessionData(prev => [...prev, dataPoint]);

            // Draw video frame to main canvas
            const ctx = canvasRef.current.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);

            // Draw overlays if enabled
            if (showOverlays) {
                drawOverlays(interpolated);
            }
        } catch (err) {
            console.error('Detection error:', err);
        }

        animationFrameRef.current = requestAnimationFrame(detectLoop);
    }, [isTracking, sessionStartTime, showOverlays]);

    // Draw overlays on canvas
    const drawOverlays = useCallback((result) => {
        const ctx = overlayCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

        // Draw face detection
        if (result.face?.length > 0 && consent.faceDetection) {
            result.face.forEach(face => {
                drawFaceBox(ctx, face);
                if (showMesh && face.mesh) {
                    drawFaceMesh(ctx, face.mesh);
                }
                if (consent.gazeTracking && face.rotation?.gaze) {
                    drawGaze(ctx, face);
                }
            });
        }

        // Draw body pose
        if (result.body?.length > 0 && consent.bodyTracking) {
            result.body.forEach(body => {
                drawBodySkeleton(ctx, body);
            });
        }

        // Draw hands
        if (result.hand?.length > 0 && consent.handTracking) {
            result.hand.forEach(hand => {
                drawHandLandmarks(ctx, hand);
            });
        }

        // Draw gestures
        if (result.gesture?.length > 0 && consent.handTracking) {
            drawGestures(ctx, result.gesture);
        }
    }, [consent, showMesh]);

    // Drawing helper functions
    const drawFaceBox = (ctx, face) => {
        const [x, y, width, height] = face.box;

        // Get dominant emotion for color
        const emotion = face.emotion?.[0];
        const emotionColors = {
            happy: '#4CAF50',
            sad: '#2196F3',
            angry: '#F44336',
            surprise: '#FF9800',
            fear: '#9C27B0',
            disgust: '#795548',
            neutral: '#9E9E9E'
        };
        const color = emotion ? emotionColors[emotion.emotion] : '#00ff00';

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw emotion label
        if (emotion) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y - 30, 150, 25);
            ctx.fillStyle = '#000';
            ctx.font = '14px system-ui';
            ctx.fillText(
                `${emotion.emotion} ${Math.round(emotion.score * 100)}%`,
                x + 5,
                y - 10
            );
        }
    };

    const drawFaceMesh = (ctx, mesh) => {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        mesh.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        });
    };

    const drawGaze = (ctx, face) => {
        const [x, y, width, height] = face.box;
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        const { bearing, strength } = face.rotation.gaze;
        const length = strength * 100;

        const endX = centerX + Math.cos((bearing * Math.PI) / 180) * length;
        const endY = centerY + Math.sin((bearing * Math.PI) / 180) * length;

        ctx.strokeStyle = `rgba(255, 255, 0, ${strength})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw arrow head
        ctx.fillStyle = `rgba(255, 255, 0, ${strength})`;
        ctx.beginPath();
        ctx.arc(endX, endY, 5, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawBodySkeleton = (ctx, body) => {
        const connections = [
            [5, 6],   // shoulders
            [5, 7],   // left arm
            [7, 9],   // left forearm
            [6, 8],   // right arm
            [8, 10],  // right forearm
            [5, 11],  // left torso
            [6, 12],  // right torso
            [11, 12], // hips
            [11, 13], // left thigh
            [13, 15], // left shin
            [12, 14], // right thigh
            [14, 16]  // right shin
        ];

        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 3;

        connections.forEach(([startIdx, endIdx]) => {
            const start = body.keypoints[startIdx];
            const end = body.keypoints[endIdx];

            if (start && end && start.score > 0.3 && end.score > 0.3) {
                ctx.beginPath();
                ctx.moveTo(start.position[0], start.position[1]);
                ctx.lineTo(end.position[0], end.position[1]);
                ctx.stroke();
            }
        });

        // Draw keypoints
        ctx.fillStyle = '#00ff00';
        body.keypoints.forEach(kp => {
            if (kp.score > 0.3) {
                ctx.beginPath();
                ctx.arc(kp.position[0], kp.position[1], 6, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    };

    const drawHandLandmarks = (ctx, hand) => {
        const [x, y, width, height] = hand.box;

        ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
        hand.landmarks.forEach(([lx, ly]) => {
            ctx.beginPath();
            ctx.arc(lx, ly, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    };

    const drawGestures = (ctx, gestures) => {
        const gestureEmojis = {
            'thumbs_up': '👍',
            'victory': '✌️',
            'i_love_you': '🤟',
            'thumbs_down': '👎',
            'pointing_up': '☝️'
        };

        gestures.forEach((gesture, i) => {
            if (gesture.confidence > 0.7) {
                const emoji = gestureEmojis[gesture.name] || '🤚';
                ctx.font = '48px system-ui';
                ctx.fillText(emoji, 20, 80 + i * 60);

                ctx.font = '16px system-ui';
                ctx.fillStyle = '#fff';
                ctx.fillText(
                    `${gesture.name} (${Math.round(gesture.confidence * 100)}%)`,
                    80,
                    90 + i * 60
                );
            }
        });
    };

    // Save session to database
    const saveSessionToDatabase = useCallback(async () => {
        try {
            const response = await fetch('/api/empathylab/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    sessionData,
                    consent,
                    humeConfigId: selectedConfigId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save session');
            }

            const result = await response.json();
            console.log('Session saved:', result.sessionId);
            alert(`Session saved successfully! ID: ${result.sessionId}`);
        } catch (err) {
            console.error('Failed to save session:', err);
            alert('Failed to save session. Please try again.');
        }
    }, [sessionData, consent, selectedConfigId]);

    // Export session data (fallback for offline usage)
    const exportSessionData = useCallback(() => {
        const data = {
            sessionStart: new Date(sessionStartTime).toISOString(),
            sessionEnd: new Date().toISOString(),
            duration: Date.now() - sessionStartTime,
            dataPoints: sessionData,
            consent: consent
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `empathy-lab-session-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [sessionData, sessionStartTime, consent]);

    // Handle Hume emotion updates
    const handleHumeEmotionUpdate = useCallback((emotionData) => {
        setHumeEmotions(emotionData.emotions);
    }, []);

    // Extract Human facial emotions for fusion
    const getHumanEmotions = () => {
        if (!results?.face?.[0]?.emotion) return null;
        return results.face[0].emotion;
    };

    // Extract gaze data for overlay
    const getGazeData = () => {
        if (!results?.face?.[0]?.rotation?.gaze) return null;
        return results.face[0].rotation.gaze;
    };

    return (
        <div className="empathy-lab">
            <BoothHeader
                icon="psychology"
                title="EmpathyLab"
                typeText="Multimodal Intelligence Research"
                status={isTracking ? 'active' : 'ready'}
                description="AI-powered face, body, and gesture tracking for UX research, presentation training, and empathic AI interactions. All processing happens locally in your browser."
                align="top"
                actions={
                    <>
                        {!isTracking ? (
                            <Button
                                variant="primary"
                                icon="videocam"
                                onClick={startTracking}
                                disabled={isLoading || !Object.values(consent).some(v => v)}
                            >
                                {isLoading ? 'Loading Models...' : 'Start Tracking'}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="secondary"
                                    icon="stop"
                                    onClick={stopTracking}
                                >
                                    Stop Tracking
                                </Button>
                                <Button
                                    variant="primary"
                                    icon="cloud_upload"
                                    onClick={saveSessionToDatabase}
                                    disabled={sessionData.length === 0}
                                >
                                    Save Session
                                </Button>
                                <Button
                                    variant="secondary"
                                    icon="download"
                                    onClick={exportSessionData}
                                    disabled={sessionData.length === 0}
                                >
                                    Export JSON
                                </Button>
                            </>
                        )}
                        <Button
                            variant={showVoiceChat ? 'primary' : 'secondary'}
                            icon={showVoiceChat ? 'mic_off' : 'mic'}
                            onClick={() => setShowVoiceChat(!showVoiceChat)}
                        >
                            {showVoiceChat ? 'Hide' : 'Show'} Voice Chat
                        </Button>
                    </>
                }
            >
                <div className="tracking-controls">
                    <FormField label="Tracking Mode">
                        <select
                            value={trackingMode}
                            onChange={(e) => setTrackingMode(e.target.value)}
                            disabled={isTracking}
                        >
                            <option value="face">Face Only</option>
                            <option value="body">Body Only</option>
                            <option value="hands">Hands Only</option>
                            <option value="all">All Features</option>
                        </select>
                    </FormField>

                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={showOverlays}
                            onChange={(e) => setShowOverlays(e.target.checked)}
                        />
                        Show Overlays
                    </label>

                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={showMesh}
                            onChange={(e) => setShowMesh(e.target.checked)}
                            disabled={!consent.faceDetection}
                        />
                        Show Face Mesh
                    </label>
                </div>
            </BoothHeader>

            <div className="empathy-lab-main">
                {error && (
                    <div className="error-display" aria-live="polite" role="status">
                        <span className="icon">error</span>
                        <div>
                            <h4>Error</h4>
                            <p>{error}</p>
                        </div>
                        <button onClick={() => setError(null)}>
                            <span className="icon">close</span>
                        </button>
                    </div>
                )}

                {/* Split-screen layout: Webcam + Voice Chat */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: showVoiceChat ? '1fr 1fr' : '1fr',
                    gap: '1rem',
                    marginBottom: '1rem'
                }}>
                    {/* Left: Webcam with Gaze Overlay */}
                    <Panel title="Webcam Viewer" info={isTracking ? 'Live' : 'Idle'}>
                        <div style={{ position: 'relative' }}>
                            <VideoFrame
                                videoRef={videoRef}
                                canvasRef={canvasRef}
                                overlayCanvasRef={overlayCanvasRef}
                                active={isTracking}
                                error={!!error}
                            >
                                <RecordingIndicator active={isTracking} />
                            </VideoFrame>

                            {/* Gaze overlay on top of video */}
                            {isTracking && consent.gazeTracking && getGazeData() && videoRef.current && (
                                <GazeOverlay
                                    gazeData={getGazeData()}
                                    videoWidth={videoRef.current.videoWidth || 1280}
                                    videoHeight={videoRef.current.videoHeight || 720}
                                />
                            )}
                        </div>
                    </Panel>

                    {/* Right: Hume Voice Chat */}
                    {showVoiceChat && (
                        <Panel title="Empathic Voice Chat" info="Hume EVI">
                            <HumeVoiceChat
                                onEmotionUpdate={handleHumeEmotionUpdate}
                                selectedConfigId={selectedConfigId}
                            />
                        </Panel>
                    )}
                </div>

                {/* Emotion Fusion Display */}
                {showVoiceChat && (
                    <EmotionFusionDisplay
                        humanEmotions={getHumanEmotions()}
                        humeEmotions={humeEmotions}
                    />
                )}

                {/* Stats Panel */}
                {results && (
                    <ResultsPanel
                        results={results}
                        sessionDuration={Date.now() - sessionStartTime}
                        dataPointsCount={sessionData.length}
                        fps={fps}
                        tensors={tensors}
                    />
                )}
            </div>
        </div>
    );
}

function ResultsPanel({ results, sessionDuration, dataPointsCount, fps, tensors }) {
    const formatDuration = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <Panel variant="info" title="Detection Results" className="results-panel">
            <div className="results-grid">
                <div className="result-stat">
                    <span className="icon">timer</span>
                    <div>
                        <strong>{formatDuration(sessionDuration)}</strong>
                        <small>Session Duration</small>
                    </div>
                </div>

                <div className="result-stat">
                    <span className="icon">speed</span>
                    <div>
                        <strong>{fps} FPS</strong>
                        <small>Performance</small>
                    </div>
                </div>

                <div className="result-stat">
                    <span className="icon">memory</span>
                    <div>
                        <strong>{tensors}</strong>
                        <small>TF Tensors</small>
                    </div>
                </div>

                <div className="result-stat">
                    <span className="icon">face</span>
                    <div>
                        <strong>{results.face?.length || 0}</strong>
                        <small>Faces Detected</small>
                    </div>
                </div>

                <div className="result-stat">
                    <span className="icon">accessibility</span>
                    <div>
                        <strong>{results.body?.length || 0}</strong>
                        <small>Bodies Tracked</small>
                    </div>
                </div>

                <div className="result-stat">
                    <span className="icon">back_hand</span>
                    <div>
                        <strong>{results.hand?.length || 0}</strong>
                        <small>Hands Detected</small>
                    </div>
                </div>

                <div className="result-stat">
                    <span className="icon">gesture</span>
                    <div>
                        <strong>{results.gesture?.length || 0}</strong>
                        <small>Gestures Recognized</small>
                    </div>
                </div>

                <div className="result-stat">
                    <span className="icon">data_usage</span>
                    <div>
                        <strong>{dataPointsCount}</strong>
                        <small>Data Points</small>
                    </div>
                </div>
            </div>

            {results.face?.[0]?.emotion && (
                <div className="emotion-breakdown">
                    <h4>Detected Emotions</h4>
                    <div className="emotion-bars">
                        {results.face[0].emotion.slice(0, 5).map((emotion, i) => (
                            <div key={i} className="emotion-bar">
                                <span className="emotion-name">{emotion.emotion}</span>
                                <div className="emotion-progress">
                                    <div
                                        className="emotion-fill"
                                        style={{
                                            width: `${emotion.score * 100}%`,
                                            backgroundColor: getEmotionColor(emotion.emotion)
                                        }}
                                    />
                                </div>
                                <span className="emotion-score">
                                    {Math.round(emotion.score * 100)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {results.gesture?.length > 0 && (
                <div className="gestures-list">
                    <h4>Active Gestures</h4>
                    {results.gesture
                        .filter(g => g.confidence > 0.5)
                        .map((gesture, i) => (
                            <div key={i} className="gesture-item">
                                <span className="gesture-name">{gesture.name}</span>
                                <span className="gesture-confidence">
                                    {Math.round(gesture.confidence * 100)}%
                                </span>
                            </div>
                        ))}
                </div>
            )}
        </Panel>
    );
}

function getEmotionColor(emotion) {
    const colors = {
        happy: '#4CAF50',
        sad: '#2196F3',
        angry: '#F44336',
        surprise: '#FF9800',
        fear: '#9C27B0',
        disgust: '#795548',
        neutral: '#9E9E9E'
    };
    return colors[emotion] || '#9E9E9E';
}
