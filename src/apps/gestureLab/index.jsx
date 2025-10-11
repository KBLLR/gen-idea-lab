import React, { useEffect } from 'react';
import useStore from '@store';
import GestureLab from './components/GestureLab.jsx';
import GestureLabSidebar from './components/GestureLabSidebar.jsx';
import { useLeftPane } from '@shared/lib/layoutSlots';
import AppHomeBlock from '@components/ui/organisms/AppHomeBlock.jsx';
import { appHomeContent } from '@components/ui/organisms/appHomeContent.js';

export default function GestureLabApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();

  useEffect(() => {
    setActiveApp('gestureLab');
    setLeftPane(<GestureLabSidebar />);
    return () => clearLeftPane();
  }, [setActiveApp]);

  const isFirstVisit = useStore(s => s.firstVisit?.gestureLab);
  const dismissFirstVisit = useStore(s => s.actions?.dismissFirstVisit);
  const c = appHomeContent.gestureLab;
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {isFirstVisit && (
        <div className="app-first-visit">
          <AppHomeBlock icon={c.icon} subtitle={c.subtitle} title={c.title} description={c.description} tips={c.tips}>
            <button className="btn primary" style={{ marginTop: '12px' }} onClick={() => dismissFirstVisit?.('gestureLab')}>Got it</button>
          </AppHomeBlock>
        </div>
      )}
      <GestureLab />
    </div>
  );
}
