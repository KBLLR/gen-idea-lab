/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

export default function NodeConfigModal({ node, isOpen, onSave, onClose }) {
  const [config, setConfig] = useState({
    label: '',
    description: '',
    variables: {},
    config: {},
    connectorType: 'none', // 'none', 'loop', 'trigger'
    loopCondition: '',
    triggerCondition: '',
    maxIterations: 10
  });

  useEffect(() => {
    if (node) {
      setConfig({
        label: node.data?.label || '',
        description: node.data?.description || '',
        variables: node.data?.variables || {},
        config: node.data?.config || {},
        connectorType: node.data?.connectorType || 'none',
        loopCondition: node.data?.loopCondition || '',
        triggerCondition: node.data?.triggerCondition || '',
        maxIterations: node.data?.maxIterations || 10
      });
    }
  }, [node]);

  const handleSave = () => {
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        ...config
      }
    };
    onSave(updatedNode);
    onClose();
  };

  const handleVariableAdd = () => {
    const key = prompt('Variable name:');
    if (key && !config.variables[key]) {
      setConfig(prev => ({
        ...prev,
        variables: {
          ...prev.variables,
          [key]: ''
        }
      }));
    }
  };

  const handleVariableChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [key]: value
      }
    }));
  };

  const handleVariableDelete = (key) => {
    setConfig(prev => {
      const newVars = { ...prev.variables };
      delete newVars[key];
      return {
        ...prev,
        variables: newVars
      };
    });
  };

  const handleConfigAdd = () => {
    const key = prompt('Configuration key:');
    if (key && !config.config[key]) {
      setConfig(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [key]: ''
        }
      }));
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  const handleConfigDelete = (key) => {
    setConfig(prev => {
      const newConfig = { ...prev.config };
      delete newConfig[key];
      return {
        ...prev,
        config: newConfig
      };
    });
  };

  if (!isOpen || !node) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="config-modal" onClick={e => e.stopPropagation()}>
        <div className="config-header">
          <h3>Configure Node: {node.data?.label || 'Untitled'}</h3>
          <button className="close-btn" onClick={onClose}>
            <span className="icon">close</span>
          </button>
        </div>

        <div className="config-body">
          {/* Basic Properties */}
          <div className="config-section">
            <h4>Basic Properties</h4>
            <div className="form-group">
              <label>Label</label>
              <input
                type="text"
                value={config.label}
                onChange={e => setConfig(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Node label"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={config.description}
                onChange={e => setConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Node description"
                rows={3}
              />
            </div>
          </div>

          {/* Connector Semantics */}
          <div className="config-section">
            <h4>Connector Semantics</h4>
            <div className="form-group">
              <label>Connector Type</label>
              <select
                value={config.connectorType}
                onChange={e => setConfig(prev => ({ ...prev, connectorType: e.target.value }))}
              >
                <option value="none">None (Normal Flow)</option>
                <option value="loop">Loop Connector</option>
                <option value="trigger">Trigger Connector</option>
              </select>
            </div>

            {config.connectorType === 'loop' && (
              <>
                <div className="form-group">
                  <label>Loop Condition</label>
                  <input
                    type="text"
                    value={config.loopCondition}
                    onChange={e => setConfig(prev => ({ ...prev, loopCondition: e.target.value }))}
                    placeholder="e.g., iteration < maxIterations"
                  />
                </div>
                <div className="form-group">
                  <label>Max Iterations</label>
                  <input
                    type="number"
                    value={config.maxIterations}
                    onChange={e => setConfig(prev => ({ ...prev, maxIterations: parseInt(e.target.value) || 10 }))}
                    min="1"
                    max="100"
                  />
                </div>
              </>
            )}

            {config.connectorType === 'trigger' && (
              <div className="form-group">
                <label>Trigger Condition</label>
                <input
                  type="text"
                  value={config.triggerCondition}
                  onChange={e => setConfig(prev => ({ ...prev, triggerCondition: e.target.value }))}
                  placeholder="e.g., error_rate > 0.1"
                />
              </div>
            )}
          </div>

          {/* Variables */}
          <div className="config-section">
            <div className="section-header">
              <h4>Variables</h4>
              <button className="add-btn" onClick={handleVariableAdd}>
                <span className="icon">add</span>
                Add Variable
              </button>
            </div>
            <div className="variable-list">
              {Object.entries(config.variables).map(([key, value]) => (
                <div key={key} className="variable-item">
                  <input
                    type="text"
                    value={key}
                    readOnly
                    className="variable-key"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={e => handleVariableChange(key, e.target.value)}
                    placeholder="Variable value"
                    className="variable-value"
                  />
                  <button
                    className="delete-btn"
                    onClick={() => handleVariableDelete(key)}
                  >
                    <span className="icon">delete</span>
                  </button>
                </div>
              ))}
              {Object.keys(config.variables).length === 0 && (
                <p className="empty-state">No variables defined</p>
              )}
            </div>
          </div>

          {/* Node-specific Configuration */}
          <div className="config-section">
            <div className="section-header">
              <h4>Node Configuration</h4>
              <button className="add-btn" onClick={handleConfigAdd}>
                <span className="icon">add</span>
                Add Config
              </button>
            </div>
            <div className="config-list">
              {Object.entries(config.config).map(([key, value]) => (
                <div key={key} className="config-item">
                  <input
                    type="text"
                    value={key}
                    readOnly
                    className="config-key"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={e => handleConfigChange(key, e.target.value)}
                    placeholder="Configuration value"
                    className="config-value"
                  />
                  <button
                    className="delete-btn"
                    onClick={() => handleConfigDelete(key)}
                  >
                    <span className="icon">delete</span>
                  </button>
                </div>
              ))}
              {Object.keys(config.config).length === 0 && (
                <p className="empty-state">No configuration defined</p>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="config-section">
            <h4>Preview</h4>
            <div className="preview-box">
              <strong>{config.label || 'Untitled Node'}</strong>
              {config.description && <p>{config.description}</p>}
              {config.connectorType !== 'none' && (
                <div className="connector-preview">
                  <span className="connector-badge">{config.connectorType}</span>
                  {config.connectorType === 'loop' && config.loopCondition && (
                    <small>Loop: {config.loopCondition}</small>
                  )}
                  {config.connectorType === 'trigger' && config.triggerCondition && (
                    <small>Trigger: {config.triggerCondition}</small>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="config-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}