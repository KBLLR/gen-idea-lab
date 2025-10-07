# Refactor Plan for Gen-Idea-Lab

_Date: 2025-10-06 (Europe/Berlin)_

---

## 1. Modular Frontend Structure (`src/apps/`)

The frontend should be reorganized into **micro-app packages** under `src/apps/`, replacing any existing `src/features/` folders. Each app (e.g., `Planner`, `GestureLab`, `Archiva`, `EmpathyLab`, etc.) gets its own directory with a standardized sub-structure:

```
src/
└── apps/
    ├── Planner/
    │   ├── components/     # React components specific to Planner
    │   ├── hooks/          # app-specific hooks
    │   ├── services/       # API/service adapters
    │   ├── styles/         # scoped CSS or module styles
    │   └── index.jsx       # root component / entry point for Planner
    ├── GestureLab/
    │   └── (same structure as above)
    ├── Archiva/
    └── ...                 # (other micro-apps)
```

Additionally:

```
src/
├── components/
│   └── ui/               # shared UI primitives (see Section 3)
├── shared/
│   ├── lib/              # cross-app utilities (API clients, store, etc.)
│   ├── hooks/            # reusable hooks (not app-specific)
│   └── types/            # shared TypeScript types/interfaces
└── index.jsx             # host (root) entry; mounts router, global providers
```

This follows the **feature-based grouping principle**. Each app should export a root component (and its own routes if needed). The host application (at `src/index.jsx`) will use **React Router** to lazily mount each app based on the URL (e.g., `/planner/*`, `/gesturelab/*`).

> **Co-locate related files**: component (`.jsx`), style (`.css`), story (`.stories.jsx`), and test (`.test.js`) should live together for clarity.

- App-specific hooks → `apps/[App]/hooks/`
- Truly shared hooks/state logic → `src/shared/hooks/` and `src/shared/lib/`

### Key Guidelines:
- **Group by app/feature**: One folder per tool under `apps/`.
- **Shallow nesting**: No more than ~2 subfolders deep inside each app.
- **Co-location**: Place component, style, test, and story files together to improve discoverability.
- **Separate concerns**: Components, hooks, services, and styles each get their own folder within an app.

This mirrors recommended **micro-frontend practices**, enabling independent deployment and development of each tool.

---

## 2. `server.js` Cleanup and Restructure

The single `server.js` should be split into domain-specific modules and utility layers.

### Routes
Create an Express `routes/` directory (e.g., `routes/auth.js`, `routes/university.js`, `routes/modules.js`, `routes/empathyLab.js`, etc.), where each file exports an `express.Router()` with related endpoints.

**Example:**
```js
// server/routes/auth.js
import express from 'express';
const router = express.Router();
router.post('/login', authController.login);
router.get('/me', authController.getProfile);
export default router;
```

In `server.js`, import and mount:
```js
import authRouter from './routes/auth.js';
app.use('/api/auth', authRouter);
```

### Services
Move business logic and API calls (database, external APIs, token management, etc.) into a `services/` folder. Route handlers delegate to service functions.

**Example:**
```js
// server/services/userService.js
export async function findUser(id) { /* DB lookup */ }
```

This isolates data access and AI calls from Express handlers, making them **testable**.

### Middleware
Consolidate common middleware (CORS, cookie/session parsing, auth guards, logging) into a `middleware/` folder. Apply per-router where appropriate instead of globally to **minimize coupling**.

### Configuration
Create a `config/` or `env.js` to handle environment variables (e.g., API base URLs, credentials) rather than scattering `process.env` throughout the code.

### Possible Services Breakdown
If certain features (e.g., image processing or voice AI) require different scaling or security, consider splitting them into **separate microservices**. The main server can act as a **gateway/API aggregator**.

### Logging & Metrics
- Ensure each module uses the shared **Winston logger** (via a logger util).
- Expose standard endpoints: `/healthz` (health check) and metrics endpoints as per existing conventions.

By refactoring this way, the backend aligns with **Node.js best practices** and becomes easier to maintain and test.

---

## 3. Shared UI Primitives (`src/components/ui`)

Extract all reusable UI components (buttons, panels, form fields, modals, etc.) into a shared “design system” folder: `src/components/ui/`.

### Key Actions:

