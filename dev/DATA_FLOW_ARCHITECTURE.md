# Data Flow Architecture

> **Last Updated**: 2025-10-16
> **Author**: Architecture Analysis

## Overview

This document defines the data flow patterns, contracts, and inter-app communication mechanisms for the GenBooth Idea Lab micro-app architecture.

## Architecture Principles

### 1. **Centralized State (Zustand Store)**
- All shared state lives in the Zustand store (`src/shared/lib/store.js`)
- Apps NEVER pass props to each other
- Apps communicate exclusively through the store
- Each app is independently mountable

### 2. **Unidirectional Data Flow**
```
User Action → Store Action → Store Update → Component Re-render
     ↓
  Backend API Call (optional)
     ↓
  Response → Store Action → Store Update → Component Re-render
```

### 3. **Store Slice Isolation**
- Each app can have its own slice in the store
- Slices are flat at the top level (for selector efficiency)
- Actions are grouped in `actions` proxy for discoverability

---

## Store Structure

### Core Slices (Top-Level)

#### Authentication Slice (`authSlice.js`)
```javascript
{
  user: { name, email, picture } | null,
  isAuthChecking: boolean,
  // Actions: login, logout, checkAuth
}
```

**Used by**: Home, all apps (for user display)

#### Service Connection Slice (`serviceConnectionSlice.js`)
```javascript
{
  connectedServices: {
    github: { connected: boolean, email: string },
    notion: { connected: boolean, email: string },
    googleDrive: { connected: boolean, email: string },
    googleCalendar: { connected: boolean, email: string },
    openai: { connected: boolean, email: string },
    // ... etc
  },
  // Actions: fetchConnectedServices, connectService, disconnectService
}
```

**Used by**: Home, Calendar AI, Character Lab, Planner, Idea Lab

#### App Switching Slice (`appSwitchingSlice.js`)
```javascript
{
  activeApp: string | null,
  leftPane: ReactNode | null,
  rightPane: ReactNode | null,
  // Actions: setActiveApp, setLeftPane, setRightPane, clearLeftPane, clearRightPane
}
```

**Used by**: All apps (registration), App.jsx (layout rendering)

#### Rigging Tasks Slice (`riggingTasksSlice.js`)
```javascript
{
  riggingTasks: {
    [taskId]: {
      id: string,
      status: 'pending' | 'processing' | 'completed' | 'failed',
      progress: number,
      modelUrl: string,
      createdAt: timestamp,
      // ... other fields
    }
  },
  selectedTaskId: string | null,
  // Actions: submitRiggingTask, updateTaskStatus, removeRiggingTask, pollAllTasks
}
```

**Used by**: Character Lab

#### Tasks Slice (`tasksSlice.js`)
```javascript
{
  tasks: {
    byId: { [taskId]: Task },
    allIds: string[]
  },
  lanes: {
    todo: string[],
    doing: string[],
    done: string[]
  },
  selectedTaskId: string | null,
  // Actions: createTask, updateTask, deleteTask, moveTask, bulkUpsertTasks
}
```

**Used by**: Kanban

### App-Specific Slices

#### Assistant State (Chat, Idea Lab, Multi Mind Map)
```javascript
{
  // Chat history per module
  assistantHistories: {
    [moduleId]: [
      { role: 'user' | 'assistant', content: string, chatId: string, fromAgentName?: string }
    ]
  },

  // Active chat session
  activeChatId: string | null,

  // Chat loading state
  isAssistantLoading: boolean,

  // Model selection
  assistantModel: { id: string, name: string, provider: string },

  // System prompts per module
  assistantSystemPrompts: {
    [moduleId]: string
  },

  // Saved chat sessions
  moduleAssistantSavedChats: {
    [moduleId]: {
      [chatId]: {
        id: string,
        title: string,
        messages: Message[],
        createdAt: timestamp,
        updatedAt: timestamp
      }
    }
  },

  // Actions: sendMessage, startNewChat, saveAssistantChat, loadChat, setAssistantModel
}
```

**Used by**: Chat, Idea Lab, Multi Mind Map

