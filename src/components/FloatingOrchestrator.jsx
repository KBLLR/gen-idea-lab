/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import useStore from '../lib/store';
import { sendMessageToOrchestrator } from '../lib/actions';
import { personalities } from '../lib/assistant/personalities';
import { modulesBySemester } from '../lib/modules';
import { extractWorkflowContext } from '../lib/contextExtraction';
import '../styles/components/floating-orchestrator.css';

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

export default function FloatingOrchestrator() {
    const isOpen = useStore.use.isFloatingOrchestratorOpen();
    const position = useStore.use.floatingOrchestratorPosition();
    const history = useStore.use.orchestratorHistory();
    const isLoading = useStore.use.isOrchestratorLoading();
    const orchestratorModel = useStore.use.orchestratorModel();
    const connectedServices = useStore.use.connectedServices();
    const activeModuleId = useStore.use.activeModuleId();
    const activeApp = useStore.use.activeApp();

    const toggleFloatingOrchestrator = useStore.use.actions().toggleFloatingOrchestrator;
    const setFloatingOrchestratorPosition = useStore.use.actions().setFloatingOrchestratorPosition;
    const setOrchestratorModel = useStore.use.actions().setOrchestratorModel;
    const clearOrchestratorHistory = useStore.use.actions().clearOrchestratorHistory;

    const [input, setInput] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [autoMinimize, setAutoMinimize] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [windowSize, setWindowSize] = useState({ width: 320, height: 400 });
    const [showInviteMenu, setShowInviteMenu] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [ollamaModels, setOllamaModels] = useState([]);
    const [enableThinking, setEnableThinking] = useState(false);
    const [thinkingBudget, setThinkingBudget] = useState('medium');
    const [isContextAware, setIsContextAware] = useState(false);

    const historyRef = useRef(null);
    const windowRef = useRef(null);

    // Function to gather context based on current app
    const gatherAppContext = useCallback(async () => {
        let context = '';

        switch (activeApp) {
            case 'planner':
                try {
                    const plannerGraph = useStore.getState().plannerGraph;
                    if (plannerGraph) {
                        context = `I'm currently in the Planner app. Here's the current workflow canvas:
Title: ${plannerGraph.title || 'Untitled Flow'}
Nodes: ${plannerGraph.nodes?.length || 0} blocks
Edges: ${plannerGraph.edges?.length || 0} connections

Workflow structure:
${JSON.stringify(plannerGraph, null, 2)}

I can help you:
- Analyze and improve your workflow design
- Suggest connections between blocks
- Add missing components
- Generate workflow titles
- Convert to executable workflow
`;
                    } else {
                        context = `I'm currently in the Planner app. The canvas is empty. I can help you:
- Start building a workflow from scratch
- Suggest workflow structures for common tasks
- Explain how to connect different components
- Add modules, assistants, tools, and model providers
`;
                    }
                } catch (error) {
                    context = `I'm currently in the Planner app. I can help you design and build workflows.`;
                }
                break;

            case 'imageBooth':
                context = `I'm currently in the Image Booth app. I can help you:
- Generate images using AI models
- Improve prompts for better results
- Suggest creative ideas and concepts
- Explain different image generation techniques
- Work with style transfers and modifications
`;
                break;

            case 'workflows':
                context = `I'm currently in the Workflows app. I can help you:
- Review and edit existing workflows
- Create new workflow templates
- Explain workflow steps and logic
- Optimize workflow performance
- Debug workflow issues
`;
                break;

            case 'archiva':
                context = `I'm currently in the Archiva app (documentation system). I can help you:
- Create and organize documentation
- Generate content based on templates
- Structure information effectively
- Review and improve existing documents
- Search and retrieve information
`;
                break;

            case 'ideaLab':
            default:
                const activeModule = activeModuleId ? useStore.getState().modules[activeModuleId] : null;
                if (activeModule) {
                    context = `I'm currently in the Idea Lab app, focused on the "${activeModule['Module Title']}" module.

Module Details:
- Code: ${activeModule['Module Code']}
- Credits: ${activeModule['Credits']}
- Prerequisites: ${activeModule['Prerequisites'] || 'None'}
- Key Topics: ${activeModule['Key Contents / Topics'] || 'Not specified'}
- Objectives: ${activeModule['Qualification Objectives']?.join(', ') || 'Not specified'}

I can help you:
- Understand this module's concepts
- Work on assignments and projects
- Connect ideas across different topics
- Find relevant resources and tools
`;
                } else {
                    context = `I'm currently in the Idea Lab app. I can help you:
- Explore available modules and learning paths
- Choose the right module for your goals
- Understand prerequisites and requirements
- Plan your learning journey
`;
                }
                break;
        }

        return context;
    }, [activeApp, activeModuleId]);

    // Enhanced send message function with context awareness
    const sendContextualMessage = useCallback(async (message) => {
        let enhancedMessage = message;

        if (isContextAware) {
            const context = await gatherAppContext();
            enhancedMessage = `${context}

User Message: ${message}`;
        }

        sendMessageToOrchestrator(enhancedMessage, { enableThinking, thinkingBudget });
    }, [isContextAware, gatherAppContext, enableThinking, thinkingBudget]);

    // Generate workflow from current application context
    const generateWorkflowFromContext = useCallback(async () => {
        try {
            // Use the new context extraction utility
            const context = extractWorkflowContext();

            // Add to chat history to show user what's happening
            useStore.setState(state => {
                state.orchestratorHistory.push({
                    role: 'user',
                    parts: [{ text: '/generate_workflow' }]
                }, {
                    role: 'assistant',
                    parts: [{ text: '🔄 Generating workflow from current application context...' }]
                });
            });

            // Call the backend to generate workflow
            const response = await fetch('/api/planner/generate-from-context', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ context })
            });

            if (response.ok) {
                const { nodes, edges, title } = await response.json();

                // Set the generated workflow in the planner
                const actions = useStore.getState().actions;
                if (actions?.setPlannerGraph) {
                    actions.setPlannerGraph({ nodes, edges, title: title || 'AI Generated Workflow' });
                }

                // Switch to planner view
                if (actions?.setActiveApp) {
                    actions.setActiveApp('planner');
                }

                // Update chat history with success
                useStore.setState(state => {
                    state.orchestratorHistory.push({
                        role: 'assistant',
                        parts: [{ text: `✅ Generated workflow: "${title || 'AI Generated Workflow'}" with ${nodes.length} nodes and ${edges.length} connections. Switching to Planner view.` }]
                    });
                });
            } else {
                const error = await response.text();
                throw new Error(error);
            }
        } catch (error) {
            console.error('Failed to generate workflow:', error);
            useStore.setState(state => {
                state.orchestratorHistory.push({
                    role: 'assistant',
                    parts: [{ text: `❌ Failed to generate workflow: ${error.message}` }]
                });
            });
        }
    }, []);

    // Function to start a new chat
    const handleNewChat = useCallback(() => {
        if (window.confirm('Start a new chat? This will clear the current conversation.')) {
            clearOrchestratorHistory();
        }
    }, [clearOrchestratorHistory]);

    // Function to invite a module assistant
    const handleInviteAssistant = useCallback(async (moduleCode) => {
        const module = useStore.getState().modules[moduleCode];
        if (!module) return;

        const personality = personalities[moduleCode];
        const inviteMessage = `Please invite the ${personality?.name || moduleCode} assistant to join our conversation. They specialize in ${module['Module Title']} and can help with: ${module['Key Contents / Topics'] || 'module-specific topics'}.`;

        sendContextualMessage(inviteMessage);
        setShowInviteMenu(false);
    }, [sendContextualMessage]);

    useEffect(() => {
        if (historyRef.current && !isMinimized) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history, isLoading, isMinimized]);

    // Auto-minimize after inactivity
    useEffect(() => {
        if (!autoMinimize || isMinimized || isDragging) return;

        const timer = setTimeout(() => {
            setIsMinimized(true);
        }, 30000); // 30 seconds of inactivity

        return () => clearTimeout(timer);
    }, [autoMinimize, isMinimized, isDragging, history, input]); // Reset timer on any activity

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.floating-orchestrator')) {
                setShowInviteMenu(false);
                setShowToolsMenu(false);
                setShowModelSelector(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Get available AI models (reuse logic from OrchestratorChat)
    const getAvailableModels = () => {
        const models = [];

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Handle special commands
        if (input.startsWith('/generate_workflow')) {
            generateWorkflowFromContext();
            setInput('');
            return;
        }

        sendContextualMessage(input);
        setInput('');
    };

    const handleModelSelect = (modelId) => {
        setOrchestratorModel(modelId);
        setShowModelSelector(false);
        useStore.setState(state => {
            const selectedModel = availableModels.find(m => m.id === modelId);
            state.orchestratorHistory.push({
                role: 'system',
                parts: [{ text: `*Switched orchestrator to ${selectedModel.name} model*` }]
            });
        });
    };

    const handleInviteAgent = (moduleCode) => {
        useStore.setState({ activeModuleId: moduleCode });
        setTimeout(() => {
            sendMessageToOrchestrator(`/invite`);
        }, 100);
        setShowInviteMenu(false);
    };

    const handleToolAction = (tool) => {
        if (tool === 'search') {
            setInput('/search ');
        }
        setShowToolsMenu(false);
    };

    const handleMouseDown = (e) => {
        if (e.target.closest('.floating-orchestrator-header-actions') ||
            e.target.closest('.floating-orchestrator-content') ||
            e.target.closest('.resize-handle')) return;

        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleResizeMouseDown = (e) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: windowSize.width,
            height: windowSize.height
        });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;

            // Keep window within viewport bounds
            const maxX = window.innerWidth - windowSize.width;
            const maxY = window.innerHeight - (isMinimized ? 60 : windowSize.height);

            setFloatingOrchestratorPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            });
        } else if (isResizing) {
            const deltaX = e.clientX - resizeStart.x;
            const deltaY = e.clientY - resizeStart.y;

            const newWidth = Math.max(280, Math.min(600, resizeStart.width + deltaX));
            const newHeight = Math.max(250, Math.min(800, resizeStart.height + deltaY));

            setWindowSize({ width: newWidth, height: newHeight });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, dragStart, resizeStart, position, windowSize]);

    // Get all modules for the invite menu
    const allModules = Object.values(modulesBySemester).flat();

    // Get active agents (those that have been invited)
    const activeAgents = history.filter(msg => msg.role === 'agent-task')
        .map(msg => ({
            name: msg.agentName,
            icon: msg.agentIcon
        }))
        .filter((agent, index, self) =>
            index === self.findIndex(a => a.name === agent.name)
        );

    if (!isOpen) return null;

    return (
        <div
            ref={windowRef}
            className={`floating-orchestrator ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''}`}
style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                zIndex: 1000,
                width: isMinimized ? '60px' : `${windowSize.width}px`,
                height: isMinimized ? '60px' : `${windowSize.height}px`,
                transition: isDragging ? 'none' : 'all 0.3s ease',
                cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseDown={handleMouseDown}
        >
            {isMinimized ? (
                <div
                    className="floating-orchestrator-icon"
                    onClick={() => setIsMinimized(false)}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '24px',
                        color: 'var(--color-accent)'
                    }}
                >
                    <span className="icon">psychology</span>
                </div>
            ) : (
                <>
                    <div className="floating-orchestrator-header">
                        <div className="floating-orchestrator-title">
                            <span className="icon">psychology</span>
                            Orchestrator
                        </div>
                        <div className="floating-orchestrator-header-actions">
                            <button
                                onClick={() => setIsContextAware(!isContextAware)}
                                className={`btn-icon ${isContextAware ? 'active' : ''}`}
                                title={`App Awareness: ${isContextAware ? 'ON' : 'OFF'} - ${activeApp} context`}
                            >
                                <span className="icon">{isContextAware ? 'visibility' : 'visibility_off'}</span>
                            </button>
                            <button
                                onClick={handleNewChat}
                                className="btn-icon"
                                title="New Chat"
                            >
                                <span className="icon">add_comment</span>
                            </button>
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="btn-icon"
                                title="Minimize"
                            >
                                <span className="icon">remove</span>
                            </button>
                            <button
                                onClick={toggleFloatingOrchestrator}
                                className="btn-icon"
                                title="Close"
                            >
                                <span className="icon">close</span>
                            </button>
                        </div>
                    </div>

                    <div className="floating-orchestrator-content">
                        <div
                            ref={historyRef}
                            className="floating-orchestrator-history"
                        >
                            {history.slice(-10).map((msg, index) => {
                                if (msg.role === 'agent-task') {
                                    return <AgentTask key={index} message={msg} />;
                                }
                                if (msg.role === 'model') {
                                    return (
<div key={index} className="message model">
                                            <p dangerouslySetInnerHTML={{ __html: msg.parts[0].text.replace(/\n/g, '<br />') }} />
                                        </div>
                                    );
                                }
                                if (msg.role === 'user') {
                                    return (
<div key={index} className="message user">
                                            <p dangerouslySetInnerHTML={{ __html: msg.parts[0].text.replace(/\n/g, '<br />') }} />
                                        </div>
                                    );
                                }
                                return (
<div key={index} className="message system">
                                        <p dangerouslySetInnerHTML={{ __html: msg.parts[0].text.replace(/\n/g, '<br />') }} />
                                    </div>
                                );
                            })}
                            {isLoading && (
                                <div className="message loading" style={{
                                    display: 'flex',
                                    gap: '4px',
                                    padding: '8px'
                                }}>
                                    <div className="dot" style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: 'var(--color-accent)',
                                        animation: 'pulse 1.5s infinite'
                                    }}></div>
                                    <div className="dot" style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: 'var(--color-accent)',
                                        animation: 'pulse 1.5s infinite 0.2s'
                                    }}></div>
                                    <div className="dot" style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: 'var(--color-accent)',
                                        animation: 'pulse 1.5s infinite 0.4s'
                                    }}></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thinking Model Controls */}
                    <div className="floating-orchestrator-controls">
                        <div className="thinking-controls">
                            <label className="thinking-toggle">
                                <input
                                    type="checkbox"
                                    checked={enableThinking}
                                    onChange={(e) => setEnableThinking(e.target.checked)}
                                    disabled={isLoading}
                                />
                                <span className="icon">psychology</span>
                                <span>Thinking Mode</span>
                            </label>
                            {enableThinking && (
                                <select
                                    value={thinkingBudget}
                                    onChange={(e) => setThinkingBudget(e.target.value)}
                                    disabled={isLoading}
                                    className="thinking-budget"
                                    title="Thinking effort level"
                                >
                                    <option value="low">Low effort</option>
                                    <option value="medium">Medium effort</option>
                                    <option value="high">High effort</option>
                                </select>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="input-container">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message orchestrator..."
                                disabled={isLoading}
                            />
                            <div className="input-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteMenu(!showInviteMenu)}
                                    className="btn-invite"
                                    title="Invite Module Assistant"
                                >
                                    <span className="icon">person_add</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="send-btn"
                                >
                                    <span className="icon">send</span>
                                </button>
                            </div>
                        </div>

                        {showInviteMenu && (
                            <div className="invite-menu">
                                <div className="invite-menu-header">Invite Module Assistant</div>
                                <div className="invite-menu-items">
                                    {Object.values(useStore.getState().modules)
                                        .filter(m => personalities[m['Module Code']])
                                        .map(module => (
                                            <button
                                                key={module['Module Code']}
                                                onClick={() => handleInviteAssistant(module['Module Code'])}
                                                className="invite-menu-item"
                                            >
                                                <span className="icon">{personalities[module['Module Code']]?.icon || 'smart_toy'}</span>
                                                <div>
                                                    <div className="assistant-name">{personalities[module['Module Code']]?.name || module['Module Code']}</div>
                                                    <div className="assistant-module">{module['Module Title']}</div>
                                                </div>
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </form>

                    {/* Resize handle */}
                    <div
                        className="resize-handle"
                        onMouseDown={handleResizeMouseDown}
                        title="Resize window"
                    >
                        <div className="corner" />
                    </div>
                </>
            )}
        </div>
    );
}