
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useRef } from 'react';
import useStore from '../lib/store';
import { sendAssistantMessage, toggleAssistant } from '../lib/actions';
import { personalities } from '../lib/assistant/personalities';
import { getTasksForModule } from '../lib/assistant/tasks';
import { useDraggable } from '../lib/hooks/useDraggable';

export default function Assistant() {
    const assistantHistories = useStore.use.assistantHistories();
    const activeModuleId = useStore.use.activeModuleId();
    const history = assistantHistories[activeModuleId] || [];
    const isLoading = useStore.use.isAssistantLoading();
    const [input, setInput] = useState('');
    const [showTaskMenu, setShowTaskMenu] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const historyRef = useRef(null);
    
    // Add drag functionality
    const { isDragging, position, handleMouseDown } = useDraggable();

    const activePersonality = personalities[activeModuleId] || {};

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        
        sendAssistantMessage(input.trim());
        setInput('');
    };

    const handleTaskSelect = (taskId) => {
        const tasks = getTasksForModule(activeModuleId);
        const task = tasks.common[taskId] || tasks.specialized[taskId];
        if (task) {
            const message = `Please help me with: ${task.name}. ${task.description}`;
            sendAssistantMessage(message);
        }
        setShowTaskMenu(false);
    };

    const handleToolAction = (tool) => {
        if (tool === 'search') {
            setInput('/search ');
            // Focus the input after setting the value
            setTimeout(() => {
                const inputElement = document.querySelector('.assistant-input-form input');
                if (inputElement) {
                    inputElement.focus();
                    inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
                }
            }, 50);
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
            <div 
                className={`assistant-window ${isDragging ? 'dragging' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease'
                }}
            >
                <div 
                    className="assistant-header draggable-header"
                    onMouseDown={handleMouseDown}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    <span className="icon assistant-icon">{activePersonality.icon || 'school'}</span>
                    <div className="assistant-header-text">
                        <h3>{activePersonality.name || 'Assistant'}</h3>
                        <h4>{activePersonality.title || 'Your creative partner'}</h4>
                    </div>
                    <button 
                        className="close-btn" 
                        onClick={toggleAssistant}
                        onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking close
                    >
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
                            <div className="message-content">
                                <p dangerouslySetInnerHTML={{ __html: msg.responseText || msg.content }} />
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="assistant-message model loading">
                            <div className="message-content">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>
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
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setShowTaskMenu(false);
                                setShowToolsMenu(false);
                            }
                        }}
                        placeholder={`Ask ${activePersonality.name || 'Assistant'} for help...`}
                        disabled={isLoading}
                        autoFocus
                        autoComplete="off"
                        spellCheck="true"
                    />
                    <button type="submit" disabled={isLoading || !input.trim()}>
                        <span className="icon">send</span>
                    </button>
                </form>
            </div>
        </div>
    );
}