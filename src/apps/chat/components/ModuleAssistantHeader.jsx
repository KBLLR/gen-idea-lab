/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import useStore from '@store';
import { personalities } from '@shared/lib/assistant/personalities.js';

export default function ModuleAssistantHeader() {
    const activeModuleId = useStore.use.activeModuleId();
    const assistantHistories = useStore.use.assistantHistories();
    const history = activeModuleId ? (assistantHistories[activeModuleId] || []) : [];
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [showSystemPrompt, setShowSystemPrompt] = useState(false);
    const [showAgentsList, setShowAgentsList] = useState(false);
    const assistantModel = useStore.use.assistantModel();
    const setAssistantModel = useStore.use.actions().setAssistantModel;
    const setAssistantSystemPrompt = useStore.use.actions().setAssistantSystemPrompt;
    const assistantSystemPrompts = useStore.use.assistantSystemPrompts();
    const currentSystemPrompt = activeModuleId ? (assistantSystemPrompts[activeModuleId] || '') : '';

    const activePersonality = activeModuleId ? personalities[activeModuleId] : null;
    const hasConversation = history.length > 0;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-button-container') && !event.target.closest('.module-agents-header-actions')) {
                setShowModelMenu(false);
                setShowSystemPrompt(false);
                setShowAgentsList(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNewChat = () => {
        if (!activeModuleId) return;
        if (window.confirm('Start a new chat? This will clear the current conversation.')) {
            useStore.setState(state => {
                state.assistantHistories[activeModuleId] = [];
            });
        }
        setShowModelMenu(false);
        setShowSystemPrompt(false);
        setShowAgentsList(false);
    };

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

    if (!activeModuleId) {
        return (
            <div className="module-agents-header" style={{ justifyContent: 'center', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text-secondary, #999)' }}>
                    <span className="material-icons-round" style={{ fontSize: '24px', opacity: 0.5 }}>person_search</span>
                    <span style={{ fontSize: '16px', fontWeight: 500 }}>Choose Assistant</span>
                </div>
            </div>
        );
    }

    return (
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
    );
}
