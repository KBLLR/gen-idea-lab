/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import useStore from '../lib/store';
import { RiPlayLine, RiEditLine, RiFileCopyLine, RiDeleteBinLine, RiAddLine, RiTimeLine, RiCheckLine, RiLightbulbLine, RiArrowRightLine } from 'react-icons/ri';

const WorkflowEditor = () => {
  const [editMode, setEditMode] = useState(false);
  const selectedWorkflow = useStore.use.selectedWorkflow();

  if (!selectedWorkflow) {
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

  const workflow = selectedWorkflow;

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

export default WorkflowEditor;