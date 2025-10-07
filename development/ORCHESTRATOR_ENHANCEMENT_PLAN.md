# Orchestrator Enhancement Plan

## Overview
This document outlines the plan to enhance the Orchestrator with function calling, tooling capabilities, and improved visual states for the Live Voice Chat dock component.

---

## Current State Analysis

### What We Have
- **Live Voice Chat Integration**: Gemini Live API with real-time audio streaming
- **Basic Voice Commands**: Simple voice control for app navigation
- **Screen Awareness**: DOM context extraction (headings, buttons, inputs, visible text)
- **Glass Dock UI**: Floating, draggable, resizable panel with voice visualization
- **Personality System**: Different voices per module (Puck for orchestrator)

### Current Limitations
1. No function calling capabilities in voice chat
2. Limited visual feedback for AI actions
3. No tool execution UI
4. Basic screen awareness without rich context
5. No state management for multi-turn conversations with tool use

---

## Proposed Enhancements

## 1. Function Calling & Tooling Architecture

### Tool Categories

#### **Navigation Tools**
- `switch_app(appName)` - Switch between apps (ideaLab, imageBooth, archiva, planner, workflows)
- `open_module(moduleCode)` - Open specific learning module
- `navigate_to(path)` - Navigate to specific route

#### **Module Interaction Tools**
- `get_module_content(moduleCode)` - Retrieve module learning materials
- `search_modules(query)` - Search across all modules
- `get_current_module_context()` - Get current active module details

#### **Archiva Tools**
- `create_entry(title, content, tags)` - Create new Archiva entry
- `search_entries(query)` - Search Archiva entries
- `update_entry(entryId, updates)` - Update existing entry
- `tag_entry(entryId, tags)` - Add tags to entry

#### **Planner Tools**
- `create_task(title, description, deadline)` - Create new task
- `update_task(taskId, updates)` - Update task details
- `get_tasks(filter)` - Get tasks with optional filtering
- `create_node(type, content)` - Add node to planner canvas
- `become_planner_node(nodeName, config)` - Transform orchestrator into a workflow node ⭐ **NEW**

#### **Workflow Tools**
- `create_workflow(name, description)` - Create new workflow
- `add_workflow_step(workflowId, step)` - Add step to workflow
- `execute_workflow(workflowId)` - Run a workflow
- `get_workflows()` - List all workflows

#### **Settings & System Tools**
- `open_settings(section)` - Open settings at specific section
- `toggle_theme()` - Switch between light/dark mode
- `show_system_info()` - Display system information
- `set_voice(voiceName)` - Change orchestrator voice

#### **Screen Interaction Tools**
- `click_button(buttonText)` - Simulate click on visible button
- `fill_input(inputLabel, value)` - Fill form field
- `read_section(sectionTitle)` - Read content from specific section
- `take_screenshot()` - Capture current view (future: for multimodal)

---

## 2. Visual States System

### State Categories

#### **Connection States**
- `disconnected` - Gray icon, "Click to connect" prompt
- `connecting` - Pulsing animation, "Connecting..." text
- `connected` - Green light, voice waves ready
- `error` - Red indicator, error message toast

#### **Activity States**
- `idle` - Gentle wave animation (breathing effect)
- `listening` - Active wave pulse when user speaks
- `processing` - Spinner or processing indicator
- `speaking` - Different wave pattern when AI responds
- `thinking` - Subtle processing animation (for tool execution)

#### **Tool Execution States**
- `tool_calling` - Show tool name being called
- `tool_executing` - Progress indicator for tool
- `tool_success` - Success checkmark animation
- `tool_error` - Error indication with retry option

#### **Context States**
- `screen_aware_active` - Eye icon blinking
- `screen_aware_inactive` - Eye icon hidden
- `rich_context` - Badge showing context depth (e.g., "5 tools available")

---

## 3. UI Component Structure

### Enhanced Dock Layout

