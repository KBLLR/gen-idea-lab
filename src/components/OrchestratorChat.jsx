
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useRef } from 'react';
import useStore from '../lib/store';
import { sendMessageToOrchestrator } from '../lib/actions';
import { personalities } from '../lib/assistant/personalities';
import WorkflowPanel from './WorkflowPanel';
import { RiArrowRightLine, RiPlayLine } from 'react-icons/ri';

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
    const [showWorkflows, setShowWorkflows] = useState(false);
    const [activeWorkflow, setActiveWorkflow] = useState(null);
    const historyRef = useRef(null);
    const activeModuleId = useStore.use.activeModuleId();

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessageToOrchestrator(input);
        setInput('');
    };

    const handleWorkflowSelect = (workflow) => {
        setActiveWorkflow(workflow);
        setShowWorkflows(false);
        // Start workflow by sending first prompt to chat
        sendMessageToOrchestrator(`Starting workflow: ${workflow.title}. ${workflow.steps[0].promptChain[0].prompt}`);
    };

    const placeholderText = activeModuleId
      ? `Message or try /invite @${personalities[activeModuleId]?.name || 'Agent'}`
      : 'Select a module to begin...';

    if (showWorkflows) {
        return (
            <div className="orchestrator-chat-container workflow-mode">
                <WorkflowPanel
                    moduleId={activeModuleId}
                    onWorkflowSelect={handleWorkflowSelect}
                    onClose={() => setShowWorkflows(false)}
                />
            </div>
        );
    }

    return (
        <div className="orchestrator-chat-container">
            <div className="chat-header">
                <div className="chat-title">
                    <h3>Orchestrator Chat</h3>
                    {activeWorkflow && (
                        <div className="active-workflow-indicator">
                            <RiPlayLine />
                            <span>{activeWorkflow.title}</span>
                            <button onClick={() => setActiveWorkflow(null)} className="stop-workflow">
                                Stop
                            </button>
                        </div>
                    )}
                </div>
                <div className="chat-actions">
                    <button
                        className="workflow-toggle"
                        onClick={() => setShowWorkflows(true)}
                        disabled={!activeModuleId}
                        title="Start a guided workflow"
                    >
                        <RiArrowRightLine />
                        Workflows
                    </button>
                </div>
            </div>

            <div className="assistant-history" ref={historyRef}>
                {history.map((msg, index) => {
                    if (msg.role === 'agent-task') {
                        return <AgentTask key={index} message={msg} />;
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
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholderText}
                    disabled={isLoading || !activeModuleId}
                    autoFocus
                />
                <button type="submit" disabled={isLoading || !input.trim()}>
                    <span className="icon">send</span>
                </button>
            </form>
        </div>
    );
}
