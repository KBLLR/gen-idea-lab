import React, { useEffect } from 'react';
import useStore from '@store';
import ArchivaDashboard from './components/ArchivaDashboard.jsx';
import ArchivaSidebar from './components/ArchivaSidebar.jsx';
import ArchivaEntryForm from './components/ArchivaEntryForm.jsx';
import { useLeftPane } from '@shared/lib/layoutSlots';

export default function ArchivaApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const activeEntryId = useStore.use.activeEntryId();
  const { setLeftPane, clearLeftPane } = useLeftPane();

  useEffect(() => {
    setActiveApp('archiva');
    setLeftPane(<ArchivaSidebar />);
    return () => clearLeftPane();
  }, [setActiveApp]);

  return activeEntryId ? <ArchivaEntryForm /> : <ArchivaDashboard />;
}