```
┌─────────────────────────────────────┐
│  ○ Status    [Activity Badge]     × │ <- Minimal header
├─────────────────────────────────────┤
│                                     │
│      [Voice Visualization]          │ <- Adaptive based on state
│      [+ Eye Icon if aware]          │
│                                     │
│      [Tool Execution Area]          │ <- Shows active tools
│      ┌─────────────────────┐       │
│      │ 🔧 Creating task... │       │
│      └─────────────────────┘       │
│                                     │
├─────────────────────────────────────┤
│  [System Messages - scrollable]    │ <- Auto-dissolve toasts
├─────────────────────────────────────┤
│  [Chat Messages - scrollable]      │ <- Conversation history
└─────────────────────────────────────┘
```

### Tool Execution Card Design
```jsx
<div className="tool-execution-card">
  <div className="tool-icon">{tool.icon}</div>
  <div className="tool-info">
    <span className="tool-name">{tool.displayName}</span>
    <span className="tool-status">{status}</span>
  </div>
  <div className="tool-progress">
    {/* Progress bar or spinner */}
  </div>
</div>
```

---

## 4. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Define tool schemas in JSON format
- [ ] Create tool registry system
- [ ] Implement tool execution handler
- [ ] Add visual state manager (React context or Zustand slice)
- [ ] Design tool execution UI components

### Phase 2: Core Tools (Week 2)
- [ ] Implement Navigation tools
- [ ] Implement Settings & System tools
- [ ] Add tool execution feedback UI
- [ ] Create tool call/response logging
- [ ] Add error handling for tools

### Phase 3: Module Integration (Week 3)
- [ ] Implement Module Interaction tools
- [ ] Implement Archiva tools
- [ ] Implement Planner tools
- [ ] Implement Workflow tools
- [ ] Test cross-app tool execution

### Phase 4: Screen Interaction (Week 4)
- [ ] Enhance screen awareness with richer context
- [ ] Implement Screen Interaction tools (simulated clicks, fills)
- [ ] Add screenshot capability (for future multimodal)
- [ ] Implement context history tracking

### Phase 5: Polish & Testing (Week 5)
- [ ] Animation refinements for all states
- [ ] Performance optimization
- [ ] Comprehensive error handling
- [ ] User testing and feedback iteration
- [ ] Documentation and examples

---

## 5. Technical Implementation Details

### Tool Schema Format
```javascript
{
  name: "create_task",
  displayName: "Create Task",
  description: "Creates a new task in the planner",
  icon: "add_task",
  category: "planner",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Task title"
      },
      description: {
        type: "string",
        description: "Task description"
      },
      deadline: {
        type: "string",
        format: "date",
        description: "Task deadline (optional)"
      }
    },
    required: ["title"]
  },
  handler: async (args) => {
    // Implementation
    return { success: true, taskId: "..." };
  }
}
```

### Visual State Machine
```javascript
const stateTransitions = {
  disconnected: ['connecting'],
  connecting: ['connected', 'error'],
  connected: ['idle', 'error', 'disconnected'],
  idle: ['listening', 'disconnected'],
  listening: ['processing', 'idle'],
  processing: ['speaking', 'thinking', 'idle'],
  thinking: ['tool_calling', 'speaking', 'idle'],
  tool_calling: ['tool_executing'],
  tool_executing: ['tool_success', 'tool_error', 'speaking'],
  tool_success: ['idle', 'speaking'],
  tool_error: ['idle'],
  speaking: ['idle', 'listening']
};
```

### Enhanced Store Structure
```javascript
// Add to store.js
voiceChat: {
  connectionState: 'disconnected',
  activityState: 'idle',
  activeTools: [],
  toolHistory: [],
  contextDepth: 0,
  conversationHistory: []
}
```

---

## 6. User Experience Goals

### Interaction Patterns
1. **Transparent Tool Use**: User sees what the AI is doing in real-time
2. **Interruptible Actions**: User can stop tool execution if needed
3. **Context Persistence**: Tool results persist in conversation history
4. **Multi-tool Orchestration**: AI can chain multiple tools together
5. **Error Recovery**: Clear error messages with retry/undo options

### Visual Feedback Requirements
- **< 100ms**: State change acknowledgment (e.g., listening indicator)
- **< 500ms**: Tool call initiation feedback
- **< 2s**: Tool execution progress indication
- **Persistent**: Tool results visible in chat history
- **Non-intrusive**: System messages auto-dissolve

---

## 7. Open Questions & Decisions Needed