#### Module State (Idea Lab, Chat)
```javascript
{
  activeModuleId: string | null,  // Currently selected module
  modules: { [moduleId]: ModuleMeta },  // Static module definitions
  showKnowledgeSection: boolean,
  // Actions: setActiveModuleId, toggleKnowledgeSection
}
```

**Used by**: Idea Lab, Chat, Multi Mind Map

#### Image Generation State (Image Booth)
```javascript
{
  inputImage: string | null,  // Base64 or URL
  outputImage: string | null,  // Base64 or URL
  isGenerating: boolean,
  generationError: string | null,
  activeModeKey: string,  // Selected generation mode
  imageProvider: 'gemini' | 'openai' | 'drawthings',
  imageModel: string,
  // Actions: generateImage, setInputImage, setOutputImage, setImageProvider
}
```

**Used by**: Image Booth

#### Planner State
```javascript
{
  plannerGraph: {
    nodes: ReactFlowNode[],
    edges: ReactFlowEdge[]
  },
  workflowAutoTitleModel: { id: string, name: string },
  // Actions: setNodes, setEdges, addCustomWorkflow
}
```

**Used by**: Planner

#### Archiva State
```javascript
{
  archivaEntries: {
    [entryId]: {
      id: string,
      templateKey: string,
      fields: { [fieldKey]: any },
      createdAt: timestamp,
      updatedAt: timestamp
    }
  },
  activeEntryId: string | null,
  selectedTemplateForPreview: string | null,
  // Actions: createArchivaEntry, updateArchivaEntry, deleteArchivaEntry, setActiveEntryId
}
```

**Used by**: Archiva

#### Empathy Lab State
```javascript
{
  empathyLab: {
    consent: {
      microphone: boolean,
      camera: boolean,
      faceTracking: boolean,
      handTracking: boolean,
      poseTracking: boolean
    },
    overlays: {
      faceMesh: boolean,
      hands: boolean,
      pose: boolean,
      emotions: boolean
    },
    selectedHumeConfigId: string | null,
    isModelLoaded: boolean
  },
  // Actions: setEmpathyLabConsent, setEmpathyLabOverlay, setEmpathyLabHumeConfig
}
```

**Used by**: Empathy Lab

#### Gesture Lab State
```javascript
{
  gestureLab: {
    mode: 'whiteboard' | '3d-nav' | 'ui-control',
    examples: {
      [exampleName]: boolean  // Toggle for each example
    }
  },
  // Actions: setGestureLabMode, setGestureLabExample
}
```

**Used by**: Gesture Lab

#### Workflow State
```javascript
{
  selectedWorkflow: string | null,
  workflowHistory: {
    [workflowId]: {
      runs: Array<{ timestamp, result, duration }>
    }
  },
  // Actions: setSelectedWorkflow, addWorkflowRun
}
```

**Used by**: Workflows

### Global UI State
```javascript
{
  theme: 'dark' | 'light',
  accentTheme: string,
  toasts: Toast[],
  firstVisit: {
    [appName]: boolean  // True if first visit, undefined after dismiss
  },
  isSettingsOpen: boolean,
  isWelcomeScreenOpen: boolean,

  // Glass Dock
  dockPosition: { x: number, y: number },
  dockMinimized: boolean,
  dockMode: 'chat' | 'node',

  // Actions: showToast, setTheme, dismissFirstVisit, toggleSettings, setDockPosition
}
```

**Used by**: All apps

---

## Data Flow Patterns

### Pattern 1: Simple Read (Display Only)

```javascript
// Component reads from store, no mutations
function MyComponent() {
  const user = useStore.use.user();
  return <div>{user?.name}</div>;
}
```

**Examples**: Home (user display), Idea Lab (module metadata)

### Pattern 2: Local Action (Immediate Update)

```javascript
// Component calls action, store updates immediately
function MyComponent() {
  const setTheme = useStore.use.actions().setTheme;

  const handleClick = () => {
    setTheme('dark');  // Immediate store update
  };
}
```

**Examples**: Settings panel (theme toggle), Image Booth (mode selection)

### Pattern 3: Async Action (Backend Fetch)

