
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useRef } from 'react';
import useStore from '../lib/store';
import { sendMessageToOrchestrator } from '../lib/actions';
import { personalities } from '../lib/assistant/personalities';
import { modulesBySemester } from '../lib/modules';

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
    const historyRef = useRef(null);
    const activeModuleId = useStore.use.activeModuleId();

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
                        onClick={() => setShowAIList(!showAIList)}
                        title={`Active AIs (${activeAgents.length})`}
                    >
                        <span className="icon">groups</span>
                        <span className="ai-count">{activeAgents.length}</span>
                    </button>
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
                    placeholder="Type a message..."
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
