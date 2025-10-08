/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import c from 'clsx'
import React, { Suspense, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { LeftPaneProvider, LeftPane, RightPaneProvider, RightPane, useLeftPaneNode, useRightPaneNode } from '@shared/lib/layoutSlots'
import { selectModule } from "@shared/lib/actions/ideaLabActions.js";
import { checkAuthStatus } from "@shared/lib/actions/authActions.js";
import useStore from '@store'
import { LoginForm, ModalWizard } from '@ui';
import SettingsModal from './modals/SettingsModal.jsx'
import SystemInfoModal from './modals/SystemInfoModal.jsx'
import CommandPalette from './modals/CommandPalette.jsx'
import GlassDock from './glassdock/GlassDock.jsx'
import UserBar from './ui/organisms/UserBar.jsx'
import AppSwitchOverlay from './ui/organisms/AppSwitchOverlay.jsx'
import ModuleViewer from '@apps/ideaLab/components/ModuleViewer.jsx'
import AppSwitcher from './headers/AppSwitcher.jsx'
import { actions as globalActions } from '@shared/lib/actions.js'
import ChatApp from '../apps/chat/index.jsx';
import { debug as logDebug } from '@shared/lib/log.js';

const BYPASS = import.meta.env.VITE_AUTH_BYPASS === '1';
import IdeaLabApp from '../apps/ideaLab/index.jsx';
import ImageBoothApp from '../apps/imageBooth/index.jsx';
import ArchivaApp from '../apps/archiva/index.jsx';
import WorkflowsApp from '../apps/workflows/index.jsx';
import PlannerApp from '../apps/planner/index.jsx';
import CalendarAIApp from '../apps/calendarAI/index.jsx';
import EmpathyLabApp from '../apps/empathyLab/index.jsx';
import GestureLabApp from '../apps/gestureLab/index.jsx';

export default function App() {
const isWelcomeScreenOpen = useStore(s => s.isWelcomeScreenOpen)
const activeApp = useStore(s => s.activeApp)
const theme = useStore(s => s.theme)
const activeModuleId = useStore(s => s.activeModuleId)


const showKnowledgeSection = useStore(s => s.showKnowledgeSection)
const activeEntryId = useStore(s => s.activeEntryId)
const isAuthenticated = useStore(s => s.isAuthenticated)
const isCheckingAuth = useStore(s => s.isCheckingAuth)
const isSettingsOpen = useStore(s => s.isSettingsOpen)
const isSystemInfoOpen = useStore(s => s.isSystemInfoOpen)
const setIsSystemInfoOpen = useStore(s => s.actions?.setIsSystemInfoOpen)
const rightColumnWidth = useStore(s => s.rightColumnWidth)
const setRightColumnWidth = useStore(s => s.actions?.setRightColumnWidth)
const leftColumnWidth = useStore(s => s.leftColumnWidth)
const setLeftColumnWidth = useStore(s => s.actions?.setLeftColumnWidth)
const setIsLiveVoiceChatOpen = useStore(s => s.actions?.setIsLiveVoiceChatOpen)
const isLiveVoiceChatOpen = useStore(s => s.isLiveVoiceChatOpen)
const setUser = useStore(s => s.actions?.setUser)

  // Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    if (BYPASS && setUser) {
      setUser({ id: 'dev', email: 'dev@code.berlin', name: 'Dev User', roles: ['dev'], provider: 'bypass' });
      return;
    }
    checkAuthStatus();
  }, [setUser]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K (or Ctrl+K on Windows) for Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Dev-only log for palette toggle
        logDebug('[App] Cmd+K pressed - toggling command palette');
        setIsCommandPaletteOpen(prev => {
          logDebug('[App] Command palette now:', !prev);
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
    // kept for backward compat; ModalWizard will call setDismissedOnboarding
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

  // Finish app switch after first paint of new app
  const appTransition = useStore.use.appTransition();
  const finishAppSwitch = useStore.use.actions().finishAppSwitch;
  useEffect(() => {
    if (appTransition?.status === 'starting') {
      const cb = () => finishAppSwitch?.();
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        // @ts-ignore
        window.requestIdleCallback(cb, { timeout: 200 });
      } else {
        setTimeout(cb, 0);
      }
    }
  }, [activeApp, appTransition?.status, finishAppSwitch]);

  const renderLeftColumnContent = () => {
    switch (activeApp) {
      case 'chat':
        return <ChatApp />;
      case 'ideaLab':
        return <IdeaLabApp />;
      case 'imageBooth':
        return <ImageBoothApp />;
      case 'archiva':
        return <ArchivaApp />;
      case 'workflows':
        return <WorkflowsApp />;
      case 'planner':
        return <PlannerApp />;
      case 'calendarAI':
        return <CalendarAIApp />;
      case 'empathyLab':
        return <EmpathyLabApp />;
      case 'gestureLab':
        return <GestureLabApp />;
      default:
        return null;
    }
  };

  const renderRightColumnContent = () => {
    switch (activeApp) {
      case 'chat':
        return <ChatApp />;
      case 'ideaLab':
        return <IdeaLabApp />;
      case 'imageBooth':
        return <ImageBoothApp />;
      case 'archiva':
        return <ArchivaApp />;
      case 'workflows':
        return <WorkflowsApp />;
      case 'planner':
        return <PlannerApp />;
      case 'calendarAI':
        return <CalendarAIApp />;
      case 'empathyLab':
        return <EmpathyLabApp />;
      case 'gestureLab':
        return <GestureLabApp />;
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

  // Show login form if not authenticated (but not in bypass mode)
  if (!BYPASS && !isAuthenticated) {
    return (
      <div data-theme={theme}>
        <LoginForm />
      </div>
    );
  }

  const hasModuleSelected = activeApp === 'ideaLab' && activeModuleId;

  const LayoutBody = () => {
    const leftPaneNode = useLeftPaneNode();
    const rightPaneNode = useRightPaneNode();
    const isThreeColumnLayout = Boolean(rightPaneNode);
    return (
      <main data-theme={theme} className={c({
        'three-column': isThreeColumnLayout
      })}>
        {/* Onboarding Wizard */}
        {(() => {
          const dismissed = useStore.use.settings()?.dismissedOnboarding;
          const setDismissedOnboarding = useStore.use.actions().setDismissedOnboarding;
          const steps = [
            { title: 'Welcome to GenBooth', desc: 'Your Generative Research Suite.' },
            { title: 'Micro‑apps', desc: 'Focused tools for chat, planning, documentation, voice, and more.' },
            { title: 'Privacy', desc: 'Local-first UI; connect services when you need them.' },
            { title: "What's new", desc: 'Slot-based layout, @ui design system, and improved app switching.' },
          ];
          return (
            <ModalWizard
              isOpen={!dismissed}
              steps={steps}
              onClose={() => setDismissedOnboarding(true)}
            />
          );
        })()}

        <React.Suspense fallback={null}>
          <SettingsModal
            isOpen={!!(useStore((s) => s.ui?.isSettingsOpen) ?? isSettingsOpen)}
            onClose={globalActions.closeSettings}
          />
        </React.Suspense>
        {isSystemInfoOpen && <SystemInfoModal isOpen={isSystemInfoOpen} onClose={() => setIsSystemInfoOpen(false)} />}
        <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
        <GlassDock />
        <AppSwitchOverlay />

      {leftPaneNode ? (
        <>
          <div 
            className="left-column"
            style={{ width: `${leftColumnWidth}px` }}
          >
            <AppSwitcher />
            <div className="left-column-content">
              <LeftPane />
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
        </>
      ) : (
        <>
          <AppSwitcher />
          <UserBar />
        </>
      )}

      <div className="middle-column">
        <Outlet />
      </div>

      {rightPaneNode ? (
        <>
          <div
            className="column-resizer"
            onMouseDown={handleResizerMouseDown}
            role="separator"
            aria-orientation="vertical"
            title="Drag to resize"
          />

          <div
            className="right-column"
            style={{ width: `${rightColumnWidth}px` }}
          >
            <RightPane />
          </div>
        </>
      ) : null}
      </main>
    );
  };

  return (
    <LeftPaneProvider>
      <RightPaneProvider>
        <LayoutBody />
      </RightPaneProvider>
    </LeftPaneProvider>
  )
}
