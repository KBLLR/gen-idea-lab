import React, { useEffect } from 'react';
import useStore from '@store';
import seedTasks from './data/seed-tasks.json';
import './styles/kanban.css';
import CategorySidebar from './components/CategorySidebar.jsx';
import KanbanLanes from './components/KanbanLanes.jsx';
import TaskDetailPanel from './components/TaskDetailPanel.jsx';
import { useRightPane, useLeftPane } from '@shared/lib/layoutSlots';

export default function KanbanContent() {
  const setActiveApp = useStore(s => s.actions.setActiveApp);
  const selectedTaskId = useStore(s => s.selectedTaskId);
  const { setRightPane, clearRightPane } = useRightPane();
  const { setLeftPane, clearLeftPane } = useLeftPane();

  // Seed tasks once on mount
  const allIds = useStore(s => s.tasks.allIds);
  const bulkUpsertTasks = useStore(s => s.bulkUpsertTasks);

  useEffect(() => {
    if (!allIds || allIds.length === 0) {
      const mapped = (seedTasks || []).map(t => ({
        id: t.id,
        title: t.title,
        action: t.action,
        category: t.category,
        subcategory: t.subcategory,
        bucket: t.bucket,
        priority: t.priority || 'med',
        assignee: t.assignee || 'Unassigned',
        col: (t.status || 'todo')
      }));
      bulkUpsertTasks(mapped);
    }
  }, [allIds?.length, bulkUpsertTasks]);

  // Mount: set app and left pane once
  useEffect(() => {
    setActiveApp('kanban');
    setLeftPane(<CategorySidebar />);
    return () => { clearRightPane(); clearLeftPane(); };
  }, [setActiveApp, setLeftPane, clearLeftPane, clearRightPane]);

  // Reactive: update right pane when task is selected
  useEffect(() => {
    if (selectedTaskId) {
      setRightPane(<TaskDetailPanel />);
    } else {
      clearRightPane();
    }
  }, [selectedTaskId, setRightPane, clearRightPane]);

  return (
    <div className="kanban-workspace">
      <KanbanLanes />
    </div>
  );
}
