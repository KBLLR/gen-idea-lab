# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # Full stack: Vite (3000) + Express (8081)
npm run dev:client       # Frontend only (Vite dev server)
npm run dev:server       # Backend only (Express with nodemon)
```

### Testing
```bash
npm test                 # Run all Jest tests (ESM mode)
npm run test:auth        # Run auth route tests only
npm run test:ui          # Run UI component tests (Vitest + jsdom)
npm run test:ui:watch    # UI tests in watch mode
```

### Build & Deploy
```bash
npm run build            # Production build (tokens + Vite)
npm run vercel-build     # Vercel deployment build
npm run preview          # Preview production build locally
npm start               # Serve production build (Node)
```

### Design System
```bash
npm run tokens:build     # Generate CSS tokens from Style Dictionary
npm run tokens:watch     # Watch mode for token changes
npm run tokens:validate  # Validate token definitions
npm run tokens:audit     # Audit CSS for direct pixel usage
npm run ds:check         # Check design system for px usage
```

### Utilities
```bash
npm run generate-thumbnails  # Generate AI thumbnails for Image Booth modes
npm run storybook           # Launch Storybook on port 6006
npm run build-storybook     # Build Storybook static site
```

---

## Architecture Overview

### Micro-App System

This is **not a monolithic SPA**—it's a platform of **13 independent micro-apps** that communicate exclusively through a centralized Zustand store. Each app:

- Mounts independently via React Router
- Registers itself with `setActiveApp('appName')` on mount
- Declares its UI layout via **layout slots** (`setLeftPane`, `setRightPane`)
- Communicates with other apps **only** through the store (zero prop passing)
- Cleans up on unmount (clear panes, stop polling)

**Apps**: Home (dashboard), Idea Lab (modules), Chat, Image Booth, Character Lab, Calendar AI, Multi Mind Map, Planner, Archiva, Workflows, Kanban, Empathy Lab, Gesture Lab.

### Critical Architectural Rules

**✅ Always:**
1. Use `useStore.use.sliceName()` for selectors (memoized via `auto-zustand-selectors-hook`)
2. Use `useStore.use.actions().actionName()` for mutations (never mutate store directly)
3. Call `setActiveApp('appName')` on app mount
4. Return cleanup function from `useEffect` (clear panes, stop timers)
5. Check `connectedServices` before calling service APIs
6. Prefix all backend routes with `/api/`

**❌ Never:**
1. Pass props between apps (creates coupling)
2. Import one app from another (creates circular dependencies)
3. Use `useStore(s => s.sliceName)` inline (breaks memoization)
4. Use localStorage for shared data (use Zustand persist middleware)
5. Call third-party APIs directly from client (use `/api/proxy`)
6. Hardcode API URLs (use relative paths)

### Layout Slot System

Apps don't control their own layout—they declare content via slots:

```javascript
// In any app's useEffect:
setLeftPane(<MySidebar />);    // Rendered in left column
setRightPane(<MyPanel />);     // Rendered in right column (optional)

// On cleanup:
return () => {
  clearLeftPane();
  clearRightPane();
};
```

**App.jsx** orchestrates the layout based on these declarations. This enables consistent UI structure without apps managing positioning.

### Zustand Store Pattern

**Store Location**: `src/shared/lib/store.js` (543 lines)

**State Organization**:
- **Core slices**: `user`, `connectedServices`, `activeApp`, `leftPane`, `rightPane`
- **Chat slices**: `activeModuleId`, `assistantHistories`, `activeChatId`, `assistantModel`
- **App-specific**: `riggingTasks`, `plannerGraph`, `archivaEntries`, `tasks`, `imageProvider`
- **UI state**: `theme`, `toasts`, `firstVisit`, `dockPosition`

**Action Proxy Pattern**:
All mutations go through `actions` object at store root:
```javascript
const setTheme = useStore.use.actions().setTheme;
const showToast = useStore.use.actions().showToast;
const sendMessage = useStore.use.actions().sendMessage;
```

**Selector Pattern** (via `auto-zustand-selectors-hook`):
```javascript
// ✅ Correct: Pre-memoized, only re-renders when slice changes
const user = useStore.use.user();
const activeModuleId = useStore.use.activeModuleId();

// ❌ Wrong: Inline selector, re-computes on every store change
const user = useStore(s => s.user);
```

### Data Flow

Standard pattern for all features:
```
User Action
  ↓
Store Action (via useStore.use.actions())
  ↓
[Optional: Backend API call via fetch('/api/...')]
  ↓
