# Architecture Refactor - September 2025

## Overview
Major refactoring of the orchestrator and assistant chat architecture to establish clear separation of concerns and enable the orchestrator to function as both a floating voice interface and a workflow node.

## Key Changes

### 1. Orchestrator Architecture

#### Previous Architecture
- **FloatingOrchestrator** component provided text-based chat that floated over apps
- **OrchestratorChat** component in the right column for Academic Mode
- Confusion between orchestrator (project coordination) and module assistants (content experts)

#### New Architecture
- **GlassDock** is the primary orchestrator interface
  - Minimized state: Single psychology icon at bottom-left corner
  - Expanded state: Full dock with voice chat capabilities
  - Can transform into node configuration panel via `become_planner_node` tool
- **Orchestrator exists in two contexts:**
  1. Floating voice interface (GlassDock)
  2. Workflow node in Planner canvas (future: AIAgentNode component)

### 2. Module Assistants Chat

#### Previous Architecture
- Individual module assistants opened in floating **Assistant** component
- Right column showed **OrchestratorChat** by default
- No clear distinction between orchestrator and module assistant conversations

#### New Architecture
- **ModuleAgentsChat** component in right column (toggleable)
  - Hidden by default
  - Toggle via chat icon in ModuleViewer header
  - Module assistants can collaborate and invite each other
  - Focused on module-specific content and interdisciplinary collaboration

#### Layout States
1. **No module selected**: Left column only (module list)
2. **Module selected, chat hidden** (default): Left + Middle (ModuleViewer expands)
3. **Module selected, chat visible**: Left + Middle + Right (ModuleAgentsChat)

### 3. Glass Dock Enhancements

#### Minimized State
- Single orchestrator icon at bottom-left
- Psychology icon with glass morphism styling
- Hover effects and smooth transitions
- Click to expand to full dock

#### Auto-hide Disabled
- Previous behavior: Dock would hide when mouse moved away
- New behavior: Always visible (either minimized or expanded)
- Provides consistent access to orchestrator

#### Mode Switching
- **Chat Mode** (default): Voice interaction with orchestrator
- **Node Mode**: Configure AI agent as workflow node
  - Input/output port configuration
  - Settings for screen awareness, conversation history, max tokens
  - Test, save, and return to chat functionality

### 4. Orchestrator as Node (Phase 1 Complete)

#### State Management (`store.js`)
```javascript
dockMode: 'chat', // 'chat' | 'node'
activeNodeId: null,
currentNodeConfig: null,
```

#### Actions
- `becomePlannerNode(config)`: Transform dock into node configuration panel
- `returnToChat()`: Return to chat mode
- `setCurrentNodeConfig(config)`: Save node configuration

#### Tool Registration
```javascript
{
  name: 'become_planner_node',
  description: 'Transform the orchestrator into a workflow node in the planner',
  parameters: {
    nodeName: string,
    inputs: array,
    outputs: array
  }
}
```

#### NodeModePanel Component
- Editable node name
- Dynamic input port configuration
- Dynamic output port configuration
- Settings: screen awareness, conversation history, max tokens
- Test, save, and return actions

### 5. Code Cleanup

#### Removed Components
- `FloatingOrchestrator.jsx` - Replaced by GlassDock minimized state
- `floating-orchestrator.css` - No longer needed
- `OrchestratorChat.jsx` - Replaced by ModuleAgentsChat in Academic Mode

#### Removed State
- `isFloatingOrchestratorOpen` - No longer needed
- `floatingOrchestratorPosition` - No longer needed

#### Updated Components
- `App.jsx`: Layout logic updated for new column visibility rules
- `ModuleViewer.jsx`: Chat icon now toggles third column visibility
- `GlassDock.jsx`: Added minimized state and node mode support

## Files Modified

### Components
- `src/components/GlassDock.jsx` - Minimized state, node mode, auto-hide disabled
- `src/components/ModuleAgentsChat.jsx` - New module-focused chat component
- `src/components/NodeModePanel.jsx` - New node configuration panel
- `src/components/App.jsx` - Layout logic for column visibility
- `src/components/ModuleViewer.jsx` - Chat toggle integration

