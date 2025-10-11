import React, { useEffect } from 'react';
import useStore from '@store';
import BoothViewer from './components/BoothViewer.jsx';
import ModeSelector from './components/ModeSelector.jsx';
import { useLeftPane } from '@shared/lib/layoutSlots';
import AppHomeBlock from '@components/ui/organisms/AppHomeBlock.jsx';
import { appHomeContent } from '@components/ui/organisms/appHomeContent.js';

export default function ImageBoothApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();

  useEffect(() => {
    setActiveApp('imageBooth');
    setLeftPane(<ModeSelector />);
    return () => clearLeftPane();
  }, [setActiveApp, setLeftPane, clearLeftPane]);

  // Center content only; sidebar is provided via left pane slot
  const isFirstVisit = useStore(s => s.firstVisit?.imageBooth);
  const dismissFirstVisit = useStore(s => s.actions?.dismissFirstVisit);
  const c = appHomeContent.imageBooth;
  return (
    <div style={{ position: 'relative' }}>
      {isFirstVisit && (
        <div className="app-first-visit">
          <AppHomeBlock icon={c.icon} subtitle={c.subtitle} title={c.title} description={c.description} tips={c.tips}>
            <button className="btn primary" style={{ marginTop: '12px' }} onClick={() => dismissFirstVisit?.('imageBooth')}>Got it</button>
          </AppHomeBlock>
        </div>
      )}
      <BoothViewer />
    </div>
  );
}
