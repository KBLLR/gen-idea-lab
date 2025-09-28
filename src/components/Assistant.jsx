
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useRef } from 'react';
import useStore from '../lib/store';
import { sendAssistantMessage, toggleAssistant } from '../lib/actions';
import { personalities } from '../lib/assistant/personalities';
import { getTasksForModule } from '../lib/assistant/tasks';

export default function Assistant() {
    const assistantHistories = useStore.use.assistantHistories();
    const activeModuleId = useStore.use.activeModuleId();
    const history = assistantHistories[activeModuleId] || [];
    const isLoading = useStore.use.isAssistantLoading();
    const [input, setInput] = useState('');
    const [showTaskMenu, setShowTaskMenu] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const historyRef = useRef(null);

    const activePersonality = personalities[activeModuleId] || {};

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    const handleSubmit = (e) => {
        e.preventDefault();
        sendAssistantMessage(input);
        setInput('');
    };

    const handleTaskSelect = (taskId) => {
        const tasks = getTasksForModule(activeModuleId);
        const task = tasks.common[taskId] || tasks.specialized[taskId];
        if (task) {
            sendAssistantMessage(`Please help me with: ${task.name}. ${task.description}`);
        }
        setShowTaskMenu(false);
    };

    const handleToolAction = (tool) => {
        if (tool === 'search') {
            setInput('/search ');
        }
        setShowToolsMenu(false);
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.assistant-actions-container')) {
                setShowTaskMenu(false);
                setShowToolsMenu(false);
            }
        };

        if (showTaskMenu || showToolsMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showTaskMenu, showToolsMenu]);

    return (
        <div className="assistant-overlay" onClick={toggleAssistant}>
            <div className="assistant-window" onClick={(e) => e.stopPropagation()}>
                <div className="assistant-header">
                    <span className="icon assistant-icon">{activePersonality.icon || 'school'}</span>
                    <div className="assistant-header-text">
                        <h3>{activePersonality.name || 'Assistant'}</h3>
                        <h4>{activePersonality.title || 'Your creative partner'}</h4>
                    </div>
                    <button className="close-btn" onClick={toggleAssistant}>
                        <span className="icon">close</span>
                    </button>
                </div>
                <div className="assistant-history" ref={historyRef}>
                    {history.map((msg, index) => (
                        <div key={index} className={`assistant-message ${msg.role}`}>
                            {msg.role === 'model' && (
                                <div className="message-header">
                                    <span className="icon ai-icon">{activePersonality.icon || 'school'}</span>
                                    <span className="ai-name">{activePersonality.name || 'Assistant'}</span>
                                </div>
                            )}
                            <p dangerouslySetInnerHTML={{ __html: msg.responseText || msg.content }} />
                        </div>
                    ))}
                    {isLoading && (
                        <div className="assistant-message model loading">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                        </div>
                    )}
                </div>
                <form className="assistant-input-form" onSubmit={handleSubmit}>
                    <div className="assistant-actions-container">
                        <div className="assistant-tasks-container">
                            <button
                                type="button"
                                className="action-btn tasks-btn"
                                onClick={() => setShowTaskMenu(!showTaskMenu)}
                                title="Available Tasks"
                            >
                                <span className="icon">assignment</span>
                            </button>
                            {showTaskMenu && (
                            <div className="assistant-tasks-dropdown">
                                <div className="tasks-dropdown-header">
                                    <span className="icon">{activePersonality.icon}</span>
                                    <div>
                                        <strong>{activePersonality.name} Tasks</strong>
                                        <p>Choose a specific task to work on</p>
                                    </div>
                                </div>

                                {(() => {
                                    const tasks = getTasksForModule(activeModuleId);
                                    return (
                                        <>
                                            <div className="task-section">
                                                <h4>Common Tasks</h4>
                                                {Object.entries(tasks.common).map(([taskId, task]) => (
                                                    <button
                                                        key={taskId}
                                                        type="button"
                                                        className="task-item"
                                                        onClick={() => handleTaskSelect(taskId)}
                                                    >
                                                        <span className="icon">assistant</span>
                                                        <div>
                                                            <strong>{task.name}</strong>
                                                            <p>{task.description}</p>
                                                            <span className="task-time">{task.estimatedTime}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            {Object.keys(tasks.specialized).length > 0 && (
                                                <div className="task-section">
                                                    <h4>Specialized Tasks</h4>
                                                    {Object.entries(tasks.specialized).map(([taskId, task]) => (
                                                        <button
                                                            key={taskId}
                                                            type="button"
                                                            className="task-item specialized"
                                                            onClick={() => handleTaskSelect(taskId)}
                                                        >
                                                            <span className="icon">stars</span>
                                                            <div>
                                                                <strong>{task.name}</strong>
                                                                <p>{task.description}</p>
                                                                <span className="task-time">{task.estimatedTime}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                            )}
                        </div>

                        <div className="assistant-tools-container">
                            <button
                                type="button"
                                className="action-btn tools-btn"
                                onClick={() => setShowToolsMenu(!showToolsMenu)}
                                title="Tools"
                            >
                                <span className="icon">build</span>
                            </button>
                            {showToolsMenu && (
                                <div className="assistant-tools-dropdown">
                                    <div className="tools-dropdown-header">
                                        <strong>Tools</strong>
                                        <p>Available tools for assistance</p>
                                    </div>
                                    <div className="tool-section">
                                        <button
                                            type="button"
                                            className="tool-item"
                                            onClick={() => handleToolAction('search')}
                                        >
                                            <span className="icon">search</span>
                                            <div>
                                                <strong>Web Search</strong>
                                                <p>Search the web for information</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Ask ${activePersonality.name} for help...`}
                        disabled={isLoading}
                        autoFocus
                    />
                    <button type="submit" disabled={isLoading || !input.trim()}>
                        <span className="icon">send</span>
                    </button>
                </form>
            </div>
        </div>
    );
}