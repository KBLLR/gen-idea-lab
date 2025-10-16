# GEMINI.md

> **Project Context for Gemini CLI**
> **Last Updated**: 2025-10-16

## Quick Reference

**What is this project?** A micro-app platform for creative AI workflows built with React + Vite frontend and Express backend.

**Architecture**: 13 independent apps communicating via Zustand store, zero prop passing, layout slot system.

**Stack**: React 18, Vite 5, Zustand 4, Express 4, Node.js 20+, ES Modules throughout.

---

## Before You Start

### Read These First
1. **`.gemini/project-overview.md`** - Complete architecture reference (700+ lines)
2. **`docs/DATA_FLOW_ARCHITECTURE.md`** - Data contracts, patterns, app template
3. **`docs/DATA_FLOW_DIAGRAM.md`** - Visual diagrams

### Quick Commands
```bash
npm run dev          # Full stack (Vite:3000 + Express:8081)
npm run dev:client   # Frontend only
npm run dev:server   # Backend only
npm test            # Jest tests
npm run build       # Production build
```

---

## Key Architecture Rules

### ✅ Always Do
1. **Use selectors for store reads**: `useStore.use.sliceName()`
2. **Use actions for mutations**: `useStore.use.actions().actionName()`
3. **Register app on mount**: `setActiveApp('appName')`
4. **Clean up panes**: Return cleanup from useEffect
5. **Check service status**: Before calling service APIs
6. **Prefix API routes**: All backend routes start with `/api/`

### ❌ Never Do
1. **Pass props between apps** - Use store
2. **Import one app from another** - Creates coupling
3. **Mutate store directly** - Always use actions
4. **Use localStorage for shared data** - Use Zustand persist
5. **Hardcode API URLs** - Use relative `/api/...`
6. **Forget useEffect cleanup** - Always return cleanup

---

## File Organization

```
genbooth-idea-lab/
├── src/apps/           # 13 micro-apps (independent, no cross-imports)
│   ├── home/           # Dashboard launcher
│   ├── chat/           # Multi-agent AI chat
│   ├── ideaLab/        # Module workspace
│   └── ...
├── src/shared/lib/
│   ├── store.js        # Zustand store (543 lines, single source of truth)
│   ├── routes.js       # React Router config
│   └── actions/        # Async actions (backend calls)
├── server/routes/      # Express API routes (all prefixed /api/)
├── docs/               # Architecture docs (start here!)
└── .gemini/            # Gemini CLI config
```

---

## Data Flow Pattern

**Standard flow for all features**:
```
User Action
  ↓
Store Action (useStore.use.actions().actionName())
  ↓
[Optional: Backend API call via fetch('/api/...')]
  ↓
Store Update (via Immer mutation in action)
  ↓
Component Re-render (via selector reactivity)
```

---

## Common Tasks

### Adding a New Micro-App
1. Create `src/apps/myApp/index.jsx` following template in `docs/DATA_FLOW_ARCHITECTURE.md`
2. Add store slice to `src/shared/lib/store.js`
3. Add route to `src/shared/lib/routes.js`
4. Add manifest to `src/shared/data/appManifests.js`
5. Follow 14-point checklist in architecture docs

### Adding a Backend Endpoint
1. Create `server/routes/myRoute.js`
2. Register in `server/apiRouter.js`
3. Use `requireAuth` middleware for protected routes
4. Return JSON, handle errors with try/catch
5. Call from frontend with `fetch('/api/myroute/endpoint')`

### Debugging Store Issues
1. Check Zustand DevTools (if installed)
2. Verify selector pattern: `useStore.use.sliceName()`
3. Ensure action returns from `useStore.use.actions()`
4. Check if slice exists in store.js
5. Verify cleanup in useEffect return

---

## Known Issues (Technical Debt)

1. **RAG endpoints missing** - Client code exists but `/api/rag/*` not implemented
2. **Calendar AI uses localStorage** - Should migrate to Zustand persist
3. **Mixed error handling** - No standard pattern across apps
4. **No TypeScript** - Would catch many bugs
5. **Two `useAvailableModels` copies** - In `hooks/` and `shared/hooks/`

---

## Environment Setup

**Required in `.env`**:
```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ENCRYPTION_KEY=...  # Generate: openssl rand -hex 32 (must persist!)
SESSION_SECRET=...

# Optional AI providers
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
HUME_API_KEY=...
MESHY_API_KEY=...
```

**Ports**:
- Frontend: 3000 (Vite)
- Backend: 8081 (Express)
- Proxy: Vite → Backend for `/api`, `/auth`, `/metrics`, `/healthz`

---

## Repository Conventions

