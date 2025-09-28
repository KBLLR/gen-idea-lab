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
import WorkflowsApp from './WorkflowsApp.jsx'
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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleStart = () => {
    useStore.setState({ isWelcomeScreenOpen: false });
  }

  const renderLeftColumnContent = () => {
    switch (activeApp) {
      case 'ideaLab':
        return <ModuleSelector />;
      case 'imageBooth':
        return <ModeSelector />;
      case 'archiva':
        return <ArchivaSidebar />;
      case 'workflows':
        return null; // Workflows handles its own layout
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
        return <WorkflowsApp />;
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
  const isWorkflowsLayout = activeApp === 'workflows';

  return (
    <main data-theme={theme} className={c({
      'three-column': isThreeColumnLayout,
      'workflows-layout': isWorkflowsLayout
    })}>
      {isWelcomeScreenOpen && <WelcomeScreen onStart={handleStart} />}
      {isAssistantOpen && <Assistant />}
      {isSettingsOpen && <SettingsModal />}

      {!isWorkflowsLayout && (
        <div className="left-column">
          <AppSwitcher />
          <div className="left-column-content">
            {renderLeftColumnContent()}
          </div>
          <UserBar />
        </div>
      )}

      {isThreeColumnLayout && (
        <div className="middle-column">
          <ModuleViewer />
        </div>
      )}

      <div className={`right-column ${isWorkflowsLayout ? 'workflows-full-width' : ''}`}>
        {isWorkflowsLayout && (
          <div className="workflows-header">
            <AppSwitcher />
            <UserBar />
          </div>
        )}
        {renderRightColumnContent()}
      </div>
    </main>
  )
}