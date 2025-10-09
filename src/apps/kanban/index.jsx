import React, { useEffect } from 'react';
import useStore from '@store';
import seedTasks from './data/seed-tasks.json';
import './styles/kanban.css';
import CategorySidebar from './components/CategorySidebar.jsx';
import KanbanLanes from './components/KanbanLanes.jsx';
import { useRightPane, useLeftPane } from '@shared/lib/layoutSlots';
import TabbedRightPane from '@shared/lib/TabbedRightPane.jsx';
import { Panel } from '@ui';

export default function KanbanContent() {
  const setActiveApp = useStore(s => s.actions.setActiveApp);
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
        priority: t.priority || 'med',
        assignee: t.assignee || 'Unassigned',
        col: (t.status || 'todo')
      }));
      bulkUpsertTasks(mapped);
    }
  }, [allIds?.length, bulkUpsertTasks]);

  // Mount: set app and panes once
  useEffect(() => {
    setActiveApp('kanban');
    setLeftPane(<CategorySidebar />);
    setRightPane(
      <TabbedRightPane
        initial="kanban"
        tabs={[
          {
            id: 'kanban',
            label: 'Kanban',
            icon: '🧭',
            title: 'Status',
            render: () => <KanbanLanes />
          },
        ]}
      />
    );
    return () => { clearRightPane(); clearLeftPane(); };
  }, [setActiveApp, setRightPane, clearRightPane, setLeftPane, clearLeftPane]);

  return (
    <Panel title="Standup / Task Detail">
      Select or create a task…
    </Panel>
  );
}
