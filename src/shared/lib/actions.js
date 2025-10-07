

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from './store'

const get = useStore.getState
const set = useStore.setState

export const init = () => {
  if (get().didInit) {
    return
  }
  set(state => {
    state.didInit = true
  })
}

export { toggleTheme } from './actions/appThemeActions';


export { switchApp } from './actions/appSwitchingActions';


export { selectModule, updateModuleResourceUrl } from './actions/ideaLabActions';


export { sendMessageToOrchestrator, newOrchestratorChat, restoreOrchestratorSession, deleteOrchestratorSession, clearOrchestratorSessions } from './actions/orchestratorActions';

export { toggleModuleChat, sendAssistantMessage } from './actions/assistantActions';


export { selectMode, setInputImage, generateImage } from './actions/imageBoothActions';

export { setActiveEntryId, clearActiveEntryId, createArchivaEntry, createNewArchivaEntry, updateArchivaEntry, updateArchivaEntryStatus } from './actions/archivaActions';
export { checkAuthStatus, loginWithGoogle, logout } from './actions/authActions';

export { toggleSettings } from './actions/settingsActions';

export { connectService, disconnectService, loadConnectedServices } from './actions/serviceConnectionActions';

init()
