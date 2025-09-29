/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import useStore from '../lib/store';
import { sendMessageToOrchestrator } from '../lib/actions';
import { personalities } from '../lib/assistant/personalities';
import { modulesBySemester } from '../lib/modules';
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

    const toggleFloatingOrchestrator = useStore.use.actions().toggleFloatingOrchestrator;
    const setFloatingOrchestratorPosition = useStore.use.actions().setFloatingOrchestratorPosition;
    const setOrchestratorModel = useStore.use.actions().setOrchestratorModel;

    const [input, setInput] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [windowSize, setWindowSize] = useState({ width: 320, height: 400 });
    const [showInviteMenu, setShowInviteMenu] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [ollamaModels, setOllamaModels] = useState([]);

    const historyRef = useRef(null);
    const windowRef = useRef(null);

    useEffect(() => {
        if (historyRef.current && !isMinimized) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history, isLoading, isMinimized]);

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
        sendMessageToOrchestrator(input);
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

                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Message orchestrator..."
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="send-btn"
                        >
                            <span className="icon">send</span>
                        </button>
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