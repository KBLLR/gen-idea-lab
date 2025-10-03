/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import FormField from './ui/FormField.jsx';
import { createHumeConfig } from '../lib/services/hume.js';
import SidebarSubheader from './sidebar/SidebarSubheader.jsx';
import SidebarToggleItemCard from './sidebar/SidebarToggleItemCard.jsx';
import { getAllPrompts, getPrompt } from '../data/hume-prompts.js';

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
    const [showPromptLibrary, setShowPromptLibrary] = useState(false);
    const [cfgName, setCfgName] = useState('');
    const [cfgVoice, setCfgVoice] = useState('ITO');
    const [cfgEviVersion, setCfgEviVersion] = useState('3');
    const [cfgLanguageModel, setCfgLanguageModel] = useState('claude-sonnet-4-20250514');
    const [cfgAllowWebSearch, setCfgAllowWebSearch] = useState(false);
    const [cfgPrompt, setCfgPrompt] = useState('You are an empathic AI assistant. Be warm, understanding, and supportive.');
    const [cfgAllowShortResponses, setCfgAllowShortResponses] = useState(false);
    const [cfgEnableGreeting, setCfgEnableGreeting] = useState(true);
    const [cfgInactivityTimeout, setCfgInactivityTimeout] = useState(120);
    const [cfgSaving, setCfgSaving] = useState(false);
    const [cfgError, setCfgError] = useState(null);

    const allPrompts = getAllPrompts();
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
                evi_version: cfgEviVersion,
                name: cfgName || `EmpathyLab Config ${savedConfigs.length + 1}`,
                voice: {
                    name: cfgVoice,
                    provider: 'HUME_AI'
                },
                language_model: {
                    model_provider: 'ANTHROPIC',
                    model_resource: cfgLanguageModel
                },
                prompt: cfgPrompt ? {
                    text: cfgPrompt
                } : undefined,
                builtin_tools: cfgAllowWebSearch ? [{
                    name: 'web_search'
                }] : undefined,
                ellm_model: cfgEviVersion === '3' ? {
                    allow_short_responses: cfgAllowShortResponses
                } : undefined,
                event_messages: {
                    on_new_chat: {
                        enabled: cfgEnableGreeting
                    }
                },
                timeouts: {
                    inactivity: {
                        enabled: true,
                        duration_secs: cfgInactivityTimeout
                    }
                }
            };

            console.log('[EmpathyLab] Creating Hume config:', payload);
            const result = await createHumeConfig(payload);
            console.log('[EmpathyLab] Config created:', result);

            const entry = {
                id: result?.id || Date.now().toString(),
                name: result?.name || cfgName,
                voice: cfgVoice,
                languageModel: cfgLanguageModel,
                eviVersion: cfgEviVersion
            };
            persistConfigs([entry, ...savedConfigs]);
            setShowConfigsList(true);

            // Reset form
            setCfgName('');
            setCfgPrompt('You are an empathic AI assistant. Be warm, understanding, and supportive.');
        } catch (e) {
            console.error('[EmpathyLab] Config creation error:', e);
            setCfgError(e?.data?.error || e.message || 'Failed to save config');
        } finally {
            setCfgSaving(false);
        }
    };

    return (
        <div className="empathy-lab-sidebar distribute-evenly">
            {/* Sticky Preset Row under header */}
            <div className="preset-bar">
              <SidebarSubheader
                icon="tune"
                title="Presets"
                subtitle="Quick toggle sets"
                actions={[
                  { key: 'research', title: 'Full Research', icon: 'science', ariaPressed: presets === 'research', onClick: () => applyPreset('research') },
                  { key: 'presentation', title: 'Presentation', icon: 'co_present', ariaPressed: presets === 'presentation', onClick: () => applyPreset('presentation') },
                  { key: 'minimal', title: 'Minimal', icon: 'visibility_off', ariaPressed: presets === 'minimal', onClick: () => applyPreset('minimal') },
                ]}
              />
            </div>

            <SidebarSubheader icon="tune" title="Tracking Permissions" subtitle="Toggle capabilities used in the lab" />
            <div className="consent-options" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SidebarToggleItemCard
                  icon="face"
                  label="Face Detection"
                  checked={!!consent.faceDetection}
                  onChange={() => toggleConsent('faceDetection')}
                  description="Detect face position, rotation, and 3D mesh landmarks"
                />
                <div style={{ opacity: consent.faceDetection ? 1 : 0.5 }}>
                  <SidebarToggleItemCard
                    icon="mood"
                    label="Emotion Analysis"
                    checked={!!consent.emotionAnalysis}
                    onChange={() => toggleConsent('emotionAnalysis')}
                    description="Analyze facial expressions for 7 basic emotions"
                  />
                </div>
                <div style={{ opacity: consent.faceDetection ? 1 : 0.5 }}>
                  <SidebarToggleItemCard
                    icon="visibility"
                    label="Gaze Tracking"
                    checked={!!consent.gazeTracking}
                    onChange={() => toggleConsent('gazeTracking')}
                    description="Track eye direction and focus strength"
                  />
                </div>
                <SidebarToggleItemCard
                  icon="accessibility"
                  label="Body Pose Tracking"
                  checked={!!consent.bodyTracking}
                  onChange={() => toggleConsent('bodyTracking')}
                  description="Track 17-point body skeleton for posture analysis"
                />
                <SidebarToggleItemCard
                  icon="back_hand"
                  label="Hand & Gesture Tracking"
                  checked={!!consent.handTracking}
                  onChange={() => toggleConsent('handTracking')}
                  description="Track hand landmarks and recognize gestures"
                />
                <SidebarToggleItemCard
                  icon="download"
                  label="Data Export"
                  checked={!!consent.dataExport}
                  onChange={() => toggleConsent('dataExport')}
                  description="Allow exporting anonymized session data (JSON)"
                />
            </div>

            {/* Hume EVI Configuration */}
            <SidebarSubheader icon="settings_voice" title="Hume EVI" subtitle="Configuration and saved presets" />
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
                            <FormField label="EVI Version">
                                <select value={cfgEviVersion} onChange={(e) => setCfgEviVersion(e.target.value)}>
                                    <option value="3">EVI 3 (Recommended)</option>
                                    <option value="4-mini">EVI 4-mini</option>
                                </select>
                            </FormField>
                            <FormField label="Voice"><input type="text" value={cfgVoice} onChange={(e) => setCfgVoice(e.target.value)} placeholder="e.g., ITO, Kora" /></FormField>
                            <FormField label="Language Model">
                                <select value={cfgLanguageModel} onChange={(e) => setCfgLanguageModel(e.target.value)}>
                                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                                    <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
                                    <option value="hume-evi-3-web-search">Hume EVI 3 (Web Search)</option>
                                    <option value="gpt-4o">GPT-4o</option>
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                </select>
                            </FormField>
                            <label className="checkbox-label"><input type="checkbox" checked={cfgAllowWebSearch} onChange={(e) => setCfgAllowWebSearch(e.target.checked)} /> Enable web search tool</label>

                            <FormField label="System Prompt">
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                    <button
                                        type="button"
                                        className="preset-btn"
                                        style={{ flex: 1 }}
                                        onClick={() => setShowPromptLibrary(!showPromptLibrary)}
                                    >
                                        <span className="icon">auto_awesome</span>
                                        <span>{showPromptLibrary ? 'Hide' : 'Browse'} Prompt Library</span>
                                    </button>
                                </div>
                                {showPromptLibrary && (
                                    <div style={{
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        marginBottom: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    }}>
                                        {allPrompts.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                className="preset-btn"
                                                style={{
                                                    width: '100%',
                                                    justifyContent: 'flex-start',
                                                    padding: '8px',
                                                    textAlign: 'left'
                                                }}
                                                onClick={() => {
                                                    setCfgPrompt(p.prompt);
                                                    setShowPromptLibrary(false);
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{p.name}</div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{p.description}</div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '2px' }}>
                                                        {p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <textarea rows={5} value={cfgPrompt} onChange={(e) => setCfgPrompt(e.target.value)} />
                            </FormField>

                            {/* Advanced Options */}
                            <details style={{ marginTop: '8px' }}>
                                <summary style={{ cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontWeight: 600 }}>
                                    Advanced Options
                                </summary>
                                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
                                    {cfgEviVersion === '3' && (
                                        <label className="checkbox-label">
                                            <input type="checkbox" checked={cfgAllowShortResponses} onChange={(e) => setCfgAllowShortResponses(e.target.checked)} />
                                            Allow quick short responses (EVI 3 only)
                                        </label>
                                    )}
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={cfgEnableGreeting} onChange={(e) => setCfgEnableGreeting(e.target.checked)} />
                                        Enable greeting on new chat
                                    </label>
                                    <FormField label="Inactivity timeout (seconds)">
                                        <input
                                            type="number"
                                            min="10"
                                            max="600"
                                            value={cfgInactivityTimeout}
                                            onChange={(e) => setCfgInactivityTimeout(parseInt(e.target.value) || 120)}
                                        />
                                    </FormField>
                                </div>
                            </details>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                            <span className="icon">settings_voice</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</strong>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                    Voice: {c.voice} · EVI {c.eviVersion || '3'}
                                                </p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {c.languageModel || 'Default LLM'}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                            <button className="preset-btn" title="Copy config ID" onClick={() => {
                                                navigator.clipboard.writeText(c.id);
                                                alert(`Config ID copied: ${c.id}`);
                                            }}>
                                                <span className="icon">content_copy</span>
                                            </button>
                                            <button className="preset-btn" title="Remove" onClick={() => persistConfigs(savedConfigs.filter(x => x.id !== c.id))}>
                                                <span className="icon">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Use Cases moved to main area */}

            {/* About moved to main area */}
        </div>
    );
}