#### Move / Extract
Examples:
- `Button`, `FormField`, `Panel`, `ActionBar`, `GlassDock` → `src/components/ui/Button.jsx`, etc.

> The changelog already shows these components being standardized and made reusable.

#### Theming & Tokens
Use **CSS-in-JS** or **CSS modules** with **design tokens**:
- Colors: `--color-primary`
- Typography: `--fs-md`
- Spacing: `--space-sm`, `--space-md`
- Semantic layout tokens: `--panel-padding`, `--gutter`, `--stack-gap`

**Example component usage:**
```jsx
<button className="btn-primary">{label}</button>
```

**Corresponding CSS:**
```css
.btn-primary {
  background-color: var(--color-primary);
  padding: var(--space-sm) var(--space-md);
  /* Use semantic tokens like --panel-padding, --gutter for layout */
}
```

> Refer to the CLAUDE guideline on migrating `--spacing-*` to `--space-*` and adopting semantic tokens.

#### Storybook
- Fully document each primitive in **Storybook**.
- Write `.stories.jsx` or `.stories.mdx` files showcasing all states (primary/secondary, disabled, etc.).
- Use `@storybook/addon-docs` for props tables.
- Mirror folder structure in stories.
- Enable key addons: **Docs**, **Controls**, **A11y**.

#### Style Variables
- When updating styles (especially spacing), run `npm run tokens:build` (per CLAUDE conventions) to regenerate CSS token files.
- Prefer **semantic tokens** like `--panel-padding-*`, `--stack-gap-*` in components.

Extracting these primitives ensures **consistency**, **reusability**, and **maintainability**. The changelog confirms many components (e.g., `GlassDock`, `StatCard`) have already been standardized and added to Storybook—this practice must continue.

---

## 4. Example Micro-App: Multi-Agent Chat + MindMap

Below is a conceptual example of a new micro-app (`ChatMindApp`) that integrates a **multi-agent chat interface** with a **mind-map visualization**.

### Dependencies:
- `react`, `react-router`, `zustand` (global state)
- AI orchestration library (e.g., `@openai/agents`)
- Mindmap/graph library (e.g., `react-flow-renderer` or `react-d3-tree`)
- Utility libs: `marked` (Markdown parsing), or `mermaid` (diagram syntax)

### Directory Structure (`src/apps/ChatMindApp/`):
```
ChatMindApp/
├── components/
│   ├── ChatInterface.jsx     # chat UI (message list, input box)
│   ├── MindMap.jsx           # mind-map visualization
│   └── MindMapUtils.js       # markdown → mindmap logic
├── hooks/
│   └── useChatAgents.js      # multi-agent orchestration
├── services/
│   └── chatService.js        # calls backend or agent library
├── styles/
└── index.jsx                 # exports <ChatMindApp /> as root
```

### Example `index.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import MindMap from './components/MindMap';
import { useStore } from '../shared/lib/store'; // Zustand store

function ChatMindApp() {
  const user = useStore(state => state.user);
  const setActiveApp = useStore(state => state.setActiveApp);

  const [conversation, setConversation] = useState([]);
  const [mindmapData, setMindmapData] = useState({ nodes: [], edges: [] });

  useEffect(() => {
    setActiveApp('ChatMind');
  }, [setActiveApp]);

  async function handleSendMessage(text) {
    const userMsg = { role: 'user', content: text };
    setConversation(prev => [...prev, userMsg]);

    const agentResponse = await ChatService.sendToAgents(conversation.concat(userMsg));
    setConversation(prev => [...prev, agentResponse]);

    const graph = transformMarkdownToMindmap(agentResponse.content);
    setMindmapData(graph);
  }

  return (
    <div className="chatmind-container">
      <ChatInterface conversation={conversation} onSend={handleSendMessage} />
      <MindMap data={mindmapData} />
    </div>
  );
}

