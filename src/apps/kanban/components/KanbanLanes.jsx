import React, { useMemo } from 'react';
import useStore from '@store';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import Lane from './Lane.jsx';
import TaskCard from './TaskCard.jsx';

export default function KanbanLanes() {
  const tasksById = useStore(s => s.tasks.byId);
  const lanesState = useStore(s => s.lanes);
  const moveTask = useStore(s => s.moveTask);
  const [activeTask, setActiveTask] = React.useState(null);

  const lanes = useMemo(() => ({
    todo: (lanesState.todo || []).map(id => tasksById[id]).filter(Boolean),
    doing: (lanesState.doing || []).map(id => tasksById[id]).filter(Boolean),
    done: (lanesState.done || []).map(id => tasksById[id]).filter(Boolean),
  }), [lanesState, tasksById]);

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasksById[active.id];
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const task = tasksById[taskId];

    // Check if dropped over a lane
    if (over.data.current?.type === 'lane') {
      const targetLane = over.data.current.laneId;
      if (task && task.col !== targetLane) {
        moveTask(taskId, targetLane);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="lanes">
        <Lane laneId="todo" title="To Do" icon="playlist_add_check" items={lanes.todo} />
        <Lane laneId="doing" title="Doing" icon="pending_actions" items={lanes.doing} />
        <Lane laneId="done" title="Done" icon="check_circle" items={lanes.done} />
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
