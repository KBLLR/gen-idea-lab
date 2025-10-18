# Gemini Live API - Enhanced Function Calling

**Last Updated**: 2025-10-01

This document describes the robust function calling implementation for Gemini Live API voice interactions.

---

## Overview

The enhanced voice function calling system integrates three sources of tools:
1. **Local Voice Functions** - UI navigation and orchestrator control
2. **Workflow Tools** - 7 workflow-specific tools (web search, RAG, documents, etc.)
3. **Assistant Tools** - 6 assistant-specific tools (knowledge base, memory, etc.)

**Total Available Tools**: ~20+ tools dynamically loaded based on context

---

## Architecture

### VoiceFunctionManager

Located: `/src/lib/voice/voiceFunctionManager.js`

**Key Features**:
- Centralized tool execution with automatic fallback
- Retry logic with exponential backoff
- Call history tracking and analytics
- Pending call state management
- Tool cancellation support

**Tool Resolution Order**:
```
1. Try local voice function (switch_app, open_settings, etc.)
   ↓ (if not found)
2. Try workflow tool (web_search, rag_query, create_document, etc.)
   ↓ (if not found)
3. Try assistant tool (query_knowledge_base, save_memory, etc.)
   ↓ (if all fail)
4. Return error with detailed message
```

### Integration Points

**GlassDock.jsx**:
- Loads all tools asynchronously before connecting
- Passes tools in Gemini Live API config
- Handles tool call events with error recovery
- Shows system messages for UI actions

**GenAILiveClient.js**:
- Emits `toolcall` events when Gemini requests function execution
- Accepts tool responses via `sendToolResponse()`
- Handles tool cancellations

---

## Available Tools

### Local Voice Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `switch_app` | Switch to different app | appName (enum) |
| `open_app` | Open specific app | appName (string) |
| `show_system_info` | Display system info modal | - |
| `start_chat` | Open orchestrator chat | - |
| `open_settings` | Open settings | - |
| `switch_module` | Switch academic module | moduleId (string) |
| `explain_concept` | Explain a concept | concept (string) |
| `search_knowledge` | Search knowledge base | query (string) |
| `run_code` | Execute code | language, code |
| `debug_error` | Debug error message | error_message |
| `analyze_composition` | Analyze design composition | image_url |
| `suggest_color_palette` | Suggest color palette | mood, style |
| `track_progress` | Track learning progress | - |
| `create_quiz` | Create quiz on topic | topic |
| `become_planner_node` | Transform to workflow node | nodeName, inputs, outputs |

### Workflow Tools (from workflowTools.js)

| Function | Description | Parameters |
|----------|-------------|------------|
| `web_search` | Search the web | query, max_results |
| `rag_query` | Query knowledge base | query, moduleId, topK |
| `rag_upsert` | Save to knowledge base | text, moduleId, metadata |
| `create_document` | Create Archiva document | title, content, tags |
| `image_generation` | Generate image | prompt, style |
| `invite_agent` | Invite AI agent to conversation | agentType, context |
| `app_state_snapshot` | Get app state | includeHistory |

### Assistant Tools (from assistantTools.js)

| Function | Description | Parameters |
|----------|-------------|------------|
| `query_knowledge_base` | Search module knowledge | query, top_k |
| `add_to_knowledge_base` | Save to knowledge base | text, metadata |
| `search_web` | Web search | query, max_results |
| `create_archiva_document` | Create document | title, content, tags |
| `get_conversation_context` | Retrieve conversation history | messages_back |
| `save_conversation_memory` | Save to long-term memory | memory_text, memory_type |

---

## Usage Examples

### Basic Voice Interaction

**User**: "Search the web for latest AI news"

**Flow**:
1. Gemini Live API recognizes intent → calls `web_search` tool
2. VoiceFunctionManager executes with retry logic
3. Tool result returned to Gemini
4. Gemini speaks response with search results

### Complex Multi-Tool Interaction

**User**: "Find information about React hooks and save it to my notes"

**Flow**:
1. Gemini calls `web_search("React hooks")`
2. VoiceFunctionManager executes, returns results
3. Gemini calls `create_archiva_document("React Hooks", results, ["react", "frontend"])`
4. VoiceFunctionManager executes, saves document
5. Gemini speaks: "I found some great resources on React hooks and saved them to your Archiva notes."

### Error Recovery Example

**User**: "Search for quantum computing"