Store Update (via Immer mutation in action)
  ↓
Component Re-render (via selector reactivity)
```

### Inter-App Communication

Apps communicate via **6 mechanisms**:

1. **Shared Store Slices**: Multiple apps read/write same data (e.g., `chat`, `ideaLab`, `multiMindMap` share `assistantHistories`)
2. **Route Navigation with State**: `navigate('/app', { state: { data } })`
3. **Global Actions**: `showToast`, `setTheme` accessible everywhere
4. **Layout Slots**: Declare sidebars via `setLeftPane`/`setRightPane`
5. **Service Connection Events**: React to OAuth status changes
6. **First-Visit Flags**: Track onboarding per app (`firstVisit.appName`)

### Backend API Conventions

**Route Organization** (`server/routes/`):
- All routes prefixed with `/api/`
- Auth routes: `auth.js` (login, logout, OAuth)
- Service routes: `services.js` (connection management)
- Feature routes: `chat.js`, `models.js`, `rigging.js`, `driveImport.js`, etc.

**Route Registration** (`server/apiRouter.js`):
```javascript
import myRoute from './routes/myRoute.js';
router.use('/myroute', myRoute);
```

**Protected Routes**:
```javascript
import { requireAuth } from '../lib/authMiddleware.js';
router.get('/endpoint', requireAuth, async (req, res) => { ... });
```

**Error Handling**:
```javascript
try {
  // Implementation
  res.json({ success: true, data });
} catch (error) {
  console.error('[Context] Error:', error);
  res.status(500).json({ error: error.message });
}
```

### Vite Proxy Configuration

Development setup uses Vite proxy to route API calls to Express:

```javascript
// vite.config.js
proxy: {
  '/api': 'http://localhost:8081',
  '/auth': 'http://localhost:8081',
  '/metrics': 'http://localhost:8081',
  '/healthz': 'http://localhost:8081'
}
```

This makes frontend (3000) and backend (8081) appear as single server during dev.

---

## Environment Variables

**Required** (`.env`):
```bash
# Google OAuth (primary auth)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Encryption for OAuth tokens (MUST persist across restarts!)
ENCRYPTION_KEY=...  # Generate: openssl rand -hex 32

# Session
SESSION_SECRET=...

