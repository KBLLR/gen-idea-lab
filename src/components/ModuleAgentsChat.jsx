/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useRef } from 'react';
import useStore from '../lib/store';
import { sendAssistantMessage } from '../lib/actions';
import { personalities } from '../lib/assistant/personalities';
import { modulesBySemester } from '../lib/modules';

const AgentCollaborationMessage = ({ message }) => (
    <div className="agent-collaboration-message">
        <div className="agent-collab-header">
            <span className="icon">{message.fromAgentIcon}</span>
            <h4>{message.fromAgentName} → {message.toAgentName}</h4>
        </div>
        <div className="agent-collab-body">
            <p dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }} />
        </div>
    </div>
);

export default function ModuleAgentsChat() {
    const activeModuleId = useStore.use.activeModuleId();
    const assistantHistories = useStore.use.assistantHistories();
    const history = activeModuleId ? (assistantHistories[activeModuleId] || []) : [];
    const isLoading = useStore.use.isAssistantLoading();
    const [input, setInput] = useState('');
    const [showInviteMenu, setShowInviteMenu] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [showAgentsList, setShowAgentsList] = useState(false);
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [showSystemPrompt, setShowSystemPrompt] = useState(false);
    const assistantModel = useStore.use.assistantModel();
    const setAssistantModel = useStore.use.actions().setAssistantModel;
    const setAssistantSystemPrompt = useStore.use.actions().setAssistantSystemPrompt;
    const assistantSystemPrompts = useStore.use.assistantSystemPrompts();
    const currentSystemPrompt = activeModuleId ? (assistantSystemPrompts[activeModuleId] || '') : '';
    const historyRef = useRef(null);

    const activePersonality = activeModuleId ? personalities[activeModuleId] : null;
    const hasConversation = history.length > 0;

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-button-container') && !event.target.closest('.module-agents-header-actions')) {
                setShowInviteMenu(false);
                setShowToolsMenu(false);
                setShowAgentsList(false);
                setShowModelMenu(false);
                setShowSystemPrompt(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || !activeModuleId) return;

        sendAssistantMessage(input.trim());
        setInput('');
    };

    const handleInviteAgent = (moduleCode) => {
        if (!activePersonality) return;

        const invitedPersonality = personalities[moduleCode];
        const inviteMessage = `@${activePersonality.name} would like to collaborate with @${invitedPersonality.name}. ${invitedPersonality.name}, please join this conversation and share your expertise on ${useStore.getState().modules[moduleCode]?.['Module Title'] || moduleCode}.`;

        // Send message as current agent
        sendAssistantMessage(inviteMessage);
        setShowInviteMenu(false);
    };

    const handleToolAction = (tool) => {
        if (tool === 'search') {
            setInput('/search ');
        }
        setShowToolsMenu(false);
    };

    const handleNewChat = () => {
        if (!activeModuleId) return;
        if (window.confirm('Start a new chat? This will clear the current conversation.')) {
            useStore.setState(state => {
                state.assistantHistories[activeModuleId] = [];
            });
        }
        setShowInviteMenu(false);
        setShowToolsMenu(false);
        setShowAgentsList(false);
    };

    // Get all modules for the invite menu
    const allModules = Object.values(modulesBySemester).flat();
    const connectedServices = useStore.use.connectedServices();
    const dynamicModels = () => {
        const models = ['gemini-2.5-flash','gemini-2.0-flash-exp'];
        if (connectedServices?.ollama?.connected) {
            models.push('ollama:llama3.1:8b-instruct-q5_K_M','ollama:phi3.5');
        }
        if (connectedServices?.openai?.connected) {
            models.push('gpt-4o-mini');
        }
        if (connectedServices?.claude?.connected) {
            models.push('claude-3-5-sonnet-20240620');
        }
        return models;
    };

    // Get active agents from conversation
    const activeAgents = history
        .filter(msg => msg.role === 'model')
        .map(() => activePersonality)
        .filter((agent, index, self) =>
            agent && index === self.findIndex(a => a?.name === agent.name)
        );

    const placeholderText = activeModuleId
        ? `Message ${activePersonality?.name || 'assistant'}...`
        : 'Select a module to chat with its assistant';

    if (!activeModuleId) {
        return (
            <div className="module-agents-chat-container">
                <div className="module-agents-empty">
                    <span className="icon" style={{ fontSize: '48px', opacity: 0.3 }}>chat_bubble</span>
                    <h3>Module Agents Chat</h3>
                    <p>Select a module from the left to chat with its assistant</p>
                    <p className="hint">Module assistants can collaborate and invite each other to help with interdisciplinary topics</p>
                </div>
            </div>
        );
    }

    return (
        <div className="module-agents-chat-container">
            <div className="module-agents-header">
                <div className="module-agents-header-info">
                    <div className="module-agents-title">
                        <span className="icon module-agent-icon">{activePersonality?.icon || 'smart_toy'}</span>
                        <h2>{activePersonality?.name || 'Module Assistant'}</h2>
                    </div>
                    <p className="module-agents-subtitle">{activePersonality?.title || 'Module Expert'}</p>
                </div>
                <div className="module-agents-header-actions">
                    {/* Model selector */}
                    <div className="action-button-container">
                        <button
                          className="ai-list-btn"
                          onClick={() => setShowModelMenu(!showModelMenu)}
                          title={`Model: ${assistantModel}`}
                          type="button"
                        >
                          <span className="icon">tune</span>
                          <span className="ai-count" style={{ minWidth: 0 }}>{assistantModel.split(':')[0]}</span>
                        </button>
                        {showModelMenu && (
                          <div className="ai-list-dropdown">
                            <div className="dropdown-header">Assistant Model</div>
                            {dynamicModels().map((m) => (
                              <button key={m} className="dropdown-item" type="button" onClick={() => { setAssistantModel(m); setShowModelMenu(false); }}>
                                {m}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* System prompt editor */}
                    <div className="action-button-container">
                      <button
                        className="ai-list-btn"
                        onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                        title="Edit system prompt"
                        type="button"
                      >
                        <span className="icon">notes</span>
                        <span>System</span>
                      </button>
                      {showSystemPrompt && (
                        <div className="ai-list-dropdown" style={{ width: 360 }}>
                          <div className="dropdown-header">System Prompt (Module)</div>
                          <textarea
                            defaultValue={currentSystemPrompt}
                            onBlur={(e) => { if (activeModuleId) setAssistantSystemPrompt(activeModuleId, e.target.value); }}
                            placeholder="Override the module assistant's system prompt here"
                            style={{ width: '100%', minHeight: 120 }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                            <button type="button" className="action-btn" onClick={() => setShowSystemPrompt(false)} title="Close"><span className="icon">close</span></button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                        className="ai-list-btn"
                        onClick={handleNewChat}
                        title="New Chat Session"
                        disabled={!hasConversation}
                    >
                        <span className="icon">add</span>
                        <span>New</span>
                    </button>
                    <button
                        className="ai-list-btn"
                        onClick={() => {
                          const title = window.prompt('Save chat title:', activePersonality?.name ? `${activePersonality.name} – ${new Date().toLocaleString()}` : `Chat ${new Date().toLocaleString()}`);
                          if (title !== null) useStore.getState().actions.saveAssistantChat(title);
                        }}
                        title="Save current chat"
                        type="button"
                    >
                        <span className="icon">save</span>
                        <span>Save</span>
                    </button>
                    <button
                        className="ai-list-btn"
                        onClick={() => setShowAgentsList(!showAgentsList)}
                        title={`Collaborating Agents (${activeAgents.length})`}
                    >
                        <span className="icon">groups</span>
                        <span className="ai-count">{activeAgents.length}</span>
                    </button>

                    {showAgentsList && (
                        <div className="ai-list-dropdown">
                            <div className="dropdown-header">Collaborating Agents</div>
                            {activeAgents.length === 0 ? (
                                <div className="dropdown-empty">No other agents invited yet</div>
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
                        <button type="button" className="action-btn" title="Module Overview" onClick={() => sendAssistantMessage("Can you give me a comprehensive overview of this module, its learning objectives, and how it fits into my overall curriculum?")}>
                            <span className="icon">info</span>
                            <span>Overview</span>
                        </button>
                        <button type="button" className="action-btn" title="Study Plan" onClick={() => sendAssistantMessage("Help me create a study plan for this module. What are the key topics I should focus on?")}>
                            <span className="icon">calendar_today</span>
                            <span>Study Plan</span>
                        </button>
                        <button type="button" className="action-btn" title="Practice Questions" onClick={() => sendAssistantMessage("Generate some practice questions to test my understanding of the key concepts in this module.")}>
                            <span className="icon">quiz</span>
                            <span>Practice</span>
                        </button>
                        <button type="button" className="action-btn" title="Search Resources" onClick={() => setInput('/search ')}>
                            <span className="icon">search</span>
                            <span>Search</span>
                        </button>
                    </div>
                )}
                {history.map((msg, index) => {
                    if (msg.role === 'agent-collaboration') {
                        return <AgentCollaborationMessage key={index} message={msg} />;
                    }
                    if (msg.role === 'model') {
                        // Use agent info if available (multi-agent conversation)
                        const agentIcon = msg.agentIcon || activePersonality?.icon || 'smart_toy';
                        const agentName = msg.agentName || activePersonality?.name || 'Assistant';
                        const agentId = msg.agentId || activeModuleId;
                        const isMultiAgent = msg.agentId && msg.agentId !== activeModuleId;

                        return (
                            <div key={index} className={`assistant-message ${msg.role} ${isMultiAgent ? 'invited-agent' : ''}`}>
                                <div className="message-header">
                                    <span className="icon ai-icon">{agentIcon}</span>
                                    <span className="ai-name">{agentName}</span>
                                    {isMultiAgent && <span className="agent-badge">Invited</span>}
                                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                                        <span className="tools-badge" title={`Used: ${msg.toolsUsed.join(', ')}`}>
                                            <span className="icon">build</span>
                                            {msg.toolsUsed.length}
                                        </span>
                                    )}
                                </div>
                                <p dangerouslySetInnerHTML={{ __html: (msg.responseText || msg.content || msg.parts?.[0]?.text || '').replace(/\n/g, '<br />') }} />
                            </div>
                        )
                    }
                    return (
                        <div key={index} className={`assistant-message ${msg.role}`}>
                            <p dangerouslySetInnerHTML={{ __html: (msg.responseText || msg.content || msg.parts?.[0]?.text || '').replace(/\n/g, '<br />') }} />
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
                            title="Invite Another Module Assistant"
                        >
                            <span className="icon">person_add</span>
                        </button>
                        {showInviteMenu && (
                            <div className="dropdown-menu invite-menu">
                                <div className="dropdown-header">Invite Module Assistant</div>
                                <p className="dropdown-hint">Collaborate with experts from other modules</p>
                                {allModules
                                    .filter(module => module['Module Code'] !== activeModuleId)
                                    .map(module => {
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
                    disabled={isLoading || !activeModuleId}
                    autoFocus
                />
                <button type="submit" disabled={isLoading || !input.trim() || !activeModuleId}>
                    <span className="icon">send</span>
                </button>
            </form>
        </div>
    );
}
