/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import useStore from '../lib/store';
import { SiFigma, SiGithub, SiNotion, SiGoogledrive, SiOpenai, SiGoogle, SiGmail } from 'react-icons/si';
import { RiRobot2Line, RiBrainLine, RiSearchLine, RiImageLine, RiCalendarLine } from 'react-icons/ri';

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
                id: 'googledrive',
                name: 'Google Drive',
                description: 'Connect to access and manage your Google Drive files',
                icon: SiGoogledrive,
                color: '#4285F4',
                scopes: ['https://www.googleapis.com/auth/drive'],
                setupUrl: 'https://console.cloud.google.com/apis/credentials',
                helpText: 'Enable Google Drive API and create OAuth credentials'
            },
            {
                id: 'googlephotos',
                name: 'Google Photos',
                description: 'Connect to access and manage your Google Photos library',
                icon: RiImageLine,
                color: '#4285F4',
                scopes: ['https://www.googleapis.com/auth/photoslibrary'],
                setupUrl: 'https://console.cloud.google.com/apis/credentials',
                helpText: 'Enable Google Photos API and create OAuth credentials'
            },
            {
                id: 'googlecalendar',
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
                id: 'ollama',
                name: 'Ollama',
                description: 'Connect to your local Ollama instance for private AI',
                icon: RiRobot2Line,
                color: '#000000',
                scopes: [],
                requiresUrl: true,
                setupUrl: 'https://ollama.com/download',
                helpText: 'Download Ollama and run "ollama serve" in your terminal',
                placeholder: 'http://localhost:11434',
                defaultValue: 'http://localhost:11434',
                instructions: [
                    '1. Download Ollama from ollama.com',
                    '2. Install and run: ollama serve',
                    '3. Pull a model: ollama pull llama2',
                    '4. Connect using the default URL below'
                ]
            }
        ]
    },
    search: {
        name: 'Search & Discovery',
        services: [
            {
                id: 'googlesearch',
                name: 'Google Search',
                description: 'Enable web search capabilities for assistants',
                icon: RiSearchLine,
                color: '#4285F4',
                scopes: [],
                requiresApiKey: true,
                setupUrl: 'https://console.cloud.google.com/apis/library/customsearch.googleapis.com',
                helpText: 'Enable Custom Search API and create credentials',
                placeholder: 'AIzaSy...'
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
    const [isConnecting, setIsConnecting] = useState(false);
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKeyValue, setApiKeyValue] = useState('');
    const [urlValue, setUrlValue] = useState(service.defaultValue || 'http://localhost:11434');
    const [error, setError] = useState('');
    
    const isConnected = connectedServices[service.id]?.connected || false;
    const hasStoredCredentials = !!serviceCredentials[service.id];
    const Icon = service.icon;

    const handleConnect = async () => {
        setError('');
        
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
        
        setError('');
        setIsConnecting(true);
        try {
            await connectService(service.id, { url: urlValue.trim() });
            setShowUrlInput(false);
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
                    </div>
                    <p className="service-description">{service.description}</p>
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
                    <div className="service-error">
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
                                    ({connectedServices[service.id].info.name})
                                </span>
                            )}
                        </div>
                        <button 
                            className="disconnect-btn"
                            onClick={handleDisconnect}
                        >
                            Disconnect
                        </button>
                    </div>
                ) : showApiKeyInput ? (
                    <div className="input-container">
                        <div className="input-header">
                            <span>API Key Required</span>
                            {service.setupUrl && (
                                <a 
                                    href={service.setupUrl} 
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
                            placeholder={service.placeholder || `Enter ${service.name} API key`}
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
                            <span>Server URL Required</span>
                            {service.setupUrl && (
                                <a 
                                    href={service.setupUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="get-key-link"
                                >
                                    Download Ollama
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
                                if (e.key === 'Enter' && urlValue.trim()) {
                                    handleUrlConnect();
                                }
                            }}
                        />
                        <div className="input-actions">
                            <button 
                                className="connect-btn primary"
                                onClick={handleUrlConnect}
                                disabled={isConnecting || !urlValue.trim()}
                            >
                                {isConnecting ? 'Connecting...' : 'Connect'}
                            </button>
                            <button 
                                className="cancel-btn"
                                onClick={() => {
                                    setShowUrlInput(false);
                                    setUrlValue(service.defaultValue || 'http://localhost:11434');
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
                        disabled={isConnecting}
                    >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                )}
            </div>
        </div>
    );
}

export default function SettingsModal() {
    // Always call hooks at the top level
    const isSettingsOpen = useStore.use.isSettingsOpen();
    const user = useStore.use.user();
    const setIsSettingsOpen = useStore((state) => state.actions.setIsSettingsOpen);
    const fetchConnectedServices = useStore((state) => state.actions.fetchConnectedServices);
    
    useEffect(() => {
        if (isSettingsOpen) {
            fetchConnectedServices();
        }
    }, [isSettingsOpen, fetchConnectedServices]);

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
                                {categoryId === 'search' && 'Enable search capabilities to give your assistants access to real-time information.'}
                            </p>
                            
                            <div className="service-connectors">
                                {category.services.map(service => (
                                    <ServiceConnector 
                                        key={service.id} 
                                        service={service} 
                                    />
                                ))}
                            </div>
                        </section>
                    ))}

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
            </div>
        </div>
    );
}