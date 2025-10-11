import React, { useEffect } from 'react';
import useStore from '@store';
import seedTasks from './data/seed-tasks.json';
import './styles/kanban.css';
import CategorySidebar from './components/CategorySidebar.jsx';
import KanbanLanes from './components/KanbanLanes.jsx';
import TaskDetailPanel from './components/TaskDetailPanel.jsx';
import BoothHeader from '@components/ui/organisms/BoothHeader.jsx';
import { useRightPane, useLeftPane } from '@shared/lib/layoutSlots';
import AppHomeBlock from '@components/ui/organisms/AppHomeBlock.jsx';
import { appHomeContent } from '@components/ui/organisms/appHomeContent.js';

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

  const isFirstVisit = useStore(s => s.firstVisit?.kanban);
  const dismissFirstVisit = useStore(s => s.actions?.dismissFirstVisit);

  return (
    <div className="booth-viewer">
      <BoothHeader
        icon="view_kanban"
        title="Kanban Board"
        typeText="Task Management"
        status="active"
        description="Organize and track tasks across different stages"
        align="top"
      />
      <div className="kanban-workspace">
        {isFirstVisit ? (
          <div className="kanban-welcome">
            {(() => { const c = appHomeContent.kanban; return (
              <AppHomeBlock icon={c.icon} subtitle={c.subtitle} title={c.title} description={c.description} tips={c.tips}>
                <button className="btn primary" style={{ marginTop: '12px' }} onClick={() => dismissFirstVisit?.('kanban')}>
                  Got it
                </button>
              </AppHomeBlock>
            ); })()}
          </div>
        ) : (
          <KanbanLanes />
        )}
      </div>
    </div>
  );
}
