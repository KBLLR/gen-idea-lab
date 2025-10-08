import React, { useEffect } from 'react';
import useStore from '@store';
import { useLeftPane, useRightPane } from '@shared/lib/layoutSlots';
import TemplateSidebar from './components/_TemplateSidebar.jsx';
import TemplateCenter from './components/_Template.jsx';
import './styles/_template.css';

export default function TemplateApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();
  const { setRightPane, clearRightPane } = useRightPane();

  useEffect(() => {
    setActiveApp('_template');
    setLeftPane(<TemplateSidebar />);
    // Right pane is optional; leave null by default
    return () => { clearLeftPane(); clearRightPane(); };
  }, [setActiveApp]);

  return <TemplateCenter />;
}