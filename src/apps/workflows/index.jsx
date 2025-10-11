import React, { useEffect } from 'react';
import useStore from '@store';
import WorkflowsList from './components/WorkflowsList.jsx';
import WorkflowEditor from './components/WorkflowEditor.jsx';
import { useLeftPane } from '@shared/lib/layoutSlots';
import { useRightPane } from '@shared/lib/layoutSlots';

export default function WorkflowsApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();
  const { setRightPane, clearRightPane } = useRightPane();

  useEffect(() => {
    setActiveApp('workflows');
    // Sidebar (left pane): list of workflows
    setLeftPane(<WorkflowsList />);
    // No third-pane welcome; center content handles empty state
    return () => { clearLeftPane(); clearRightPane(); };
  }, [setActiveApp, setLeftPane, clearLeftPane]);

  // Center content: workflow editor for selected item
  return <WorkflowEditor />;
}
