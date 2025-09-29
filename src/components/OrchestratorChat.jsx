
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useRef } from 'react';
import useStore from '../lib/store';
import { sendMessageToOrchestrator, newOrchestratorChat, restoreOrchestratorSession, deleteOrchestratorSession, clearOrchestratorSessions } from '../lib/actions';
import { personalities } from '../lib/assistant/personalities';
import { modulesBySemester } from '../lib/modules';
import { getGoalsSummary } from '../lib/goals';

const AgentTask = ({ message }) => (
    <div className="agent-task-message">
        <div className="agent-task-header">
            <span className="icon">{message.agentIcon}</span>
            <h4>{message.agentName} is on the job...</h4>
        </div>
        <div className="agent-task-body">
            <p><strong>Task:</strong> {message.task}</p>
            <div className="spinner-line">
                <div className="spinner-dot"></div>
            </div>
            {message.result && (
                 <div className="agent-task-result">
                    <strong>Findings:</strong>
                    <p dangerouslySetInnerHTML={{ __html: message.result.replace(/\n/g, '<br />') }} />
                </div>
            )}
        </div>
    </div>
);


export default function OrchestratorChat() {
    const history = useStore.use.orchestratorHistory();
    const isLoading = useStore.use.isOrchestratorLoading();
    const [input, setInput] = useState('');
    const [showInviteMenu, setShowInviteMenu] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [showAIList, setShowAIList] = useState(false);
    const [showModelSelector, setShowModelSelector] = useState(false);
    const orchestratorModel = useStore.use.orchestratorModel();
    const setOrchestratorModel = useStore.use.actions().setOrchestratorModel;
    const connectedServices = useStore.use.connectedServices();
    const [ollamaModels, setOllamaModels] = useState([]);
    const historyRef = useRef(null);
    const activeModuleId = useStore.use.activeModuleId();
    const hasConversation = useStore.use.orchestratorHasConversation();
    const [showSessions, setShowSessions] = useState(false);
    const savedSessions = useStore.use.orchestratorSavedSessions();

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-button-container') && !event.target.closest('.orchestrator-header-actions')) {
                setShowInviteMenu(false);
                setShowToolsMenu(false);
                setShowAIList(false);
                setShowModelSelector(false);
                setShowSessions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessageToOrchestrator(input);
        setInput('');
    };

    const handleInviteAgent = (moduleCode) => {
        // First, select the module, then invite the agent
        useStore.setState({ activeModuleId: moduleCode });
        setTimeout(() => {
            sendMessageToOrchestrator(`/invite`);
        }, 100); // Small delay to ensure module selection is processed
        setShowInviteMenu(false);
    };

    const handleToolAction = (tool) => {
        if (tool === 'search') {
            setInput('/search ');
        }
        setShowToolsMenu(false);
    };

    const handleGoalsClick = () => {
        try {
            const message = getGoalsSummary();
            sendMessageToOrchestrator(message);
        } catch (e) {
            sendMessageToOrchestrator('Please remind me of my academic goals and requirements and propose next actions.');
        }
    };



    // Get available AI models based on connected services
    const getAvailableModels = () => {
        const models = [];
        
        // Always include default Gemini models (built-in)
        models.push(
            {
                id: 'gemini-2.0-flash-exp',
                name: 'Gemini 2.0 Flash',
                description: 'Fast responses, experimental features',
                icon: 'flash_on',
                badge: 'EXPERIMENTAL',
                service: 'gemini',
                builtin: true
            },
            {
                id: 'gemini-1.5-pro',
                name: 'Gemini 1.5 Pro',
                description: 'Balanced performance and capability',
                icon: 'psychology',
                badge: 'RECOMMENDED',
                service: 'gemini',
                builtin: true
            },
            {
                id: 'gemini-1.5-flash',
                name: 'Gemini 1.5 Flash',
                description: 'Speed optimized',
                icon: 'speed',
                badge: 'FAST',
                service: 'gemini',
                builtin: true
            }
        );
        
        // Add OpenAI models if connected
        if (connectedServices.openai?.connected) {
            models.push(
                {
                    id: 'gpt-4o',
                    name: 'GPT-4o',
                    description: 'Advanced multimodal reasoning',
                    icon: 'auto_awesome',
                    badge: 'PREMIUM',
                    service: 'openai'
                },
                {
                    id: 'gpt-4o-mini',
                    name: 'GPT-4o Mini',
                    description: 'Cost-effective intelligence',
                    icon: 'bolt',
                    badge: 'EFFICIENT',
                    service: 'openai'
                }
            );
        }
        
        // Add Claude models if connected
        if (connectedServices.claude?.connected) {
            models.push(
                {
                    id: 'claude-3-5-sonnet-20241022',
                    name: 'Claude 3.5 Sonnet',
                    description: 'Advanced reasoning and coding',
                    icon: 'psychology',
                    badge: 'SMART',
                    service: 'claude'
                },
                {
                    id: 'claude-3-5-haiku-20241022',
                    name: 'Claude 3.5 Haiku',
                    description: 'Fast and efficient',
                    icon: 'speed',
                    badge: 'QUICK',
                    service: 'claude'
                }
            );
        }
        
        // Add Ollama models live if connected
        if (connectedServices.ollama?.connected && ollamaModels.length > 0) {
            for (const m of ollamaModels) {
                models.push({
                    id: m.name,
                    name: m.name,
                    description: 'Local Ollama model',
                    icon: 'computer',
                    badge: 'LOCAL',
                    service: 'ollama'
                });
            }
        }
        
        return models;
    };
    
    const availableModels = getAvailableModels();

    const handleNewChat = () => {
        newOrchestratorChat();
        // Close any open menus when starting new chat
        setShowInviteMenu(false);
        setShowToolsMenu(false);
        setShowAIList(false);
        setShowModelSelector(false);
    };

    // Fetch Ollama models dynamically when connected
    useEffect(() => {
        let keep = true;
        async function load() {
            if (connectedServices?.ollama?.connected) {
                try {
                    const resp = await fetch('/api/ollama/models', { credentials: 'include' });
                    const data = await resp.json();
                    if (keep && resp.ok) {
                        setOllamaModels(data.models || []);
                    }
                } catch (e) {
                    // ignore; UI will just not show ollama models
                }
            } else {
                setOllamaModels([]);
            }
        }
        load();
        return () => { keep = false; }
    }, [connectedServices?.ollama?.connected]);

    const handleModelSelect = (modelId) => {
        setOrchestratorModel(modelId);
        setShowModelSelector(false);
        // Add a system message indicating the model change
        useStore.setState(state => {
            const selectedModel = availableModels.find(m => m.id === modelId);
            state.orchestratorHistory.push({
                role: 'system',
                parts: [{ text: `*Switched orchestrator to ${selectedModel.name} model*` }]
            });
        });
    };

    // Get all modules for the invite menu
    const allModules = Object.values(modulesBySemester).flat();

    const placeholderText = activeModuleId
      ? `Message or try /invite @${personalities[activeModuleId]?.name || 'Agent'} | /search <query>`
      : 'Select a module to begin... Available commands: /search <query>';

    // Get active agents (those that have been invited)
    const activeAgents = history.filter(msg => msg.role === 'agent-task')
        .map(msg => ({
            name: msg.agentName,
            icon: msg.agentIcon
        }))
        .filter((agent, index, self) => 
            index === self.findIndex(a => a.name === agent.name)
        );

    return (
        <div className="orchestrator-chat-container">
            <div className="orchestrator-header">
                <div className="orchestrator-header-info">
                    <div className="orchestrator-title">
                        <span className="icon orchestrator-icon">psychology</span>
                        <h2>Orchestrator</h2>
                    </div>
                    <p className="orchestrator-subtitle">Main Project Coordinator</p>
                </div>
                <div className="orchestrator-header-actions">
                    <button
                        className="ai-list-btn"
                        onClick={handleNewChat}
                        title="New Chat Session"
                    >
                        <span className="icon">add</span>
                        <span>New</span>
                    </button>
                    <button
                        className="ai-list-btn"
                        onClick={() => setShowSessions(!showSessions)}
                        title={`Sessions (${savedSessions?.length || 0})`}
                    >
                        <span className="icon">history</span>
                        <span className="ai-count">{savedSessions?.length || 0}</span>
                    </button>
                    {showSessions && (
                        <div className="ai-list-dropdown">
                            <div className="dropdown-header">Sessions</div>
                            {(savedSessions?.length || 0) === 0 ? (
                                <div className="dropdown-empty">No saved sessions</div>
                            ) : (
                                savedSessions.map((s) => (
                                    <div key={s.id} className="ai-list-item" style={{ gap: '12px' }}>
                                        <span className="icon">history</span>
                                        <div className="model-info" style={{ flex: 1 }}>
                                            <span className="model-title">{s.title || 'Untitled session'}</span>
                                            <span className="model-desc">{new Date(s.createdAt).toLocaleString()} · {s.model || ''}</span>
                                        </div>
                                        <button type="button" className="action-btn" title="Restore" onClick={() => { restoreOrchestratorSession(s.id); setShowSessions(false); }}>
                                            <span className="icon">restore</span>
                                        </button>
                                        <button type="button" className="action-btn" title="Delete" onClick={() => deleteOrchestratorSession(s.id)}>
                                            <span className="icon">delete</span>
                                        </button>
                                    </div>
                                ))
                            )}
                            {(savedSessions?.length || 0) > 0 && (
                                <div className="ai-list-item" style={{ justifyContent: 'flex-end' }}>
                                    <button type="button" className="action-btn" title="Clear All" onClick={() => clearOrchestratorSessions()}>
                                        <span className="icon">delete_forever</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    <button 
                        className="model-selector-btn"
                        onClick={() => setShowModelSelector(!showModelSelector)}
                        title="Select AI Model"
                    >
                        <span className="icon">{availableModels.find(m => m.id === orchestratorModel)?.icon || 'psychology'}</span>
                        <span className="model-name">{availableModels.find(m => m.id === orchestratorModel)?.name || 'Gemini'}</span>
                    </button>
                    <button 
                        className="ai-list-btn"
                        onClick={() => setShowAIList(!showAIList)}
                        title={`Active AIs (${activeAgents.length})`}
                    >
                        <span className="icon">groups</span>
                        <span className="ai-count">{activeAgents.length}</span>
                    </button>
                    {showModelSelector && (
                        <div className="model-selector-dropdown">
                            <div className="dropdown-header">Select AI Model</div>
                            {availableModels.map((model) => (
                                <button
                                    key={model.id}
                                    className={`dropdown-item ${model.id === orchestratorModel ? 'active' : ''}`}
                                    onClick={() => handleModelSelect(model.id)}
                                >
                                    <span className="icon">{model.icon}</span>
                                    <div className="model-info">
                                        <span className="model-title">{model.name}</span>
                                        <span className="model-desc">{model.description}</span>
                                    </div>
                                    {model.badge && <span className="model-badge">{model.badge}</span>}
                                </button>
                            ))}
                        </div>
                    )}

                    {showAIList && (
                        <div className="ai-list-dropdown">
                            <div className="dropdown-header">Active AIs</div>
                            {activeAgents.length === 0 ? (
                                <div className="dropdown-empty">No agents invited yet</div>
                            ) : (
                                activeAgents.map((agent, index) => (
                                    <div key={index} className="ai-list-item">
                                        <span className="icon">{agent.icon}</span>
                                        <span className="ai-name">{agent.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="assistant-history" ref={historyRef}>
                {!hasConversation && (
                    <div className="assistant-actions-container" style={{ flexWrap: 'wrap', gap: '10px' }}>
                        <button type="button" className="action-btn" title="Project Kickoff" onClick={() => sendMessageToOrchestrator("Let's kick off a new project. Help me define goals, scope, milestones, and initial tasks. Ask clarifying questions.")}>
                            <span className="icon">flag</span>
                            <span>Kickoff</span>
                        </button>
                        <button type="button" className="action-btn" title="Goals" onClick={handleGoalsClick}>
                            <span className="icon">school</span>
                            <span>Goals</span>
                        </button>
                        <button type="button" className="action-btn" title="Create Code Notebook" onClick={() => sendMessageToOrchestrator('/document Code_Notebook')}>
                            <span className="icon">description</span>
                            <span>Notebook</span>
                        </button>
                        <button type="button" className="action-btn" title="Search the Web" onClick={() => setInput('/search ')}>
                            <span className="icon">search</span>
                            <span>Search</span>
                        </button>
                    </div>
                )}
                {history.map((msg, index) => {
                    if (msg.role === 'agent-task') {
                        return <AgentTask key={index} message={msg} />;
                    }
                    if (msg.role === 'model') {
                        return (
                            <div key={index} className={`assistant-message ${msg.role}`}>
                                <div className="message-header">
                                    <span className="icon ai-icon">psychology</span>
                                    <span className="ai-name">Orchestrator</span>
                                </div>
                                <p dangerouslySetInnerHTML={{ __html: msg.parts[0].text.replace(/\n/g, '<br />') }} />
                            </div>
                        )
                    }
                    return (
                        <div key={index} className={`assistant-message ${msg.role}`}>
                            <p dangerouslySetInnerHTML={{ __html: msg.parts[0].text.replace(/\n/g, '<br />') }} />
                        </div>
                    )
                })}
                {isLoading && (
                    <div className="assistant-message model loading">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                )}
            </div>
            <form className="assistant-input-form" onSubmit={handleSubmit}>
                <div className="input-actions">
                    <div className="action-button-container">
                        <button
                            type="button"
                            className="action-btn"
                            onClick={() => setShowInviteMenu(!showInviteMenu)}
                            title="Invite Module Assistant"
                        >
                            <span className="icon">person_add</span>
                        </button>
                        {showInviteMenu && (
                            <div className="dropdown-menu invite-menu">
                                <div className="dropdown-header">Invite Assistant</div>
                                {allModules.map(module => {
                                    const personality = personalities[module['Module Code']];
                                    if (!personality) return null;
                                    return (
                                        <button
                                            key={module['Module Code']}
                                            type="button"
                                            className="dropdown-item"
                                            onClick={() => handleInviteAgent(module['Module Code'])}
                                        >
                                            <span className="icon">{personality.icon}</span>
                                            <div className="module-info">
                                                <span className="module-code">{module['Module Code']}</span>
                                                <span className="module-name">{personality.name}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="action-button-container">
                        <button
                            type="button"
                            className="action-btn"
                            onClick={() => setShowToolsMenu(!showToolsMenu)}
                            title="Tools"
                        >
                            <span className="icon">build</span>
                        </button>
                        {showToolsMenu && (
                            <div className="dropdown-menu tools-menu">
                                <div className="dropdown-header">Tools</div>
                                <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => handleToolAction('search')}
                                >
                                    <span className="icon">search</span>
                                    <span>Web Search</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>


                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholderText}
                    disabled={isLoading}
                    autoFocus
                />
                <button type="submit" disabled={isLoading || !input.trim()}>
                    <span className="icon">send</span>
                </button>
            </form>
        </div>
    );
}
