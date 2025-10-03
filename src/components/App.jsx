/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import c from 'clsx'
import { useEffect, useState } from 'react'
import { selectModule, checkAuthStatus } from '../lib/actions'
import useStore from '../lib/store'
import WelcomeScreen from './WelcomeScreen.jsx'
import LoginForm from './LoginForm.jsx'
import SettingsModal from './SettingsModal.jsx'
import AppSwitcher from './AppSwitcher.jsx'
import ModeSelector from './ModeSelector.jsx'
import BoothViewer from './BoothViewer.jsx'
import UserBar from './UserBar.jsx'
import ModuleAgentsChat from './ModuleAgentsChat.jsx'
import ArchivaDashboard from './ArchivaDashboard.jsx'
import ArchivaSidebar from './ArchivaSidebar.jsx'
import ArchivaEntryForm from './ArchivaEntryForm.jsx'
import WorkflowsList from './WorkflowsList.jsx'
import WorkflowEditor from './WorkflowEditor.jsx'
import ModuleViewer from './ModuleViewer.jsx'
import Assistant from './Assistant.jsx'
import PlannerSidebar from './PlannerSidebar.jsx'
import PlannerCanvas from './PlannerCanvas.jsx'
import CalendarAI from './CalendarAI.jsx'
import CalendarAISidebar from './CalendarAISidebar.jsx'
import EmpathyLab from './EmpathyLab.jsx'
import EmpathyLabSidebar from './EmpathyLabSidebar.jsx'
import GlassDock from './GlassDock.jsx'
import SystemInfoModal from './SystemInfoModal.jsx'
import CommandPalette from './CommandPalette.jsx'
import { personalities } from '../lib/assistant/personalities'
import { modulesByDiscipline } from '../lib/modules'
import '../styles/components/command-palette.css'

const ModuleSelector = () => {
  const activeModuleId = useStore.use.activeModuleId()

  return (
    <>
      {Object.entries(modulesByDiscipline).map(([discipline, modules]) => (
        <div className="semester-group" key={discipline}>
          <h2>{discipline}</h2>
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
  const showModuleChat = useStore.use.showModuleChat();
  const activeEntryId = useStore.use.activeEntryId();
  const isAuthenticated = useStore.use.isAuthenticated();
  const isCheckingAuth = useStore.use.isCheckingAuth();
  const isSettingsOpen = useStore.use.isSettingsOpen();
  const isSystemInfoOpen = useStore.use.isSystemInfoOpen();
  const setIsSystemInfoOpen = useStore.use.actions().setIsSystemInfoOpen;
  const rightColumnWidth = useStore.use.rightColumnWidth();
  const setRightColumnWidth = useStore.use.actions().setRightColumnWidth;
  const leftColumnWidth = useStore.use.leftColumnWidth();
  const setLeftColumnWidth = useStore.use.actions().setLeftColumnWidth;
  const setIsLiveVoiceChatOpen = useStore.use.actions().setIsLiveVoiceChatOpen;
  const isLiveVoiceChatOpen = useStore.use.isLiveVoiceChatOpen();

  // Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K (or Ctrl+K on Windows) for Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        console.log('[App] Cmd+K pressed - toggling command palette');
        setIsCommandPaletteOpen(prev => {
          console.log('[App] Command palette now:', !prev);
          return !prev;
        });
      }

      // Cmd+Shift+V (or Ctrl+Shift+V on Windows) for Voice Chat toggle
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'v') {
        e.preventDefault();
        setIsLiveVoiceChatOpen(!isLiveVoiceChatOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLiveVoiceChatOpen, setIsLiveVoiceChatOpen]);

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
      case 'planner':
        return <PlannerSidebar />;
      case 'calendarAI':
        return <CalendarAISidebar />;
      case 'empathyLab':
        return <EmpathyLabSidebar />;
      default:
        return null;
    }
  };

  const renderRightColumnContent = () => {
    switch (activeApp) {
      case 'ideaLab':
        return showModuleChat ? <ModuleAgentsChat /> : null;
      case 'imageBooth':
        return <BoothViewer />;
      case 'archiva':
        return activeEntryId ? <ArchivaEntryForm /> : <ArchivaDashboard />;
      case 'workflows':
        return <WorkflowEditor />;
      case 'planner':
        return <PlannerCanvas />;
      case 'calendarAI':
        return <CalendarAI />;
      case 'empathyLab':
        return <EmpathyLab />;
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

  const hasModuleSelected = activeApp === 'ideaLab' && activeModuleId;
  const isThreeColumnLayout = hasModuleSelected && showModuleChat;

  return (
    <main data-theme={theme} className={c({
      'three-column': isThreeColumnLayout
    })}>
      {isWelcomeScreenOpen && <WelcomeScreen onStart={handleStart} />}
      {isAssistantOpen && <Assistant />}
      {isSettingsOpen && <SettingsModal />}
      {isSystemInfoOpen && <SystemInfoModal isOpen={isSystemInfoOpen} onClose={() => setIsSystemInfoOpen(false)} />}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      <GlassDock />

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

      {hasModuleSelected && (
        <div className="middle-column">
          <ModuleViewer />
        </div>
      )}

      {hasModuleSelected && showModuleChat && (
        <div
          className="column-resizer"
          onMouseDown={handleResizerMouseDown}
          role="separator"
          aria-orientation="vertical"
          title="Drag to resize"
        />
      )}

      {(activeApp !== 'ideaLab' || showModuleChat) && (
        <div
          className="right-column"
          style={isThreeColumnLayout ? { width: `${rightColumnWidth}px` } : {}}
        >
          {renderRightColumnContent()}
        </div>
      )}
    </main>
  )
}