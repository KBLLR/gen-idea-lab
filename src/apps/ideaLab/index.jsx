import React, { useEffect } from 'react';
import useStore from '@store';
import ModuleSelector from './components/ModuleSelector.jsx';
import ModuleViewer from './components/ModuleViewer.jsx';
import ModuleKnowledgeSection from './components/ModuleKnowledgeSection.jsx';
import { useLeftPane, useRightPane } from '@shared/lib/layoutSlots';
import { Panel } from '@ui';

export default function IdeaLabApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const activeModuleId = useStore.use.activeModuleId();
  const showKnowledgeSection = useStore.use.showKnowledgeSection();
  const { setLeftPane, clearLeftPane } = useLeftPane();
  const { setRightPane, clearRightPane } = useRightPane();

  useEffect(() => {
    setActiveApp('ideaLab');
    setLeftPane(<ModuleSelector />);
    if (activeModuleId && showKnowledgeSection) {
      setRightPane(
        <Panel title="Knowledge">
          <ModuleKnowledgeSection moduleId={activeModuleId} />
        </Panel>
      );
    }
    return () => { clearLeftPane(); clearRightPane(); };
  }, [setActiveApp]);

  return (
    <>
      {activeModuleId ? <ModuleViewer /> : null}
    </>
  );
}
