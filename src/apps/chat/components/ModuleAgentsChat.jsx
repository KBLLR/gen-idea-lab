/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useRef } from 'react';
import AppHomeBlock from '@components/ui/organisms/AppHomeBlock.jsx';
import { appHomeContent } from '@components/ui/organisms/appHomeContent.js';
import { useDroppable } from '@dnd-kit/core';
import useStore from '@store';
import { sendAssistantMessage } from '@shared/lib/actions/assistantActions.js';
import { personalities } from '@shared/lib/assistant/personalities.js';
import { modulesBySemester } from '@shared/lib/modules.js';

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
    const activeChatId = useStore.use.activeChatId();
    const isLoading = useStore.use.isAssistantLoading();

    // Filter history by active chat ID
    const allHistory = activeModuleId ? (assistantHistories[activeModuleId] || []) : [];
    const history = activeChatId
        ? allHistory.filter(msg => msg.chatId === activeChatId)
        : allHistory;
    const [input, setInput] = useState('');
    const [showInviteMenu, setShowInviteMenu] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const historyRef = useRef(null);

    const activePersonality = activeModuleId ? personalities[activeModuleId] : null;
    const hasConversation = history.length > 0;

    // Make chat history droppable for assistant avatars
    const { setNodeRef, isOver } = useDroppable({
        id: 'chat-drop-zone',
        data: {
            accepts: 'assistant',
        },
    });

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-button-container')) {
                setShowInviteMenu(false);
                setShowToolsMenu(false);
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

    // Get all modules for the invite menu
    const allModules = Object.values(modulesBySemester).flat();

    const placeholderText = activeModuleId
        ? `Message ${activePersonality?.name || 'assistant'}...`
        : 'Select a module to chat with its assistant';

    if (!activeModuleId) {
        return (
            <div className="module-agents-chat-container">
                {(() => { const c = appHomeContent.chat; return (
                  <AppHomeBlock icon={c.icon} subtitle={c.subtitle} title={c.title} description={c.description} tips={c.tips} />
                ); })()}
            </div>
        );
    }

    return (
        <div className="module-agents-chat-container">
            <div
                className={`assistant-history ${isOver ? 'drop-zone-active' : ''}`}
                ref={(node) => {
                    historyRef.current = node;
                    setNodeRef(node);
                }}
            >
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
