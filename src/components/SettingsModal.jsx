/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import React from 'react';
import useStore from '../lib/store';
import { useAvailableModels } from '../hooks/useAvailableModels';
import { SiFigma, SiGithub, SiNotion, SiGoogledrive, SiOpenai, SiGoogle, SiGmail } from 'react-icons/si';
import { RiRobot2Line, RiBrainLine, RiSearchLine, RiImageLine, RiCalendarLine, RiCloudLine, RiServerLine, RiCpuLine, RiMovieLine, RiSchoolLine } from 'react-icons/ri';
import HumeTest from './HumeTest.jsx';
import SidebarTooltip from './sidebar/SidebarTooltip.jsx';
import ThumbCard from './ui/ThumbCard.jsx';

const serviceCategories = {
    productivity: {
        name: 'Productivity & Storage',
        services: [
            {
                id: 'github',
                name: 'GitHub',
                description: 'Connect to access your repositories and create issues',
                icon: SiGithub,
                color: '#000000',
                scopes: ['repo', 'user:email'],
                setupUrl: 'https://github.com/settings/applications/new',
                helpText: 'Create a new OAuth app in your GitHub settings'
            },
            {
                id: 'notion',
                name: 'Notion',
                description: 'Connect to read and write to your Notion workspace',
                icon: SiNotion,
                color: '#000000',
                scopes: [],
                setupUrl: 'https://www.notion.so/my-integrations',
                helpText: 'Create a new integration in your Notion workspace'
            },
            {
                id: 'googleDrive',
                name: 'Google Drive',
                description: 'Connect to access and manage your Google Drive files',
                icon: SiGoogledrive,
                color: '#4285F4',
                scopes: ['https://www.googleapis.com/auth/drive'],
                setupUrl: 'https://console.cloud.google.com/apis/credentials',
                helpText: 'Enable Google Drive API and create OAuth credentials'
            },
            {
                id: 'googlePhotos',
                name: 'Google Photos',
                description: 'Connect to access and manage your Google Photos library',
                icon: RiImageLine,
                color: '#4285F4',
                scopes: ['https://www.googleapis.com/auth/photoslibrary'],
                setupUrl: 'https://console.cloud.google.com/apis/credentials',
                helpText: 'Enable Google Photos API and create OAuth credentials'
            },
            {
                id: 'googleCalendar',
                name: 'Google Calendar',
                description: 'Connect to access and manage your Google Calendar events',
                icon: RiCalendarLine,
                color: '#4285F4',
                scopes: ['https://www.googleapis.com/auth/calendar'],
                setupUrl: 'https://console.cloud.google.com/apis/credentials',
                helpText: 'Enable Google Calendar API and create OAuth credentials'
            },
            {
                id: 'gmail',
                name: 'Gmail',
                description: 'Connect to read and send emails from your Gmail account',
                icon: SiGmail,
                color: '#EA4335',
                scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
                setupUrl: 'https://console.cloud.google.com/apis/credentials',
                helpText: 'Enable Gmail API and create OAuth credentials'
            },
            {
                id: 'figma',
                name: 'Figma',
                description: 'Connect to access your Figma files and projects',
                icon: SiFigma,
                color: '#F24E1E',
                scopes: ['file_read'],
                setupUrl: 'https://www.figma.com/developers/apps',
                helpText: 'Create a new app in Figma for Developers'
            }
        ]
    },
    aiModels: {
        name: 'AI Models & Services',
        services: [
            {
                id: 'openai',
                name: 'OpenAI',
                description: 'Connect to use GPT models and DALL-E for generation',
                icon: SiOpenai,
                color: '#412991',
                scopes: [],
                requiresApiKey: true,
                setupUrl: 'https://platform.openai.com/api-keys',
                helpText: 'Get your API key from the OpenAI platform',
                placeholder: 'sk-proj-...'
            },
            {
                id: 'claude',
                name: 'Anthropic Claude',
                description: 'Connect to use Claude models for advanced reasoning',
                icon: RiBrainLine,
                color: '#CC785C',
                scopes: [],
                requiresApiKey: true,
                setupUrl: 'https://console.anthropic.com/settings/keys',
                helpText: 'Get your API key from the Anthropic console',
                placeholder: 'sk-ant-api...'
            },
            {
                id: 'gemini',
                name: 'Google Gemini',
                description: 'Connect additional Gemini models and services',
                icon: SiGoogle,
                color: '#4285F4',
                scopes: [],
                requiresApiKey: true,
                setupUrl: 'https://aistudio.google.com/app/apikey',
                helpText: 'Get your API key from Google AI Studio',
                placeholder: 'AIzaSy...'
            },
            {
                id: 'drawthings',
                name: 'DrawThings',
                description: 'Connect to your local Draw Things server via HTTP or gRPC bridge for on-device image generation.',
                icon: RiImageLine,
                color: '#6C5CE7',
                requiresUrl: true,
                transportOptions: [
                    { value: 'http', label: 'HTTP REST' },
                    { value: 'grpc', label: 'gRPC Bridge' }
                ],
                setupUrl: 'https://github.com/DrawThings/DrawThings',
                helpText: 'Enable the Draw Things server in the app (Settings → Advanced → Server) and provide the endpoint URL.',
                placeholder: 'http://127.0.0.1:5678',
                instructions: [
                    '1. Open Draw Things on your device and enable the local server feature.',
                    '2. Copy the HTTP or gRPC endpoint displayed in the server panel.',
                    '3. Paste the endpoint here to allow Idea Lab to send generation jobs.'
                ]
            },
            {
                id: 'ollama',
                name: 'Ollama',
                description: 'Connect to your local Ollama instance for private AI models, or add an API key to enable web search capabilities.',
                icon: RiRobot2Line,
                color: '#000000',
                scopes: [],
                requiresUrl: true,
                requiresApiKey: true, // Support both connection types
                supportsWebSearch: true,
                setupUrl: 'https://ollama.com/download',
                helpText: 'Local instance for private models, API key enables web search for any model',
                placeholder: 'http://localhost:11434',
                defaultValue: 'http://localhost:11434',
                cloudApiKeyPlaceholder: 'Enter your Ollama API key',
                apiKeySetupUrl: 'https://ollama.com/settings/keys',
                instructions: [
                    'Local Ollama:',
                    '1. Download Ollama from ollama.com',
                    '2. Install and run: ollama serve',
                    '3. Connect using URL: http://localhost:11434',
                    '',
                    'API Key for Web Search:',
                    '1. Create account at ollama.com',
                    '2. Generate API key at ollama.com/settings/keys',
                    '3. Add key to enable web search for local models'
                ]
            },
            {
                id: 'huggingface',
                name: 'Hugging Face',
                description: 'Access thousands of open-source models through the Hugging Face Hub API',
                icon: RiCloudLine,
                color: '#FF6B35',
                scopes: [],
                requiresApiKey: true,
                setupUrl: 'https://huggingface.co/settings/tokens',
                helpText: 'Get your API key from Hugging Face settings',
                placeholder: 'hf_...'
            },
            {
                id: 'replicate',
                name: 'Replicate',
                description: 'Run machine learning models in the cloud via Replicate API',
                icon: RiServerLine,
                color: '#000000',
                scopes: [],
                requiresApiKey: true,
                setupUrl: 'https://replicate.com/account/api-tokens',
                helpText: 'Create an API token in your Replicate account',
                placeholder: 'r8_...'
            },
            {
                id: 'together',
                name: 'Together AI',
                description: 'High-performance inference for open-source language models',
                icon: RiCpuLine,
                color: '#6366F1',
                scopes: [],
                requiresApiKey: true,
                setupUrl: 'https://api.together.xyz/settings/api-keys',
                helpText: 'Get your API key from Together AI dashboard',
                placeholder: 'together_...'
            },
            {
                id: 'mistral',
                name: 'Mistral AI',
                description: 'Connect to Mistral AI models for efficient language processing',
                icon: RiBrainLine,
                color: '#FF7000',
                scopes: [],
                requiresApiKey: true,
                setupUrl: 'https://console.mistral.ai/api-keys/',
                helpText: 'Generate an API key from Mistral AI console',
                placeholder: 'mistral_...'
            },
            {
                id: 'cohere',
                name: 'Cohere',
                description: 'Enterprise-grade language AI platform for text generation and understanding',
                icon: RiCloudLine,
                color: '#39594C',
                scopes: [],
                requiresApiKey: true,
                setupUrl: 'https://dashboard.cohere.ai/api-keys',
                helpText: 'Create an API key in the Cohere dashboard',
                placeholder: 'co_...'
            },
            {
                id: 'vllm',
                name: 'vLLM',
                description: 'Connect to your self-hosted vLLM server for high-throughput LLM inference',
                icon: RiServerLine,
                color: '#2563EB',
                scopes: [],
                requiresUrl: true,
                setupUrl: 'https://docs.vllm.ai/en/latest/getting_started/quickstart.html',
                helpText: 'Set up vLLM server and provide the API endpoint',
                placeholder: 'http://localhost:8000',
                instructions: [
                    '1. Install vLLM: pip install vllm',
                    '2. Start server: python -m vllm.entrypoints.openai.api_server --model meta-llama/Llama-2-7b-hf',
                    '3. Connect using the server URL'
                ]
            },
            {
                id: 'localai',
                name: 'LocalAI',
                description: 'Self-hosted OpenAI-compatible API for running models locally',
                icon: RiCpuLine,
                color: '#10B981',
                scopes: [],
                requiresUrl: true,
                setupUrl: 'https://localai.io/basics/getting_started/',
                helpText: 'Set up LocalAI server and provide the API endpoint',
                placeholder: 'http://localhost:8080',
                instructions: [
                    '1. Install LocalAI using Docker or binary',
                    '2. Start the server with your model configuration',
                    '3. Connect using the LocalAI server URL'
                ]
            },
            {
                id: 'stability',
                name: 'Stability AI',
                description: 'Access Stable Diffusion and other generative AI models',
                icon: RiImageLine,
                color: '#8B5CF6',
                scopes: [],
                requiresApiKey: true,
                setupUrl: 'https://platform.stability.ai/account/keys',
                helpText: 'Generate an API key from Stability AI platform',
                placeholder: 'sk-...'
            },
            {
                id: 'midjourney',
                name: 'Midjourney',
                description: 'Connect to Midjourney for AI image generation (via unofficial API)',
                icon: RiImageLine,
                color: '#FF6B9D',
                scopes: [],
                requiresApiKey: true,
                setupUrl: 'https://docs.midjourney.com/',
                helpText: 'Requires third-party API service for Midjourney access',
                placeholder: 'mj_...'
            },
            {
                id: 'runway',
                name: 'Runway ML',
                description: 'Creative AI tools for video, image, and audio generation',
                icon: RiMovieLine,
                color: '#00D4AA',
                scopes: [],
                requiresApiKey: true,
                setupUrl: 'https://runwayml.com/account/',
                helpText: 'Get API access from your Runway ML account',
                placeholder: 'runway_...'
            }
        ]
    },
    education: {
        name: 'Educational Services',
        services: [
            {
                id: 'university',
                name: 'University (CODE Berlin)',
                description: 'Connect to CODE University Learning Platform for student data and course information',
                icon: RiSchoolLine,
                color: '#FF6B6B',
                scopes: [],
                setupUrl: 'https://api.app.code.berlin',
                helpText: 'Connect using your CODE University Google account'
            }
        ]
    }
};

