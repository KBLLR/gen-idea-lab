# Context Awareness System

## Overview

The **Context Awareness** (Screen Awareness) system is a core feature of GenBooth that enables the Voice Orchestrator to understand what the user is currently viewing and working on. When enabled, the Orchestrator gains deep insight into the active app, current data, and user's workflow state, allowing it to provide intelligent, context-specific assistance.

## The Context Awareness Button

### Location
The context awareness toggle is located in the **GlassDock** toolbar, represented by an eye icon:
- 🔵 **Blue (Active)**: Orchestrator is aware of current screen context
- ⚪ **Gray (Inactive)**: Orchestrator has no screen context

### Keyboard Shortcut
- **Cmd/Ctrl + Shift + V**: Toggle voice chat (includes context awareness when opened)

### How It Works

When context awareness is enabled, the system:

1. **Detects the Active App**: Identifies which module the user is currently viewing
2. **Captures Relevant State**: Collects app-specific data (selected items, filters, current view, etc.)
3. **Injects Context into Prompts**: Automatically prepends context information to every voice interaction
4. **Maintains Session Memory**: Keeps track of the conversation flow within the current context

## Context by Application

### 1. Academic Mods (Idea Lab)

**What the Orchestrator Sees:**
```
Active App: Idea Lab
Selected Module: CDE-ENG05 (Creative Coding)
Module Personality: Kai (Creative Technologist)
Chat State: Open with Kai
Recent Resources:
- p5.js Documentation
- Three.js Examples
- Creative Coding Lecture Notes
```

**Example Interactions:**

**Without Context Awareness:**
```
User: "Can you help me with the assignment?"
Orchestrator: "I'd be happy to help! What assignment are you working on?"
```

**With Context Awareness:**
```
User: "Can you help me with the assignment?"
Orchestrator: "Sure! I see you're working with Kai on Creative Coding (CDE-ENG05).
Looking at the current module resources, I can help you with the p5.js interactive
sketch assignment. Would you like me to explain the particle system example or help
you debug your code?"
```

**Use Cases:**
- Get module-specific help without repeating the course name
- Access relevant documentation automatically
- Receive personality-appropriate responses (Kai's creative, experimental tone vs. Professor Ada's academic rigor)
- Quick navigation: "Open the Three.js example"

---

### 2. VizGen Booth (Image Generation)

**What the Orchestrator Sees:**
```
Active App: VizGen Booth
Selected Mode: Ideation Mode
Recent Generations: 3 images in current session
Last Prompt: "Cyberpunk city at sunset, neon lights, aerial view"
Active Model: DALL-E 3
Aspect Ratio: 16:9 (Landscape)
```

**Example Interactions:**

**Without Context Awareness:**
```
User: "Make it more vibrant"
Orchestrator: "I'm not sure what you'd like to make more vibrant. Could you provide more details?"
```

**With Context Awareness:**
```
User: "Make it more vibrant"
Orchestrator: "I'll enhance the vibrancy of your cyberpunk city prompt. Here's the updated
version: 'Vibrant cyberpunk city at sunset, intense neon lights in pink and blue,
aerial view, saturated colors, high contrast.' Generating now with DALL-E 3 in 16:9..."
```

**Use Cases:**
- Iterate on images with natural language ("darker", "add more people", "change the time of day")
- Switch modes by voice: "Switch to prototyping mode"
- Modify settings: "Make it square aspect ratio"
- Compare generations: "Show me the last three images"

---

### 3. ArchivAI (Knowledge Management)

**What the Orchestrator Sees:**
```
Active App: ArchivAI
Active Template: Research Paper Analysis
Current Entry: "Deep Learning Optimization Techniques"
Entry State: Draft (not published)
Tags: machine-learning, neural-networks, optimization
Linked Resources: 3 papers, 2 code repositories
Workflow: Literature Review → Analysis → Summary
```

**Example Interactions:**

**Without Context Awareness:**
```
User: "Add a section about Adam optimizer"
Orchestrator: "I can help you add information about the Adam optimizer.
Which document should I add this to?"
```

**With Context Awareness:**
```
User: "Add a section about Adam optimizer"
Orchestrator: "I'll add a section about the Adam optimizer to your 'Deep Learning
Optimization Techniques' research analysis. Based on your linked papers, I can see
you're already covering SGD and momentum. I'll insert this after the momentum section
with citations from your attached Kingma & Ba (2014) paper. Should I include the
mathematical formulation or focus on practical applications?"
```

