# Legacy Code Cleanup Report

**Generated**: 2025-10-08
**Focus**: Actionable cleanup items with concrete changes, effort estimates, and impact assessment.

---

## 1. Duplicate OAuth Implementation (COMPLETED ✓)

**Context**: OAuth logic was scattered across `server/routes/services.js` with provider-specific code inline.

**Risk**: Hard to maintain, test, and extend. No separation of concerns.

**Proposed Change**: Modularize into `server/oauth/` with:
- `config.js` - Provider definitions
- `callbacks.js` - Generic callback handling
- `providers/*.js` - Per-provider logic

**Status**: ✅ **COMPLETED** - See PR A

**Effort**: ~4 hours (DONE)

---

## 2. Slot Template Non-Conformance (2 apps)

**Context**: `kanban` and `ideaLab` apps don't follow the slot template pattern correctly.

### 2a. Kanban App - Reactive Dependencies Issue

**File**: `src/apps/kanban/index.jsx:71`

**Problem**:
```javascript
useEffect(() => {
  setActiveApp('kanban');
  setLeftPane(<KanbanSidebar />);
  setRightPane(<KanbanRightPane lanes={lanes} categories={categories} />);
  return () => { clearLeftPane(); clearRightPane(); };
}, [setActiveApp, lanes.todo, lanes.doing, lanes.done, categories]);
```
The dependency array includes `lanes` and `categories`, causing full pane re-initialization on every data change.

**Proposed Change**:
```javascript
// Mount panes once
useEffect(() => {
  setActiveApp('kanban');
  setLeftPane(<KanbanSidebar />);
  setRightPane(<KanbanRightPane />); // Pass lanes via store instead
  return () => { clearLeftPane(); clearRightPane(); };
}, [setActiveApp]);

// KanbanRightPane reads lanes from store directly
const KanbanRightPane = () => {
  const lanes = useStore.use.plannerGraph();
  // ... rest of component
};
```

**Effort**: ~30 minutes
**Impact**: Prevents unnecessary re-renders and follows template pattern

### 2b. IdeaLab App - Conditional Right Pane Logic

**File**: `src/apps/ideaLab/index.jsx:19-25`

**Problem**:
```javascript
useEffect(() => {
  setActiveApp('ideaLab');
  setLeftPane(<IdeaLabSidebar />);
  if (activeModuleId && showKnowledgeSection) {
    setRightPane(<KnowledgePane moduleId={activeModuleId} />);
  } else {
    clearRightPane();
  }
  return () => { clearLeftPane(); clearRightPane(); };
}, [setActiveApp]); // Missing activeModuleId, showKnowledgeSection
```
Conditional logic depends on state not in dependency array = stale closures.

**Proposed Change**:
```javascript
// Mount left pane once
useEffect(() => {
  setActiveApp('ideaLab');
  setLeftPane(<IdeaLabSidebar />);
  return () => { clearLeftPane(); clearRightPane(); };
}, [setActiveApp]);

// Handle right pane separately
useEffect(() => {
  if (activeModuleId && showKnowledgeSection) {
    setRightPane(<KnowledgePane moduleId={activeModuleId} />);
  } else {
    clearRightPane();
  }
}, [activeModuleId, showKnowledgeSection]);
```

**Effort**: ~30 minutes
**Impact**: Fixes stale closure bugs, proper reactivity

---

## 3. Environment Variable Duplication

**Context**: `.env.example` had redundant/unclear variable organization.

**Risk**: Confusing for developers, easy to miss required vars.

**Proposed Change**: ✅ **COMPLETED** - Reorganized into sections:
- Server-only (AUTH_SECRET, secrets)
- OAuth credentials (per-provider sections with redirect URIs)
- Client-safe (VITE_ prefix)
- Dev-only (AUTH_BYPASS)

**Effort**: ~30 minutes (DONE)

---

## 4. Test Failures Due to COOP Headers

**Context**: Tests expect COOP headers but they're only set in production (server/index.js:47).

**File**: `tests/auth.routes.test.js:71`

**Problem**:
```javascript
const expectUnsafeNone = (res) => {
  expect(res.headers['cross-origin-opener-policy']).toBe('unsafe-none');
};
```
Fails because `setCoopCoepHeaders` middleware only runs in production.

**Proposed Change**:
```javascript
// Option A: Always set headers
app.use(setCoopCoepHeaders);

// Option B: Update test expectations
const expectUnsafeNone = (res) => {
  if (process.env.NODE_ENV === 'production') {
    expect(res.headers['cross-origin-opener-policy']).toBe('unsafe-none');
  }
};
```

**Effort**: ~15 minutes
**Impact**: GREEN test suite

---

## 5. AUTH_BYPASS in Workflow Tests

**Context**: `tests/workflow.routes.test.js:67` expects 401 but gets 200.

**Problem**: AUTH_BYPASS=1 in test environment bypasses auth check.