### State Management
- `src/lib/store.js` - Dock mode state, module chat visibility
- `src/lib/actions.js` - `toggleModuleChat()` action, cleanup

### Styling
- `src/styles/components/glass-dock.css` - Minimized state styling
- `src/styles/components/node-mode-panel.css` - New node panel styling
- `src/index.css` - Module agents chat styling, column layout updates

### Documentation
- `docs/ORCHESTRATOR_ENHANCEMENT_PLAN.md` - Original enhancement plan
- `docs/ORCHESTRATOR_AS_NODE_SPEC.md` - Technical specification for node feature
- `docs/ARCHITECTURE_REFACTOR_2025.md` - This document

## What's Next

The following is a summary of the planned enhancements for the orchestrator and related systems. For a more detailed breakdown, see the [Orchestrator Enhancement Plan](ORCHESTRATOR_ENHANCEMENT_PLAN.md).

### Phase 2: Canvas Integration (Priority)
- Create a React Flow custom node for displaying AI agent nodes in the planner canvas.
- Implement the execution logic for AI agent nodes.

### Phase 3: Enhanced Collaboration (Medium Priority)
- Enable richer collaboration between module assistants with features like agent invitation, context sharing, and conversation threading.
- Give agents persistent memory across conversations.

### Phase 4: Tool Ecosystem (Medium Priority)
- Implement a comprehensive set of tools for navigation, module interaction, Archiva, and the planner.

### Phase 5: Visual States System (Low Priority)
- Implement a visual state system to provide clear feedback on the orchestrator's status.

### Phase 6: Advanced Features (Future)
- Implement advanced features like screen awareness, voice enhancements, and workflow automation.

## Technical Debt

### Immediate
- [ ] Remove legacy Assistant component (floating window)
- [ ] Consolidate chat message styling
- [ ] Add PropTypes or TypeScript for new components
- [ ] Add unit tests for new functionality

### Medium-term
- [ ] Migrate all state to Zustand selectors
- [ ] Optimize React Flow performance for large graphs
- [ ] Implement proper error boundaries
- [ ] Add comprehensive logging system

### Long-term
- [ ] Consider TypeScript migration
- [ ] Evaluate state management architecture
- [ ] Performance profiling and optimization
- [ ] Accessibility audit and improvements

## Migration Guide

### For Developers

#### Accessing Module Chat
```javascript
// Old way (don't use)
import { toggleAssistant } from '../lib/actions';

// New way
import { toggleModuleChat } from '../lib/actions';
const toggleModuleChat = useStore.use.actions().toggleModuleChat;
```

#### Checking Column Visibility
```javascript
// Check if module chat is visible
const showModuleChat = useStore.use.showModuleChat();

// Three-column layout condition
const isThreeColumnLayout = activeApp === 'ideaLab' && activeModuleId && showModuleChat;
```

#### Working with Dock Modes
```javascript
// Get current dock mode
const dockMode = useStore((state) => state.dockMode); // 'chat' | 'node'

// Switch to node mode
const becomePlannerNode = useStore((state) => state.actions.becomePlannerNode);
becomePlannerNode({ name: 'My Agent', inputs: [...], outputs: [...] });

// Return to chat mode
const returnToChat = useStore((state) => state.actions.returnToChat);
returnToChat();
```

## Success Metrics

### User Experience
- ✅ Clear distinction between orchestrator and module assistants
- ✅ Intuitive UI for toggling chat visibility
- ✅ Smooth transitions between dock states
- ✅ Consistent access to orchestrator (always visible)

### Technical
- ✅ Reduced component coupling
- ✅ Cleaner state management
- ✅ Removed ~800 lines of legacy code
- ✅ Improved maintainability

### Feature Completeness
- ✅ Phase 1: Orchestrator as Node (UI complete)
- ⏳ Phase 2: Canvas Integration (pending)
- ⏳ Phase 3: Node Execution (pending)
- ⏳ Phase 4: Enhanced Collaboration (pending)

## Notes

- All changes are backward compatible with existing workflows
- No data migration required
- CSS follows existing design system patterns
- Voice chat functionality remains unchanged
- Module knowledge base and resources remain functional

---

**Last Updated:** September 30, 2025
**Version:** 1.0.0
**Status:** Phase 1 Complete, Phase 2 Planning