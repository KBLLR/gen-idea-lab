# GenBooth Idea Lab - Current State Documentation

**Last Updated**: 2025-10-01
**Session Focus**: Orchestrator-as-Node Phase 3, Multi-Provider Tool Calling, Assistant Upgrades

---

## Executive Summary

This session completed the orchestrator-as-node feature with voice narration, visual feedback, and full workflow execution across all node types. Additionally, implemented comprehensive multi-provider tool calling for both workflow nodes and module assistants, with persistent memory integration.

**Major Accomplishments**:
- ✅ Web Speech API integration for orchestrator voice narration
- ✅ Visual state indicators for all node types (idle/processing/complete/error)
- ✅ Multi-provider AI integration (Gemini, OpenAI, Claude, Ollama)
- ✅ 7 workflow tools with provider-specific adapters
- ✅ 6 assistant tools with RAG memory persistence
- ✅ Glass Dock auto-centering and subtitle display
- ✅ Fixed critical node configuration bugs

---

## Critical Bug Fixes

### 1. Orchestrator Node Configuration Bug
**Symptom**: Buttons in NodeModePanel didn't execute actions; nodes "bounced"

**Root Causes**:
1. Zustand immer immutability violation in `store.js:becomePlannerNode`
2. NodeModePanel reading `activeNodeId` instead of `nodeId` prop
3. Missing event prevention on buttons

**Fix** (`store.js:418-470`):
```javascript
becomePlannerNode: (config) => {
  set((state) => {
    // CORRECT: Mutate state directly with immer
    state.plannerGraph.nodes.push(newNode);
    // INCORRECT (previous): const graph = state.plannerGraph; graph.nodes.push(newNode);
  });
}
```

### 2. Voice Narration Not Speaking
**Symptom**: Orchestrator narration logged but no audio output

**Fix** (`PlannerCanvas.jsx:2403-2443`):
```javascript
if ('speechSynthesis' in window) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 1.1;
  utterance.pitch = 1.0;
  utterance.volume = 0.9;

  const getVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  };

  getVoiceAndSpeak();
}
```

---

## Architecture Overview

### Multi-Provider Tool Calling

**Flow**:
1. User/workflow triggers AI completion with tools enabled
2. System selects provider adapter based on model prefix
3. Tools converted to provider-specific schema
4. AI responds with function calls
5. Tools executed locally
6. Results sent back for final response

**Provider Adapters** (`workflowTools.js:216-377`):

| Provider | Tool Schema | Response Format | Models |
|----------|-------------|-----------------|--------|
| Gemini | `functionDeclarations` | `functionCall` | gemini-2.5-flash, gemini-2.0-flash-exp |
| OpenAI | `functions` array | `tool_calls` | gpt-4o, gpt-4o-mini |
| Claude | `input_schema` | `tool_use` | claude-3-5-sonnet, claude-3-5-haiku |
| Ollama | OpenAI-compatible | `tool_calls` | gpt-oss:20b, llama3.2, qwen2.5 |

### Workflow Engine Updates

**New Functions** (`workflowEngine.js`):
- `executeAICompletion()` - Unified chat without tools
- `executeAICompletionWithTools()` - Multi-turn tool calling
- Updated all `execute*Node()` functions to use real APIs

**Node State Machine**:
```
idle → processing → complete
   ↓                    ↓
   └─────→ error ←──────┘
```

### Assistant System Architecture

**Tool Categories**:

1. **Knowledge Base** (`assistantTools.js:12-49`):
   - `query_knowledge_base` - Search module RAG
   - `add_to_knowledge_base` - Save to RAG
   - `save_conversation_memory` - Long-term memory

2. **External Data** (`assistantTools.js:51-69`):
   - `search_web` - Web search via `/api/tools/web-search`

3. **Document Creation** (`assistantTools.js:71-93`):
   - `create_archiva_document` - Create ArchivAI entries