# Optional AI Providers
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
HUME_API_KEY=...
MESHY_API_KEY=...
```

**Critical**: `ENCRYPTION_KEY` must be persistent. If changed, all stored OAuth tokens become invalid.

---

## Key Files & Their Purpose

### Frontend Core
- `src/components/App.jsx` - Root layout orchestration, renders layout slots
- `src/shared/lib/store.js` - Zustand store (single source of truth)
- `src/shared/lib/routes.js` - React Router configuration
- `src/shared/lib/actions/assistantActions.js` - AI chat actions
- `src/shared/data/appManifests.js` - App metadata for dashboard

### Backend Core
- `server/index.js` - Express entry point
- `server/apiRouter.js` - Route aggregator
- `server/lib/authMiddleware.js` - `requireAuth` middleware
- `server/lib/encryptionUtils.js` - OAuth token encryption

### Micro-Apps (all in `src/apps/`)
Each app follows pattern: `index.jsx` (main), `components/` (app-specific), `lib/` (actions), `styles/` (CSS)

### Documentation
- `.gemini/project-overview.md` - Complete architecture (700+ lines)
- `docs/DATA_FLOW_ARCHITECTURE.md` - Data contracts, patterns, template
- `docs/DATA_FLOW_DIAGRAM.md` - Visual flow diagrams
- `docs/OAUTH_SETUP.md` - Service integration guide

---

## Adding New Features

### New Micro-App
1. Create `src/apps/myApp/index.jsx` following pattern:
   ```javascript
   export default function MyApp() {
     const setActiveApp = useStore.use.actions().setActiveApp;
     const { setLeftPane, clearLeftPane } = useLeftPane();

     useEffect(() => {
       setActiveApp('myApp');
       setLeftPane(<MySidebar />);
       return () => { clearLeftPane(); };
     }, [setActiveApp, setLeftPane, clearLeftPane]);

     return <MyMainContent />;
   }
   ```

2. Add store slice to `src/shared/lib/store.js`:
   ```javascript
   myApp: { data: null, isLoading: false, error: null },
   setMyAppData: (data) => set(state => { state.myApp.data = data; }),
   ```

3. Add route to `src/shared/lib/routes.js`:
   ```javascript
   { path: '/myapp', element: <MyApp /> }
   ```

4. Add manifest to `src/shared/data/appManifests.js`:
   ```javascript
   myapp: {
     id: 'myapp',
     name: 'My App',
     icon: 'icon_name',
     route: '/myapp',
     category: 'Productivity',
     // ...
   }
   ```

### New Backend Endpoint
1. Create `server/routes/myRoute.js`:
   ```javascript
   import express from 'express';
   import { requireAuth } from '../lib/authMiddleware.js';
   const router = express.Router();

   router.get('/endpoint', requireAuth, async (req, res) => {
     try {
       res.json({ success: true, data });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });

   export default router;
   ```

2. Register in `server/apiRouter.js`:
   ```javascript
   import myRoute from './routes/myRoute.js';
   router.use('/myroute', myRoute);
   ```

3. Call from frontend:
   ```javascript
   const response = await fetch('/api/myroute/endpoint', {
     credentials: 'include'
   });
   const data = await response.json();
   ```

---

## Known Issues & Technical Debt

1. **RAG endpoints not implemented** - Client code exists (`src/shared/lib/rag.js`) but `/api/rag/*` routes missing
2. **Calendar AI uses localStorage** - Should migrate to Zustand persist for consistency
3. **Mixed error handling** - No standard error UI pattern across apps
4. **No TypeScript** - Would catch many runtime errors
5. **Two `useAvailableModels` copies** - In both `src/hooks/` and `src/shared/hooks/`
6. **OAuth token refresh** - Not implemented, tokens expire after 1 hour

---

## Testing Conventions

**Jest** (ESM mode):
- Uses `NODE_OPTIONS=--experimental-vm-modules`
- API tests use Supertest
- Mock Zustand store in tests

**Vitest** (UI components):
- Uses jsdom environment
- React Testing Library patterns
- Stories in `src/**/*.stories.jsx`

---

## Style System

**Design Tokens** (`tokens/`):
- Source: Style Dictionary JSON
- Output: `src/styles/tokens/tokens.css`
- Command: `npm run tokens:build`

**Migration**:
- Old: `--spacing-*` (hard-coded values)
- New: `--space-*` (8px scale) or semantic tokens (`--panel-padding-*`)

**CSS Conventions**:
- Component classes: kebab-case (`.chat-sidebar`)
- App-specific prefix: `.app-name-*` (`.character-lab-viewer`)
- Shared components: Generic names (`.panel`, `.booth-header`)

---

## Changelog Convention

**Before committing**, append entry to `CHANGELOG.md`:
```bash
echo "$(date +%F): Short description of the change." >> CHANGELOG.md
git add CHANGELOG.md
```

For substantial changes, also update `docs/IMPLEMENTATION_NOTES.md`.

---

## Common Debugging Scenarios

**App not rendering?**
1. Check console for errors
2. Verify route exists in `src/shared/lib/routes.js`
3. Ensure `setActiveApp` called on mount
4. Check component is default export

**Store not updating?**
1. Verify using selector: `useStore.use.sliceName()`
2. Check action exists in `store.js`
3. Ensure Immer mutation in action (not returning new object)
4. Check if slice is initialized in store

**Backend API failing?**
1. Check Vite proxy config (`vite.config.js`)
2. Verify route registered in `apiRouter.js`
3. Check `requireAuth` middleware if getting 401
4. Check backend logs for error details

**OAuth redirect failing?**
1. Verify redirect URI in OAuth app config matches exactly
2. Check `FRONTEND_URL` environment variable
3. Verify callback route exists in `server/routes/auth.js`
4. Ensure `ENCRYPTION_KEY` is set and hasn't changed

---

## Performance Notes

- **Lazy loading**: Markmap and ReactFlow loaded on demand
- **Selector memoization**: `auto-zustand-selectors-hook` prevents unnecessary re-renders
- **Code splitting**: Vite automatically splits vendor chunks
- **Model discovery caching**: 5-second cache for `/api/models` endpoint
- **Static file serving**: Efficient with `express.static`

---

## Security Model

**Authentication**:
- JWT tokens in httpOnly cookies (prevents XSS)
- OAuth2 for third-party services
- Token encryption with AES-256-CBC

**API Security**:
- All AI calls proxied through backend
- API keys never exposed to client
- Input validation on all endpoints
- CORS restricted to `http://localhost:3000` (dev)

---

*For complete architectural details, see `.gemini/project-overview.md` and `docs/DATA_FLOW_ARCHITECTURE.md`*
