import React, { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate } from 'react-router-dom'
import AppProviders from './AppProviders.jsx'
import App from './components/App.jsx'
import './index.css'
import { APP_ID_TO_SLUG } from '@routes'

const Chat       = lazy(() => import('./apps/chat/index.jsx'))
const IdeaLab    = lazy(() => import('./apps/ideaLab/index.jsx'))
const ImageBooth = lazy(() => import('./apps/imageBooth/index.jsx'))
const Archiva    = lazy(() => import('./apps/archiva/index.jsx'))
const Planner    = lazy(() => import('./apps/planner/index.jsx'))
const Workflows  = lazy(() => import('./apps/workflows/index.jsx'))
const CalendarAI = lazy(() => import('./apps/calendarAI/index.jsx'))
const EmpathyLab = lazy(() => import('./apps/empathyLab/index.jsx'))
const GestureLab = lazy(() => import('./apps/gestureLab/index.jsx'))
const Kanban     = lazy(() => import('./apps/kanban/index.jsx'))
const MindMap    = lazy(() => import('./apps/multimindmap/index.jsx'))

const withProviders = (node) => (
  <AppProviders>
    <Suspense fallback={<div style={{ padding: 'var(--space-4, 1rem)' }}>Loading…</div>}>{node}</Suspense>
  </AppProviders>
)

const defaultApp = import.meta.env.VITE_DEFAULT_APP
const defaultSlug = defaultApp && APP_ID_TO_SLUG[String(defaultApp).toLowerCase()] ? APP_ID_TO_SLUG[String(defaultApp).toLowerCase()] : null

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={withProviders(<App />)}>
      <Route index element={defaultSlug ? <Navigate to={`/${defaultSlug}`} replace /> : <Navigate to="/idealab" replace />} />
      <Route path="chat/*"        element={withProviders(<Chat />)} />
      <Route path="idealab/*"     element={withProviders(<IdeaLab />)} />
      <Route path="imagebooth/*"  element={withProviders(<ImageBooth />)} />
      <Route path="archiva/*"     element={withProviders(<Archiva />)} />
      <Route path="planner/*"     element={withProviders(<Planner />)} />
      <Route path="workflows/*"   element={withProviders(<Workflows />)} />
      <Route path="calendarai/*"  element={withProviders(<CalendarAI />)} />
      <Route path="empathylab/*"  element={withProviders(<EmpathyLab />)} />
      <Route path="gesturelab/*"  element={withProviders(<GestureLab />)} />
      <Route path="kanban/*"      element={withProviders(<Kanban />)} />
      <Route path="mindmap/*"     element={withProviders(<MindMap />)} />
      <Route path="*" element={<Navigate to="/idealab" replace />} />
    </Route>
  )
)

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)
