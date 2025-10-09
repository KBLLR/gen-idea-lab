import React, { useState, useEffect } from 'react';
import useStore from '@store';
import { Panel } from '@ui';
import styles from './TaskDetailPanel.module.css';

const ACTION_OPTIONS = ['Implement', 'Create', 'Add', 'Document', 'Test', 'Fix', 'Refactor'];
const PRIORITY_OPTIONS = ['high', 'med', 'low'];
const STATUS_OPTIONS = ['todo', 'doing', 'done'];

export default function TaskDetailPanel() {
  const selectedTaskId = useStore(s => s.selectedTaskId);
  const tasksById = useStore(s => s.tasks.byId);
  const updateTask = useStore(s => s.updateTask);
  const moveTask = useStore(s => s.moveTask);
  const setSelectedTask = useStore(s => s.setSelectedTask);

  const task = selectedTaskId ? tasksById[selectedTaskId] : null;

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title || '',
        description: task.description || '',
        action: task.action || 'Implement',
        priority: task.priority || 'med',
        assignee: task.assignee || 'Unassigned',
        category: task.category || '',
        subcategory: task.subcategory || '',
        bucket: task.bucket || '',
        dueDate: task.dueDate || '',
        tags: task.tags?.join(', ') || '',
      });
    }
  }, [task]);

  if (!task) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📋</span>
        <p className={styles.emptyText}>Select a task to view details</p>
      </div>
    );
  }

  const handleSave = () => {
    const updates = {
      ...editForm,
      tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };

    // If status changed, move to new lane
    if (updates.status && updates.status !== task.col) {
      moveTask(task.id, updates.status);
    }

    updateTask(task.id, updates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      action: task.action || 'Implement',
      priority: task.priority || 'med',
      assignee: task.assignee || 'Unassigned',
      category: task.category || '',
      subcategory: task.subcategory || '',
      bucket: task.bucket || '',
      dueDate: task.dueDate || '',
      tags: task.tags?.join(', ') || '',
    });
  };

  const handleClose = () => {
    setSelectedTask(null);
    setIsEditing(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'med': return '#ffaa00';
      case 'low': return '#44ff44';
      default: return '#999';
    }
  };

  return (
    <div className={styles.container}>
      <Panel
        title={
          <div className={styles.header}>
            <span>Task Details</span>
            <button
              className={styles.closeBtn}
              onClick={handleClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        }
      >
        <div className={styles.content}>
          {/* Action Buttons */}
          <div className={styles.actions}>
            {!isEditing ? (
              <button className={styles.btnPrimary} onClick={() => setIsEditing(true)}>
                ✏️ Edit
              </button>
            ) : (
              <>
                <button className={styles.btnSuccess} onClick={handleSave}>
                  ✓ Save
                </button>
                <button className={styles.btnSecondary} onClick={handleCancel}>
                  Cancel
                </button>
              </>
            )}
          </div>

          {/* Task Content */}
          {isEditing ? (
            // Edit Mode
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Title</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Add a description..."
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Action</label>
                  <select
                    className={styles.select}
                    value={editForm.action}
                    onChange={(e) => setEditForm({ ...editForm, action: e.target.value })}
                  >
                    {ACTION_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Priority</label>
                  <select
                    className={styles.select}
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  >
                    {PRIORITY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Status</label>
                  <select
                    className={styles.select}
                    value={task.col}
                    onChange={(e) => moveTask(task.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Assignee</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editForm.assignee}
                    onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Category</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Subcategory</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editForm.subcategory}
                  onChange={(e) => setEditForm({ ...editForm, subcategory: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Bucket</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editForm.bucket}
                  onChange={(e) => setEditForm({ ...editForm, bucket: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Due Date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Tags (comma-separated)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  placeholder="urgent, backend, bug"
                />
              </div>
            </div>
          ) : (
            // View Mode
            <div className={styles.view}>
              <h2 className={styles.title}>{task.title}</h2>

              {task.description && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>Description</div>
                  <p className={styles.description}>{task.description}</p>
                </div>
              )}

              <div className={styles.metadata}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Action:</span>
                  <span className={styles.metaBadge}>{task.action}</span>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Priority:</span>
                  <span
                    className={styles.metaBadge}
                    style={{ borderColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </span>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Status:</span>
                  <span className={styles.metaBadge}>{task.col}</span>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Assignee:</span>
                  <span className={styles.metaValue}>{task.assignee || 'Unassigned'}</span>
                </div>

                {task.category && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Category:</span>
                    <span className={styles.metaValue}>{task.category}</span>
                  </div>
                )}

                {task.subcategory && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Subcategory:</span>
                    <span className={styles.metaValue}>{task.subcategory}</span>
                  </div>
                )}

                {task.bucket && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Bucket:</span>
                    <span className={styles.metaValue}>{task.bucket}</span>
                  </div>
                )}

                {task.dueDate && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Due Date:</span>
                    <span className={styles.metaValue}>{task.dueDate}</span>
                  </div>
                )}

                {task.tags && task.tags.length > 0 && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Tags:</span>
                    <div className={styles.tags}>
                      {task.tags.map((tag, i) => (
                        <span key={i} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.footer}>
                <div className={styles.timestamp}>
                  <span className={styles.timestampLabel}>Created:</span>
                  <span className={styles.timestampValue}>{formatDate(task.createdAt)}</span>
                </div>
                {task.updatedAt && (
                  <div className={styles.timestamp}>
                    <span className={styles.timestampLabel}>Updated:</span>
                    <span className={styles.timestampValue}>{formatDate(task.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
