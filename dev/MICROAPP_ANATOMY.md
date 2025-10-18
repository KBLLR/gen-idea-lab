# Micro-App Anatomy - Complete Reference

**Last Updated:** 2025-10-17
**Purpose:** Definitive guide for micro-app structure, patterns, and requirements in GenBooth Idea Lab

---

## Table of Contents
1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [UI Patterns](#ui-patterns)
4. [Data Handling](#data-handling)
5. [Agency & AI Integration](#agency--ai-integration)
6. [Service Integration](#service-integration)
7. [Lifecycle Management](#lifecycle-management)
8. [App Variants](#app-variants)
9. [Template Model](#template-model)

---

## Overview

A **micro-app** in GenBooth is an independent React component that:
- Mounts via React Router at `/appname`
- Registers itself in the global store with `setActiveApp('appname')`
- Declares UI via layout slots (no direct layout control)
- Communicates with other apps **only** through Zustand store
- Follows strict architectural conventions for maintainability

**Zero prop-passing between apps** - all communication via store.

---

## File Structure

### Minimal Structure
```
src/apps/myapp/
├── index.jsx                 # App entry point (required)
├── components/               # App-specific components
│   ├── MyAppSidebar.jsx     # Left pane content
│   ├── MyAppCenter.jsx      # Main content area
│   └── MyAppPanel.jsx       # Optional right pane
└── styles/
    └── myapp.css            # App-specific styles
```

### Full Structure (with advanced features)
```
src/apps/myapp/
├── index.jsx                 # Entry point
├── components/
│   ├── MyAppSidebar.jsx     # Left pane
│   ├── MyAppCenter.jsx      # Main area
│   ├── MyAppPanel.jsx       # Right pane
│   ├── MyAppHeader.jsx      # Optional header
│   └── ...                  # Feature components
├── lib/
│   ├── myappActions.js      # App-specific actions (optional)
│   ├── myappHelpers.js      # Utility functions
│   └── myappConstants.js    # Constants/config
└── styles/
    └── myapp.css            # Scoped styles
```

---

## UI Patterns

### Pattern 1: Single Layout (Left Pane Only)
**Used by:** Image Booth, Empathy Lab, Gesture Lab, Workflows

```javascript
import { useLeftPane } from '@shared/lib/layoutSlots';

export default function MyApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();

  useEffect(() => {
    setActiveApp('myapp');
    setLeftPane(<MyAppSidebar />);
    return () => clearLeftPane();
  }, [setActiveApp, setLeftPane, clearLeftPane]);

  return <MyAppCenter />;
}
```

**Layout:** `[Sidebar] [Main Content]`

---

### Pattern 2: Three-Column Layout (Left + Right)
**Used by:** Chat, Character Lab, Planner, Idea Lab

```javascript
import { useLeftPane, useRightPane } from '@shared/lib/layoutSlots';

export default function MyApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();
  const { setRightPane, clearRightPane } = useRightPane();
  const [showRightPane, setShowRightPane] = useState(false);

  useEffect(() => {
    setActiveApp('myapp');
    setLeftPane(<MyAppSidebar />);

    if (showRightPane) {
      setRightPane(<MyAppPanel />);
    } else {
      clearRightPane();
    }

    return () => {
      clearLeftPane();
      clearRightPane();
    };
  }, [setActiveApp, showRightPane]);

  return <MyAppCenter onTogglePanel={() => setShowRightPane(!showRightPane)} />;
}
```

**Layout:** `[Sidebar] [Main Content] [Right Panel]`

---

### Pattern 3: Minimal Layout (No Sidebar)
**Used by:** Dashboard (Home), Kanban

```javascript
export default function MyApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;

  useEffect(() => {
    setActiveApp('myapp');
    return () => {}; // Cleanup if needed
  }, [setActiveApp]);

  return <MyAppCenter />;
}
```

**Layout:** `[Full Width Content]`

---

### First Visit Experience Pattern
**Used by:** Image Booth, Empathy Lab, Idea Lab

```javascript
import AppHomeBlock from '@components/ui/organisms/AppHomeBlock.jsx';
import { appHomeContent } from '@components/ui/organisms/appHomeContent.js';

export default function MyApp() {
  const isFirstVisit = useStore(s => s.firstVisit?.myapp);
  const dismissFirstVisit = useStore(s => s.actions?.dismissFirstVisit);
  const content = appHomeContent.myapp;

  return (
    <div style={{ position: 'relative' }}>
      {isFirstVisit && (
        <div className="app-first-visit">
          <AppHomeBlock
            icon={content.icon}
            title={content.title}
            subtitle={content.subtitle}
            description={content.description}
            tips={content.tips}
          >
            <button
              className="btn primary"
              onClick={() => dismissFirstVisit?.('myapp')}
            >
              Got it
            </button>
          </AppHomeBlock>
        </div>
      )}
      <MyAppContent />
    </div>
  );
}
```

---

## Data Handling

### Store Slice Pattern

Every app can have a dedicated store slice in `/src/shared/lib/store.js`:

```javascript
// In store.js
myapp: {
  data: null,
  isLoading: false,
  error: null,
  selectedItem: null,
  preferences: {
    viewMode: 'grid',
    sortBy: 'date',
  },
  ui: {
    showPanel: false,
    activeTab: 'overview',
  },
},

// Actions
setMyAppData: (data) => set(state => { state.myapp.data = data; }),
setMyAppLoading: (loading) => set(state => { state.myapp.isLoading = loading; }),
setMyAppError: (error) => set(state => { state.myapp.error = error; }),
updateMyAppPreferences: (prefs) => set(state => {
  state.myapp.preferences = { ...state.myapp.preferences, ...prefs };
}),
```

### Usage in Components

```javascript
// Read from store
const myappData = useStore.use.myapp();
const preferences = useStore.use.myapp().preferences;
const isLoading = useStore.use.myapp().isLoading;

// Write to store
const setMyAppData = useStore.use.actions().setMyAppData;
const updatePrefs = useStore.use.actions().updateMyAppPreferences;
```

### Persistence Pattern

Apps can opt-in to localStorage persistence:

```javascript
// Add to persist whitelist in store.js
persist(
  immer(storeImpl),
  {
    name: 'genbooth-store',
    partialize: (state) => ({
      // ... other persisted state
      myapp: state.myapp,  // Add your app
    }),
  }
)
```

---

## Data Layer Integration

### API Endpoints Pattern

Add endpoints to `/src/shared/lib/dataLayer/endpoints.js`:

```javascript
export const api = {
  // ... other endpoints

  myapp: {
    /**
     * Get items
     * @returns {Promise<{items: Array<Object>}>}
     */
    getItems: async () => {
      const response = await fetch('/api/myapp/items', {
        credentials: 'include',
      });
      return parseResponse(response);
    },

    /**
     * Create item
     * @param {Object} payload - Item data
     * @returns {Promise<{id: string}>}
     */
    createItem: async (payload) => {
      const response = await fetch('/api/myapp/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      return parseResponse(response);
    },
  },
};

// Query keys for caching
export const queryKeys = {
  // ... other keys
  myappItems: 'myapp-items',
  myappItem: (id) => `myapp-item-${id}`,
};
```

### Using Data Layer in Components

```javascript
import { useQuery, useMutation } from '@shared/hooks';
import { api, queryKeys } from '@shared/lib/dataLayer/endpoints.js';

function MyAppComponent() {
  // Fetch data
  const { data, isLoading, error, refetch } = useQuery(
    queryKeys.myappItems,
    api.myapp.getItems,
    {
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: true,
    }
  );

  // Mutate data
  const createItem = useMutation(
    api.myapp.createItem,
    {
      onSuccess: () => {
        // Refetch items after creation
        refetch();
      },
    }
  );

  const handleCreate = async () => {
    await createItem.mutateAsync({ name: 'New Item' });
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {data?.items?.map(item => <div key={item.id}>{item.name}</div>)}
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}
```

**Note:** Most apps currently use direct store mutations instead of useQuery/useMutation. This is being migrated incrementally.

---

## Agency & AI Integration

### Pattern 1: Direct AI Integration
**Used by:** Chat, Idea Lab

Apps can directly call AI models via the proxy:

```javascript
const response = await api.chat.complete({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }],
});
```

### Pattern 2: Orchestrator Tool Integration
**Used by:** Planner (planned), Archiva (planned)

Apps can register tools for the orchestrator to call:

```javascript
// In orchestrator tools registry
{
  name: 'myapp_action',
  description: 'Perform action in MyApp',
  parameters: {
    action: { type: 'string', enum: ['create', 'update', 'delete'] },
    data: { type: 'object' },
  },
  execute: async (params) => {
    // Call app action via store
    const action = useStore.getState().actions.performMyAppAction;
    return await action(params);
  },
}
```

### Pattern 3: AI Assistant Agents
**Used by:** Idea Lab (module assistants)

Apps can have dedicated AI assistants with personality/context:

```javascript
const assistantHistory = useStore.use.assistantHistories()[myAssistantId];
const sendMessage = useStore.use.actions().sendMessage;

await sendMessage({
  assistantId: myAssistantId,
  personality: 'expert',
  context: 'My app context...',
  message: userInput,
});
```

---

## Service Integration

### Required vs Optional Services

Defined in app manifest (`appManifests.js`):

```javascript
{
  requiredServices: ['googleDrive'],  // App cannot function without
  optionalServices: ['openai', 'notion'],  // Enhanced functionality
}
```

### Checking Service Status

```javascript
const connectedServices = useStore.use.connectedServices();
const isDriveConnected = connectedServices?.googleDrive?.connected;

// Conditional rendering
if (!isDriveConnected) {
  return <ConnectServicePrompt serviceId="googleDrive" />;
}
```

### Service-Specific API Calls

```javascript
// Google Drive example
const files = await api.googleDrive.files({ folderId: 'root' });

// Gmail example
const messages = await api.gmail.messages({ maxResults: 10 });

// GitHub example
const repos = await api.github.repos();
```

---

## Lifecycle Management

### Mount/Unmount Pattern

```javascript
useEffect(() => {
  // 1. Register app
  setActiveApp('myapp');

  // 2. Set up UI
  setLeftPane(<MySidebar />);

  // 3. Initialize data
  loadInitialData();

  // 4. Start polling (if needed)
  const interval = setInterval(pollUpdates, 5000);

  // 5. Cleanup on unmount
  return () => {
    clearLeftPane();
    clearRightPane();
    clearInterval(interval);
    // Clean up app-specific resources
  };
}, []);
```

### Polling Pattern

```javascript
useEffect(() => {
  if (!shouldPoll) return;

  const pollInterval = setInterval(async () => {
    try {
      const data = await api.myapp.getItems();
      setMyAppData(data);
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 5000);

  return () => clearInterval(pollInterval);
}, [shouldPoll]);
```

---

## App Variants

### Variant A: Data Visualization App
**Examples:** Dashboard, Kanban, Calendar AI

**Characteristics:**
- Displays data from external services
- Read-heavy, minimal mutations
- Grid/list/calendar views
- Filtering and search

**Template Features:**
- Data fetching with useQuery
- View switcher (grid/list/calendar)
- Search/filter sidebar
- Export functionality

---

### Variant B: Creative/Generation App
**Examples:** Image Booth, Character Lab

**Characteristics:**
- AI-powered content generation
- User input forms
- Preview/gallery views
- Export/download functionality

**Template Features:**
- Generation form with presets
- Progress indicators
- Gallery/history view
- Download/share actions

---

### Variant C: Canvas/Editor App
**Examples:** Planner, Multi Mind Map

**Characteristics:**
- Visual canvas (React Flow, Canvas API)
- Drag-and-drop interactions
- Nodes/connections/shapes
- Save/load workflows

**Template Features:**
- Canvas component (React Flow)
- Toolbar with node types
- Minimap/controls
- JSON export/import

---

### Variant D: Interactive/Real-time App
**Examples:** Empathy Lab, Gesture Lab, Chat

**Characteristics:**
- Real-time data streams (webcam, voice, chat)
- WebSocket/SSE connections
- Immediate visual feedback
- Recording/playback features

**Template Features:**
- Media stream handling
- Real-time data processing
- Visual overlays/annotations
- Session recording

---

## Template Model

### Base Template Structure

```javascript
// src/apps/myapp/index.jsx
import React, { useEffect } from 'react';
import useStore from '@store';
import { useLeftPane, useRightPane } from '@shared/lib/layoutSlots';
import MyAppSidebar from './components/MyAppSidebar.jsx';
import MyAppCenter from './components/MyAppCenter.jsx';
import './styles/myapp.css';

export default function MyApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();
  const { clearRightPane } = useRightPane();

  useEffect(() => {
    setActiveApp('myapp');
    setLeftPane(<MyAppSidebar />);
    return () => {
      clearLeftPane();
      clearRightPane();
    };
  }, [setActiveApp, setLeftPane, clearLeftPane, clearRightPane]);

  return <MyAppCenter />;
}
```

### Manifest Entry Template

```javascript
// src/shared/data/appManifests.js
export const APP_MANIFESTS = {
  // ... other apps

  myapp: {
    id: 'myapp',
    name: 'My App',
    shortName: 'My App',
    description: 'Brief one-line description',
    longDescription: 'Detailed description of what the app does and its key features.',
    icon: 'material_icon_name',  // Google Material Icon
    color: '#FF5733',  // Primary accent color
    category: 'Productivity',  // Productivity | Creative | AI & Research | Automation
    route: '/myapp',
    requiredServices: [],  // ['googleDrive', 'openai']
    optionalServices: [],  // ['notion', 'github']
    features: [
      'Feature 1 description',
      'Feature 2 description',
      'Feature 3 description',
      'Feature 4 description',
    ],
    tags: ['Tag1', 'Tag2', 'Tag3'],
    status: 'stable',  // 'stable' | 'beta' | 'alpha'
  },
};
```

### Route Registration

```javascript
// src/shared/lib/routes.js
import MyApp from '@apps/myapp';

const routes = [
  // ... other routes
  { path: '/myapp', element: <MyApp /> },
];
```

### Store Slice Template

```javascript
// In src/shared/lib/store.js

myapp: {
  // Data
  items: [],
  selectedItem: null,

  // UI state
  isLoading: false,
  error: null,

  // User preferences
  preferences: {
    viewMode: 'grid',
    sortBy: 'date',
    showAdvanced: false,
  },

  // Session state (not persisted)
  ui: {
    showSidebar: true,
    activeTab: 'overview',
  },
},

// Actions
setMyAppItems: (items) => set(state => { state.myapp.items = items; }),
setMyAppSelectedItem: (item) => set(state => { state.myapp.selectedItem = item; }),
setMyAppLoading: (loading) => set(state => { state.myapp.isLoading = loading; }),
setMyAppError: (error) => set(state => { state.myapp.error = error; }),
updateMyAppPreferences: (prefs) => set(state => {
  state.myapp.preferences = { ...state.myapp.preferences, ...prefs };
}),
toggleMyAppSidebar: () => set(state => {
  state.myapp.ui.showSidebar = !state.myapp.ui.showSidebar;
}),
```

---

## Checklist for New Apps

### Required Files
- [ ] `src/apps/myapp/index.jsx` - Entry point
- [ ] `src/apps/myapp/components/MyAppCenter.jsx` - Main content
- [ ] `src/apps/myapp/components/MyAppSidebar.jsx` - Left pane (if needed)
- [ ] `src/apps/myapp/styles/myapp.css` - App styles
- [ ] Entry in `src/shared/data/appManifests.js`
- [ ] Route in `src/shared/lib/routes.js`

### Store Integration
- [ ] Add store slice in `src/shared/lib/store.js`
- [ ] Add actions for mutations
- [ ] Add to persist whitelist (if needed)
- [ ] Use `useStore.use.myapp()` for selectors

### Data Layer (if using backend)
- [ ] Add endpoints to `src/shared/lib/dataLayer/endpoints.js`
- [ ] Add query keys
- [ ] Create backend routes in `server/routes/myapp.js`
- [ ] Register route in `server/apiRouter.js`

### UI Components
- [ ] Use layout slots (`setLeftPane`, `setRightPane`)
- [ ] Call `setActiveApp` on mount
- [ ] Clean up panes on unmount
- [ ] Add first-visit experience (optional)

### Testing
- [ ] Test app mounting/unmounting
- [ ] Test store integration
- [ ] Test API calls (if applicable)
- [ ] Test cross-app navigation
- [ ] Test service integrations (if required)

---

## Anti-Patterns (Don't Do This!)

❌ **Passing props between apps**
```javascript
// Wrong!
<ChatApp data={ideaLabData} />
```

✅ **Use store instead**
```javascript
// Correct!
const data = useStore.use.ideaLab().data;
```

---

❌ **Importing one app from another**
```javascript
// Wrong!
import { ChatComponent } from '@apps/chat';
```

✅ **Navigate or use shared components**
```javascript
// Correct!
import { SharedComponent } from '@shared/components';
navigate('/chat');
```

---

❌ **Direct layout manipulation**
```javascript
// Wrong!
<div className="app-with-sidebar">
  <Sidebar />
  <Content />
</div>
```

✅ **Use layout slots**
```javascript
// Correct!
setLeftPane(<Sidebar />);
return <Content />;
```

---

❌ **Inline store selectors**
```javascript
// Wrong! (re-computes on every store change)
const data = useStore(s => s.myapp.data);
```

✅ **Use pre-memoized selectors**
```javascript
// Correct! (only re-renders when myapp changes)
const myapp = useStore.use.myapp();
const data = myapp.data;
```

---

## Summary

A robust micro-app in GenBooth:

1. **Follows file structure conventions** - predictable locations
2. **Uses layout slots** - no direct layout control
3. **Communicates via store** - zero prop-passing
4. **Registers on mount** - `setActiveApp('myapp')`
5. **Cleans up on unmount** - clear panes, stop intervals
6. **Uses data layer** - centralized API calls
7. **Integrates with services** - OAuth-aware
8. **Has manifest entry** - metadata for dashboard
9. **Has route registration** - accessible via URL
10. **Has store slice** - app-specific state

**Result:** Apps are independent, maintainable, and can be generated automatically with this template model.

---

**Next Step:** Build the app generator tool using this anatomy as the blueprint.
