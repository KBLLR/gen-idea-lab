/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import Panel from './ui/Panel.jsx';
import FormField from './ui/FormField.jsx';
import { createHumeConfig } from '../lib/services/hume.js';

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

    // Hume EVI Config form state
    const [showConfigForm, setShowConfigForm] = useState(false);
    const [showConfigsList, setShowConfigsList] = useState(false);
    const [cfgName, setCfgName] = useState('');
    const [cfgVoice, setCfgVoice] = useState('Evelyn');
    const [cfgLatency, setCfgLatency] = useState('low');
    const [cfgAllowTools, setCfgAllowTools] = useState(false);
    const [cfgPrompt, setCfgPrompt] = useState('You are an empathic AI assistant. Be warm, understanding, and supportive.');
    const [cfgSaving, setCfgSaving] = useState(false);
    const [cfgError, setCfgError] = useState(null);
    const [savedConfigs, setSavedConfigs] = useState(() => {
        try { return JSON.parse(localStorage.getItem('empathyLab.hume.configs') || '[]'); } catch { return []; }
    });

    const persistConfigs = (list) => {
        setSavedConfigs(list);
        try { localStorage.setItem('empathyLab.hume.configs', JSON.stringify(list)); } catch {}
    };

    const handleSaveConfig = async () => {
        setCfgError(null);
        setCfgSaving(true);
        try {
            const payload = {
                name: cfgName || undefined,
                voice: { name: cfgVoice, provider: 'HUME_AI' },
                latency: cfgLatency,
                prompts: cfgPrompt ? [{ text: cfgPrompt }] : undefined,
                tools: cfgAllowTools ? [] : []
            };
            const result = await createHumeConfig(payload);
            const entry = { id: result?.id || result?.config_id || Date.now().toString(), name: result?.name || cfgName || `Config ${savedConfigs.length + 1}`, voice: cfgVoice, latency: cfgLatency };
            persistConfigs([entry, ...savedConfigs]);
            setShowConfigsList(true);
        } catch (e) {
            setCfgError(e?.data?.error || e.message || 'Failed to save config');
        } finally {
            setCfgSaving(false);
        }
    };

    return (
        <div className="empathy-lab-sidebar">
            {/* Sticky Preset Row under header */}
            <div className="preset-bar">
                <div className="preset-buttons">
                    <button className={`preset-btn ${presets === 'research' ? 'active' : ''}`} onClick={() => applyPreset('research')} title="Full Research">
                        <span className="icon">science</span>
                        <span>Full Research</span>
                    </button>
                    <button className={`preset-btn ${presets === 'presentation' ? 'active' : ''}`} onClick={() => applyPreset('presentation')} title="Presentation">
                        <span className="icon">co_present</span>
                        <span>Presentation</span>
                    </button>
                    <button className={`preset-btn ${presets === 'minimal' ? 'active' : ''}`} onClick={() => applyPreset('minimal')} title="Minimal">
                        <span className="icon">visibility_off</span>
                        <span>Minimal</span>
                    </button>
                </div>
            </div>

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

            {/* Hume EVI Configuration */}
            <div className="sidebar-accordion">
                <button className="accordion-header" onClick={() => setShowConfigForm(v => !v)} aria-expanded={showConfigForm}>
                    <span className="icon">tune</span>
                    <strong style={{ flex: 1 }}>EVI Configuration</strong>
                    <span className="icon">{showConfigForm ? 'expand_less' : 'expand_more'}</span>
                </button>
                {showConfigForm && (
                    <div className="accordion-body">
                        <div className="sidebar-section" style={{ gap: '8px', display: 'flex', flexDirection: 'column' }}>
                            <FormField label="Name"><input type="text" value={cfgName} onChange={(e) => setCfgName(e.target.value)} placeholder="e.g., Research Default" /></FormField>
                            <FormField label="Voice"><input type="text" value={cfgVoice} onChange={(e) => setCfgVoice(e.target.value)} placeholder="e.g., Evelyn" /></FormField>
                            <FormField label="Latency">
                                <select value={cfgLatency} onChange={(e) => setCfgLatency(e.target.value)}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </FormField>
                            <label className="checkbox-label"><input type="checkbox" checked={cfgAllowTools} onChange={(e) => setCfgAllowTools(e.target.checked)} /> Allow function tools</label>
                            <FormField label="System Prompt"><textarea rows={3} value={cfgPrompt} onChange={(e) => setCfgPrompt(e.target.value)} /></FormField>
                            {cfgError && (
                                <div className="privacy-notice" style={{ borderColor: 'rgba(244,67,54,0.3)', background: 'rgba(244,67,54,0.08)' }}>
                                    <span className="icon">error</span>
                                    <div>
                                        <strong>Save failed</strong>
                                        <p style={{ margin: 0 }}>{cfgError}</p>
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="preset-btn" onClick={handleSaveConfig} disabled={cfgSaving}>
                                    <span className="icon">save</span>
                                    <span>{cfgSaving ? 'Saving…' : 'Save Config'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Saved Configurations */}
            <div className="sidebar-accordion">
                <button className="accordion-header" onClick={() => setShowConfigsList(v => !v)} aria-expanded={showConfigsList}>
                    <span className="icon">folder_open</span>
                    <strong style={{ flex: 1 }}>Saved EVI Configs</strong>
                    <span className="icon">{showConfigsList ? 'expand_less' : 'expand_more'}</span>
                </button>
                {showConfigsList && (
                    <div className="accordion-body">
                        {savedConfigs.length === 0 ? (
                            <div className="consent-item" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No configurations saved yet.</div>
                        ) : (
                            <div className="use-cases" style={{ gap: '8px' }}>
                                {savedConfigs.map((c) => (
                                    <div key={c.id} className="use-case-item" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="icon">settings_voice</span>
                                            <div>
                                                <strong>{c.name}</strong>
                                                <p style={{ margin: 0 }}>Voice: {c.voice} · Latency: {c.latency}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="preset-btn" title="Use config" onClick={() => {/* future: set active */}}>
                                                <span className="icon">check_circle</span>
                                                <span>Use</span>
                                            </button>
                                            <button className="preset-btn" title="Remove" onClick={() => persistConfigs(savedConfigs.filter(x => x.id !== c.id))}>
                                                <span className="icon">delete</span>
                                                <span>Remove</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="privacy-notice privacy-sticky">
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

            {/* Use Cases moved to main area */}

            {/* About moved to main area */}
        </div>
    );
}
