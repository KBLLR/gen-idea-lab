/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import useStore from '../lib/store';
import { RiArrowRightLine, RiArrowLeftLine, RiPlayLine, RiCheckLine, RiTimeLine, RiLightbulbLine } from 'react-icons/ri';

const WorkflowPanel = ({ moduleId, onWorkflowSelect, onClose }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowHistory] = useStore.use.workflowHistory();
  const [workflows, setWorkflows] = useState([]);

  useEffect(() => {
    // Load workflows for current module
    loadWorkflowsForModule(moduleId);
  }, [moduleId]);

  const loadWorkflowsForModule = async (moduleId) => {
    // This would fetch from your workflows data
    const moduleWorkflows = await fetch(`/api/workflows/${moduleId}`);
    setWorkflows(await moduleWorkflows.json());
  };

  const startWorkflow = (workflow) => {
    onWorkflowSelect(workflow);
    // Track workflow start
    useStore.setState(state => {
      state.workflowHistory[workflow.id] = {
        startedAt: new Date().toISOString(),
        currentStep: 0,
        status: 'in_progress'
      };
    });
  };

  const getWorkflowStatus = (workflowId) => {
    const history = workflowHistory[workflowId];
    if (!history) return 'not_started';
    return history.status;
  };

  const getCompletionPercentage = (workflow) => {
    const history = workflowHistory[workflow.id];
    if (!history) return 0;
    return Math.round((history.currentStep / workflow.steps.length) * 100);
  };

  const WorkflowCard = ({ workflow }) => {
    const status = getWorkflowStatus(workflow.id);
    const completion = getCompletionPercentage(workflow);

    return (
      <div
        className={`workflow-card ${selectedWorkflow?.id === workflow.id ? 'selected' : ''}`}
        onClick={() => setSelectedWorkflow(workflow)}
      >
        <div className="workflow-header">
          <div className="workflow-title">
            <h3>{workflow.title}</h3>
            <div className="workflow-meta">
              <span className={`status-badge ${status}`}>
                {status === 'completed' && <RiCheckLine />}
                {status === 'in_progress' && <RiPlayLine />}
                {status === 'not_started' && <RiLightbulbLine />}
                {status.replace('_', ' ')}
              </span>
              <span className="time-estimate">
                <RiTimeLine />
                {workflow.estimatedTime}
              </span>
            </div>
          </div>

          {completion > 0 && (
            <div className="progress-ring">
              <div className="progress-text">{completion}%</div>
            </div>
          )}
        </div>

        <p className="workflow-description">{workflow.description}</p>

        <div className="workflow-tags">
          {workflow.metadata.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
          {workflow.metadata.tags.length > 3 && (
            <span className="tag more">+{workflow.metadata.tags.length - 3}</span>
          )}
        </div>

        <div className="workflow-steps-preview">
          <span className="steps-count">{workflow.steps.length} steps</span>
          <div className="steps-dots">
            {workflow.steps.slice(0, 5).map((_, index) => (
              <div
                key={index}
                className={`step-dot ${index < (workflowHistory[workflow.id]?.currentStep || 0) ? 'completed' : ''}`}
              />
            ))}
            {workflow.steps.length > 5 && <span>...</span>}
          </div>
        </div>
      </div>
    );
  };

  const WorkflowDetails = ({ workflow }) => {
    if (!workflow) {
      return (
        <div className="workflow-details-empty">
          <RiLightbulbLine size={48} />
          <h3>Select a Workflow</h3>
          <p>Choose a workflow from the left to see detailed steps and guidance.</p>
        </div>
      );
    }

    return (
      <div className="workflow-details">
        <div className="workflow-details-header">
          <h2>{workflow.title}</h2>
          <button
            className="start-workflow-btn primary"
            onClick={() => startWorkflow(workflow)}
          >
            <RiPlayLine />
            Start Workflow
          </button>
        </div>

        <div className="workflow-overview">
          <p className="description">{workflow.description}</p>

          <div className="workflow-info-grid">
            <div className="info-item">
              <label>Duration</label>
              <span>{workflow.estimatedTime}</span>
            </div>
            <div className="info-item">
              <label>Difficulty</label>
              <span className={`difficulty ${workflow.difficulty}`}>
                {workflow.difficulty}
              </span>
            </div>
            <div className="info-item">
              <label>Steps</label>
              <span>{workflow.steps.length}</span>
            </div>
          </div>
        </div>

        <div className="learning-objectives">
          <h4>Learning Objectives</h4>
          <ul>
            {workflow.metadata.learningObjectives.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
        </div>

        <div className="workflow-steps-detail">
          <h4>Workflow Steps</h4>
          {workflow.steps.map((step, index) => (
            <div key={step.id} className="step-detail">
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <h5>{step.title}</h5>
                <p>{step.guidance.explanation}</p>
                <div className="step-type">
                  <span className={`type-badge ${step.type}`}>
                    {step.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="workflow-deliverables">
          <h4>What You'll Create</h4>
          <div className="deliverables-list">
            {workflow.completion.deliverables.map((deliverable, index) => (
              <span key={index} className="deliverable-tag">
                {deliverable.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="workflow-panel">
      <div className="workflow-panel-header">
        <div className="panel-title">
          <h2>Workflows</h2>
          <p>Guided learning sequences for structured progress</p>
        </div>
        <button className="close-panel" onClick={onClose}>
          <RiArrowLeftLine />
        </button>
      </div>

      <div className="workflow-content">
        <div className="workflow-list">
          <div className="workflow-categories">
            <div className="category-section">
              <h3>Recommended for You</h3>
              {workflows.filter(w => w.category === 'recommended').map(workflow => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))}
            </div>

            <div className="category-section">
              <h3>Module Workflows</h3>
              {workflows.filter(w => w.moduleId === moduleId).map(workflow => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))}
            </div>

            <div className="category-section">
              <h3>Cross-Module</h3>
              {workflows.filter(w => w.category === 'interdisciplinary').map(workflow => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))}
            </div>
          </div>
        </div>

        <div className="workflow-details-panel">
          <WorkflowDetails workflow={selectedWorkflow} />
        </div>
      </div>
    </div>
  );
};

export default WorkflowPanel;