**Proposed Change**:
```javascript
// workflow.routes.test.js
beforeEach(() => {
  // Temporarily disable AUTH_BYPASS for this test
  delete process.env.AUTH_BYPASS;
});

afterEach(() => {
  // Restore if needed
  process.env.AUTH_BYPASS = '1';
});
```

**Effort**: ~10 minutes
**Impact**: Accurate auth testing

---

## 6. Deep @ui Imports (Linter Rule)

**Context**: Some components may import `@ui/components/Button` instead of `@ui`.

**Risk**: Breaks barrel export pattern, harder to refactor.

**Proposed Change**: Add ESLint rule:
```javascript
// .eslintrc.js
rules: {
  'no-restricted-imports': ['error', {
    patterns: [{
      group: ['@ui/*'],
      message: 'Use barrel import from @ui instead of deep paths'
    }]
  }]
}
```

**Effort**: ~15 minutes + fixing violations
**Impact**: Enforces design system consistency

---

## 7. ARIA Prop Warnings

**Context**: Some components pass `ariaLabel` instead of `aria-label`.

**Example**: Check ActionBar, Button, SidebarItemCard usage.

**Proposed Change**: Codemod with jscodeshift:
```javascript
// transforms/fix-aria-props.js
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root.find(j.JSXAttribute, { name: { name: 'ariaLabel' } })
    .forEach(path => {
      path.node.name.name = 'aria-label';
    });

  return root.toSource();
}
```

**Effort**: ~30 minutes (write + test codemod)
**Impact**: No React warnings, better accessibility

---

## 8. Dead Code - Unused Service Route

**Context**: `server/routes/services.js` is no longer used (replaced by `server/oauth/`).

**Risk**: Confusion, potential import conflicts.

**Proposed Change**:
```bash
# After PR A is merged and tested:
git rm server/routes/services.js
```

**Effort**: ~5 minutes (after PR merge)
**Impact**: Cleaner codebase, single source of truth

**Safety**: Keep for 1 sprint behind feature flag before deleting.

---

## 9. In-Memory Fallback Warning

**Context**: tokenStore logs warning if MongoDB isn't configured.

**Current Behavior**: Falls back to in-memory storage (lost on restart).

**Risk**: Developers may not realize tokens won't persist.

**Proposed Change**:
```javascript
// src/shared/lib/secureTokens.js:71
if (!uri) {
  console.warn(
    '[SecureTokens] MONGODB_URI not set. Service connections will NOT persist across restarts.',
    '\nSet MONGODB_URI in .env to enable persistence.',
    '\nExample: MONGODB_URI=mongodb://localhost:27017'
  );
  return null;
}
```

**Effort**: ~5 minutes
**Impact**: Clearer developer experience

---

## 10. Storybook Stories Out of Sync

**Context**: Some components have stories (e.g., `ModuleAgentsChat.stories.jsx`) but stories may not reflect latest component APIs.

**Proposed Change**: Audit + update workflow:
1. Run Storybook: `npm run storybook`
2. Test each story for:
   - Render errors
   - Missing props
   - Outdated state examples
3. Update stories to match current component signatures

**Effort**: ~2 hours
**Impact**: Reliable component documentation

---

## Summary

| Item | Status | Effort | Priority |
|------|--------|--------|----------|
| 1. Modular OAuth | ✅ Done | 4h | High |
| 2a. Kanban slot fix | Pending | 30m | Medium |
| 2b. IdeaLab slot fix | Pending | 30m | Medium |
| 3. .env cleanup | ✅ Done | 30m | High |
| 4. Test COOP headers | Pending | 15m | Low |
| 5. AUTH_BYPASS test | Pending | 10m | Low |
| 6. Lint @ui imports | Pending | 1h | Medium |
| 7. ARIA props codemod | Pending | 30m | Medium |
| 8. Remove old services.js | Pending | 5m | Low |
| 9. Token storage warning | Pending | 5m | Low |
| 10. Storybook audit | Pending | 2h | Low |

**Total Remaining Effort**: ~5 hours
**Completed**: OAuth modularization + .env cleanup (~4.5 hours)

---

## Recommended Order

1. **Immediate (before merge)**:
   - Item 2a + 2b: Slot template fixes (~1 hour)
   - Item 6: ESLint rule (~1 hour with fixes)

2. **Next Sprint**:
   - Item 7: ARIA codemod (~30m)
   - Item 4 + 5: Test fixes (~25m)
   - Item 9: Warning clarity (~5m)

3. **Maintenance Backlog**:
   - Item 8: Remove dead code (after PR A stable)
   - Item 10: Storybook audit (during design system review)

---

## Rollback Instructions

**If OAuth module breaks**:
1. Revert PR A: `git revert <commit-sha>`
2. Old route still in git history: `git show <old-commit>:server/routes/services.js > server/routes/services.js`
3. Update apiRouter.js to use old route

**If slot fixes break apps**:
1. Revert per-app commits
2. Apps are independent - kanban/ideaLab revert won't affect others