### Questions for User
1. **Tool Permissions**: Should some tools require confirmation before execution?
2. **Tool Visibility**: Show all available tools somewhere in UI, or only when called?
3. **History Persistence**: Should tool execution history persist across sessions?
4. **Multi-step Flows**: How to visualize multi-step tool orchestration?
5. **Undo/Redo**: Should destructive tools have undo capability?
6. **Voice Confirmation**: Should critical actions require voice confirmation?

### Design Decisions
1. **Tool Execution Area**: Fixed position or floating cards?
2. **Animation Style**: Subtle/minimal vs. expressive/playful?
3. **Color Coding**: Tool categories by color or by icon?
4. **Mobile Responsiveness**: How should this work on smaller screens?
5. **Accessibility**: Screen reader announcements for tool execution?

---

## 8. Success Metrics

### Functional Metrics
- Tool execution success rate > 95%
- Average tool response time < 2s
- Error recovery success rate > 90%

### UX Metrics
- User satisfaction with visual feedback
- Time to complete common tasks (with vs without voice)
- Number of successful multi-tool conversations
- Reduction in user confusion/errors

---

## 9. Orchestrator-as-Node Feature ⭐

### Concept
The orchestrator can transform into a workflow node in the Planner, becoming an executable step in automated workflows.

### How It Works

#### Voice Activation
```
User: "Orchestrator, become a node in the planner"
OR
User: "Add yourself as a workflow step"
```

#### Transformation Flow
1. **Trigger**: User invokes `become_planner_node()` via voice
2. **Mode Switch**: Dock transitions from "chat mode" to "node mode"
3. **Canvas Integration**: New AI Agent node appears in planner canvas
4. **Dock UI Transforms**: Shows input/output configuration panel

#### Node Mode UI Layout
```
┌─────────────────────────────────────┐
│  🤖 AI Agent Node    [Node Mode]  × │
├─────────────────────────────────────┤
│  Node Name: [Orchestrator_1      ] │
│  Voice: Puck                        │
│  Status: ● Idle                     │
├─────────────────────────────────────┤
│  INPUTS (3)                         │
│  ⚪ user_query (text)               │
│  ⚪ context_data (object)           │
│  ⚪ previous_result (any)           │
├─────────────────────────────────────┤
│  CONFIGURATION                      │
│  □ Use screen awareness             │
│  □ Include conversation history     │
│  Task: [Generate summary        ▼] │
├─────────────────────────────────────┤
│  OUTPUTS (2)                        │
│  🔵 result (text)                   │
│  🔵 metadata (object)               │
├─────────────────────────────────────┤
│  [Test Node] [Back to Chat Mode]   │
└─────────────────────────────────────┘
```

#### Canvas Node Representation
```jsx
<AIAgentNode>
  <NodeHeader icon="🤖" title="Orchestrator" />
  <NodeBody>
    <Inputs>
      <Port id="user_query" type="text" />
      <Port id="context_data" type="object" />
      <Port id="previous_result" type="any" />
    </Inputs>
    <StatusIndicator state={nodeState} />
    <Outputs>
      <Port id="result" type="text" />
      <Port id="metadata" type="object" />
    </Outputs>
  </NodeBody>
</AIAgentNode>
```

### Node Execution Flow

1. **Input Reception**: Node receives data from connected upstream nodes
2. **Context Building**: Constructs prompt with inputs + screen awareness
3. **AI Processing**: Sends to Gemini Live API with appropriate tools
4. **Tool Execution**: Can call other tools as part of processing
5. **Output Generation**: Returns structured data to downstream nodes
6. **State Update**: Updates visual state (processing → complete)

### Node Configuration Options

```javascript
{
  nodeName: "Orchestrator_1",
  voice: "Puck",
  systemPrompt: "You are a workflow step that...",
  enabledTools: ["search_entries", "create_task"],
  inputSchema: {
    user_query: { type: "string", required: true },
    context_data: { type: "object", required: false }
  },
  outputSchema: {
    result: { type: "string" },
    metadata: { type: "object" }
  },
  settings: {
    screenAwareness: true,
    conversationHistory: false,
    maxTokens: 2000
  }
}
```

### Use Cases

