import React, { useMemo } from 'react';
import useStore from '@store';
import { useDraggable } from '@dnd-kit/core';
import { Panel } from '@ui';
import styles from './CategorySidebar.module.css';

function DraggableSidebarTask({ task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  const setSelectedTask = useStore(s => s.setSelectedTask);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.taskItem}
      {...attributes}
      {...listeners}
      onClick={() => setSelectedTask(task.id)}
    >
      <div className={styles.taskTitle}>{task.title}</div>
      <div className={styles.taskMeta}>
        {task.action} · {task.col}
      </div>
    </div>
  );
}

export default function CategorySidebar() {
  const tasksById = useStore(s => s.tasks.byId);
  const allIds = useStore(s => s.tasks.allIds);

  const tasks = useMemo(() => allIds.map(id => tasksById[id]).filter(Boolean), [allIds, tasksById]);

  const categories = useMemo(() => {
    const by = new Map();
    for (const t of tasks) {
      const bucket = t.bucket || 'General';
      if (!by.has(bucket)) by.set(bucket, []);
      by.get(bucket).push(t);
    }
    return Array.from(by.entries()).map(([name, items]) => ({ name, items }));
  }, [tasks]);

  return (
    <aside className={styles.root}>
      {categories.map(({ name, items }) => (
        <Panel key={name} title={<span className={styles.headerTitle}>{name} <span className={styles.badge}>{items.length}</span></span>}>
          <div className={styles.list}>
            {items.map(t => (
              <DraggableSidebarTask key={t.id} task={t} />
            ))}
          </div>
        </Panel>
      ))}
    </aside>
  );
}
