/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import c from 'clsx'
import { selectModule } from '../lib/actions'
import useStore from '../lib/store'
import WelcomeScreen from './WelcomeScreen.jsx'
import AppSwitcher from './AppSwitcher.jsx'
import ModeSelector from './ModeSelector.jsx'
import BoothViewer from './BoothViewer.jsx'
import UserBar from './UserBar.jsx'
import OrchestratorChat from './OrchestratorChat.jsx'
import ArchivaDashboard from './ArchivaDashboard.jsx'
import ArchivaSidebar from './ArchivaSidebar.jsx'
import ArchivaEntryForm from './ArchivaEntryForm.jsx'
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
      default:
        return null;
    }
  }
  
  const isThreeColumnLayout = activeApp === 'ideaLab' && activeModuleId;

  return (
    <main data-theme={theme} className={c({ 'three-column': isThreeColumnLayout })}>
      {isWelcomeScreenOpen && <WelcomeScreen onStart={handleStart} />}
      {isAssistantOpen && <Assistant />}

      <div className="left-column">
        <AppSwitcher />
        <div className="left-column-content">
          {renderLeftColumnContent()}
        </div>
        <UserBar />
      </div>
      
      {isThreeColumnLayout && (
        <div className="middle-column">
          <ModuleViewer />
        </div>
      )}

      <div className="right-column">
        {renderRightColumnContent()}
      </div>
    </main>
  )
}