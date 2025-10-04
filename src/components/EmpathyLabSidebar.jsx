/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import FormField from './ui/FormField.jsx';
import { createHumeConfig, listHumeVoices } from '../lib/services/hume.js';
import SidebarSubheader from './sidebar/SidebarSubheader.jsx';
import SidebarTooltip from './sidebar/SidebarTooltip.jsx';
import SidebarToggleItemCard from './sidebar/SidebarToggleItemCard.jsx';
import { getAllPrompts, getPrompt } from '../data/hume-prompts.js';
import useStore from '../lib/store.js';
import { useAvailableModels } from '../hooks/useAvailableModels.js';

export default function EmpathyLabSidebar() {
    // Get consent and overlays from Zustand store
    const consent = useStore.use.empathyLab().consent;
    const overlays = useStore.use.empathyLab().overlays || {
        drawBoxes: true,
        drawPoints: true,
        drawPolygons: true,
        drawLabels: true,
        drawFaceMesh: false,
        drawIris: false,
        drawGaze: true,
        drawAttention: false,
        drawBodySkeleton: true,
        drawBodyPoints: true,
        drawHandSkeleton: true,
        drawHandPoints: true,
        showGazeOverlay: false,
        showEmotionFusion: true
    };
    const setEmpathyLabConsent = useStore.use.actions().setEmpathyLabConsent;
    const setEmpathyLabConsentAll = useStore.use.actions().setEmpathyLabConsentAll;
    const setEmpathyLabHumeConfig = useStore.use.actions().setEmpathyLabHumeConfig;
    const setEmpathyLabOverlay = useStore.use.actions().setEmpathyLabOverlay;

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

        setEmpathyLabConsentAll(presetConfigs[preset]);
    };

    const toggleConsent = (key) => {
        setEmpathyLabConsent(key, !consent[key]);
        setPresets('custom');
    };

    // Hume EVI Config form state
    const [showConfigForm, setShowConfigForm] = useState(false);
    const [showConfigsList, setShowConfigsList] = useState(false);
    const [showPromptLibrary, setShowPromptLibrary] = useState(false);
    const [cfgName, setCfgName] = useState('');
    const [cfgVoice, setCfgVoice] = useState('ITO');
    const [cfgEviVersion, setCfgEviVersion] = useState('3');
    const [cfgLanguageModel, setCfgLanguageModel] = useState('');

    // Fetch available models from services
    const { models, textModels, loading: modelsLoading } = useAvailableModels();
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
    const [tooltip, setTooltip] = useState({ open: false, x: 0, y: 0, text: '' });

    // Voice library state
    const [voices, setVoices] = useState([]);
    const [voicesLoading, setVoicesLoading] = useState(false);
    const [voicesError, setVoicesError] = useState(null);

    // Fetch Hume voices on mount
    useEffect(() => {
        const fetchVoices = async () => {
            setVoicesLoading(true);
            setVoicesError(null);
            try {
                const data = await listHumeVoices('HUME_AI', 0, 100);
                // API returns { voices_page: [{ name, id, description, ... }], total_results, page_number, page_size }
                if (data?.voices_page && Array.isArray(data.voices_page)) {
                    setVoices(data.voices_page);
                }
            } catch (err) {
                console.error('[EmpathyLab] Failed to fetch voices:', err);
                setVoicesError(err.message || 'Failed to load voice library');
            } finally {
                setVoicesLoading(false);
            }
        };

        fetchVoices();
    }, []);

    const persistConfigs = (list) => {
        setSavedConfigs(list);
        try { localStorage.setItem('empathyLab.hume.configs', JSON.stringify(list)); } catch {}
    };

    // Set default model when models are loaded
    useEffect(() => {
        if (textModels.length > 0 && !cfgLanguageModel) {
            setCfgLanguageModel(textModels[0].id);
        }
    }, [textModels, cfgLanguageModel]);

    // Helper: Detect model provider from model ID using loaded models
    const getModelProvider = (modelResource) => {
        const model = models.find(m => m.id === modelResource);
        if (!model) {
            // Fallback to name-based detection
            if (modelResource.startsWith('claude')) return 'ANTHROPIC';
            if (modelResource.startsWith('gpt')) return 'OPEN_AI';
            if (modelResource.startsWith('gemini')) return 'GOOGLE';
            return 'ANTHROPIC'; // default
        }

        // Map provider names to Hume's expected format
        const providerMap = {
            'Anthropic': 'ANTHROPIC',
            'OpenAI': 'OPEN_AI',
            'Google': 'GOOGLE',
            'Gemini': 'GOOGLE'
        };

        return providerMap[model.provider] || 'ANTHROPIC';
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
                    model_provider: getModelProvider(cfgLanguageModel),
                    model_resource: cfgLanguageModel
                },
                // Note: prompt field requires a prompt ID from a previously created prompt
                // For now, omit it - users can add system instructions via the config later
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

            <hr className="sidebar-separator" />

            <SidebarSubheader icon="tune" title="Tracking Permissions" subtitle="Toggle capabilities used in the lab" />
            <div className="consent-options" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SidebarToggleItemCard
                  icon="face"
                  label="Face Detection"
                  checked={!!consent.faceDetection}
                  onChange={() => toggleConsent('faceDetection')}
                  tooltip="Detect face position, rotation, and 3D mesh landmarks"
                  onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Detect face position, rotation, and 3D mesh landmarks' })}
                  onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                  onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                />
                <div style={{ opacity: consent.faceDetection ? 1 : 0.5 }}>
                  <SidebarToggleItemCard
                    icon="mood"
                    label="Emotion Analysis"
                    checked={!!consent.emotionAnalysis}
                    onChange={() => toggleConsent('emotionAnalysis')}
                    tooltip="Analyze facial expressions for 7 basic emotions"
                    onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Analyze facial expressions for 7 basic emotions' })}
                    onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                    onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                  />
                </div>
                <div style={{ opacity: consent.faceDetection ? 1 : 0.5 }}>
                  <SidebarToggleItemCard
                    icon="visibility"
                    label="Gaze Tracking"
                    checked={!!consent.gazeTracking}
                    onChange={() => toggleConsent('gazeTracking')}
                    tooltip="Track eye direction and focus strength"
                    onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Track eye direction and focus strength' })}
                    onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                    onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                  />
                </div>
                <SidebarToggleItemCard
                  icon="accessibility"
                  label="Body Pose Tracking"
                  checked={!!consent.bodyTracking}
                  onChange={() => toggleConsent('bodyTracking')}
                  tooltip="Track 17-point body skeleton for posture analysis"
                  onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Track 17-point body skeleton for posture analysis' })}
                  onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                  onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                />
                <SidebarToggleItemCard
                  icon="back_hand"
                  label="Hand & Gesture Tracking"
                  checked={!!consent.handTracking}
                  onChange={() => toggleConsent('handTracking')}
                  tooltip="Track hand landmarks and recognize gestures"
                  onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Track hand landmarks and recognize gestures' })}
                  onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                  onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                />
                <SidebarToggleItemCard
                  icon="download"
                  label="Data Export"
                  checked={!!consent.dataExport}
                  onChange={() => toggleConsent('dataExport')}
                  tooltip="Allow exporting anonymized session data (JSON)"
                  onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Allow exporting anonymized session data (JSON)' })}
                  onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                  onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                />
            </div>

            <hr className="sidebar-separator" />

            <SidebarSubheader icon="visibility" title="Visualization Controls" subtitle="Toggle detection overlays" />
            <div className="overlay-options" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* General Overlays */}
                <SidebarToggleItemCard
                  icon="check_box_outline_blank"
                  label="Bounding Boxes"
                  checked={!!overlays.drawBoxes}
                  onChange={() => setEmpathyLabOverlay('drawBoxes', !overlays.drawBoxes)}
                  tooltip="Show detection bounding boxes"
                  onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Show detection bounding boxes' })}
                  onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                  onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                />
                <SidebarToggleItemCard
                  icon="label"
                  label="Labels & Text"
                  checked={!!overlays.drawLabels}
                  onChange={() => setEmpathyLabOverlay('drawLabels', !overlays.drawLabels)}
                  tooltip="Show detection labels and metadata"
                  onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Show detection labels and metadata' })}
                  onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                  onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                />

                {/* Face Overlays */}
                <div style={{ opacity: consent.faceDetection ? 1 : 0.5 }}>
                  <SidebarToggleItemCard
                    icon="grid_on"
                    label="Face Mesh"
                    checked={!!overlays.drawFaceMesh}
                    onChange={() => setEmpathyLabOverlay('drawFaceMesh', !overlays.drawFaceMesh)}
                    tooltip="Show 468-point 3D face mesh"
                    onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Show 468-point 3D face mesh' })}
                    onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                    onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                  />
                </div>
                <div style={{ opacity: consent.gazeTracking ? 1 : 0.5 }}>
                  <SidebarToggleItemCard
                    icon="near_me"
                    label="Gaze Direction"
                    checked={!!overlays.drawGaze}
                    onChange={() => setEmpathyLabOverlay('drawGaze', !overlays.drawGaze)}
                    tooltip="Show eye gaze direction arrows"
                    onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Show eye gaze direction arrows' })}
                    onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                    onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                  />
                </div>

                {/* Body Overlays */}
                <div style={{ opacity: consent.bodyTracking ? 1 : 0.5 }}>
                  <SidebarToggleItemCard
                    icon="account_tree"
                    label="Body Skeleton"
                    checked={!!overlays.drawBodySkeleton}
                    onChange={() => setEmpathyLabOverlay('drawBodySkeleton', !overlays.drawBodySkeleton)}
                    tooltip="Show body pose skeleton lines"
                    onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Show body pose skeleton lines' })}
                    onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                    onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                  />
                </div>

                {/* Hand Overlays */}
                <div style={{ opacity: consent.handTracking ? 1 : 0.5 }}>
                  <SidebarToggleItemCard
                    icon="polyline"
                    label="Hand Skeleton"
                    checked={!!overlays.drawHandSkeleton}
                    onChange={() => setEmpathyLabOverlay('drawHandSkeleton', !overlays.drawHandSkeleton)}
                    tooltip="Show hand landmarks and finger lines"
                    onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Show hand landmarks and finger lines' })}
                    onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                    onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                  />
                </div>

                <hr style={{ margin: '12px 0', opacity: 0.3, border: 'none', borderTop: '1px solid var(--color-surface-border)' }} />

                {/* Advanced Sci-Fi Overlays */}
                <div style={{ opacity: consent.gazeTracking ? 1 : 0.5 }}>
                  <SidebarToggleItemCard
                    icon="hub"
                    label="Sci-Fi Gaze Overlay"
                    checked={!!overlays.showGazeOverlay}
                    onChange={() => setEmpathyLabOverlay('showGazeOverlay', !overlays.showGazeOverlay)}
                    tooltip="Animated gaze direction overlay with focus indicator"
                    onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Animated gaze direction overlay with focus indicator' })}
                    onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                    onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                  />
                </div>

                <SidebarToggleItemCard
                  icon="auto_awesome"
                  label="Emotion Fusion Display"
                  checked={!!overlays.showEmotionFusion}
                  onChange={() => setEmpathyLabOverlay('showEmotionFusion', !overlays.showEmotionFusion)}
                  tooltip="Advanced multimodal emotion analysis with conflict detection"
                  onMouseEnter={(e) => setTooltip({ open: true, x: e.clientX + 12, y: e.clientY, text: 'Advanced multimodal emotion analysis with conflict detection' })}
                  onMouseMove={(e) => setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY }))}
                  onMouseLeave={() => setTooltip({ open: false, x: 0, y: 0, text: '' })}
                />
            </div>

            {/* Hover tooltip for consent items */}
            <SidebarTooltip text={tooltip.text} x={tooltip.x} y={tooltip.y} visible={tooltip.open} placement="right" />

            <hr className="sidebar-separator" />

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
                            <FormField label="Voice">
                                {voicesLoading ? (
                                    <input type="text" value="Loading voices..." disabled />
                                ) : voicesError ? (
                                    <input type="text" value={cfgVoice} onChange={(e) => setCfgVoice(e.target.value)} placeholder="Type voice name (e.g., ITO, Kora)" />
                                ) : (
                                    <select value={cfgVoice} onChange={(e) => setCfgVoice(e.target.value)}>
                                        {voices.length === 0 ? (
                                            <option value="ITO">ITO (default)</option>
                                        ) : voices.map(voice => (
                                            <option key={voice.id || voice.name} value={voice.name}>
                                                {voice.name}{voice.description ? ` - ${voice.description.substring(0, 40)}${voice.description.length > 40 ? '...' : ''}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </FormField>
                            <FormField label="Language Model">
                                <select
                                    value={cfgLanguageModel}
                                    onChange={(e) => setCfgLanguageModel(e.target.value)}
                                    disabled={modelsLoading}
                                >
                                    {modelsLoading ? (
                                        <option value="">Loading models...</option>
                                    ) : textModels.length === 0 ? (
                                        <option value="">No models available</option>
                                    ) : (
                                        textModels.map(model => (
                                            <option key={model.id} value={model.id}>
                                                {model.name} {model.provider && `(${model.provider})`}
                                            </option>
                                        ))
                                    )}
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

            <hr className="sidebar-separator" />

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
                                            <button
                                                className="preset-btn"
                                                title="Use this config"
                                                onClick={() => setEmpathyLabHumeConfig(c.id)}
                                                style={{ background: 'var(--color-accent)', color: 'white' }}
                                            >
                                                <span className="icon">check</span>
                                            </button>
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
