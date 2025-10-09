import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import useStore from '@store';
import TaskCard from './TaskCard.jsx';

export default function Lane({ laneId, title, items }) {
  const { setNodeRef, isOver } = useDroppable({
    id: laneId,
    data: {
      type: 'lane',
      laneId,
    },
  });

  const setSelectedTask = useStore(s => s.setSelectedTask);

  const handleTaskClick = (taskId) => {
    setSelectedTask(taskId);
  };

  return (
    <section className="lane" data-lane={laneId}>
      <header className="lane__hdr">
        {title} <span className="badge">{items.length}</span>
      </header>
      <div
        ref={setNodeRef}
        className={`lane__body ${isOver ? 'lane__body--over' : ''}`}
        style={{
          backgroundColor: isOver ? 'rgba(74, 158, 255, 0.1)' : undefined,
          transition: 'background-color 0.2s ease',
        }}
      >
        {items.map(t => (
          <TaskCard key={t.id} task={t} onClick={handleTaskClick} />
        ))}
        {items.length === 0 && (
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--color-text-secondary, #999)',
            fontSize: '14px'
          }}>
            Drop tasks here
          </div>
        )}
      </div>
    </section>
  );
}
