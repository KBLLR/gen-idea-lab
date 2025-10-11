import React, { useEffect } from 'react';
import useStore from '@store';
import ModuleSelector from './components/ModuleSelector.jsx';
import ModuleViewer from './components/ModuleViewer.jsx';
import ModuleKnowledgeSection from './components/ModuleKnowledgeSection.jsx';
import { useLeftPane, useRightPane } from '@shared/lib/layoutSlots';
import { Panel } from '@ui';
import AppHomeBlock from '@components/ui/organisms/AppHomeBlock.jsx';
import { appHomeContent } from '@components/ui/organisms/appHomeContent.js';

export default function IdeaLabApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const activeModuleId = useStore.use.activeModuleId();
  const showKnowledgeSection = useStore.use.showKnowledgeSection();
  const { setLeftPane, clearLeftPane } = useLeftPane();
  const { setRightPane, clearRightPane } = useRightPane();

  // Mount: set app and left pane once
  useEffect(() => {
    setActiveApp('ideaLab');
    setLeftPane(<ModuleSelector />);
    return () => { clearLeftPane(); clearRightPane(); };
  }, [setActiveApp, setLeftPane, clearLeftPane, clearRightPane]);

  // Reactive: update right pane when module or visibility changes
  useEffect(() => {
    if (activeModuleId && showKnowledgeSection) {
      setRightPane(
        <Panel title="Knowledge">
          <ModuleKnowledgeSection moduleId={activeModuleId} />
        </Panel>
      );
    } else {
      clearRightPane();
    }
  }, [activeModuleId, showKnowledgeSection, setRightPane, clearRightPane]);

  return (
    <>
      {activeModuleId ? (
        <ModuleViewer />
      ) : (
        (() => { const c = appHomeContent.ideaLab; return (
          <AppHomeBlock icon={c.icon} subtitle={c.subtitle} title={c.title} description={c.description} tips={c.tips} />
        ); })()
      )}
    </>
  );
}