```javascript
// Component calls action, action fetches from backend, updates store
function MyComponent() {
  const fetchConnectedServices = useStore.use.actions().fetchConnectedServices;

  useEffect(() => {
    fetchConnectedServices();  // Async: fetch → update store
  }, []);

  const connectedServices = useStore.use.connectedServices();
  // Renders with loading state, then data
}
```

**Examples**: Home (OAuth callback), Character Lab (rigging status), Calendar AI (events)

### Pattern 4: Optimistic Update

```javascript
// Update store immediately, sync with backend in background
function MyComponent() {
  const updateTask = useStore.use.updateTask();

  const handleDrop = (taskId, newLane) => {
    updateTask(taskId, { lane: newLane });  // Immediate UI update
    // Backend sync happens in action (fire-and-forget)
  };
}
```

**Examples**: Kanban (task drag-and-drop)

### Pattern 5: Cross-App Navigation with State

```javascript
// App A navigates to App B, passing data via route state
import { useNavigate } from 'react-router-dom';

function AppA() {
  const navigate = useNavigate();

  const handleExport = (markdown) => {
    navigate('/multimindmap', { state: { markdown } });
  };
}

// App B receives data via location.state
function AppB() {
  const location = useLocation();
  const markdown = location?.state?.markdown;
  // Use markdown if provided, else compute from store
}
```

**Examples**: Multi Mind Map (can receive markdown from other apps)

### Pattern 6: Shared State (Multiple Apps Read/Write Same Slice)

```javascript
// Multiple apps interact with same state slice

// In Chat app
function Chat() {
  const activeModuleId = useStore.use.activeModuleId();
  const history = useStore.use.assistantHistories()[activeModuleId];
  // Read module-specific chat history
}

// In Idea Lab
function IdeaLab() {
  const activeModuleId = useStore.use.activeModuleId();
  const setActiveModuleId = useStore.use.actions().setActiveModuleId;
  // Change active module, Chat will react to change
}

// In Multi Mind Map
function MultiMindMap() {
  const activeModuleId = useStore.use.activeModuleId();
  const history = useStore.use.assistantHistories()[activeModuleId];
  // Visualize same chat history as Chat app
}
```

**Examples**: `activeModuleId`, `assistantHistories` shared by Chat, Idea Lab, Multi Mind Map

---

## Backend API Contracts

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/check
```

### Service Connections
```
GET /api/services/status
POST /api/services/{serviceName}/connect
POST /api/services/{serviceName}/disconnect

# OAuth callbacks
GET /api/auth/github/callback
GET /api/auth/notion/callback
GET /api/auth/google/callback
GET /api/auth/figma/callback
```

### Chat & AI
```
POST /api/chat
  Body: { model, messages, temperature, max_tokens }
  Response: { message: string }

POST /api/chat/tools
  Body: { model, messages, tools }
  Response: { message: string, tool_calls?: [] }
```

### Image Generation
```
POST /api/proxy
  Body: { provider, model, prompt, options }
  Response: { image: base64 | url }
```

### Character Rigging
```
POST /api/rigging/submit
  Body: FormData { file: Blob, settings }
  Response: { taskId, status }

GET /api/rigging/status/:taskId
  Response: { status, progress, modelUrl }

GET /api/rigging/download/:taskId
  Response: Blob (GLB file)

GET /api/rigging/gallery
  Response: { models: [] }
```

### Google Services
```
GET /api/services/googleDrive/files
GET /api/services/googleCalendar/events
GET /api/services/googlePhotos/albums
GET /api/services/gmail/messages
```

### RAG (Planned)
```
POST /api/rag/upsert
  Body: { moduleId, chunks: [{ text, metadata }] }
  Response: { success: boolean }

POST /api/rag/query
  Body: { moduleId, query, topK }
  Response: { results: [{ text, score, metadata }] }
```

### Models Discovery
```
GET /api/models
  Response: {
    models: [
      { id, name, provider, category, available }
    ]
  }
