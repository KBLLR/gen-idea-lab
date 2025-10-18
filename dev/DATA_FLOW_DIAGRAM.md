# Data Flow Diagram

> **Visual representation of data flow in GenBooth Idea Lab**

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                           │
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │   Home   │  │ Idea Lab │  │   Chat   │  │  Image   │  │Character │ │
│  │Dashboard │  │          │  │          │  │  Booth   │  │   Lab    │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │             │             │             │             │        │
│  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐ │
│  │ Calendar │  │  Multi   │  │ Planner  │  │ Archiva  │  │ Empathy  │ │
│  │    AI    │  │ MindMap  │  │          │  │          │  │   Lab    │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │             │             │             │             │        │
│  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐                             │
│  │Workflows │  │  Kanban  │  │ Gesture  │                             │
│  │          │  │          │  │   Lab    │                             │
│  └──────────┘  └──────────┘  └──────────┘                             │
│                                                                          │
└──────────────────┬───────────────────────────────────────────────────────┘
                   │
                   │ Zustand Selectors (useStore.use.sliceName())
                   │ Zustand Actions (useStore.use.actions().actionName())
                   │
┌──────────────────▼───────────────────────────────────────────────────────┐
│                         ZUSTAND STORE (Single Source of Truth)           │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        CORE SLICES                                 │  │
│  │                                                                     │  │
│  │  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │  │
│  │  │   Auth      │  │ Service          │  │  App Switching       │ │  │
│  │  │             │  │ Connections      │  │                      │ │  │
│  │  │ • user      │  │ • connectedSvcs  │  │ • activeApp          │ │  │
│  │  │ • checking  │  │ • fetchServices  │  │ • leftPane/rightPane │ │  │
│  │  └─────────────┘  └──────────────────┘  └──────────────────────┘ │  │
│  │                                                                     │  │
│  │  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │  │
│  │  │   Toast     │  │    Theme         │  │  First Visit         │ │  │
│  │  │             │  │                  │  │                      │ │  │
│  │  │ • toasts[]  │  │ • theme          │  │ • firstVisit{}       │ │  │
│  │  │ • addToast  │  │ • accentTheme    │  │ • dismissFirstVisit  │ │  │
│  │  └─────────────┘  └──────────────────┘  └──────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      APP-SPECIFIC SLICES                           │  │
│  │                                                                     │  │
│  │  ┌────────────────────────────────────────────────────────┐       │  │
│  │  │  Assistant State (Chat, Idea Lab, Multi Mind Map)      │       │  │
│  │  │                                                         │       │  │
│  │  │  • assistantHistories: { [moduleId]: Message[] }       │       │  │
│  │  │  • activeChatId: string                                │       │  │
│  │  │  • activeModuleId: string                              │       │  │
│  │  │  • assistantModel: Model                               │       │  │
│  │  │  • moduleAssistantSavedChats: {}                       │       │  │
│  │  │  • isAssistantLoading: boolean                         │       │  │
│  │  └────────────────────────────────────────────────────────┘       │  │
│  │                                                                     │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │  │
│  │  │ Image Booth      │  │ Character Lab    │  │ Planner         │ │  │
│  │  │                  │  │                  │  │                 │ │  │
│  │  │ • inputImage     │  │ • riggingTasks   │  │ • plannerGraph  │ │  │
│  │  │ • outputImage    │  │ • selectedTaskId │  │ • nodes/edges   │ │  │
│  │  │ • isGenerating   │  │ • pollAllTasks   │  │ • workflows     │ │  │
│  │  │ • imageProvider  │  │                  │  │                 │ │  │
│  │  └──────────────────┘  └──────────────────┘  └─────────────────┘ │  │
│  │                                                                     │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │  │
│  │  │ Archiva          │  │ Kanban           │  │ Empathy Lab     │ │  │
│  │  │                  │  │                  │  │                 │ │  │
│  │  │ • archivaEntries │  │ • tasks.byId     │  │ • consent{}     │ │  │
│  │  │ • activeEntryId  │  │ • tasks.allIds   │  │ • overlays{}    │ │  │
│  │  │                  │  │ • lanes{}        │  │ • isModelLoaded │ │  │
│  │  └──────────────────┘  └──────────────────┘  └─────────────────┘ │  │
│  │                                                                     │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                       │  │
│  │  │ Gesture Lab      │  │ Workflows        │                       │  │
│  │  │                  │  │                  │                       │  │
│  │  │ • mode           │  │ • selectedWorkflw│                       │  │
│  │  │ • examples{}     │  │ • workflowHistory│                       │  │
│  │  └──────────────────┘  └──────────────────┘                       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                         ACTIONS PROXY                              │  │
│  │                                                                     │  │
│  │  actions.setActiveApp() • actions.showToast() • actions.login()   │  │
│  │  actions.fetchConnectedServices() • actions.generateImage()       │  │
│  │  actions.sendMessage() • actions.createTask() • ...               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└──────────────────┬────────────────────────────────────────────────────────┘
                   │
                   │ Async actions make API calls
                   │
