/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import useStore from '../lib/store';
import { workflowTemplates, getWorkflowsForModule } from '../lib/workflows';
import { RiPlayLine, RiEditLine, RiFileCopyLine, RiDeleteBinLine, RiAddLine, RiTimeLine, RiCheckLine, RiLightbulbLine, RiArrowRightLine } from 'react-icons/ri';

const WorkflowsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const selectedWorkflow = useStore.use.selectedWorkflow();
  const setSelectedWorkflow = useStore.use.actions().setSelectedWorkflow;
  const workflowHistory = useStore.use.workflowHistory();

  // Get all workflows and organize them
  const customWorkflows = useStore.use.customWorkflows?.() || {};
  const allWorkflows = [...Object.values(workflowTemplates), ...Object.values(customWorkflows)];

  const filteredWorkflows = allWorkflows.filter(workflow => {
    const matchesSearch = workflow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' ||
      workflow.category === categoryFilter ||
      (categoryFilter === 'custom' && workflow.id?.startsWith('custom_'));
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'All Workflows' },
    { id: 'module_assistant', name: 'Module Assistant' },
    { id: 'orchestrator', name: 'Orchestrator' },
    { id: 'custom', name: 'Custom (Planner)' },
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

  return (
    <>
      <h2>Workflows</h2>
      <p className="section-description">Structured guidance for AI assistants</p>

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
          <div className="empty-list-message">
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
    </>
  );
};

export default WorkflowsList;