**Use Cases:**
- Voice-driven content creation within templates
- Automatic cross-referencing of linked resources
- Workflow progression: "Move to the analysis stage"
- Template switching: "Convert this to a meeting notes template"
- Smart search: "Find entries related to this topic"

---

### 4. Workflows (Automation Builder)

**What the Orchestrator Sees:**
```
Active App: Workflows
Selected Workflow: "Research Paper Summary Pipeline"
Workflow State:
- Node 1: Ollama (Llama 3.2) - Extract key points
- Node 2: Google Drive - Save to folder
- Node 3: Gmail - Send summary to collaborators
Active Node: Node 1 (Ollama)
Node Configuration: Model=llama3.2, Temperature=0.3
```

**Example Interactions:**

**Without Context Awareness:**
```
User: "Change the temperature to 0.7"
Orchestrator: "Which model's temperature would you like to adjust?"
```

**With Context Awareness:**
```
User: "Change the temperature to 0.7"
Orchestrator: "I've updated the Ollama node in your 'Research Paper Summary Pipeline'
to use temperature 0.7. This will make the key points extraction more creative and varied.
The workflow is currently stopped - would you like me to run it with the new settings?"
```

**Use Cases:**
- Voice-guided workflow building: "Add a Gemini node after this"
- Parameter tuning by voice: "Make it more creative" → adjusts temperature
- Workflow execution: "Run this workflow on the last 5 PDFs"
- Debugging: "Why is the Gmail node failing?"
- Template application: "Apply the summarization template"

---

### 5. PlannerAI (Project Planning)

**What the Orchestrator Sees:**
```
Active App: PlannerAI
Active Canvas: "Semester Project Plan"
Nodes on Canvas:
- Google Calendar: Next 30 days of deadlines
- Notion: Project documentation
- GitHub: Code repository
- Gmail: Team communications
Active Connections: Calendar → Notion (deadline sync)
Selected Node: Google Calendar
```

**Example Interactions:**

**Without Context Awareness:**
```
User: "When's my next deadline?"
Orchestrator: "I don't have access to your calendar. Could you check your calendar app?"
```

**With Context Awareness:**
```
User: "When's my next deadline?"
Orchestrator: "Looking at your Google Calendar node in the Semester Project Plan,
your next deadline is the Creative Coding assignment on October 15th (in 12 days).
I also see you have a research paper due on October 22nd. Would you like me to create
a task breakdown in your Notion workspace for the Creative Coding project?"
```

**Use Cases:**
- Multi-service queries: "What's in my calendar and my GitHub issues?"
- Connection building: "Link my calendar to Notion for deadline tracking"
- Smart suggestions: "What should I work on today?" (considers calendar + tasks + priorities)
- Resource discovery: "Find all documents related to this project"
- Workflow creation: "Create a daily standup workflow from these sources"

---

### 6. CalendarAI (Event Countdown)

**What the Orchestrator Sees:**
```
Active App: CalendarAI
Active Events:
- CODE Demo Day (Oct 15, 2025) - 12 days remaining
- Semester End Party (Dec 20, 2025) - 78 days remaining
Google Calendar: Connected
Filter: Upcoming Events
Event Categories: 2 academic, 1 social
```

**Example Interactions:**

**Without Context Awareness:**
```
User: "How long until Demo Day?"
Orchestrator: "I don't see any event called 'Demo Day' in my knowledge.
Could you provide more details?"
```

**With Context Awareness:**
```
User: "How long until Demo Day?"
Orchestrator: "CODE Demo Day is in 12 days, 7 hours, and 23 minutes. It's on
October 15th at 2:00 PM. I see you have it marked as an academic event. Would you
like me to create a preparation checklist or set up reminder notifications?"
```

**Use Cases:**
- Event queries without specifying full names: "When's the party?"
- Category filtering by voice: "Show only academic events"
- Countdown updates: "How much time do I have?"
- Event creation: "Add a study session for tomorrow at 3pm"
- Google Calendar sync: "Import my calendar events"

---

## Technical Implementation

### Screen Context Detection

The system uses a content-based detection strategy implemented in `src/lib/voice/enhancedVoiceSystem.js`:

```javascript
export function getCurrentScreenContext() {
  const state = useStore.getState();
  const activeApp = state.activeApp;

  // Detect active app
  let context = `Active App: ${getAppName(activeApp)}\n\n`;

  // App-specific context
  switch (activeApp) {
    case 'ideaLab':
      if (state.activeModuleId) {
        const module = getModuleById(state.activeModuleId);
        context += `Selected Module: ${module['Module Code']} (${module['Module Title']})\n`;

        const personality = personalities[state.activeModuleId];
        if (personality) {
          context += `Module Personality: ${personality.name} (${personality.role})\n`;
        }
      }
      break;

    case 'archiva':
      if (state.activeEntryId) {
        const entry = getActiveEntry(state.activeEntryId);
        context += `Active Entry: ${entry.title}\n`;
        context += `Template: ${entry.template}\n`;
        context += `State: ${entry.published ? 'Published' : 'Draft'}\n`;
      }
      break;

    // ... other apps
  }

  return context;
}
```

### Context Injection

When screen awareness is enabled, context is automatically prepended to every prompt:

```javascript
// In src/lib/voice/enhancedVoiceSystem.js
async function processVoiceInput(transcript) {
  let fullPrompt = transcript;

  if (isScreenAware) {
    const screenContext = getCurrentScreenContext();
    fullPrompt = `[SCREEN CONTEXT]\n${screenContext}\n\n[USER INPUT]\n${transcript}`;
  }

  // Send to Gemini Live API
  await sendToOrchestrator(fullPrompt);
}
```

### State Synchronization

The system listens for state changes and updates context in real-time:

```javascript
// Subscribe to store changes
useEffect(() => {
  const unsubscribe = useStore.subscribe((state, prevState) => {
    // Update context when relevant state changes
    if (state.activeApp !== prevState.activeApp ||
        state.activeModuleId !== prevState.activeModuleId ||
        state.activeEntryId !== prevState.activeEntryId) {
      refreshContext();
    }
  });

  return unsubscribe;
}, []);
```

---

## Best Practices

### When to Enable Context Awareness

✅ **Enable When:**
- Working within a specific app/module for extended period
- Need app-specific help or navigation
- Want hands-free interaction with current data
- Building workflows or complex projects

❌ **Disable When:**
- Having general conversations unrelated to current work
- Want to ask about a different app without switching
- Discussing sensitive information in view
- Testing prompts that shouldn't reference current state

### Privacy Considerations

**What's NOT Sent:**
- File contents or code (only metadata like filenames, titles)
- Personal identification beyond what's in UI labels
- Credentials or API keys
- Private messages or communications content

**What IS Sent:**
- App names and navigation state
- Titles of visible items (modules, entries, events)
- UI state (filters, selections, view mode)
- High-level configuration (model names, template types)

### Debugging Context

To see what the Orchestrator sees, check the browser console when screen awareness is enabled:

```javascript
// In browser console
console.log(getCurrentScreenContext());
```

This prints the exact context string being sent with each voice interaction.

---

## Future Enhancements

### Planned Features
1. **Context History**: Remember context from previous conversations in the session
2. **Cross-App Awareness**: "Based on my calendar, suggest what to work on from my workflows"
3. **Smart Context Compression**: Summarize large contexts to fit within token limits
4. **Visual Context**: Include screenshots or canvas snapshots for visual understanding
5. **Proactive Suggestions**: Orchestrator offers help based on detected context changes

### Under Consideration
- Context presets: Save and load specific context configurations
- Multi-user context: Understand collaborative workspaces
- External service context: Pull in data from connected APIs automatically

---

## Troubleshooting

### "Orchestrator doesn't know about my current work"

**Check:**
1. ✓ Is the eye icon blue in GlassDock?
2. ✓ Is the correct app active in the app switcher?
3. ✓ Have you selected a specific item (module, entry, workflow)?

**Solution:** Toggle screen awareness off and on to refresh context.

---

### "Context seems outdated"

**Cause:** State change wasn't detected by the subscription system.

**Solution:**
- Switch to another app and back
- Refresh the page
- Toggle screen awareness

---

### "Orchestrator references wrong app"

**Cause:** Context detection race condition during app switching.

**Solution:** Wait 1-2 seconds after switching apps before speaking to allow context to update.

---

## Related Documentation

- [Voice Commands Reference](./voice-commands.md)
- [GlassDock Features](./glass-dock.md)
- [Module Personalities](./module-personalities.md)
- [Enhanced Voice System Architecture](./voice-system-architecture.md)

---

**Last Updated**: 2025-10-03
**Maintainer**: GenBooth Development Team
**Related Files**:
- `src/lib/voice/enhancedVoiceSystem.js`
- `src/components/GlassDock.jsx`
- `src/lib/store.js`