```

---

## Inter-App Communication Mechanisms

### Mechanism 1: Shared Store Slices

**Use case**: Multiple apps need to read/write the same data

**Example**: Chat, Idea Lab, and Multi Mind Map all share `assistantHistories` and `activeModuleId`

```javascript
// Any app can change the active module
const setActiveModuleId = useStore.use.actions().setActiveModuleId;
setActiveModuleId('BA_001');

// All apps will reactively update
```

### Mechanism 2: Route Navigation with State

**Use case**: One app wants to hand off data to another app

**Example**: Export mind map from Chat to Multi Mind Map

```javascript
// In Chat
navigate('/multimindmap', { state: { markdown: exportedMarkdown } });

// In Multi Mind Map
const markdown = useLocation()?.state?.markdown;
```

### Mechanism 3: Global Actions

**Use case**: Any app can trigger global UI changes

**Example**: Any app can show a toast notification

```javascript
const showToast = useStore.use.actions().showToast;
showToast('Operation completed!', 'success');
```

### Mechanism 4: Layout Slots

**Use case**: Apps declare their sidebar/panel components, App.jsx orchestrates layout

**Example**: Chat sets left and right panes

```javascript
// In Chat
setLeftPane(<ChatSidebar />);
setRightPane(<Gallery />);

// App.jsx renders these in the layout slots
```

### Mechanism 5: Service Connection Events

**Use case**: Apps need to react to service connection changes

**Example**: Calendar AI enables features when Google Calendar connects

```javascript
const connectedServices = useStore.use.connectedServices();

useEffect(() => {
  if (connectedServices?.googleCalendar?.connected) {
    fetchCalendarEvents();
  }
}, [connectedServices?.googleCalendar?.connected]);
```

### Mechanism 6: First-Visit Coordination

**Use case**: Track if user has visited an app for the first time

**Example**: Show welcome overlay on first visit

```javascript
const isFirstVisit = useStore(s => s.firstVisit?.myApp);
const dismissFirstVisit = useStore.use.actions().dismissFirstVisit;

if (isFirstVisit) {
  // Show welcome overlay
}

// User clicks "Got it"
dismissFirstVisit('myApp');  // Sets firstVisit.myApp = false
```

---

## App Dependency Graph

### Legend
- **→** : Reads from
- **↔** : Reads and writes to
- **⇢** : Navigates to

### Dependencies

```
Home
  → user
  → connectedServices
  ↔ firstVisit.home
  ⇢ Any app (via app cards)

Idea Lab
  ↔ activeModuleId
  ↔ assistantHistories
  ↔ showKnowledgeSection
  → modules
  → connectedServices
  ⇢ Chat (via "Open Chat" button)

Chat
  → activeModuleId
  ↔ assistantHistories
  ↔ activeChatId
  ↔ assistantModel
  ↔ moduleAssistantSavedChats
  → modules
  → connectedServices
  ↔ firstVisit.chat

Image Booth
  ↔ inputImage
  ↔ outputImage
  ↔ isGenerating
  ↔ imageProvider
  ↔ imageModel
  → connectedServices
  ↔ firstVisit.imageBooth

Character Lab
  ↔ riggingTasks
  ↔ selectedTaskId
  → connectedServices (googleDrive)

Calendar AI
  → connectedServices (googleCalendar, googleDrive, googlePhotos, gmail)
  ↔ firstVisit.calendarAI

Multi Mind Map
  → activeModuleId
  → assistantHistories
  → activeChatId
  → modules

Planner
  ↔ plannerGraph
  ↔ workflowAutoTitleModel
  → connectedServices (all Google services)
  ↔ firstVisit.planner

Archiva
  ↔ archivaEntries
  ↔ activeEntryId
  ↔ selectedTemplateForPreview

Workflows
  ↔ selectedWorkflow
  → workflowHistory

Kanban
  ↔ tasks
  ↔ lanes
  ↔ selectedTaskId
  ↔ firstVisit.kanban

Empathy Lab
  ↔ empathyLab
  ↔ firstVisit.empathyLab

Gesture Lab
  ↔ gestureLab
  ↔ firstVisit.gestureLab