4. **Context Management** (`assistantTools.js:95-129`):
   - `get_conversation_context` - Retrieve history (pending full implementation)

**Assistant Response Flow** (`assistant.js:16-78`):
```javascript
getAssistantResponse(history, personalityId, options)
  ↓
  Fetch RAG context from last user message
  ↓
  Build messages + system instruction
  ↓
  enableTools ? getAssistantResponseWithTools : getAssistantResponseSimple
  ↓
  Return { responseText, toolsUsed }
```

---

## Key Files and Changes

### `/src/components/PlannerCanvas.jsx`
**Purpose**: Workflow canvas with execution control

**Changes**:
- Added `onRunWorkflow` with Web Speech API integration (lines 2393-2455)
- Enhanced `LabelNode` component with state indicators (lines 52-141)
- Color-coded borders: blue (processing), green (complete), red (error)
- Processing spinner and error message display

### `/src/lib/store.js`
**Purpose**: Zustand state management

**Changes**:
- Added narration state (lines 105-107):
  - `orchestratorNarration` - current message
  - `orchestratorNarrationHistory` - last 50 messages
- Fixed `becomePlannerNode` immutability bug (lines 418-470)
- Actions: `setOrchestratorNarration`, `clearOrchestratorNarration` (lines 366-383)

### `/src/components/GlassDock.jsx`
**Purpose**: Draggable orchestrator interface

**Changes**:
- Auto-centering on voice chat open (lines 91-98)
- Connected to narration store for subtitles (lines 1050-1056)
- Speaker icon toggle for subtitle display

### `/src/components/NodeModePanel.jsx`
**Purpose**: Node configuration UI

**Changes**:
- Provider selector (Gemini/OpenAI/Claude/Ollama) (lines 160-175)
- Model selector with provider-specific options (lines 177-217)
- Event handling fixes (preventDefault, stopPropagation)

### `/src/lib/workflowEngine.js`
**Purpose**: Workflow execution engine

**Changes**:
- Complete rewrite of AI execution functions (lines 11-160)
- `executeAICompletion` - simple chat
- `executeAICompletionWithTools` - multi-turn tool calling
- Updated all node executors to use real APIs

### `/src/lib/workflowTools.js` ⭐ NEW
**Purpose**: Workflow tool definitions and adapters

**Content**:
- 7 tools: web_search, rag_query, rag_upsert, create_document, image_generation, invite_agent, app_state_snapshot
- Provider adapters for Gemini, OpenAI, Claude, Ollama (lines 216-377)
- Tool execution functions (lines 379-565)

### `/src/lib/assistantTools.js` ⭐ NEW
**Purpose**: Assistant-specific tools

**Content**:
- 6 tools: query_knowledge_base, add_to_knowledge_base, search_web, create_archiva_document, get_conversation_context, save_conversation_memory
- Tool execution with context (moduleId, userId, conversationId)
- RAG integration for memory persistence (lines 331-367)

### `/src/lib/assistant.js`
**Purpose**: Assistant chat system

**Changes**:
- Complete rewrite with tool calling support
- `getAssistantResponseWithTools` - multi-turn pattern (lines 83-182)
- RAG context injection from knowledge base (lines 25-38)
- Multi-provider support (lines 85)

### `/src/lib/actions.js`
**Purpose**: Store action handlers

**Changes**:
- Updated `sendToAssistant` to pass context (lines 393-413)
- Enabled tools by default
- Track `toolsUsed` in response history

### `/server.js`
**Purpose**: Express API server

**Changes**:
- Added `/api/chat/tools` endpoint (lines 1594-1821)
- Multi-provider tool calling (Gemini, OpenAI, Claude, Ollama)
- Unified `/api/tools/web-search` endpoint
- Tool schema conversion per provider

---

## API Endpoints

### Chat Endpoints

**`POST /api/chat`**
Simple chat without tools
```json
{
  "model": "gemini-2.5-flash",
  "messages": [{ "role": "user", "content": "Hello" }],
  "systemPrompt": "You are helpful"
}
```

