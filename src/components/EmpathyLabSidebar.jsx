/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import Panel from './ui/Panel.jsx';
import FormField from './ui/FormField.jsx';

export default function EmpathyLabSidebar() {
    const [consent, setConsent] = useState({
        faceDetection: false,
        emotionAnalysis: false,
        bodyTracking: false,
        handTracking: false,
        gazeTracking: false,
        dataExport: false
    });

    const [presets, setPresets] = useState('research');

    const applyPreset = (preset) => {
        setPresets(preset);

        const presetConfigs = {
            research: {
                faceDetection: true,
                emotionAnalysis: true,
                bodyTracking: true,
                handTracking: true,
                gazeTracking: true,
                dataExport: true
            },
            presentation: {
                faceDetection: true,
                emotionAnalysis: true,
                bodyTracking: true,
                handTracking: false,
                gazeTracking: true,
                dataExport: false
            },
            minimal: {
                faceDetection: true,
                emotionAnalysis: false,
                bodyTracking: false,
                handTracking: false,
                gazeTracking: false,
                dataExport: false
            },
            custom: consent
        };

        setConsent(presetConfigs[preset]);
    };

    const toggleConsent = (key) => {
        setConsent(prev => ({ ...prev, [key]: !prev[key] }));
        setPresets('custom');
    };

    return (
        <div className="empathy-lab-sidebar">
            <Panel variant="sidebar" title="Privacy Settings" icon="shield">
                <div className="sidebar-section">
                    <h4>Quick Presets</h4>
                    <div className="preset-buttons">
                        <button
                            className={`preset-btn ${presets === 'research' ? 'active' : ''}`}
                            onClick={() => applyPreset('research')}
                        >
                            <span className="icon">science</span>
                            <span>Full Research</span>
                        </button>
                        <button
                            className={`preset-btn ${presets === 'presentation' ? 'active' : ''}`}
                            onClick={() => applyPreset('presentation')}
                        >
                            <span className="icon">co_present</span>
                            <span>Presentation</span>
                        </button>
                        <button
                            className={`preset-btn ${presets === 'minimal' ? 'active' : ''}`}
                            onClick={() => applyPreset('minimal')}
                        >
                            <span className="icon">visibility_off</span>
                            <span>Minimal</span>
                        </button>
                    </div>
                </div>

                <div className="sidebar-section">
                    <h4>Tracking Permissions</h4>
                    <div className="consent-options">
                        <label className="consent-item">
                            <div className="consent-header">
                                <input
                                    type="checkbox"
                                    checked={consent.faceDetection}
                                    onChange={() => toggleConsent('faceDetection')}
                                />
                                <span className="icon">face</span>
                                <strong>Face Detection</strong>
                            </div>
                            <p className="consent-description">
                                Detect face position, rotation, and 3D mesh landmarks
                            </p>
                        </label>

                        <label className="consent-item" style={{ opacity: consent.faceDetection ? 1 : 0.5 }}>
                            <div className="consent-header">
                                <input
                                    type="checkbox"
                                    checked={consent.emotionAnalysis}
                                    onChange={() => toggleConsent('emotionAnalysis')}
                                    disabled={!consent.faceDetection}
                                />
                                <span className="icon">mood</span>
                                <strong>Emotion Analysis</strong>
                            </div>
                            <p className="consent-description">
                                Analyze facial expressions for 7 basic emotions
                            </p>
                        </label>

                        <label className="consent-item" style={{ opacity: consent.faceDetection ? 1 : 0.5 }}>
                            <div className="consent-header">
                                <input
                                    type="checkbox"
                                    checked={consent.gazeTracking}
                                    onChange={() => toggleConsent('gazeTracking')}
                                    disabled={!consent.faceDetection}
                                />
                                <span className="icon">visibility</span>
                                <strong>Gaze Tracking</strong>
                            </div>
                            <p className="consent-description">
                                Track eye direction and focus strength
                            </p>
                        </label>

                        <label className="consent-item">
                            <div className="consent-header">
                                <input
                                    type="checkbox"
                                    checked={consent.bodyTracking}
                                    onChange={() => toggleConsent('bodyTracking')}
                                />
                                <span className="icon">accessibility</span>
                                <strong>Body Pose Tracking</strong>
                            </div>
                            <p className="consent-description">
                                Track 17-point body skeleton for posture analysis
                            </p>
                        </label>

                        <label className="consent-item">
                            <div className="consent-header">
                                <input
                                    type="checkbox"
                                    checked={consent.handTracking}
                                    onChange={() => toggleConsent('handTracking')}
                                />
                                <span className="icon">back_hand</span>
                                <strong>Hand & Gesture Tracking</strong>
                            </div>
                            <p className="consent-description">
                                Track hand landmarks and recognize gestures
                            </p>
                        </label>

                        <label className="consent-item">
                            <div className="consent-header">
                                <input
                                    type="checkbox"
                                    checked={consent.dataExport}
                                    onChange={() => toggleConsent('dataExport')}
                                />
                                <span className="icon">download</span>
                                <strong>Data Export</strong>
                            </div>
                            <p className="consent-description">
                                Allow exporting anonymized session data (JSON)
                            </p>
                        </label>
                    </div>
                </div>

                <div className="privacy-notice">
                    <span className="icon">info</span>
                    <div>
                        <strong>Your Privacy Matters</strong>
                        <p>
                            All AI processing happens locally in your browser.
                            No video or images are sent to servers. Session data
                            is automatically deleted when you close this tab.
                        </p>
                    </div>
                </div>
            </Panel>

            <Panel variant="sidebar" title="Use Cases" icon="lightbulb">
                <div className="use-cases">
                    <div className="use-case-item">
                        <span className="icon">psychology</span>
                        <div>
                            <strong>UX Research</strong>
                            <p>Test prototypes with emotion and gaze tracking</p>
                        </div>
                    </div>

                    <div className="use-case-item">
                        <span className="icon">co_present</span>
                        <div>
                            <strong>Presentation Training</strong>
                            <p>Practice public speaking with AI feedback</p>
                        </div>
                    </div>

                    <div className="use-case-item">
                        <span className="icon">accessible</span>
                        <div>
                            <strong>Accessibility Studies</strong>
                            <p>Analyze interaction patterns for inclusive design</p>
                        </div>
                    </div>

                    <div className="use-case-item">
                        <span className="icon">school</span>
                        <div>
                            <strong>Learning Analytics</strong>
                            <p>Detect confusion and measure attention during study</p>
                        </div>
                    </div>

                    <div className="use-case-item">
                        <span className="icon">groups</span>
                        <div>
                            <strong>Design Thinking</strong>
                            <p>Capture authentic reactions during workshops</p>
                        </div>
                    </div>
                </div>
            </Panel>

            <Panel variant="sidebar" title="About Human Library" icon="code">
                <div className="about-content">
                    <p>
                        <strong>Human</strong> is an open-source computer vision library
                        by Vladimir Mandic that provides comprehensive AI-powered
                        tracking capabilities.
                    </p>

                    <div className="tech-specs">
                        <div className="spec-item">
                            <span className="icon">speed</span>
                            <strong>WebGPU Accelerated</strong>
                        </div>
                        <div className="spec-item">
                            <span className="icon">devices</span>
                            <strong>Multi-Platform</strong>
                        </div>
                        <div className="spec-item">
                            <span className="icon">lock</span>
                            <strong>Privacy-First</strong>
                        </div>
                    </div>

                    <a
                        href="https://github.com/vladmandic/human"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link"
                    >
                        <span className="icon">open_in_new</span>
                        View on GitHub
                    </a>
                </div>
            </Panel>
        </div>
    );
}
