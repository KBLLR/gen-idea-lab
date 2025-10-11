import React, { useEffect } from 'react';
import useStore from '@store';
import EmpathyLab from './components/EmpathyLab.jsx';
import EmpathyLabSidebar from './components/EmpathyLabSidebar.jsx';
import { useLeftPane } from '@shared/lib/layoutSlots';
import AppHomeBlock from '@components/ui/organisms/AppHomeBlock.jsx';
import { appHomeContent } from '@components/ui/organisms/appHomeContent.js';

export default function EmpathyLabApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();

  useEffect(() => {
    setActiveApp('empathyLab');
    setLeftPane(<EmpathyLabSidebar />);
    return () => clearLeftPane();
  }, [setActiveApp]);

  const isFirstVisit = useStore(s => s.firstVisit?.empathyLab);
  const dismissFirstVisit = useStore(s => s.actions?.dismissFirstVisit);
  const c = appHomeContent.empathyLab;
  return (
    <div style={{ position: 'relative' }}>
      {isFirstVisit && (
        <div className="app-first-visit">
          <AppHomeBlock icon={c.icon} subtitle={c.subtitle} title={c.title} description={c.description} tips={c.tips}>
            <button className="btn primary" style={{ marginTop: '12px' }} onClick={() => dismissFirstVisit?.('empathyLab')}>Got it</button>
          </AppHomeBlock>
        </div>
      )}
      <EmpathyLab />
    </div>
  );
}