**Flow**:
1. Gemini calls `web_search`
2. Attempt 1: Network timeout → retry after 1s
3. Attempt 2: API error → retry after 2s
4. Attempt 3: Success → return results
5. Gemini speaks results

---

## Configuration

### Loading Tools

```javascript
// In GlassDock.jsx handleConnect()
const tools = await getAvailableTools();

const config = {
  responseModalities: ['AUDIO'],
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: selectedVoice
      }
    }
  },
  systemInstruction: {
    parts: [{ text: systemInstructionText }]
  },
  tools: tools // All tools loaded from voiceFunctionManager
};

await connect(config);
```

### Tool Declaration Format (Gemini Live API)

```javascript
[{
  functionDeclarations: [
    {
      name: 'web_search',
      description: 'Search the web for information',
      parameters: {
        type: 'OBJECT',
        properties: {
          query: {
            type: 'STRING',
            description: 'The search query'
          },
          max_results: {
            type: 'NUMBER',
            description: 'Maximum results',
            default: 5
          }
        },
        required: ['query']
      }
    }
    // ... more tools
  ]
}]
```

### Handling Tool Calls

```javascript
// In GlassDock.jsx
const handleToolCall = async (functionCall) => {
  const { name, args, id } = functionCall;

  const context = {
    activeModuleId,
    activeApp,
    conversationId: `voice_${Date.now()}`,
    isVoice: true
  };

  try {
    // Robust execution with fallbacks
    const result = await voiceFunctionManager.executeFunction(
      name,
      args,
      context,
      id
    );

    // Send result back to Gemini
    client.sendToolResponse({
      functionResponses: [{
        id: functionCall.id,
        name: functionCall.name,
        response: result
      }]
    });
  } catch (error) {
    // Error handling with informative response
    client.sendToolResponse({
      functionResponses: [{
        id: functionCall.id,
        name: functionCall.name,
        response: {
          success: false,
          error: error.message
        }
      }]
    });
  }
};

client.on('toolcall', handleToolCall);
```

---

## Retry Logic

**Configuration**:
- Max retries: 3
- Base delay: 1000ms
- Backoff strategy: Exponential (delay × 2^attempt)

**Retry Schedule**:
```
Attempt 1: Immediate
Attempt 2: After 1000ms
Attempt 3: After 2000ms
```

**Retryable Errors**:
- Network timeouts
- API rate limits
- Temporary server errors

**Non-Retryable Errors**:
- Invalid parameters
- Permission denied
- Function not found

---

## State Management

### Pending Calls Tracking

```javascript
// Check pending calls
voiceFunctionManager.getPendingCallsCount()

// Cancel specific call
voiceFunctionManager.cancelCall(callId)

// Cancel all pending
voiceFunctionManager.cancelAllCalls()
```

### Call History

```javascript
// Get statistics
const stats = voiceFunctionManager.getCallStats();
/*
{
  totalCalls: 45,
  successfulCalls: 42,
  failedCalls: 3,
  averageDuration: 245, // ms
  functionBreakdown: {
    web_search: { count: 12, successes: 12, failures: 0 },
    rag_query: { count: 8, successes: 7, failures: 1 },
    // ...
  }
}
*/

// Clear history
voiceFunctionManager.clearHistory();
```

---

## Error Handling

### Levels of Error Handling

1. **Tool Level**: Each tool implementation handles its own errors
2. **Manager Level**: VoiceFunctionManager catches and retries
3. **Client Level**: GlassDock handles final failures and notifies user

### Error Response Format

```javascript
{
  success: false,
  error: "Tool execution failed: Network timeout",
  context: {
    attemptedFallbacks: ['workflow_tool', 'assistant_tool'],
    finalAttempt: true
  }
}
```

### User Notifications

**System Messages** (shown in voice chat):
- ✅ Success: "Switched to planner app"
- ⚠️ Warning: "Search completed with partial results"
- ❌ Error: "Failed to connect after 3 attempts"

---

## Debugging

### Enable Detailed Logging

```javascript
// Console logs automatically include:
// - [VoiceFunctionManager] prefix
// - Function name
// - Execution time
// - Success/failure status

// Example output:
[VoiceFunctionManager] web_search completed in 342ms: { success: true, results: [...] }
[VoiceFunctionManager] Attempt 2/3 failed: Network timeout
```

### Inspect Call History

```javascript
// In browser console
voiceFunctionManager.callHistory.forEach(call => {
  console.log(`${call.functionName}: ${call.success ? '✓' : '✗'} (${call.duration}ms)`);
});
```