export default ChatMindApp;
```

#### Component Details:
- **`ChatInterface.jsx`**: Displays messages and input. Accepts `conversation` and `onSend` as props. Uses CSS tokens for styling.
- **`MindMap.jsx`**: Presentational component using `react-flow-renderer`; controlled entirely via props (`{ nodes, edges }`).
- **`transformMarkdownToMindmap`** (in `MindMapUtils.js`): Parses Markdown into a node-edge graph.

**Example utility logic:**
```js
export function transformMarkdownToMindmap(markdown) {
  const lines = markdown.split('\n');
  const nodes = [];
  const edges = [];
  let lastHeadingId = null;

  lines.forEach((line, i) => {
    const match = line.match(/^(#+)\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2];
      const id = `h${i}`;
      nodes.push({ id, label: text, level });
      if (lastHeadingId) edges.push({ from: lastHeadingId, to: id });
      lastHeadingId = id;
    } else if (line.trim()) {
      const id = `p${i}`;
      nodes.push({ id, label: line.trim() });
      if (lastHeadingId) edges.push({ from: lastHeadingId, to: id });
    }
  });
  return { nodes, edges };
}
```

This example demonstrates:
- Integration of **multi-agent chat** and **mindmap view**
- Use of **Zustand** for global state (`user`, `activeApp`)
- **Prop-driven composition**
- **Token-based styling**

All styling uses CSS variables (e.g., `var(--color-primary)`, `var(--space-lg)`) per design system guidelines.

---

## 5. UI Best Practices

Refactor all UI code to follow these principles:

### Component Isolation
- Each component lives in its own file.
- Manages only its own markup/logic.
- Avoids direct access to global state or DOM.
- Example: `<Button>` accepts only props (`label`, `onClick`, `variant`), not store reads.

### Prop-Driven Composition
- Build compound components via **props** or **render props**, not inheritance.
- Example: `ActionBar` accepts an array of action descriptors.
- Use `forwardRef` on primitives for flexibility.

### Design Tokens & Theming
- Use established tokens:
  - Spacing: `--space-*`, `--panel-padding-*`, `--stack-gap-lg`
  - Color: `--color-primary`
  - Typography: `--fs-md`
- Replace hard-coded `px`/`rem` with **semantic tokens**.
- Aligns with CLAUDE playbook and recent changelog entries (e.g., “IdeaLab spacing tokens pass”).

### Accessibility
- Follow **WCAG**:
  - Semantic HTML (`<button>`, `<label>`, headings)
  - Proper ARIA attributes
  - Keyboard navigation support

### State Management
- **Do not manipulate shared state directly**.
- Define cross-app **event contracts** (e.g., `themeChanged`, `userLoggedIn`).
- Access Zustand slices via `useStore.use.sliceName()` per conventions.
- No component should write to another app’s state.

### Styling
- Prefer **CSS modules** or **styled-components**.
- Use design system CSS variables for themes (light/dark) and spacing.

**Example:**
```css
.Panel {
  background: var(--color-background);
  padding: var(--panel-padding-lg);
  box-shadow: var(--elevation-medium);
}
```

### Testing & Docs
- Write **unit tests** (Jest + React Testing Library).
- Create **Storybook stories** for visual regression.
- These practices align with documented guidelines: token-based styling, `forwardRef`, Storybook documentation, and 8px spacing scale.

---

## 6. Bootstrap (`main.jsx`) Adjustments

Modify the application entry (`src/index.jsx` or `main.jsx`) to support **dynamic micro-app loading**.

### Minimal Host
The entry file should only initialize **global providers** and a **router**:

```jsx
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppProviders from './AppProviders';

const PlannerApp = React.lazy(() => import('./apps/Planner/index.jsx'));
const GestureLabApp = React.lazy(() => import('./apps/GestureLab/index.jsx'));
// ... other apps

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppProviders>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/planner/*" element={<PlannerApp />} />
          <Route path="/gesturelab/*" element={<GestureLabApp />} />
          {/* other micro-app routes */}
        </Routes>
      </Suspense>
    </AppProviders>
  </BrowserRouter>
);
```

- **`Suspense`** ensures async loading → better startup performance.
- Matches recommendation to keep `main.jsx` minimal.

### AppProviders
Create `AppProviders.jsx` to wrap global contexts:

```jsx
export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GlassDockProvider>{children}</GlassDockProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

Includes: `ThemeProvider`, `AuthProvider`, `GlassDockProvider`, etc.

### Dynamic Mounting
- Router enables direct navigation to `/apps/*` URLs.
- Only the matching micro-app bundle loads.
- Host remains **decoupled** from app internals.