- The app is a full-stack React + Express project. Frontend lives in `src/`, backend entry is `server.js`.
- Zustand selectors use the `useStore.use.sliceName()` helper—mirror that pattern in new components.
- All AI provider calls flow through the Express proxy at `/api/proxy`; never call third-party APIs directly from the client.
- When adding new tokens/styles, update the Style Dictionary config under `tokens/` and rebuild with `npm run tokens:build`.
- Tests rely on the Jest ESM flag (`NODE_OPTIONS=--experimental-vm-modules`). Keep imports ESM-compatible.
- **UI Spacing Migration**: When touching app-specific styles, migrate hard‑coded `--spacing-*` to the new 8px tokens (`--space-*`) or semantic tokens (`--panel-padding-*`, `--gutter-*`, `--stack-gap-*`) to gradually converge.

---

## Observability & Ops

- Health endpoint: `GET /healthz`
- Metrics endpoint: `GET /metrics` (Prometheus format)
- Server logging: Winston (`logger` in `server.js`)
- Client error surfaces: check `src/lib/actions.js` handlers for toast/reporting patterns

---

## Changelog Update (Before Commit & Push)

Always update the changelog for traceability.

Example:
```bash
echo "$(date +%F): Short description of the change." >> CHANGELOG.md
git add CHANGELOG.md
git add -A && git commit -m "chore(changelog): update for <feature/area>" && git push
```

For larger changes, add a short note to `docs/IMPLEMENTATION_NOTES.md`.

---

## App Communication

Apps communicate via **6 mechanisms** (see `docs/DATA_FLOW_ARCHITECTURE.md` for details):

1. **Shared Store Slices** - Multiple apps read/write same data
2. **Route Navigation with State** - `navigate('/app', { state: { data } })`
3. **Global Actions** - Toast, theme, settings accessible everywhere
4. **Layout Slots** - Declare sidebars via `setLeftPane`/`setRightPane`
5. **Service Connection Events** - React to OAuth status changes
6. **First-Visit Flags** - Track onboarding per app

---

## Frequently Asked Questions

**Q: Why no props between apps?**
A: Apps must be independently mountable. Store ensures loose coupling.

**Q: When should I use localStorage vs Zustand?**
A: Never use localStorage for shared data. Use Zustand with persist middleware.

**Q: How do apps share state?**
A: Via shared store slices. Example: `chat`, `ideaLab`, and `multiMindMap` share `assistantHistories`.

**Q: Can I import one app from another?**
A: No. Creates circular dependencies. Use store or navigation with state.

**Q: Where do I put shared components?**
A: `src/shared/components/` for truly shared, `src/components/ui/` for UI primitives.

**Q: How do I add a new backend route?**
A: Create in `server/routes/`, register in `apiRouter.js`, prefix with `/api/`.

**Q: Why is Vite proxy important?**
A: During dev, frontend (3000) and backend (8081) are separate. Proxy makes them appear as one server.

**Q: How do I debug "undefined is not a function" in store?**
A: Check if action exists in store.js. Ensure using `useStore.use.actions()` not `useStore(s => s.actions)`.

---

## Emergency Fixes

**App not rendering?**
1. Check console for errors
2. Verify route in `routes.js`
3. Ensure `setActiveApp` called on mount
4. Check if component exported as default

**Store not updating?**
1. Verify using selector: `useStore.use.sliceName()`
2. Check action exists in store.js
3. Ensure Immer mutation in action
4. Check if slice initialized in store

**Backend API not working?**
1. Check Vite proxy config
2. Verify route registered in apiRouter.js
3. Check `requireAuth` middleware if 401
4. Check CORS if different origin
5. Check backend logs for error

**OAuth redirect failing?**
1. Verify redirect URI in OAuth app config
2. Check FRONTEND_URL env var
3. Verify callback route exists
4. Check ENCRYPTION_KEY is set and persistent

---

## When You're Stuck

1. **Read the docs**: Start with `.gemini/project-overview.md`
2. **Check examples**: Look at existing apps (Home, Chat, Image Booth)
3. **Trace data flow**: Use `docs/DATA_FLOW_DIAGRAM.md`
4. **Check dependencies**: See app dependency graph in architecture docs
5. **Ask specific questions**: Reference specific files and line numbers

---

## Code Review Checklist

Before submitting changes:

- [ ] Follows architecture patterns in `docs/DATA_FLOW_ARCHITECTURE.md`
- [ ] Uses `useStore.use.sliceName()` for selectors
- [ ] Uses `useStore.use.actions()` for mutations
- [ ] Cleans up panes in useEffect return
- [ ] No direct app imports (apps isolated)
- [ ] API routes prefixed with `/api/`
- [ ] Error handling with try/catch
- [ ] Loading states in store
- [ ] Toast notifications for user feedback
- [ ] CSS scoped to app (`.app-name-*` prefix)
- [ ] Tests added/updated
- [ ] CHANGELOG.md updated
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in dev mode

---

*For complete details, see `.gemini/project-overview.md` and `docs/DATA_FLOW_ARCHITECTURE.md`*