#### Use Case 1: Content Analysis Pipeline
```
[Document Input] → [AI Agent: Summarize] → [AI Agent: Extract Keywords] → [Create Archiva Entry]
```

#### Use Case 2: Research Assistant
```
[User Query] → [AI Agent: Search Context] → [AI Agent: Synthesize] → [Format Output] → [Display]
```

#### Use Case 3: Multi-Agent Workflow
```
[Task Input] → [AI Agent: Brainstorm] → [AI Agent: Critique] → [AI Agent: Refine] → [Final Result]
```

#### Use Case 4: Interactive Loop
```
[User Input] → [AI Agent: Process] → [Decision Node] → [AI Agent: Follow-up] → [Output]
                                        ↓
                                   [Manual Review]
```

### Technical Implementation

#### New Node Type Definition
```javascript
// src/components/planner/nodes/AIAgentNode.jsx
export const AIAgentNode = {
  type: 'aiAgent',
  data: {
    label: 'AI Agent',
    icon: '🤖',
    config: { /* ... */ },
    inputs: [ /* ... */ ],
    outputs: [ /* ... */ ],
    state: 'idle' // idle | processing | complete | error
  },
  handle: async (inputs, config) => {
    // Execute AI agent logic
    // Call Live API with inputs
    // Return outputs
  }
}
```

#### Dock Mode State
```javascript
// Add to store
dockMode: 'chat' | 'node', // Default: 'chat'
activeNodeId: null, // When in node mode, ID of the node
nodeConfig: null // Configuration for the node
```

#### Mode Switching Logic
```javascript
const becomeNode = async (config) => {
  // 1. Switch dock to node mode
  setDockMode('node');

  // 2. Create node in planner canvas
  const node = createAIAgentNode({
    position: { x: 100, y: 100 },
    data: config
  });

  // 3. Link dock to node
  setActiveNodeId(node.id);

  // 4. Transform dock UI
  // Show input/output configuration panel
};

const returnToChat = () => {
  setDockMode('chat');
  setActiveNodeId(null);
  // Restore chat UI
};
```

### Visual States in Node Mode

- **Idle**: Gray node, no activity
- **Processing**: Blue pulsing border, "thinking" indicator
- **Complete**: Green checkmark, outputs ready
- **Error**: Red border, error message
- **Connected**: Shows data flow animation on edges

### Benefits

1. **Workflow Integration**: AI becomes part of automated processes
2. **Reusability**: Same AI agent can be used in multiple workflows
3. **Composability**: Chain multiple AI agents for complex tasks
4. **Visual Debugging**: See data flow through AI processing
5. **Collaborative**: Multiple users can share AI-powered workflows

### Implementation Phases

**Phase 1**: Basic transformation
- Add `become_planner_node()` tool
- Create basic AIAgentNode component
- Implement mode switching in dock

**Phase 2**: Input/Output configuration
- UI for defining inputs/outputs
- Schema validation
- Data type handling

**Phase 3**: Execution engine
- Connect node to Live API
- Handle data flow from upstream nodes
- Output to downstream nodes

**Phase 4**: Advanced features
- Multiple AI agent nodes
- Node presets (summarizer, analyzer, etc.)
- Save/load node configurations

---

## 10. Future Enhancements (Beyond Initial Scope)

- **Multimodal Interaction**: Screenshot + voice description
- **Proactive Suggestions**: AI suggests tools based on context
- **Custom Tools**: User-defined tool creation
- **Tool Macros**: Record and replay tool sequences
- **Integration Tools**: External APIs (GitHub, Notion, etc.)
- **Collaborative Tools**: Share tool execution with other users
- **Multi-Agent Orchestration**: Multiple AI agent nodes collaborating
- **Node Templates**: Pre-configured AI agents for common tasks

---

## 10. Next Steps

1. **Review & Approve**: User reviews this plan and provides feedback
2. **Prioritize**: Decide which tools are most critical for initial release
3. **Design Mockups**: Create visual mockups for key states
4. **Technical Spike**: Prototype tool execution system
5. **Iterate**: Build, test, refine based on user feedback

---

**Document Status**: Draft v1.0
**Last Updated**: 2025-09-30
**Owner**: David Caballero (KBLLR)