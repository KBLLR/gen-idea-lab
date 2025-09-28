/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import c from 'clsx'
import { useEffect } from 'react'
import { selectModule, checkAuthStatus } from '../lib/actions'
import useStore from '../lib/store'
import WelcomeScreen from './WelcomeScreen.jsx'
import LoginForm from './LoginForm.jsx'
import SettingsModal from './SettingsModal.jsx'
import AppSwitcher from './AppSwitcher.jsx'
import ModeSelector from './ModeSelector.jsx'
import BoothViewer from './BoothViewer.jsx'
import UserBar from './UserBar.jsx'
import OrchestratorChat from './OrchestratorChat.jsx'
import ArchivaDashboard from './ArchivaDashboard.jsx'
import ArchivaSidebar from './ArchivaSidebar.jsx'
import ArchivaEntryForm from './ArchivaEntryForm.jsx'
import WorkflowsList from './WorkflowsList.jsx'
import WorkflowEditor from './WorkflowEditor.jsx'
import ModuleViewer from './ModuleViewer.jsx'
import Assistant from './Assistant.jsx'
import { personalities } from '../lib/assistant/personalities'
import { modulesBySemester } from '../lib/modules'

const ModuleSelector = () => {
  const activeModuleId = useStore.use.activeModuleId()

  return (
    <>
      {Object.entries(modulesBySemester).map(([semester, modules]) => (
        <div className="semester-group" key={semester}>
          <h2>{semester}</h2>
          <div className="module-list">
            {modules.map(module => {
              const personality = personalities[module['Module Code']];
              return (
                <button
                  key={module['Module Code']}
                  onClick={() => selectModule(module['Module Code'])}
                  className={c({ active: module['Module Code'] === activeModuleId })}
                >
                  <div className="module-info">
                    <span className="icon">{personality?.icon || 'school'}</span>
                    <p>{personality?.name || module['Module Title']}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}

export default function App() {
  const isWelcomeScreenOpen = useStore.use.isWelcomeScreenOpen()
  const activeApp = useStore.use.activeApp()
  const theme = useStore.use.theme()
  const activeModuleId = useStore.use.activeModuleId();
  const isAssistantOpen = useStore.use.isAssistantOpen();
  const activeEntryId = useStore.use.activeEntryId();
  const isAuthenticated = useStore.use.isAuthenticated();
  const isCheckingAuth = useStore.use.isCheckingAuth();
  const isSettingsOpen = useStore.use.isSettingsOpen();
  const rightColumnWidth = useStore.use.rightColumnWidth();
  const setRightColumnWidth = useStore.use.actions().setRightColumnWidth;
  const leftColumnWidth = useStore.use.leftColumnWidth();
  const setLeftColumnWidth = useStore.use.actions().setLeftColumnWidth;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleStart = () => {
    useStore.setState({ isWelcomeScreenOpen: false });
  }

  // Column resizing logic
  const minRightWidth = 360;
  const maxRightWidth = 900;
  const minLeftWidth = 240;
  const maxLeftWidth = 480;

  // Left column resizer
  const handleLeftResizerMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftColumnWidth;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // Dragging right increases width, left decreases
      const newWidth = Math.min(Math.max(startWidth + deltaX, minLeftWidth), maxLeftWidth);
      setLeftColumnWidth(newWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Right column resizer
  const handleResizerMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightColumnWidth;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // Dragging right increases width, left decreases
      const newWidth = Math.min(Math.max(startWidth + deltaX, minRightWidth), maxRightWidth);
      setRightColumnWidth(newWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const renderLeftColumnContent = () => {
    switch (activeApp) {
      case 'ideaLab':
        return <ModuleSelector />;
      case 'imageBooth':
        return <ModeSelector />;
      case 'archiva':
        return <ArchivaSidebar />;
      case 'workflows':
        return <WorkflowsList />;
      default:
        return null;
    }
  };

  const renderRightColumnContent = () => {
    switch (activeApp) {
      case 'ideaLab':
        return <OrchestratorChat />;
      case 'imageBooth':
        return <BoothViewer />;
      case 'archiva':
        return activeEntryId ? <ArchivaEntryForm /> : <ArchivaDashboard />;
      case 'workflows':
        return <WorkflowEditor />;
      default:
        return null;
    }
  }
  
  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="auth-loading" data-theme={theme}>
        <div className="spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div data-theme={theme}>
        <LoginForm />
      </div>
    );
  }

  const isThreeColumnLayout = activeApp === 'ideaLab' && activeModuleId;

  return (
    <main data-theme={theme} className={c({
      'three-column': isThreeColumnLayout
    })}>
      {isWelcomeScreenOpen && <WelcomeScreen onStart={handleStart} />}
      {isAssistantOpen && <Assistant />}
      {isSettingsOpen && <SettingsModal />}

      <div 
        className="left-column"
        style={{ width: `${leftColumnWidth}px` }}
      >
        <AppSwitcher />
        <div className="left-column-content">
          {renderLeftColumnContent()}
        </div>
        <UserBar />
      </div>

      {/* Left column resizer */}
      <div 
        className="left-column-resizer"
        onMouseDown={handleLeftResizerMouseDown}
        role="separator"
        aria-orientation="vertical"
        title="Drag to resize left panel"
      />

      {isThreeColumnLayout && (
        <div className="middle-column">
          <ModuleViewer />
        </div>
      )}

      {isThreeColumnLayout && (
        <div 
          className="column-resizer"
          onMouseDown={handleResizerMouseDown}
          role="separator"
          aria-orientation="vertical"
          title="Drag to resize"
        />
      )}

      <div 
        className="right-column" 
        style={isThreeColumnLayout ? { width: `${rightColumnWidth}px` } : {}}
      >
        {renderRightColumnContent()}
      </div>
    </main>
  )
}