┌──────────────────▼────────────────────────────────────────────────────────┐
│                        BACKEND API LAYER (Express)                         │
│                                                                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │   Auth API     │  │  Services API  │  │   Chat API     │             │
│  │                │  │                │  │                │             │
│  │ POST /login    │  │ GET /status    │  │ POST /chat     │             │
│  │ POST /logout   │  │ POST /connect  │  │ POST /chat/    │             │
│  │ GET /check     │  │                │  │      tools     │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
│                                                                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │  Image API     │  │  Rigging API   │  │  Models API    │             │
│  │                │  │                │  │                │             │
│  │ POST /proxy    │  │ POST /submit   │  │ GET /models    │             │
│  │                │  │ GET /status/:id│  │                │             │
│  │                │  │ GET /download  │  │                │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
│                                                                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │  Google APIs   │  │   RAG API      │  │  Archiva API   │             │
│  │                │  │  (Planned)     │  │                │             │
│  │ GET /drive/*   │  │ POST /upsert   │  │ POST /mock     │             │
│  │ GET /calendar/*│  │ POST /query    │  │ GET /search    │             │
│  │ GET /photos/*  │  │                │  │                │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
│                                                                            │
└──────────────┬─────────────────────────────────────────────────────────────┘
               │
               │ External API calls
               │
┌──────────────▼─────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                    │
│                                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │   OpenAI   │  │   Google   │  │  Meshy AI  │  │  Hume AI   │          │
│  │            │  │   Gemini   │  │  (Rigging) │  │  (Voice)   │          │
│  │  GPT-4o    │  │  2.5 Flash │  │            │  │            │          │
│  │  DALL-E    │  │  Imagen    │  │            │  │            │          │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘          │
│                                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │   GitHub   │  │   Notion   │  │   Figma    │  │  MediaPipe │          │
│  │    API     │  │    API     │  │    API     │  │  (Browser) │          │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘          │
│                                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                           │
│  │ Google     │  │ Google     │  │ Google     │                           │
│  │ Calendar   │  │ Drive      │  │ Photos     │                           │
│  └────────────┘  └────────────┘  └────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Patterns

### Pattern 1: Simple Read Flow

```
┌─────────────┐
│  Component  │
│             │
│  const user │──┐
│  = useStore │  │ Read selector
│    .use     │  │
│    .user()  │  │
└─────────────┘  │
                 │
                 ▼
         ┌───────────────┐
         │ Zustand Store │
         │               │
         │ user: {...}   │
         └───────────────┘
```

### Pattern 2: Action → Store Update Flow

```
┌─────────────┐
│  Component  │
│             │
│  onClick    │──┐
│    ↓        │  │ Call action
│  setTheme() │  │
└─────────────┘  │
                 │
                 ▼
         ┌───────────────┐
         │ Actions Proxy │
         │               │
         │ setTheme(val) │
         └───────┬───────┘
                 │ Immer mutation
                 ▼
         ┌───────────────┐
         │ Zustand Store │
         │               │
         │ theme: 'dark' │◄──── Store updated
         └───────┬───────┘
                 │
                 │ Reactive re-render
                 ▼
         ┌───────────────┐
         │  Component    │
         │               │
         │  Re-renders   │
         │  with new     │
         │  theme        │
         └───────────────┘
```

### Pattern 3: Async Backend Flow

```
┌─────────────┐
│  Component  │
│             │
│  useEffect  │──┐
│    ↓        │  │ Call async action
│  fetchSvcs()│  │
└─────────────┘  │
                 │
                 ▼
         ┌───────────────┐
         │ Actions Proxy │
         │               │
         │fetchConnected │
         │  Services()   │
         └───────┬───────┘
                 │ Set loading
                 ▼
         ┌───────────────┐
         │ Zustand Store │
         │               │
         │ isLoading:    │
         │   true        │
         └───────┬───────┘
                 │
                 │ fetch('/api/services/status')
                 ▼
         ┌───────────────┐
         │ Backend API   │
         │               │
         │ GET /status   │
         └───────┬───────┘
                 │ Response
                 ▼
         ┌───────────────┐
         │ Actions Proxy │
         │               │
         │ Update store  │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │ Zustand Store │
         │               │
         │ connectedSvcs │
         │ isLoading:    │
         │   false       │
         └───────┬───────┘
                 │
                 │ Reactive re-render
                 ▼
         ┌───────────────┐
         │  Component    │
         │               │
         │  Displays     │
         │  services     │
         └───────────────┘
```

### Pattern 4: Cross-App Communication via Store

```
┌─────────────┐               ┌─────────────┐               ┌─────────────┐
│  Idea Lab   │               │   Zustand   │               │    Chat     │
│             │               │    Store    │               │             │
│  setActive  │──────────────▶│             │◄──────────────│  const      │
│  ModuleId() │  Write        │ activeModule│  Read         │  activeId   │
│             │               │   Id        │               │             │
└─────────────┘               └─────────────┘               └─────────────┘
     App A                      Shared State                    App B
  writes state                                              reads state

When Idea Lab changes activeModuleId, Chat automatically re-renders
with the new module's chat history
```

### Pattern 5: Navigation with State Passing

```
┌─────────────┐
│    Chat     │
│             │
│  Export     │──┐
│  mindmap    │  │ navigate('/multimindmap', { state: { markdown } })
└─────────────┘  │
                 │
                 ▼
         ┌───────────────┐
         │ React Router  │
         │               │
         │ Navigate      │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │ Multi MindMap │
         │               │
         │ useLocation() │──┐ Read location.state.markdown
         │     ↓         │  │
         │ Get markdown  │◄─┘
         │ from state    │
         │     ↓         │
         │ Render map    │
         └───────────────┘
```

---

## Shared State Relationships

### Module-Based Chat Cluster

```
                    ┌──────────────────────────────────┐
                    │      Zustand Store               │
                    │                                  │
                    │  • activeModuleId                │
                    │  • assistantHistories[moduleId]  │
                    │  • activeChatId                  │
                    └──────┬───────┬───────┬───────────┘
                           │       │       │
          ┌────────────────┘       │       └────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
    ┌──────────┐           ┌──────────┐            ┌──────────┐
    │ Idea Lab │           │   Chat   │            │  Multi   │
    │          │           │          │            │ MindMap  │
    │ • Select │           │ • Send   │            │ • Visual │
    │   module │           │   msgs   │            │   ize    │
    │ • View   │           │ • Multi  │            │   chat   │
    │   info   │           │   agent  │            │          │
    └──────────┘           └──────────┘            └──────────┘

All three apps read/write the same conversation data
Changes in one app reflect immediately in others
```

### Service Connection Cluster

```
                    ┌──────────────────────────────────┐
                    │      Zustand Store               │
                    │                                  │
                    │  connectedServices: {            │
                    │    googleDrive: { connected }    │
                    │    googleCalendar: { connected } │
                    │    github: { connected }         │
                    │    ...                           │
                    │  }                               │
                    └──────┬───────┬───────┬───────────┘
                           │       │       │
          ┌────────────────┘       │       └────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
    ┌──────────┐           ┌──────────┐            ┌──────────┐
    │   Home   │           │Character │            │ Calendar │
    │Dashboard │           │   Lab    │            │    AI    │
    │          │           │          │            │          │
    │ • Show   │           │ • Enable │            │ • Enable │
    │   status │           │   Drive  │            │   events │
    │ • Handle │           │   import │            │ • Fetch  │
    │   OAuth  │           │          │            │   data   │
    └──────────┘           └──────────┘            └──────────┘

Apps conditionally enable features based on service connection status
```

---

## App Initialization Sequence

```
1. User navigates to /chat
   │
   ▼
2. React Router mounts Chat component
   │
   ▼
3. Chat component executes useEffect
   │
   ├─▶ setActiveApp('chat')  ──┐
   │                           │
   ├─▶ setLeftPane(...)  ──────┼──▶ Updates Zustand Store
   │                           │
   └─▶ setRightPane(...) ──────┘
   │
   ▼
4. App.jsx reads activeApp, leftPane, rightPane from store
   │
   ▼
5. App.jsx renders layout with Chat as main, sidebars in panes
   │
   ▼
6. Chat reads data from store (activeModuleId, assistantHistories, etc.)
   │
   ▼
7. Chat displays conversation
   │
   ▼
8. User sends message
   │
   ├─▶ actions.sendMessage()
   │   │
   │   ├─▶ Update store (add user message, set isLoading)
   │   │
   │   ├─▶ POST /api/chat
   │   │
   │   ├─▶ Await response
   │   │
   │   └─▶ Update store (add assistant message, clear isLoading)
   │
   ▼
9. Chat re-renders with new messages

When user navigates away:
10. Chat cleanup function runs
    │
    ├─▶ clearLeftPane()
    │
    └─▶ clearRightPane()
```

---

## Performance Considerations

### Selector Memoization

```javascript
// ❌ BAD: Creates new selector on every render
function MyComponent() {
  const data = useStore(s => s.some.nested.data);  // Re-computes on ANY store change
}

// ✅ GOOD: Uses pre-memoized selector
function MyComponent() {
  const data = useStore.use.someNestedData();  // Only re-renders when data changes
}
```

### Action Batching

```javascript
// ❌ BAD: Three separate store updates = three re-renders
setField1(value1);
setField2(value2);
setField3(value3);

// ✅ GOOD: Single batched update = one re-render
updateMultipleFields({ field1: value1, field2: value2, field3: value3 });
```

### Conditional Pane Rendering

```javascript
// ✅ GOOD: Only render pane when needed
useEffect(() => {
  if (shouldShowDetail) {
    setRightPane(<DetailPanel />);
  } else {
    clearRightPane();
  }
}, [shouldShowDetail]);
```

---

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                         │
│                                                                  │
│  • User can modify store state via DevTools                     │
│  • User can inspect all client code                             │
│  • NEVER store secrets in Zustand                               │
│  • OAuth tokens handled by backend, sent via httpOnly cookies   │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           │ HTTPS with credentials: 'include'
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                       BACKEND (Express)                          │
│                                                                  │
│  • Session cookies (httpOnly, secure)                           │
│  • OAuth token encryption (ENCRYPTION_KEY)                      │
│  • requireAuth middleware                                       │
│  • API key management for external services                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Summary

This data flow architecture enables:

1. **Loose Coupling**: Apps communicate via store, not direct imports
2. **Reactive Updates**: Changes propagate automatically via selectors
3. **Scalable**: Easy to add new apps without breaking existing ones
4. **Debuggable**: Zustand DevTools shows entire state tree
5. **Performant**: Selector memoization prevents unnecessary re-renders
6. **Consistent**: All apps follow the same patterns

The key is **disciplined adherence** to these patterns. Every deviation makes the system harder to reason about.