```

### Shared State Clusters

**Cluster 1: Module-Based Chat**
- Chat ↔ Idea Lab ↔ Multi Mind Map
- Shared: `activeModuleId`, `assistantHistories`, `activeChatId`

**Cluster 2: Service Integrations**
- Home ↔ Calendar AI ↔ Character Lab ↔ Planner
- Shared: `connectedServices`

**Cluster 3: Task Management**
- Kanban ↔ Planner (potential future integration)
- Shared: None currently (could share task data)

---

## Data Contract Template

### For New Apps

When creating a new app, define its data contract:

```markdown
## App Name

### Store Dependencies (Read)
- `sliceName` - Description of what's read and why

### Store Dependencies (Write)
- Via `actionName()` - Description of what's written

### Backend APIs
- `GET /api/path` - Description
- `POST /api/path` - Description

### Navigation Targets
- Can navigate to `/other-app` with state `{ key: value }`

### Service Requirements
- **Required**: serviceName (feature breaks without it)
- **Optional**: serviceName (feature enhanced with it)

### LocalStorage Usage
- `key.name` - Description of persisted data

### External Dependencies
- Library name - Purpose
```

---

## Best Practices

### DO ✅
1. **Use selectors for all store reads**: `useStore.use.sliceName()`
2. **Use actions proxy for all mutations**: `useStore.use.actions().actionName()`
3. **Register app on mount**: `setActiveApp('myApp')`
4. **Clean up panes on unmount**: `clearLeftPane()`, `clearRightPane()`
5. **Check service connection before API calls**: `if (connectedServices?.serviceName?.connected)`
6. **Show loading states**: Store `isLoading` flag during async operations
7. **Handle errors gracefully**: Store error state + show toast
8. **Document your data contract**: Add to this file when creating new apps

### DON'T ❌
1. **Don't pass props between apps**: Use store instead
2. **Don't use localStorage for shared data**: Use Zustand (persisted) instead
3. **Don't mutate store directly**: Always use actions
4. **Don't mix reactive and imperative patterns**: Use selectors consistently
5. **Don't create circular dependencies**: Apps should not import each other
6. **Don't hardcode API URLs**: Use relative paths (`/api/...`)
7. **Don't forget cleanup**: Always return cleanup function from `useEffect`

---

## Future Improvements

### 1. TypeScript Migration
Add TypeScript types for all store slices and actions:
```typescript
interface StoreState {
  user: User | null;
  connectedServices: Record<string, ServiceConnection>;
  // ... all slices
}

interface StoreActions {
  setActiveApp: (appName: string) => void;
  showToast: (message: string, type: ToastType, duration?: number) => void;
  // ... all actions
}
```

### 2. Data Persistence Strategy
- **Store in Zustand**: Ephemeral UI state (selected items, filters, UI flags)
- **Store in localStorage (via Zustand persist)**: User preferences, draft content
- **Store in backend**: User data, persistent documents, history

### 3. Cross-App Workflows
Enable apps to compose complex workflows:
```javascript
// Example: Image Booth → Archiva
// Generate image, then create Archiva entry with that image

// In Image Booth
const createArchivaEntry = useStore.use.actions().createArchivaEntry;
const outputImage = useStore.use.outputImage();

const handleSaveToArchiva = () => {
  const entryId = createArchivaEntry('image-documentation');
  updateArchivaEntry(entryId, 'image', outputImage);
  navigate('/archiva');
};
```

### 4. Undo/Redo System
Implement global undo/redo for all apps:
```javascript
const history = useStore.use.history();
const undo = useStore.use.actions().undo;
const redo = useStore.use.actions().redo;
```

### 5. Real-time Collaboration
Add multiplayer support via WebSocket:
```javascript
// Broadcast store changes to other users
const broadcastUpdate = useStore.use.actions().broadcastUpdate;
```

---

## Conclusion

This architecture provides:
- ✅ **Loose coupling**: Apps don't depend on each other
- ✅ **Scalability**: Easy to add new apps without breaking existing ones
- ✅ **Consistency**: Standardized patterns across all apps
- ✅ **Debuggability**: Centralized state is easy to inspect
- ✅ **Performance**: Selector-based re-rendering is efficient

The key to maintaining this architecture is **disciplined adherence to the patterns** documented here.
