/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import c from 'clsx'
import React, { Suspense, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { LeftPaneProvider, LeftPane, RightPaneProvider, RightPane, useLeftPaneNode, useRightPaneNode, DockContentProvider } from '@shared/lib/layoutSlots'
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

// Disable client-side auth bypass in all environments
const BYPASS = false;
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
const fetchConnectedServices = useStore(s => s.actions?.fetchConnectedServices)
const fetchServiceConfig = useStore(s => s.actions?.fetchServiceConfig)

  // Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, [setUser]);

  // After authentication, hydrate connected services/config once globally
  useEffect(() => {
    if (isAuthenticated) {
      try {
        fetchServiceConfig?.();
        fetchConnectedServices?.();
      } catch (e) {
        console.warn('[App] Failed to fetch service status:', e?.message || e)
      }
    }
  }, [isAuthenticated, fetchConnectedServices, fetchServiceConfig]);

  // When services are connected, prefetch Google data caches once
  const connectedServices = useStore(s => s.connectedServices)
  const fetchGoogleDriveFiles = useStore(s => s.actions?.fetchGoogleDriveFiles)
  const fetchGooglePhotosAlbums = useStore(s => s.actions?.fetchGooglePhotosAlbums)
  const fetchGmailMessages = useStore(s => s.actions?.fetchGmailMessages)
  const googleCache = useStore(s => s.google)

  useEffect(() => {
    if (!isAuthenticated) return
    const cs = connectedServices || {}
    if (cs.googleDrive?.connected && !googleCache?.drive?.lastFetched) {
      fetchGoogleDriveFiles?.()
    }
    if (cs.googlePhotos?.connected && !googleCache?.photos?.lastFetched) {
      fetchGooglePhotosAlbums?.()
    }
    if (cs.gmail?.connected && !googleCache?.gmail?.lastFetched) {
      fetchGmailMessages?.()
    }
  }, [isAuthenticated, connectedServices?.googleDrive?.connected, connectedServices?.googlePhotos?.connected, connectedServices?.gmail?.connected])

  // Apply accent theme to CSS variables so UI reflects selection
  const accentTheme = useStore(s => s.accentTheme);
  useEffect(() => {
    const root = document.documentElement;
    const isDark = (theme === 'dark');
    const palette = {
      azure:   { day: '#1e88e5', night: '#1e88e5' },
      emerald: { day: '#059669', night: '#10b981' },
      amber:   { day: '#d97706', night: '#f59e0b' },
      violet:  { day: '#7c3aed', night: '#8b5cf6' },
      rose:    { day: '#dc2626', night: '#ef4444' },
      teal:    { day: '#0d9488', night: '#14b8a6' },
      indigo:  { day: '#4f46e5', night: '#6366f1' },
      magenta: { day: '#c026d3', night: '#d946ef' },
      cyan:    { day: '#0891b2', night: '#06b6d4' },
      lime:    { day: '#65a30d', night: '#84cc16' },
    };
    const hex = (palette[accentTheme] || palette.azure)[isDark ? 'night' : 'day'];
    // Set accent CSS variables for styles using var(--color-accent)
    root.style.setProperty('--color-accent', hex);
    // Also set RGB for shadows that rely on var(--color-accent-rgb)
    const toRgb = (h) => {
      const m = h.replace('#','');
      const bigint = parseInt(m.length === 3 ? m.split('').map(c => c+c).join('') : m, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `${r}, ${g}, ${b}`;
    };
    root.style.setProperty('--color-accent-rgb', toRgb(hex));
    // Optional BG variables used by some components
    root.style.setProperty('--accent-bg', hex);
  }, [accentTheme, theme]);

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
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        const { dockMinimized, actions } = useStore.getState();
        if (dockMinimized) {
          actions.setDockMinimized(false);
        }
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
  if (!isAuthenticated) {
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
        <DockContentProvider>
          <LayoutBody />
        </DockContentProvider>
      </RightPaneProvider>
    </LeftPaneProvider>
  )
}
