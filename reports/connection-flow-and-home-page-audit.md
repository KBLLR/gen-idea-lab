# Connection Flow & Home Page Architecture Audit

**Date:** 2025-10-12
**Issue:** Micro-app architecture lacks a proper home/dashboard page; service connections feel disconnected from app usage

---

## Current Architecture

### Routing Structure
```
/ → redirects to /idealab (default app)
/idealab, /chat, /imagebooth, /archiva, etc. → Individual micro-apps
```

**Problem:** No dedicated home/dashboard route. IdeaLab acts as default but it's still a micro-app.

### Service Connection Flow

1. **User Authentication** (`/auth/google`)
   - Handled in `App.jsx:64` via `checkAuthStatus()`
   - Sets `isAuthenticated` in global store

2. **Service Connections** (Google Drive, GitHub, Notion, etc.)
   - Managed through **SettingsModal** (`src/components/modals/SettingsModal.jsx`)
   - Shows service cards with "Connect" buttons
   - Uses OAuth flows to `/api/services/{service}/auth`
   - **After connection:** Redirects to `http://localhost:3000/?success=connected&service=googleDrive`
   - **Issue:** User lands at whatever app they were on before, no confirmation screen

3. **Connection State Management**
   - Fetched globally once after auth: `App.jsx:71-72`
     ```javascript
     fetchServiceConfig?.();
     fetchConnectedServices?.();
     ```
   - Stored in Zustand: `connectedServices` object
   - Each micro-app must check if needed services are connected

### Service Categories in Settings

**Productivity & Storage:**
- GitHub (repos, issues)
- Notion (workspace read/write)
- Google Drive (file access)
- Google Photos (library access)
- Google Calendar (events)
- Gmail (read/send emails)
- Figma (files, projects)

**AI Models & Services:**
- OpenAI, Google AI, Anthropic, etc.

---

## Problems Identified

### 1. **No Home/Dashboard**
- Root `/` just redirects to `/idealab`
- No central place to:
  - View all connected services at a glance
  - Quick-launch apps
  - See user profile/settings
  - Understand app ecosystem

### 2. **Disconnected Service Flow**
- User connects Drive in Settings modal → Gets redirected with query params → No visual feedback
- Connection status not visible until you open Settings again
- Each app must independently check `connectedServices` state

### 3. **Unclear App Discovery**
- 11 micro-apps but no catalog/launchpad
- AppSwitcher exists but it's buried in the dock
- No descriptions or onboarding for each app

### 4. **Service Scoping Issues**
- Google Drive connection is global, but only CharacterLab uses it
- No indication in Settings which apps use which services
- User doesn't know what they're enabling access for

---

## Recommended Solutions

### 1. **Create a Proper Dashboard/Home Page**

**Route:** `/` or `/home` or `/dashboard`

**Features:**
```
┌────────────────────────────────────────┐
│  Welcome, David                   ⚙️   │
├────────────────────────────────────────┤
│  Connected Services (4/7)              │
│  ✓ Google Drive  ✓ GitHub             │
│  ✓ Notion        ✓ OpenAI             │
│  [ Connect More Services ]             │
├────────────────────────────────────────┤
│  Your Apps                             │
│  ┌──────┐ ┌──────┐ ┌──────┐           │
│  │ Idea │ │ Chat │ │Image │           │
│  │ Lab  │ │      │ │Booth │           │
│  └──────┘ └──────┘ └──────┘           │
│  ┌──────┐ ┌──────┐ ┌──────┐           │
│  │Charac│ │Plann │ │Archi │           │
│  │ ter  │ │ er   │ │ va   │           │
│  └──────┘ └──────┘ └──────┘           │
├────────────────────────────────────────┤
│  Recent Activity                       │
│  • Imported model from Drive (2m ago) │
│  • Generated image in ImageBooth      │
└────────────────────────────────────────┘
```

**Implementation:**
- Create `src/apps/home/index.jsx`
- Add route: `<Route path="/" element={<Home />} />`
- Show `AppHomeBlock` components with app cards
- Service connection status widget
- Quick actions for common tasks

### 2. **Improve Service Connection Feedback**

**Current:** `/?success=connected&service=googleDrive`
**Better:** Redirect to dashboard with toast notification

```javascript
// In server/oauth/callbacks.js
res.redirect(`${front}/?modal=services&connected=${service}`);
```

Then in App.jsx, detect query param and show success toast:
```javascript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const connected = params.get('connected');
  if (connected) {
    toast.success(`${connected} connected successfully!`);
    // Clean URL
    window.history.replaceState({}, '', '/');
  }
}, []);
```

### 3. **Service-to-App Mapping**

Add metadata to each micro-app about which services it uses:

```javascript
// src/apps/characterLab/manifest.js
export const manifest = {
  id: 'characterlab',
  name: 'Character Lab',
  description: '3D character rigging and optimization',
  requiredServices: ['googleDrive'],  // <-- NEW
  optionalServices: [],
  icon: 'view_in_ar',
  category: '3D & Creative',
};
```

Then in Settings, show which apps use each service:
```
┌─────────────────────────────────────┐
│ Google Drive                   ✓   │
│ Access your Drive files             │
│                                     │
│ Used by:                            │
│ • Character Lab (import models)     │
│ • Planner (sync documents)          │
└─────────────────────────────────────┘
```

### 4. **Persistent Layout**

Keep AppSwitcher, UserBar, and Service Status visible across all routes:

```javascript
// App.jsx structure
<div className="app-shell">
  <TopBar>
    <AppSwitcher />
    <UserBar />
    <ServiceStatus />
  </TopBar>

  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/idealab" element={<IdeaLabApp />} />
    {/* other apps */}
  </Routes>
</div>
```

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 hours)
1. Fix OAuth redirect to show feedback
2. Add toast notification for successful connections
3. Clean up URL query params after redirect

### Phase 2: Dashboard (3-4 hours)
1. Create `/home` route with AppHomeBlock grid
2. Service connection status widget
3. Update root `/` to redirect to `/home`

### Phase 3: Enhanced UX (2-3 hours)
1. Add app manifests with service dependencies
2. Update Settings to show service-to-app mapping
3. Add connection warnings when launching apps

---

## Files to Modify

### Immediate:
- `server/oauth/callbacks.js` - Better redirect handling
- `server/config/env.js` - Remove debug console.logs
- `src/components/App.jsx` - Add toast for connection success

### Dashboard:
- `src/apps/home/index.jsx` (NEW)
- `src/main.jsx` - Add `/` route
- `src/components/ui/organisms/AppHomeBlock.jsx` - Use for app grid
- `src/shared/lib/routes.js` - Add home route

### Enhanced:
- Each app's `manifest.js` - Add service dependencies
- `src/components/modals/SettingsModal.jsx` - Show app usage

---

## Conclusion

The micro-app architecture is solid, but it needs a **home base**. Without a dashboard, users feel lost after authentication and service connections lack context.

**Recommended Next Step:** Create a simple dashboard at `/` that shows connected services and app launcher grid. This gives users a sense of control and makes the multi-app experience cohesive.
