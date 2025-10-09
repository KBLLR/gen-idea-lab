import React, { useMemo } from 'react';
import useStore from '@store';
import Lane from './Lane.jsx';

export default function KanbanLanes() {
  const tasksById = useStore(s => s.tasks.byId);
  const lanesState = useStore(s => s.lanes);

  const lanes = useMemo(() => ({
    todo: (lanesState.todo || []).map(id => tasksById[id]).filter(Boolean),
    doing: (lanesState.doing || []).map(id => tasksById[id]).filter(Boolean),
    done: (lanesState.done || []).map(id => tasksById[id]).filter(Boolean),
  }), [lanesState, tasksById]);

  return (
    <div className="lanes">
      <Lane title="🧭 To Do"  items={lanes.todo}  />
      <Lane title="⚙️ Doing" items={lanes.doing} />
      <Lane title="✅ Done"   items={lanes.done}  />
    </div>
  );
}
