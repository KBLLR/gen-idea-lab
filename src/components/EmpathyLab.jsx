/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import BoothHeader from './BoothHeader.jsx';
import Button from './ui/Button.jsx';
import Panel from './ui/Panel.jsx';
import FormField from './ui/FormField.jsx';
import WebcamStream from './empathy/WebcamStream.jsx';
import EmotionsList from './empathy/EmotionsList.jsx';
import EmotionFusionDisplay from './empathy/EmotionFusionDisplay.jsx';
import AllEmotionsList from './empathy/AllEmotionsList.jsx';
import HumeVoiceChat from './empathy/HumeVoiceChat.jsx';
import StatsRow from './empathy/StatsRow.jsx';
import GazeOverlay from './empathy/GazeOverlay.jsx';
import useStore from '../lib/store.js';

export default function EmpathyLab() {
    // Get consent, config and overlays from store
    const consent = useStore.use.empathyLab().consent;
    const selectedHumeConfigId = useStore.use.empathyLab().selectedHumeConfigId;
    const overlays = useStore.use.empathyLab().overlays || {
        drawBoxes: true,
        drawLabels: true,
        drawFaceMesh: false,
        drawGaze: true,
        drawBodySkeleton: true,
        drawHandSkeleton: true,
        showGazeOverlay: false,
        showEmotionFusion: true
    };
    const setEmpathyLabModelLoaded = useStore.use.actions().setEmpathyLabModelLoaded;

    const videoRef = useRef(null);
    const overlayCanvasRef = useRef(null);

    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [sessionData, setSessionData] = useState([]);

    // Performance monitoring (from WebcamStream)
    const [fps, setFps] = useState(0);
    const [tensors, setTensors] = useState(0);

    // Hume integration state
    const [humeEmotions, setHumeEmotions] = useState(null);

    // Multimodal layout state
    const [showVoiceChat, setShowVoiceChat] = useState(false);
    const [showPrivacyBanner, setShowPrivacyBanner] = useState(true);

    const [isLoading, setIsLoading] = useState(false);

    // Start webcam and tracking
    const startTracking = useCallback(() => {
        if (!Object.values(consent).some(v => v)) {
            setError('Please enable at least one tracking option in Privacy Settings');
            return;
        }
        setSessionStartTime(Date.now());
        setSessionData([]);
        setError(null);
        setIsTracking(true);
        setEmpathyLabModelLoaded(true);
    }, [consent, setEmpathyLabModelLoaded]);

    const stopTracking = useCallback(() => {
        setIsTracking(false);
        setResults(null);
        setFps(0);
        setTensors(0);
    }, []);

    // Handle results from WebcamStream
    const handleWebcamResults = useCallback((human, result, interpolated) => {
        setResults(interpolated);

        // Update performance stats
        if (result.performance?.total) {
            setFps(Math.round(1000 / result.performance.total));
        }
        const memoryInfo = human.tf?.engine().memory();
        if (memoryInfo?.numTensors !== undefined) {
            setTensors(memoryInfo.numTensors);
        }

        // Record session data
        if (sessionStartTime) {
            const timestamp = Date.now() - sessionStartTime;
            const dataPoint = {
                timestamp,
                faceCount: interpolated.face?.length || 0,
                bodyCount: interpolated.body?.length || 0,
                handCount: interpolated.hand?.length || 0,
                gestureCount: interpolated.gesture?.length || 0,
                fps: Math.round(1000 / (result.performance?.total || 1)),
                tensors: memoryInfo?.numTensors || 0
            };
            if (interpolated.face?.[0]?.emotion?.[0]) {
                const topEmotion = interpolated.face[0].emotion[0];
                dataPoint.emotion = topEmotion.emotion;
                dataPoint.emotionScore = topEmotion.score;
            }
            if (interpolated.face?.[0]?.rotation?.gaze) {
                dataPoint.gazeBearing = interpolated.face[0].rotation.gaze.bearing;
                dataPoint.gazeStrength = interpolated.face[0].rotation.gaze.strength;
            }
            setSessionData(prev => [...prev, dataPoint]);
        }
    }, [sessionStartTime]);

    // Draw overlays on canvas (called by WebcamStream)
    const drawOverlays = useCallback((result, overlayCtx) => {
        if (!overlayCtx) return;

        // Draw face detection
        if (result.face?.length > 0 && consent.faceDetection) {
            result.face.forEach(face => {
                if (overlays.drawBoxes) {
                    drawFaceBox(overlayCtx, face);
                }
                if (overlays.drawFaceMesh && face.mesh) {
                    drawFaceMesh(overlayCtx, face.mesh);
                }
                if (overlays.drawGaze && consent.gazeTracking && face.rotation?.gaze) {
                    drawGaze(overlayCtx, face);
                }
            });
        }

        // Draw body pose
        if (result.body?.length > 0 && consent.bodyTracking) {
            result.body.forEach(body => {
                if (overlays.drawBodySkeleton) {
                    drawBodySkeleton(overlayCtx, body);
                }
            });
        }

        // Draw hands
        if (result.hand?.length > 0 && consent.handTracking) {
            result.hand.forEach(hand => {
                if (overlays.drawHandSkeleton) {
                    drawHandLandmarks(overlayCtx, hand);
                }
            });
        }

        // Draw gestures
        if (result.gesture?.length > 0 && consent.handTracking && overlays.drawLabels) {
            drawGestures(overlayCtx, result.gesture);
        }
    }, [consent, overlays]);

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
                    humeConfigId: selectedHumeConfigId
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
    }, [sessionData, consent, selectedHumeConfigId]);

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
        // Use topEmotions array which has [{name, score}] format
        setHumeEmotions(emotionData.topEmotions || []);
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
            {showPrivacyBanner && (
                <>
                    {/** Centered glass banner above content (right column only) */}
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                        {/* using shared glass banner styles */}
                        <div className="glass-banner-overlay">
                            <div className="glass-banner">
                                <button className="glass-banner-close" onClick={() => setShowPrivacyBanner(false)} aria-label="Close privacy notice" type="button">
                                    <span className="icon">close</span>
                                </button>
                                <div className="glass-banner-title">Your Privacy Matters</div>
                                <div className="glass-banner-body">
                                    All AI processing happens locally in your browser. No video or images are sent to servers. Session data is automatically deleted when you close this tab.
                                    <br /><br />
                                    Learn more about ethical AI: <a href="https://thehumeinitiative.org/guidelines/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>Hume Initiative Guidelines</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
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
                                {isLoading ? 'Loading...' : 'Start Tracking'}
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
                    </>
                }
            >
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

                {/* 3-panel layout: Camera + Emotions + Voice Chat */}
                <div style={{
                    flex: '1 1 auto',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '1rem',
                    minHeight: 0,
                    overflow: 'hidden'
                }}>
                    {/* Left: Webcam */}
                    <Panel title="Webcam Viewer" info={isTracking ? 'Live' : 'Idle'}>
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <WebcamStream
                                consent={consent}
                                isActive={isTracking}
                                onResults={handleWebcamResults}
                                onError={(err) => setError(err?.message || String(err))}
                                onStatusChange={setIsLoading}
                                showOverlays={Object.values(overlays).some(v => v)}
                                drawOverlays={drawOverlays}
                            />
                            {/* Sci-Fi Gaze Overlay */}
                            {overlays.showGazeOverlay && isTracking && results?.face?.[0]?.rotation?.gaze && (
                                <GazeOverlay
                                    gazeData={results.face[0].rotation.gaze}
                                    videoWidth={videoRef.current?.videoWidth || 1280}
                                    videoHeight={videoRef.current?.videoHeight || 720}
                                />
                            )}
                        </div>
                    </Panel>

                    {/* Middle: Emotions */}
                    <Panel title="Emotion Analysis" info={results ? 'Active' : 'Idle'} style={{ minWidth: '280px' }}>
                        <AllEmotionsList
                            humeEmotions={
                                // Convert array to object for AllEmotionsList
                                humeEmotions?.reduce((obj, { name, score }) => {
                                    obj[name] = score;
                                    return obj;
                                }, {}) || {}
                            }
                        />
                    </Panel>

                    {/* Right: Hume Voice Chat */}
                    <Panel title="Empathic Voice Chat" info="Hume EVI">
                        <HumeVoiceChat
                            onEmotionUpdate={handleHumeEmotionUpdate}
                            selectedConfigId={selectedHumeConfigId}
                        />
                    </Panel>
                </div>

                {/* Stats Row */}
                {results && (
                    <div style={{ flexShrink: 0 }}>
                        <StatsRow
                            results={results}
                            sessionDuration={Date.now() - sessionStartTime}
                            dataPointsCount={sessionData.length}
                            fps={fps}
                            tensors={tensors}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
