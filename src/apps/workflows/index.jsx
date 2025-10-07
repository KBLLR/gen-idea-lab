import React, { useEffect } from 'react';
import useStore from '@store';
import WorkflowsList from './components/WorkflowsList.jsx';
import WorkflowEditor from './components/WorkflowEditor.jsx';
import { useRightPane } from '@shared/lib/layoutSlots';
import { Panel } from '@ui';

export default function WorkflowsApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setRightPane, clearRightPane } = useRightPane();

  useEffect(() => {
    setActiveApp('workflows');
    setRightPane(
      <Panel title="Editor">
        <WorkflowEditor />
      </Panel>
    );
    return () => clearRightPane();
  }, [setActiveApp]);

  return <WorkflowsList />;
}