### View Pending Calls

```javascript
// In browser console
console.table([...voiceFunctionManager.pendingCalls.values()]);
```

---

## Performance Optimization

### Tool Loading Strategy

- Tools loaded **once** when voice chat opens
- Cached in memory for duration of connection
- Re-loaded only when context changes significantly

### Concurrent Call Handling

- Multiple tool calls can execute in parallel
- Each tracked independently with unique callId
- Results returned in order received (not order called)

### Memory Management

- Call history limited to last 100 calls
- Pending calls auto-cleaned on completion
- System messages auto-removed after 3 seconds

---

## Best Practices

### For Adding New Tools

1. Define in appropriate file:
   - Voice-specific → `voiceFunctionManager.js`
   - Workflow-specific → `workflowTools.js`
   - Assistant-specific → `assistantTools.js`

2. Use consistent parameter format:
```javascript
{
  name: 'my_tool',
  description: 'Clear, actionable description',
  parameters: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'What this parameter does'
      }
    },
    required: ['param1']
  }
}
```

3. Return consistent response format:
```javascript
{
  success: true,
  message: 'User-friendly message',
  data: { /* actual data */ }
}
```

### For Voice Prompting

**Good Prompts**:
- "Search for quantum computing papers"
- "Open the planner and create a new workflow"
- "Save this idea to my knowledge base"

**Avoid**:
- Complex multi-step instructions in one sentence
- Ambiguous tool names (use natural language)
- Requests requiring visual feedback without verbal confirmation

---

## Testing

### Manual Testing Checklist

- [ ] Connect to Gemini Live API
- [ ] Trigger each tool category (local, workflow, assistant)
- [ ] Test error scenarios (network failure, invalid params)
- [ ] Verify retry logic with flaky connections
- [ ] Check call statistics after 10+ interactions
- [ ] Test concurrent tool calls
- [ ] Verify system messages appear correctly

### Automated Testing

```javascript
// Example test
describe('VoiceFunctionManager', () => {
  it('should retry failed calls with backoff', async () => {
    let attempts = 0;
    const mockTool = async () => {
      attempts++;
      if (attempts < 3) throw new Error('Network timeout');
      return { success: true };
    };

    const result = await voiceFunctionManager.executeWithRetry(mockTool, 3);

    expect(attempts).toBe(3);
    expect(result.success).toBe(true);
  });
});
```

---

## Troubleshooting

### Tools Not Loading

**Symptom**: Voice chat connects but no function calls work

**Diagnosis**:
```javascript
// In browser console after connecting
console.log(voiceFunctionManager.callHistory);
// If empty, tools didn't load
```

**Fix**:
- Check import paths in `voiceFunctionManager.js`
- Verify `workflowTools.js` and `assistantTools.js` export correctly
- Check browser console for import errors

### Tool Calls Timing Out

**Symptom**: All tool calls fail after max retries

**Diagnosis**:
```javascript
voiceFunctionManager.getCallStats().failedCalls
// High failure rate indicates systemic issue
```

**Fix**:
- Check network connectivity
- Verify API keys in `.env`
- Increase retry delay or max retries

### Gemini Not Calling Tools

**Symptom**: Voice chat works but Gemini never uses functions

**Diagnosis**:
- Check config passed to `connect()`
- Verify `tools` array is present and non-empty
- Check system instruction doesn't discourage tool use

**Fix**:
- Ensure tools loaded before connect
- Simplify tool descriptions
- Add examples to system instruction

---

## Future Enhancements

### Planned Improvements

1. **Tool Discovery**
   - Dynamic tool suggestions based on user intent
   - Contextual tool filtering

2. **Performance Metrics**
   - Real-time dashboard for tool performance
   - Anomaly detection for failing tools

3. **Advanced Retry Strategies**
   - Adaptive backoff based on error type
   - Circuit breaker pattern for repeatedly failing tools

4. **Tool Chaining**
   - Automatic multi-tool workflows
   - Dependency resolution

---

## Related Documentation

- [Gemini Live API Official Docs](https://ai.google.dev/gemini-api/docs/live-api)
- [Voice System Overview](/src/lib/voice/README.md)
- [Workflow Tools](/docs/workflow-tools.md)
- [Assistant Tools](/docs/assistant-tools.md)

---

**End of Enhanced Function Calling Documentation**
