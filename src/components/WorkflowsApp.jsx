/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import useStore from '../lib/store';
import { workflowTemplates, getWorkflowsForModule } from '../lib/workflows';
import { RiPlayLine, RiEditLine, RiFileCopyLine, RiDeleteBinLine, RiAddLine, RiTimeLine, RiCheckLine, RiLightbulbLine, RiArrowRightLine } from 'react-icons/ri';

const WorkflowsApp = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const workflowHistory = useStore.use.workflowHistory();

  // Get all workflows and organize them
  const allWorkflows = Object.values(workflowTemplates);

  const filteredWorkflows = allWorkflows.filter(workflow => {
    const matchesSearch = workflow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || workflow.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'All Workflows' },
    { id: 'module_assistant', name: 'Module Assistant' },
    { id: 'orchestrator', name: 'Orchestrator' }
  ];

  const getWorkflowStatus = (workflowId) => {
    const history = workflowHistory[workflowId];
    if (!history) return 'not_started';
    return history.status || 'not_started';
  };

  const getCompletionPercentage = (workflow) => {
    const history = workflowHistory[workflow.id];
    if (!history || !workflow.steps.length) return 0;
    return Math.round((history.currentStep / workflow.steps.length) * 100);
  };

  const WorkflowCard = ({ workflow }) => {
    const status = getWorkflowStatus(workflow.id);
    const completion = getCompletionPercentage(workflow);
    const isSelected = selectedWorkflow?.id === workflow.id;

    return (
      <div
        className={`workflow-card ${isSelected ? 'selected' : ''} ${status}`}
        onClick={() => setSelectedWorkflow(workflow)}
      >
        <div className="workflow-card-header">
          <div className="workflow-meta">
            <div className="workflow-title">
              <h3>{workflow.title}</h3>
              <span className="category-badge">{workflow.category?.replace('_', ' ')}</span>
            </div>

            <div className="workflow-status">
              <span className={`status-indicator ${status}`}>
                {status === 'completed' && <RiCheckLine />}
                {status === 'in_progress' && <RiPlayLine />}
                {status === 'not_started' && <RiLightbulbLine />}
              </span>

              {completion > 0 && (
                <div className="progress-circle">
                  <span className="progress-text">{completion}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="workflow-info">
            <span className="time-estimate">
              <RiTimeLine />
              {workflow.estimatedTime}
            </span>
            <span className="steps-count">
              {workflow.steps.length} steps
            </span>
            <span className={`difficulty ${workflow.difficulty}`}>
              {workflow.difficulty}
            </span>
          </div>
        </div>

        <p className="workflow-description">{workflow.description}</p>

        <div className="workflow-tags">
          {workflow.metadata?.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
          {(workflow.metadata?.tags?.length || 0) > 3 && (
            <span className="tag more">+{workflow.metadata.tags.length - 3}</span>
          )}
        </div>
      </div>
    );
  };

  const WorkflowEditor = ({ workflow }) => {
    if (!workflow) {
      return (
        <div className="workflow-editor-empty">
          <div className="empty-state">
            <RiLightbulbLine size={64} />
            <h2>Select a Workflow</h2>
            <p>Choose a workflow from the left panel to view and edit its instructions for AI assistants.</p>
            <button className="create-workflow-btn primary">
              <RiAddLine />
              Create New Workflow
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="workflow-editor">
        <div className="workflow-editor-header">
          <div className="workflow-title-section">
            <h1>{workflow.title}</h1>
            <p className="workflow-subtitle">{workflow.description}</p>
          </div>

          <div className="workflow-actions">
            <button
              className={`edit-btn ${editMode ? 'active' : ''}`}
              onClick={() => setEditMode(!editMode)}
            >
              <RiEditLine />
              {editMode ? 'Save' : 'Edit'}
            </button>
            <button className="copy-btn">
              <RiFileCopyLine />
              Duplicate
            </button>
            <button className="use-workflow-btn primary">
              <RiArrowRightLine />
              Use in Chat
            </button>
          </div>
        </div>

        <div className="workflow-metadata">
          <div className="metadata-grid">
            <div className="metadata-item">
              <label>Category</label>
              <span className="category-value">{workflow.category?.replace('_', ' ')}</span>
            </div>
            <div className="metadata-item">
              <label>Difficulty</label>
              <span className={`difficulty-value ${workflow.difficulty}`}>{workflow.difficulty}</span>
            </div>
            <div className="metadata-item">
              <label>Duration</label>
              <span className="duration-value">{workflow.estimatedTime}</span>
            </div>
            <div className="metadata-item">
              <label>Steps</label>
              <span className="steps-value">{workflow.steps.length}</span>
            </div>
          </div>

          {workflow.metadata?.learningObjectives && (
            <div className="learning-objectives">
              <h4>Learning Objectives</h4>
              <ul>
                {workflow.metadata.learningObjectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="workflow-steps">
          <h3>Assistant Instructions</h3>
          <p className="instructions-description">
            These are the step-by-step instructions that guide AI assistants on how to help users through this workflow systematically.
          </p>

          {workflow.steps.map((step, index) => (
            <div key={step.id} className="workflow-step">
              <div className="step-header">
                <div className="step-number">{index + 1}</div>
                <div className="step-title">
                  <h4>{step.title}</h4>
                  <span className={`step-type-badge ${step.type}`}>
                    {step.type.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="step-content">
                <div className="step-guidance">
                  <h5>Assistant Guidance</h5>
                  <p>{step.guidance?.explanation}</p>

                  {step.guidance?.tips && (
                    <div className="guidance-section">
                      <h6>Tips for Assistant</h6>
                      <ul>
                        {step.guidance.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {step.guidance?.frameworks && (
                    <div className="guidance-section">
                      <h6>Frameworks to Reference</h6>
                      <ul>
                        {step.guidance.frameworks.map((framework, i) => (
                          <li key={i}>{framework}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {step.promptChain && (
                  <div className="step-prompts">
                    <h5>Prompt Sequence</h5>
                    {step.promptChain.map((prompt, i) => (
                      <div key={prompt.id} className="prompt-item">
                        <div className="prompt-meta">
                          <span className="prompt-order">#{i + 1}</span>
                          {prompt.waitForUser && <span className="wait-indicator">Wait for user</span>}
                          {prompt.dependsOn && <span className="dependency">Depends on: {prompt.dependsOn}</span>}
                        </div>
                        <div className="prompt-text">
                          {editMode ? (
                            <textarea
                              defaultValue={prompt.prompt}
                              className="prompt-editor"
                              rows={3}
                            />
                          ) : (
                            <p>"{prompt.prompt}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {step.prompt && !step.promptChain && (
                  <div className="step-prompts">
                    <h5>Assistant Prompt</h5>
                    <div className="prompt-item">
                      <div className="prompt-text">
                        {editMode ? (
                          <textarea
                            defaultValue={step.prompt.user || step.prompt}
                            className="prompt-editor"
                            rows={4}
                          />
                        ) : (
                          <p>"{step.prompt.user || step.prompt}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {step.guidance?.resources && (
                  <div className="step-resources">
                    <h5>Suggested Resources</h5>
                    <div className="resources-list">
                      {step.guidance.resources.map((resource, i) => (
                        <div key={i} className="resource-item">
                          <span className={`resource-type ${resource.type}`}>
                            {resource.type}
                          </span>
                          <span className="resource-title">{resource.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {workflow.completion && (
          <div className="workflow-completion">
            <h3>Completion & Outcomes</h3>

            {workflow.completion.deliverables && (
              <div className="deliverables-section">
                <h4>Expected Deliverables</h4>
                <div className="deliverables-list">
                  {workflow.completion.deliverables.map((deliverable, index) => (
                    <span key={index} className="deliverable-tag">
                      {deliverable.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {workflow.completion.reflection_prompts && (
              <div className="reflection-section">
                <h4>Reflection Questions</h4>
                <ul>
                  {workflow.completion.reflection_prompts.map((prompt, index) => (
                    <li key={index}>{prompt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="workflows-app">
      {/* Left Column - Workflow List */}
      <div className="workflows-sidebar">
        <div className="workflows-header">
          <h2>Workflows</h2>
          <p>Structured guidance for AI assistants</p>
        </div>

        <div className="workflows-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-filter ${categoryFilter === category.id ? 'active' : ''}`}
                onClick={() => setCategoryFilter(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="workflows-list">
          {filteredWorkflows.length === 0 ? (
            <div className="no-workflows">
              <p>No workflows found matching your criteria.</p>
            </div>
          ) : (
            filteredWorkflows.map(workflow => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))
          )}
        </div>

        <div className="workflows-actions">
          <button className="create-new-btn primary">
            <RiAddLine />
            Create New Workflow
          </button>
        </div>
      </div>

      {/* Right Column - Workflow Editor */}
      <div className="workflows-main">
        <WorkflowEditor workflow={selectedWorkflow} />
      </div>
    </div>
  );
};

export default WorkflowsApp;