**`POST /api/chat/tools`**
Chat with tool calling support
```json
{
  "model": "gemini-2.5-flash",
  "messages": [{ "role": "user", "content": "Search for AI news" }],
  "systemPrompt": "You are helpful",
  "tools": [...],
  "provider": "gemini"
}
```

Response:
```json
{
  "response": "I found 3 articles...",
  "toolCalls": [
    {
      "id": "call_123",
      "name": "web_search",
      "args": { "query": "AI news", "max_results": 3 }
    }
  ]
}
```

### Tool Endpoints

**`POST /api/tools/web-search`**
```json
{
  "query": "AI news",
  "max_results": 3
}
```

**`POST /api/rag/query`**
```json
{
  "query": "How do I use agents?",
  "moduleId": "archiva",
  "topK": 4
}
```

**`POST /api/rag/upsert`**
```json
{
  "text": "Important fact to remember",
  "moduleId": "archiva",
  "metadata": { "type": "conversation_memory" }
}
```

---

## Visual State Indicators

**Node States**:

| State | Border Color | Icon | Animation |
|-------|-------------|------|-----------|
| idle | default gray | none | none |
| processing | #3b82f6 (blue) | pending | spinner |
| complete | #10b981 (green) | check_circle | none |
| error | #ef4444 (red) | error | none |

**Implementation** (`PlannerCanvas.jsx:52-141`):
```javascript
function LabelNode({ data }) {
  const state = data.state || 'idle';
  const error = data.error;

  const getStateColor = () => {
    switch (state) {
      case 'processing': return '#3b82f6';
      case 'complete': return '#10b981';
      case 'error': return '#ef4444';
      default: return null;
    }
  };

  return (
    <div style={stateColor ? { borderColor: stateColor } : {}}>
      {stateIcon && <span style={{ color: stateColor }}>{stateIcon}</span>}
      {state === 'processing' && <span className="processing-spinner"></span>}
      {state === 'error' && error && <div className="node-error">{error}</div>}
    </div>
  );
}
```

---

## Known Issues

### 1. Port 8081 Conflict
**Status**: Background process issue, not blocking
**Description**: Server occasionally fails to start due to port already in use
**Workaround**: Kill process on port 8081 or restart

### 2. Conversation Context Tool
**Status**: Pending full implementation
**Description**: `get_conversation_context` tool returns placeholder
**Location**: `assistantTools.js:309-326`
**Note**: Requires conversation history database

---

## Testing Guide

### Test Workflow Execution
1. Open Planner app
2. Create workflow with AI agent node
3. Click "Run Workflow" button
4. Verify:
   - Node border turns blue (processing)
   - Orchestrator speaks narration
   - Subtitle appears in Glass Dock
   - Node turns green on completion

### Test Tool Calling
1. Create AI agent node with tools enabled
2. Set prompt: "Search for latest AI news"
3. Run workflow
4. Verify:
   - `web_search` tool called
   - Results displayed in node output
   - Tool usage logged in console

### Test Assistant Tools
1. Open any module (Archiva, Codex, etc.)
2. Ask: "Remember that I prefer dark mode"
3. Verify:
   - `save_conversation_memory` tool called
   - Success message in response
4. Ask: "What are my preferences?"
5. Verify:
   - `query_knowledge_base` tool called
   - Dark mode preference retrieved

### Test Multi-Provider Support
1. Create 4 AI nodes with different providers:
   - Node 1: Gemini (gemini-2.5-flash)
   - Node 2: OpenAI (gpt-4o)
   - Node 3: Claude (claude-3-5-sonnet)
   - Node 4: Ollama (gpt-oss:20b)
2. Run workflow
3. Verify all nodes complete successfully

---

## Environment Variables Required

```env
# AI Providers
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434

# Search (optional)
TAVILY_API_KEY=your_key_here
```

---

## Next Development Priorities