function ServiceConnector({ service }) {
    // Always call hooks at the top level
    const connectedServices = useStore.use.connectedServices();
    const serviceCredentials = useStore.use.serviceCredentials();
    const connectService = useStore((state) => state.actions.connectService);
    const disconnectService = useStore((state) => state.actions.disconnectService);
    const toggleService = useStore((state) => state.actions.toggleService);
    // Use generic selector to avoid missing selector keys during HMR
    const serviceConfig = useStore((state) => state.serviceConfig || {});
    const fetchServiceConfig = useStore((state) => state.actions.fetchServiceConfig);
    const [isConnecting, setIsConnecting] = useState(false);
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKeyValue, setApiKeyValue] = useState('');
    const [urlValue, setUrlValue] = useState(service.defaultValue || 'http://localhost:11434');
    const [transportValue, setTransportValue] = useState(
        Array.isArray(service.transportOptions)
            ? (service.transportOptions[0]?.value || service.transportOptions[0]?.id || service.transportOptions[0] || 'http')
            : 'http'
    );
    const [error, setError] = useState('');
    const infoRef = useRef(null);
    const [tip, setTip] = useState({ open: false, x: 0, y: 0, text: '', placement: 'right' });
    
    const isConnected = connectedServices[service.id]?.connected || false;
    const cfg = serviceConfig?.[service.id];
    const isConfigured = cfg ? !!cfg.configured : true; // default true if not reported
    const hasStoredCredentials = !!serviceCredentials[service.id];
    const Icon = service.icon;

    const showHelpTooltip = () => {
        if (!infoRef.current) return;
        const rect = infoRef.current.getBoundingClientRect();
        const xRight = rect.right + window.scrollX + 8;
        const yMid = rect.top + window.scrollY + rect.height / 2;
        // naive auto-flip if near right edge
        const placement = (rect.right + 320 > window.innerWidth) ? 'left' : 'right';
        const x = placement === 'right' ? xRight : (rect.left + window.scrollX - 8);
        const content = (
          <div style={{ maxWidth: 280 }}>
            <div style={{ marginBottom: 6 }}>{service.helpText || service.description || service.name}</div>
            {service.setupUrl && (
              <a href={service.setupUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-accent)', fontSize: 12 }}>Open Console</a>
            )}
          </div>
        );
        setTip({ open: true, x, y: yMid, text: '', placement, content });
    };
    const hideHelpTooltip = () => setTip({ open: false, x: 0, y: 0, text: '', placement: 'right' });

    const handleConnect = async () => {
        if (!isConfigured) {
            setError('Service not configured on server. See setup instructions below.');
            return;
        }
        setError('');

        // Special handling for University service - uses client-side Google Identity Services
        if (service.id === 'university') {
            setIsConnecting(true);
            try {
                // Initialize Google Identity Services and get ID token
                const { initializeUniversityAuth, getGoogleIdToken, authenticateWithUniversity } = await import('../lib/university-api.js');

                await initializeUniversityAuth();
                const googleIdToken = await getGoogleIdToken();
                const authResult = await authenticateWithUniversity(googleIdToken);

                // Connect service with session token
                await connectService(service.id, {
                    sessionToken: authResult.sessionToken,
                    user: authResult.user
                });
            } catch (error) {
                console.error(`Failed to connect ${service.name}:`, error);
                setError(`Failed to connect to ${service.name}: ${error.message}`);
            } finally {
                setIsConnecting(false);
            }
            return;
        }

        // Special handling for Ollama - show both URL and API key inputs
        if (service.id === 'ollama' && service.requiresApiKey && service.requiresUrl) {
            setShowUrlInput(true);
            return;
        }

        if (service.requiresApiKey) {
            setShowApiKeyInput(true);
            return;
        }

        if (service.requiresUrl) {
            setShowUrlInput(true);
            return;
        }

        setIsConnecting(true);
        try {
            await connectService(service.id);
        } catch (error) {
            console.error(`Failed to connect ${service.name}:`, error);
            setError(`Failed to connect to ${service.name}: ${error.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleApiKeyConnect = async () => {
        if (!apiKeyValue.trim()) {
            setError('Please enter an API key');
            return;
        }

        setError('');
        setIsConnecting(true);
        try {
            await connectService(service.id, { apiKey: apiKeyValue.trim() });
            setShowApiKeyInput(false);
            setApiKeyValue('');
        } catch (error) {
            console.error(`Failed to connect ${service.name}:`, error);
            setError(`Failed to connect: ${error.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleUrlConnect = async () => {
        if (!urlValue.trim()) {
            setError('Please enter a URL');
            return;
        }

        // For Ollama, require API key as well
        if (service.id === 'ollama' && !apiKeyValue.trim()) {
            setError('Please enter both URL and API key');
            return;
        }

        setError('');
        setIsConnecting(true);
        try {
            const payload = { url: urlValue.trim() };
            if (service.id === 'ollama' && apiKeyValue.trim()) {
                payload.apiKey = apiKeyValue.trim();
            }
            if (Array.isArray(service.transportOptions) && service.transportOptions.length > 0) {
                payload.transport = transportValue;
            }
            await connectService(service.id, payload);
            setShowUrlInput(false);
            setApiKeyValue('');
            if (Array.isArray(service.transportOptions) && service.transportOptions.length > 0) {
                setTransportValue(
                    service.transportOptions[0]?.value || service.transportOptions[0]?.id || service.transportOptions[0] || 'http'
                );
            }
        } catch (error) {
            console.error(`Failed to connect ${service.name}:`, error);
            setError(`Failed to connect: ${error.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleToggle = async (enabled) => {
        setError('');
        setIsConnecting(true);
        
        try {
            await toggleService(service.id, enabled);
        } catch (error) {
            console.error(`Failed to toggle ${service.name}:`, error);
            setError(`Failed to ${enabled ? 'enable' : 'disable'}: ${error.message}`);
        } finally {
            setIsConnecting(false);
        }
    };
    
    const handleDisconnect = async () => {
        if (confirm(`Are you sure you want to disconnect ${service.name}? This will remove your stored credentials.`)) {
            try {
                await disconnectService(service.id);
            } catch (error) {
                console.error(`Failed to disconnect ${service.name}:`, error);
                setError(`Failed to disconnect: ${error.message}`);
            }
        }
    };

    return (
        <div className="service-connector">
            <span className={`card-status-dot ${isConnected ? 'connected' : 'disconnected'}`} title={isConnected ? 'Connected' : 'Disconnected'} />
            <div className="service-info">
                <div className="service-icon">
                    <Icon size={24} style={{ color: service.color }} />
                </div>
                <div className="service-details">
                    <div className="service-header">
                        <h3>{service.name}</h3>
                        {service.setupUrl && (
                            <a 
                                href={service.setupUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="setup-link"
                                title={service.helpText}
                            >
                                <span className="icon">open_in_new</span>
                            </a>
                        )}
                        {service.helpText && (
                            <button
                              type="button"
                              ref={infoRef}
                              className="help-icon"
                              aria-label={`Help for ${service.name}`}
                              onMouseEnter={showHelpTooltip}
                              onMouseLeave={hideHelpTooltip}
                            >
                              <span className="icon">help</span>
                            </button>
                        )}
                    </div>
                    <p className="service-description">{service.description}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '4px 0 8px' }}>
                        <span className={`service-badge ${isConfigured ? 'ok' : 'warn'}`}>{isConfigured ? 'Configured' : 'Not configured'}</span>
                        <span className="service-badge neutral">{service.requiresApiKey ? 'API Key' : 'OAuth'}</span>
                    </div>
                    {serviceConfig?.[service.id]?.redirectUri && (
                        <div className="redirect-row">
                            <span className="redirect-label">Redirect URI</span>
                            <code className="redirect-value">{serviceConfig[service.id].redirectUri}</code>
                            <button className="copy-btn" onClick={async () => { try { await navigator.clipboard.writeText(serviceConfig[service.id].redirectUri); } catch {} }} title="Copy redirect URI"><span className="icon">content_copy</span></button>
                        </div>
                    )}
                    {!isConfigured && (
                        <div className="service-warning" style={{ color: '#f59e0b', fontSize: 12 }}>
                            Not configured on server. Missing: {(cfg?.missing || []).join(', ') || 'environment variables'}
                            {cfg?.redirectUri && (
                                <>
                                    <br />Set Redirect URI to: <code>{cfg.redirectUri}</code>
                                </>
                            )}
                            <br />
                            <button
                              type="button"
                              className="retry-btn"
                              onClick={() => fetchServiceConfig()}
                              style={{ marginTop: 6 }}
                            >
                              Recheck configuration
                            </button>
                        </div>
                    )}
                    {service.helpText && (
                        <p className="service-help">{service.helpText}</p>
                    )}
                    {service.instructions && (
                        <div className="service-instructions">
                            <button 
                                className="instructions-toggle"
                                onClick={() => setShowInstructions(!showInstructions)}
                            >
                                <span className="icon">{showInstructions ? 'expand_less' : 'expand_more'}</span>
                                Setup Instructions
                            </button>
                            {showInstructions && (
                                <div className="instructions-content">
                                    {service.instructions.map((instruction, index) => (
                                        <div key={index} className="instruction-step">
                                            {instruction}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="service-actions">
                {error && (
                    <div className="service-error" role="alert" aria-live="polite">
                        <span className="icon">error</span>
                        {error}
                    </div>
                )}
                
                {isConnected ? (
                    <div className="service-connected">
                        <div className="connection-status">
                            <span className="status-indicator connected"></span>
                            <span className="status-text">Connected</span>
                            {connectedServices[service.id]?.info?.name && (
                                <span className="connection-details">
                                    ({connectedServices[service.id].info.name}
                                    {connectedServices[service.id].info.transport ? ` • ${connectedServices[service.id].info.transport.toUpperCase()}` : ''}
                                    {connectedServices[service.id].info.url ? ` • ${connectedServices[service.id].info.url}` : ''})
                                </span>
                            )}
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                          <button className="connect-btn" onClick={() => useStore.getState().actions.testServiceConnection(service.id)}>Test</button>
                          <button className="disconnect-btn" onClick={handleDisconnect}>Disconnect</button>
                        </div>
                    </div>
                ) : showApiKeyInput ? (
                    <div className="input-container">
                        <div className="input-header">
                            <span>API Key Required</span>
                            {(service.apiKeySetupUrl || service.setupUrl) && (
                                <a
                                    href={service.apiKeySetupUrl || service.setupUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="get-key-link"
                                >
                                    Get API Key
                                </a>
                            )}
                        </div>
                        <input
                            type="password"
                            placeholder={service.id === 'ollama' ? service.cloudApiKeyPlaceholder : (service.placeholder || `Enter ${service.name} API key`)}
                            value={apiKeyValue}
                            onChange={(e) => {
                                setApiKeyValue(e.target.value);
                                setError('');
                            }}
                            className="service-input"
                            autoFocus
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && apiKeyValue.trim()) {
                                    handleApiKeyConnect();
                                }
                            }}
                        />
                        <div className="input-actions">
                            <button 
                                className="connect-btn primary"
                                onClick={handleApiKeyConnect}
                                disabled={isConnecting || !apiKeyValue.trim()}
                            >
                                {isConnecting ? 'Connecting...' : 'Connect'}
                            </button>
                            <button 
                                className="cancel-btn"
                                onClick={() => {
                                    setShowApiKeyInput(false);
                                    setApiKeyValue('');
                                    setError('');
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : showUrlInput ? (
                    <div className="input-container">
                        <div className="input-header">
                            <span>{service.id === 'ollama' ? 'Ollama Connection' : 'Server URL Required'}</span>
                            {service.setupUrl && (
                                <a
                                    href={service.setupUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="get-key-link"
                                >
                                    {service.id === 'ollama' ? 'Download Ollama' : 'Setup Guide'}
                                </a>
                            )}
                        </div>
                        <input
                            type="url"
                            placeholder={service.placeholder || "Enter server URL"}
                            value={urlValue}
                            onChange={(e) => {
                                setUrlValue(e.target.value);
                                setError('');
                            }}
                            className="service-input"
                            autoFocus
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && urlValue.trim() && (service.id !== 'ollama' || apiKeyValue.trim())) {
                                    handleUrlConnect();
                                }
                            }}
                        />
                        {Array.isArray(service.transportOptions) && service.transportOptions.length > 0 && (
                            <div className="input-group" style={{ marginTop: '10px' }}>
                                <div className="input-label" style={{ marginBottom: '6px' }}>
                                    <span>Connection Protocol</span>
                                </div>
                                <select
                                    className="service-input"
                                    value={transportValue}
                                    onChange={(e) => setTransportValue(e.target.value)}
                                >
                                    {service.transportOptions.map((option) => {
                                        const value = option?.value || option?.id || option;
                                        const label = option?.label || option?.name || String(option).toUpperCase();
                                        return (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}
                        {service.id === 'ollama' && (
                            <>
                                <div className="input-label" style={{ marginTop: '10px', marginBottom: '5px' }}>
                                    <span>API Key for Web Search</span>
                                    {service.apiKeySetupUrl && (
                                        <a
                                            href={service.apiKeySetupUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="get-key-link"
                                        >
                                            Get API Key
                                        </a>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    placeholder={service.cloudApiKeyPlaceholder || "Enter your Ollama API key"}
                                    value={apiKeyValue}
                                    onChange={(e) => {
                                        setApiKeyValue(e.target.value);
                                        setError('');
                                    }}
                                    className="service-input"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && urlValue.trim() && apiKeyValue.trim()) {
                                            handleUrlConnect();
                                        }
                                    }}
                                />
                            </>
                        )}
                        <div className="input-actions">
                            <button
                                className="connect-btn primary"
                                onClick={handleUrlConnect}
                                disabled={isConnecting || !urlValue.trim() || (service.id === 'ollama' && !apiKeyValue.trim())}
                            >
                                {isConnecting ? 'Connecting...' : 'Connect'}
                            </button>
                            <button
                                className="cancel-btn"
                                onClick={() => {
                                    setShowUrlInput(false);
                                    setUrlValue(service.defaultValue || 'http://localhost:11434');
                                    setApiKeyValue('');
                                    if (Array.isArray(service.transportOptions) && service.transportOptions.length > 0) {
                                        setTransportValue(
                                            service.transportOptions[0]?.value ||
                                            service.transportOptions[0]?.id ||
                                            service.transportOptions[0] ||
                                            'http'
                                        );
                                    }
                                    setError('');
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        className="connect-btn"
                        onClick={handleConnect}
                        disabled={isConnecting || !isConfigured}
                        >
                        {isConfigured ? (isConnecting ? 'Connecting...' : 'Connect') : 'Not Configured'}
                    </button>
                )}
            </div>
            {/* Tooltip for provider help/instructions with auto placement */}
            <SidebarTooltip text={tip.text} content={tip.content} x={tip.x} y={tip.y} visible={tip.open} placement={tip.placement} />
        </div>
    );
}

function WorkflowAutoTitleModelSelector() {
    const workflowAutoTitleModel = useStore.use.workflowAutoTitleModel();
    const setWorkflowAutoTitleModel = useStore((state) => state.actions.setWorkflowAutoTitleModel);
    const { textModels, loading, error, refetch } = useAvailableModels();

    // Find current model details
    const currentModel = textModels.find(m => m.id === workflowAutoTitleModel);

    // If current model is not in available models, and we have models, update to first available
    useEffect(() => {
        if (!loading && textModels.length > 0 && !currentModel) {
            console.log('Current model not available, switching to:', textModels[0].id);
            setWorkflowAutoTitleModel(textModels[0].id);
        }
    }, [loading, textModels, currentModel, workflowAutoTitleModel, setWorkflowAutoTitleModel]);

    if (loading) {
        return (
            <div className="model-selector">
                <div className="loading-state">
                    <span className="icon">refresh</span>
                    Loading available models...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="model-selector">
                <div className="error-state">
                    <span className="icon">error</span>
                    <span>Failed to load models: {error}</span>
                    <button onClick={refetch} className="retry-btn">
                        <span className="icon">refresh</span>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (textModels.length === 0) {
        return (
            <div className="model-selector">
                <div className="no-models-state">
                    <span className="icon">warning</span>
                    <span>No models available. Please connect at least one AI service.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="model-selector">
            <select
                id="workflow-auto-title-model"
                value={workflowAutoTitleModel}
                onChange={(e) => setWorkflowAutoTitleModel(e.target.value)}
                className="model-select"
            >
                {textModels.map(model => (
                    <option key={model.id} value={model.id}>
                        {model.name} ({model.provider})
                    </option>
                ))}
            </select>
            <p className="model-selector-note">
                Current: {currentModel?.name || workflowAutoTitleModel}
                {textModels.length > 0 && (
                    <span> • {textModels.length} models available</span>
                )}
            </p>
        </div>
    );
}

export default function SettingsModal() {
    // Always call hooks at the top level
    const isSettingsOpen = useStore.use.isSettingsOpen();
    const user = useStore.use.user();
    const setIsSettingsOpen = useStore((state) => state.actions.setIsSettingsOpen);
    const fetchConnectedServices = useStore((state) => state.actions.fetchConnectedServices);
    const fetchServiceConfig = useStore((state) => state.actions.fetchServiceConfig);
    const [showHumeTest, setShowHumeTest] = useState(false);
    const [activeService, setActiveService] = useState(null);

    useEffect(() => {
        if (isSettingsOpen) {
            fetchConnectedServices();
            fetchServiceConfig();
        }
    }, [isSettingsOpen, fetchConnectedServices, fetchServiceConfig]);

    if (!isSettingsOpen) return null;

    const closeSettings = () => setIsSettingsOpen(false);

    return (
        <div className="settings-overlay" onClick={closeSettings}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>Settings</h2>
                    <button className="close-btn" onClick={closeSettings}>
                        <span className="icon">close</span>
                    </button>
                </div>
                
                <div className="settings-content">
                    <section className="settings-section">
                        <h3>Account</h3>
                        <div className="account-info">
                            <div className="account-details">
                                {user?.picture && (
                                    <img 
                                        src={user.picture} 
                                        alt={user.name}
                                        className="account-avatar"
                                    />
                                )}
                                <div>
                                    <p className="account-name">{user?.name}</p>
                                    <p className="account-email">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {Object.entries(serviceCategories).map(([categoryId, category]) => (
                        <section key={categoryId} className="settings-section">
                            <h3>{category.name}</h3>
                            <p className="section-description">
                                {categoryId === 'productivity' && 'Connect productivity tools and cloud storage services for seamless project management.'}
                                {categoryId === 'aiModels' && 'Connect AI model providers to enhance your assistants with additional capabilities.'}
                                {categoryId === 'education' && 'Connect educational platforms to access student data, courses, and academic information.'}
                                {categoryId === 'search' && 'Enable search capabilities to give your assistants access to real-time information.'}
                            </p>
                            
                            <div className="mode-grid service-mode-grid">
                                {category.services.map(service => {
                                    const isConnected = useStore.getState().connectedServices?.[service.id]?.connected;
                                    const Icon = service.icon;
                                    return (
                                        <ThumbCard
                                            key={service.id}
                                            title={service.name}
                                            imageSrc={null}
                                            icon={<Icon size={24} style={{ color: service.color }} />}
                                            connected={!!isConnected}
                                            onClick={() => setActiveService(service)}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    ))}

                    <section className="settings-section">
                        <h3>Workflow Preferences</h3>
                        <p className="section-description">
                            Configure default settings for workflow creation and management.
                        </p>

                        <div className="preference-item">
                            <label htmlFor="workflow-auto-title-model" className="preference-label">
                                Auto-Title Model
                            </label>
                            <p className="preference-description">
                                Choose which AI model should be used to automatically generate workflow titles when you click the sparkles button.
                            </p>
                            <WorkflowAutoTitleModelSelector />
                        </div>
                    </section>

                    <section className="settings-section">
                        <h3>UI Customization</h3>
                        <p className="section-description">Choose an accent color set (day/night) for the interface.</p>
                        <AccentColorSelector />
                    </section>

                    {/* Hume Test moved to EmpathyLab - hidden for now, integrated into main app */}
                    {false && (
                        <section className="settings-section">
                            <h3>Hume EVI Testing</h3>
                            <p className="section-description">
                                Test the Hume Empathic Voice Interface integration. Speak to the AI and see real-time emotion detection from your voice.
                            </p>
                            <div style={{ marginBottom: '1rem' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowHumeTest(!showHumeTest)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: showHumeTest ? '#9E9E9E' : '#2196F3',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <span className="icon">{showHumeTest ? 'close' : 'psychology'}</span>
                                    {showHumeTest ? 'Close Hume Test' : 'Open Hume Test'}
                                </button>
                            </div>
                            {showHumeTest && <HumeTest />}
                        </section>
                    )}

                    <section className="settings-section">
                        <h3>Privacy & Data</h3>
                        <div className="privacy-info">
                            <p>
                                Your connected service tokens are stored securely and encrypted.
                                We only access the minimum permissions needed for the features you use.
                            </p>
                            <p>
                                You can disconnect any service at any time to revoke access.
                            </p>
                        </div>
                    </section>
                </div>

                {activeService && (
                  <div className="dialog-overlay" onClick={() => setActiveService(null)}>
                    <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
                      <div className="dialog-card-header">
                        <div className="left">
                          <span className="icon">tune</span>
                          <div className="title">{activeService.name}</div>
                        </div>
                        <button className="close-btn" onClick={() => setActiveService(null)} title="Close">
                          <span className="icon">close</span>
                        </button>
                      </div>
                      <div className="dialog-card-body">
                        <ServiceConnector service={activeService} />
                      </div>
                    </div>
                  </div>
                )}
            </div>
        </div>
    );
}

function AccentColorSelector() {
    const accentTheme = useStore.use.accentTheme();
    const setAccentTheme = useStore.use.actions().setAccentTheme;
    const palettes = [
        { id: 'azure',    name: 'Azure',    day: '#1e88e5', night: '#1e88e5' },
        { id: 'emerald',  name: 'Emerald',  day: '#059669', night: '#10b981' },
        { id: 'amber',    name: 'Amber',    day: '#d97706', night: '#f59e0b' },
        { id: 'violet',   name: 'Violet',   day: '#7c3aed', night: '#8b5cf6' },
        { id: 'rose',     name: 'Rose',     day: '#dc2626', night: '#ef4444' },
        { id: 'teal',     name: 'Teal',     day: '#0d9488', night: '#14b8a6' },
        { id: 'indigo',   name: 'Indigo',   day: '#4f46e5', night: '#6366f1' },
        { id: 'magenta',  name: 'Magenta',  day: '#c026d3', night: '#d946ef' },
        { id: 'cyan',     name: 'Cyan',     day: '#0891b2', night: '#06b6d4' },
        { id: 'lime',     name: 'Lime',     day: '#65a30d', night: '#84cc16' },
    ];
    return (
        <div className="accent-grid">
            {palettes.map(p => (
                <button
                    key={p.id}
                    className={`accent-swatch ${accentTheme === p.id ? 'selected' : ''}`}
                    onClick={() => setAccentTheme(p.id)}
                    title={`${p.name} (Day/Night)`}
                    type="button"
                >
                    <div className="accent-circle" style={{ background: `linear-gradient(90deg, ${p.night} 50%, ${p.day} 50%)` }} />
                    <div className="accent-name">{p.name}</div>
                </button>
            ))}
        </div>
    );
}
