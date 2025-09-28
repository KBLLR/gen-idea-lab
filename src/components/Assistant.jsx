
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useRef } from 'react';
import useStore from '../lib/store';
import { sendAssistantMessage, toggleAssistant } from '../lib/actions';
import { personalities } from '../lib/assistant/personalities';

export default function Assistant() {
    const assistantHistories = useStore.use.assistantHistories();
    const activeModuleId = useStore.use.activeModuleId();
    const history = assistantHistories[activeModuleId] || [];
    const isLoading = useStore.use.isAssistantLoading();
    const [input, setInput] = useState('');
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
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Ask ${activePersonality.name} for project ideas...`}
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