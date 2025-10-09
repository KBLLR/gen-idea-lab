import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import useStore from '@store';
import styles from './TaskCard.module.css';

const ACTION_ICONS = {
  Implement: '🔧',
  Create: '✨',
  Add: '➕',
  Document: '📝',
  Test: '✓',
};

const PRIORITY_COLORS = {
  high: '🔴',
  med: '🟡',
  low: '🟢',
};

export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(task.id);
    }
  };

  const priorityIcon = PRIORITY_COLORS[task.priority] || '⚪';
  const actionIcon = ACTION_ICONS[task.action] || '•';

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      data-priority={task.priority}
      data-action={task.action}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      {/* Header: Priority + Action */}
      <div className={styles.header}>
        <span className={styles.priorityBadge} title={`Priority: ${task.priority}`}>
          {priorityIcon}
        </span>
        <span className={styles.actionBadge} title={`Action: ${task.action}`}>
          {actionIcon} {task.action}
        </span>
      </div>

      {/* Title */}
      <h3 className={styles.title}>{task.title}</h3>

      {/* Metadata */}
      <div className={styles.meta}>
        <span className={styles.category}>{task.category || task.bucket}</span>
        {task.subcategory && (
          <span className={styles.subcategory}> · {task.subcategory}</span>
        )}
      </div>

      {/* Footer */}
      {task.assignee && (
        <div className={styles.footer}>
          <span className={styles.assignee} title={`Assigned to: ${task.assignee}`}>
            👤 {task.assignee}
          </span>
        </div>
      )}
    </article>
  );
}