1. **Implement Conversation History Storage**
   - Database schema for conversation persistence
   - Complete `get_conversation_context` tool implementation
   - Link to user authentication

2. **Add More Workflow Tools**
   - File system operations
   - GitHub integration
   - Notion integration
   - Calendar/scheduling

3. **Enhance Visual Feedback**
   - Progress bars for long-running tasks
   - Real-time tool execution logs
   - Workflow execution timeline view

4. **Optimize Performance**
   - Cache tool results
   - Parallel node execution where possible
   - Stream LLM responses instead of waiting

5. **Error Handling**
   - Retry logic for failed tool calls
   - Graceful degradation when providers unavailable
   - Better error messages to users

---

## Code Patterns to Follow

### Adding a New Workflow Tool

1. Define in `workflowTools.js`:
```javascript
export const WORKFLOW_TOOLS = {
  my_new_tool: {
    name: 'my_new_tool',
    description: 'Does something useful',
    parameters: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: 'First param' }
      },
      required: ['param1']
    }
  }
};
```

2. Add execution function:
```javascript
async function executeMyNewTool({ param1 }) {
  try {
    // Implementation
    return { success: true, result: 'Done!' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

3. Register in `executeTool` switch statement

### Adding a New Assistant Tool

Same pattern as workflow tools, but in `assistantTools.js` and use context:
```javascript
async function executeMyAssistantTool({ param1 }, { moduleId, userId, conversationId }) {
  // Can access module-specific data and user context
}
```

### Adding a New AI Provider

1. Add model options in `NodeModePanel.jsx`:
```javascript
{settings.provider === 'myprovider' && (
  <>
    <option value="model-1">Model 1</option>
    <option value="model-2">Model 2</option>
  </>
)}
```

2. Add adapter in `workflowTools.js`:
```javascript
export const ToolAdapters = {
  myprovider: {
    convertTools(tools) { /* convert to provider format */ },
    parseToolCalls(response) { /* extract tool calls */ },
    formatToolResults(results) { /* format for provider */ }
  }
};
```

3. Add endpoint logic in `server.js /api/chat/tools`

---

## Troubleshooting

### Voice Narration Not Working
- Check browser supports Web Speech API
- Verify audio permissions granted
- Check speaker volume / output device

### Tools Not Executing
- Verify API keys in `.env`
- Check console for error messages
- Confirm tool names match exactly
- Verify provider adapter registered

### Node State Not Updating
- Check `setNodes` callback passed to `executeWorkflow`
- Verify state transitions logged in console
- Inspect node data structure in React DevTools

### Assistant Memory Not Persisting
- Verify RAG endpoints working (`/api/rag/query`, `/api/rag/upsert`)
- Check moduleId passed correctly
- Confirm vector database initialized

---

## Session User Messages Log

1. "the orchestrator is not speaking"
2. "the voice i mean, I know it listens and reacts but no voice sound comes out"
3. "this can be implemented in the subtitles part of the glass dock"
4. "continue, the glass dock icon, the speaker icon, reveals the subtitles, I would like that to work"
5. "the thing is that when I tell the orchestrator to become a node, then when I click in the buttons during configuration, the node just bounces, it doesnt really action or become a node"
6. "only happens with the orchestrator node, when I ask him to become a planner node"
7. "when I use command+shift+v or whichever way, the orchestrator should center itself in the front of the screen"
8. [Console output showing successful workflow execution]
9. "continue"
10. "Add visual state indicators for non-AI-agent node"
11. "continue, once is solid we integrate more providers"
12. "can you please revise that we actually have many providers ? user just needs to add theur apis"
13. "ollama uses gpt-oss 20b"
14. "please ollama list for the actual models locallyh"
15. "are the tool panels operative?"
16. "please with adapters to each model provider"
17. "can you revisit the assistants chat and make it work? so they can use tools and memory?"
18. "please leave a current-state .md for next agent"

---

**End of Current State Documentation**