This implements a **lazy-loaded micro-frontend architecture**, improving scalability and maintainability.

---

## 7. Categorized Task List

Below is a table of concrete refactor tasks, organized by category.

### Rename

| File/Module                     | Task |
|----------------------------------|------|
| `src/features/`                  | Rename directory to `src/apps/` (and update imports) |
| `src/features/*App*/` (e.g., Planner) | Rename to `src/apps/*App*/` |
| `src/App.jsx` or similar         | Update imports of features → apps |
| `.storybook` config (if hard-coded) | Update paths from `features` → `apps` |

---

### Extract

| File/Module                     | Task |
|----------------------------------|------|
| `src/components/Button.jsx`     | Move to `src/components/ui/Button.jsx`; update exports |
| `src/components/Panel.jsx`      | Extract to `src/components/ui/Panel.jsx` |
| `src/components/FormField.jsx`  | Extract to `src/components/ui/FormField.jsx` |
| `src/components/GlassDock.jsx`  | Move into shared `ui/` folder; ensure token/theme usage |
| `src/components/StatCard.jsx`   | Move to `src/components/ui/StatCard.jsx`; update references |
| `src/styles/tokens/` or `tokens/` | Verify all design tokens (colors, spacing, typography) are centralized |
| Various `*.css` files           | Migrate common CSS variables into token files |
| `src/components/*/*.stories.*`  | Ensure stories exist for each extracted component |

---

### Migrate

| File/Module                     | Task |
|----------------------------------|------|
| `src/lib/store.js`              | Move to `src/shared/lib/store.js`; use Zustand slices per feature |
| `src/hooks/` or `src/components/hooks/` | Move reusable hooks to `src/shared/hooks/`; keep app-specific hooks in each app |
| `src/utils/`, `src/lib/logger.js` | Move common utilities/logging to `src/shared/lib/` |
| `src/styles/`                   | Ensure theming token output (from `tokens/`) is imported at root |
| `src/AppProviders.jsx` (or create it) | Add global contexts (Theme, Auth, GlassDock) |
| `server.js` env parsing         | Extract config logic into `config/` |

---

### Remove

| File/Module                     | Task |
|----------------------------------|------|
| Any hard-coded `--spacing-*` usage | Replace with token variables (e.g., `--space-md`) |
| Legacy or duplicate components  | Remove if covered by new primitives |
| Unused routes/endpoints in `server.js` | Remove and refactor accordingly |
| Outdated documentation in code  | Prune and update |

---

### Test

| File/Module                     | Task |
|----------------------------------|------|
| `tests/` (backend)              | Add/update Jest/Supertest suites for each route file (e.g., `tests/auth.routes.test.js`) |
| `src/components/ui/*.test.js`   | Write unit tests for each extracted primitive (Jest + React Testing Library) |
| Storybook visual tests          | Enable Chromatic snapshots for UI primitives and app views |
| E2E flows (optional)            | Add high-level tests for critical workflows (e.g., login, API integration) |

---

### Document

| Item                            | Task |
|----------------------------------|------|
| `CHANGELOG.md`                  | Append entries summarizing refactor tasks (e.g., “Refactor: move features to apps/”) |
| `docs/`                         | Update/add architecture and folder structure documentation |
| `README.md`                     | Update env var and command instructions (per `CLAUDE.md`) |
| Storybook                       | Deploy/publish updated Storybook with new components |
| `docs/IMPLEMENTATION_NOTES.md`  | Add rationales for refactor decisions and setup guidelines |
| Route & Service docs            | Document new API endpoints and service extension patterns |

> **Note**: Each task must include updating **import paths** and **references**. Follow commit convention: add a changelog line before merging.

---

## Sources & Alignment

This plan is informed by:
- Project documentation
- Recent engineering guidelines
- **CLAUDE playbook**
- Changelog notes on UI primitives and tokens
- Storybook best practices

By implementing these changes, the codebase will gain:
- Clearer **modularity**
- Consistent **design patterns**
- Improved **scalability**

---

*References embedded in plan:*
- `06102025-Revision-003.md`
- `CLAUDE.md`
- `CHANGELOG.md`
- `openai-Orchestrating-multiple-agents.pdf`
- `AGENTS.md`
