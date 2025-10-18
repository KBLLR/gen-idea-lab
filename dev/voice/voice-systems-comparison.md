# Voice Systems Comparison: Gemini Live API vs Hume EVI

## Executive Summary

GenBooth currently uses **Gemini Live API** for voice orchestration. **Hume EVI (Empathic Voice Interface)** offers specialized emotional intelligence capabilities that could significantly enhance user experience. This document compares both systems and outlines integration strategies.

---

## Feature Comparison

| Feature | Gemini Live API (Current) | Hume EVI | Winner |
|---------|---------------------------|----------|--------|
| **Emotional Intelligence** | ❌ None | ✅ Advanced emotion detection & response | 🎯 Hume |
| **Context Awareness** | ✅ Excellent (via prompts) | ⚠️ Limited (config-based) | 🎯 Gemini |
| **Function Calling** | ✅ Native support | ❌ Not available | 🎯 Gemini |
| **Multimodal** | ✅ Text + Voice + Vision | ⚠️ Voice only | 🎯 Gemini |
| **Response Quality** | ✅ GPT-4 level | ✅ Specialized for empathy | 🤝 Tie |
| **Latency** | ⚠️ ~500-1000ms | ✅ ~300-500ms | 🎯 Hume |
| **Voice Quality** | ✅ Good | ✅ Very natural | 🤝 Tie |
| **Emotional Tone** | ❌ Neutral/professional | ✅ Empathic/adaptive | 🎯 Hume |
| **Setup Complexity** | ⚠️ Complex (WebSocket proxy) | ✅ Simple (React SDK) | 🎯 Hume |
| **Cost** | $$$ (token-based) | $$ (minute-based) | 🎯 Hume |
| **Screen Awareness** | ✅ Full context injection | ❌ Limited | 🎯 Gemini |
| **Tool Integration** | ✅ Can call APIs | ❌ Response-only | 🎯 Gemini |

---

## Detailed Analysis

### 1. Emotional Intelligence

**Gemini Live API:**
```
User: "I'm really stressed about this deadline..."
Gemini: "I understand you have a deadline. Let me help you organize your tasks."
```
❌ Functional but emotionally flat

**Hume EVI:**
```
User: "I'm really stressed about this deadline..." [detects anxiety in voice]
Hume: [Warm, reassuring tone] "I can hear that you're feeling overwhelmed right now.
      Let's take this one step at a time together. What's the most pressing thing?"
```
✅ Emotionally responsive, adaptive tone, validates feelings

**Hume's Emotion Detection:**
- Analyzes 48+ emotional dimensions in real-time
- Detects: anxiety, excitement, confusion, frustration, joy, etc.
- Adjusts response tone dynamically
- Can mirror or counter emotions appropriately

---

### 2. Context Awareness & Function Calling

**Gemini Live API:**
```javascript
// Full screen context injection
const context = `
Active App: CalendarAI
Upcoming Events: 3
Next Deadline: Demo Day (12 days)
Selected Category: This Week
`;

// Function calling for actions
await gemini.sendFunctionCall({
  name: 'createEvent',
  parameters: { title: 'Study Session', when: '2025-10-05T15:00' }
});
```
✅ **Gemini excels at**: Workflow automation, tool integration, multi-step tasks

**Hume EVI:**
```typescript
// Configuration-based prompts (static)
const config = {
  systemPrompt: "You are a supportive assistant for students.",
  // Cannot dynamically inject screen context
  // Cannot call functions or trigger actions
};
```
❌ **Hume limited to**: Conversational responses only

**Verdict:** For GenBooth's workflow-heavy features (Academic Mods, Workflows, PlannerAI), Gemini's context awareness is critical.

---

### 3. Use Case Analysis by App

#### Academic Mods (Idea Lab)

**Best fit:** 🎯 **Hybrid** (Gemini for tasks, Hume for tutoring)

**Gemini strengths:**
- Access module resources
- Navigate personality chats
- Trigger workflow actions
- Switch between modules by voice

**Hume strengths:**
- Empathic tutoring sessions
- Reduce academic anxiety
- Adaptive encouragement
- Emotional support during difficult concepts

**Example scenario:**
```
User: [frustrated tone] "I don't understand this p5.js particle system at all!"

Hume (empathic): "I hear that frustration - particle systems can be really confusing
                  at first! Many students struggle with this. Let's break it down
                  together. What specific part is tripping you up?"

Then hands off to Gemini to pull up the p5.js docs and explain the code.
```

---

#### VizGen Booth

**Best fit:** 🎯 **Gemini** (needs function calling for image generation)

**Why Gemini:**
- Must call DALL-E/Stable Diffusion APIs
- Iterate on prompts with context
- Change settings (aspect ratio, model, etc.)

**Hume value:** Could provide empathic feedback on creative blocks
```
User: "I hate how this turned out..."
Hume: "It sounds like this isn't matching your vision. That's a totally normal
       part of the creative process. What specifically would you like to change?"
```

---

#### ArchivAI

**Best fit:** 🎯 **Gemini** (requires document manipulation)

**Why Gemini:**
- Create/edit entries
- Apply templates
- Search and link resources
- Navigate workflows

**Hume value:** Minimal - task-oriented app

---

#### Workflows

**Best fit:** 🎯 **Gemini** (pure automation)

**Why Gemini:**
- Configure nodes
- Execute workflows
- Debug errors
- Connect services

**Hume value:** None - technical app

---

#### PlannerAI

**Best fit:** 🎯 **Gemini** (multi-service orchestration)

**Why Gemini:**
- Query across services (Calendar + Notion + GitHub)
- Create connections
- Generate workflows
- Smart suggestions based on context

**Hume value:** Could help with decision fatigue, project anxiety

---

#### CalendarAI

**Best fit:** 🎯 **Hybrid** (Gemini for tasks, Hume for motivation)

**Gemini strengths:**
- Create events
- Filter categories
- Sync Google Calendar
- Set reminders

**Hume strengths:**
- Motivational countdown ("You've got this! Only 5 days to Demo Day!")
- Reduce deadline anxiety
- Celebrate achievements

---

## Emotional Intelligence Deep Dive

### Hume's Prosody Model

Hume analyzes voice for:

1. **Arousal**: Energy level (calm ↔ excited)
2. **Valence**: Emotional tone (negative ↔ positive)
3. **Dominance**: Confidence (uncertain ↔ assertive)

**48 Emotional Expressions Detected:**
- Admiration, Adoration, Aesthetic Appreciation, Amusement
- Anger, Anxiety, Awe, Awkwardness, Boredom, Calmness
- Concentration, Confusion, Contempt, Contentment, Craving
- Determination, Disappointment, Disgust, Distress, Doubt
- Ecstasy, Embarrassment, Empathic Pain, Entrancement
- Envy, Excitement, Fear, Guilt, Horror, Interest, Joy
- Love, Nostalgia, Pain, Pride, Realization, Relief
- Romance, Sadness, Satisfaction, Desire, Shame, Surprise
- Sympathy, Tiredness, Triumph

### Real-World Example

**Scenario**: Student struggling with Creative Coding assignment at 2am

**Hume Detection:**
```json
{
  "anxiety": 0.82,
  "tiredness": 0.76,
  "frustration": 0.68,
  "determination": 0.45
}
```

**Hume Response:**
[Soft, understanding tone]
"I can tell you're really pushing yourself right now, and it's late. I admire your
determination, but it sounds like you might be hitting a wall. Sometimes stepping
away for even 10 minutes can help things click. Want to try that, or would you
rather keep going?"

**vs Gemini Response:**
"I can help you debug your p5.js code. What's the error you're encountering?"

---

## Integration Strategies

### Option 1: Dual System (Recommended)

**Architecture:**
```
GlassDock
├─ Gemini Orchestrator (default) - All apps, context-aware, function calling
└─ Hume Companion (toggle) - Academic Mods, CalendarAI, emotional support
```

**Implementation:**
1. Add Hume toggle in GlassDock toolbar (heart icon)
2. When enabled, Hume handles emotional conversations
3. Gemini handles all task execution and context queries
4. Seamless handoff between systems

**User Flow:**
```
[Hume mode enabled]

User: "I'm so behind on this assignment..."
Hume: [Empathic response] "That must feel really overwhelming. Let's figure this out together."

User: "Show me the assignment requirements"
→ Automatically hands off to Gemini
Gemini: [Pulls up module resources from context]

User: "I still don't get it..."
→ Hands back to Hume
Hume: "Okay, let's slow down. What's the first thing that's confusing you?"
```

---

### Option 2: Hume for Specific Personas

**Use Hume for emotionally-aware module personalities:**

```javascript
const modulePersonalities = {
  'CDE-ENG05': {
    name: 'Kai',
    voiceSystem: 'hume',  // Empathic creative mentor
    humeConfig: {
      systemPrompt: "You are Kai, a warm and encouraging creative technologist..."
    }
  },
  'MAT-SCI01': {
    name: 'Professor Ada',
    voiceSystem: 'gemini',  // Academic rigor, less emotional
  }
};
```

**Benefits:**
- Each module has appropriate emotional intelligence
- Kai (Creative Coding) = empathic, encouraging
- Professor Ada (Math) = precise, logical
- Automatically switches based on active module

---

### Option 3: Gemini with Emotion Prompt Engineering

**Enhance Gemini prompts to simulate emotional awareness:**

```javascript
const emotionalPrompt = `
You are an emotionally intelligent assistant. Analyze the user's message for:
- Emotional tone (frustrated, excited, anxious, confused)
- Energy level (high, medium, low)

Adapt your response accordingly:
- If anxious: Reassure and break down steps
- If frustrated: Validate feelings, offer alternatives
- If excited: Match enthusiasm, celebrate progress
- If confused: Slow down, use simpler language
`;
```

**Pros:**
- No additional API costs
- Keeps context awareness and function calling

**Cons:**
- Not as accurate as Hume's prosody analysis
- Text-based emotion detection vs voice analysis
- Less natural emotional responses

---

## Implementation Roadmap

### Phase 1: Proof of Concept (1-2 days)
1. Install Hume SDK: `npm install @humeai/voice-react hume`
2. Create `HumeVoiceChat` component parallel to existing GlassDock
3. Test emotional detection with sample conversations
4. Compare response quality vs Gemini

### Phase 2: Dual System Integration (3-5 days)
1. Add Hume toggle to GlassDock toolbar
2. Implement voice system switching
3. Create handoff logic (task detection)
4. Test with Academic Mods use cases

### Phase 3: Smart Routing (1 week)
1. Automatic system selection based on:
   - Query type (emotional vs functional)
   - Active app
   - User preference
2. Seamless transitions mid-conversation
3. Unified message history

### Phase 4: Personality Integration (1 week)
1. Map module personalities to voice systems
2. Configure Hume prompts per personality
3. Context injection for Hume when possible
4. Emotion-aware screen awareness

---

## Cost Analysis

### Gemini Live API
- **Pricing**: ~$0.02 per 1K input tokens, ~$0.08 per 1K output tokens
- **Average session**: 15 minutes = ~$0.50-1.00
- **Monthly (100 sessions)**: ~$50-100

### Hume EVI
- **Pricing**: $0.06 per minute
- **Average session**: 15 minutes = $0.90
- **Monthly (100 sessions)**: ~$90

**Note**: Hume is more predictable (minute-based), Gemini varies by conversation complexity.

---

## Security & Privacy

### Gemini Live API
- ✅ Backend WebSocket proxy (API key hidden)
- ✅ JWT authentication
- ✅ Server-side token management
- ⚠️ Sends screen context (titles, metadata only)

### Hume EVI
- ✅ Access token generated server-side
- ✅ Emotion data stays in session
- ⚠️ Voice recordings processed by Hume
- ⚠️ Emotion patterns could be sensitive data

**Privacy consideration**: Hume's emotion detection is more invasive than Gemini's text-based approach. Users should be informed that emotional state is being analyzed.

---

## Recommendations

### Immediate Action
1. ✅ **Keep Gemini as primary orchestrator** - critical for context awareness and function calling
2. ✅ **Add Hume as emotional support companion** - toggle in GlassDock for Academic Mods and CalendarAI
3. ✅ **Dual system approach** - best of both worlds

### Implementation Priority
1. **High Priority**: Hume integration for Academic Mods (Kai personality)
2. **Medium Priority**: CalendarAI motivational support
3. **Low Priority**: Other apps (limited value)

### User Experience
- **Default**: Gemini (familiar, powerful)
- **Opt-in**: Hume toggle (heart icon) for emotional conversations
- **Auto-detect**: Switch to Hume when detecting emotional keywords ("stressed", "confused", "frustrated")

---

## Example Integration Code

### Dual System Switcher

```typescript
// src/lib/voice/voiceSystemManager.ts
export type VoiceSystem = 'gemini' | 'hume';

export class VoiceSystemManager {
  private activeSystem: VoiceSystem = 'gemini';
  private geminiClient: GenAIProxyClient;
  private humeClient: HumeVoiceClient;

  async processInput(transcript: string): Promise<void> {
    // Detect if emotional support needed
    const needsEmpathy = this.detectEmotionalKeywords(transcript);

    if (needsEmpathy && this.humeEnabled) {
      await this.switchToHume();
      await this.humeClient.send(transcript);
    } else {
      await this.switchToGemini();
      const context = getCurrentScreenContext();
      await this.geminiClient.send(`${context}\n\n${transcript}`);
    }
  }

  private detectEmotionalKeywords(text: string): boolean {
    const emotionalKeywords = [
      'stressed', 'frustrated', 'confused', 'overwhelmed',
      'scared', 'worried', 'anxious', 'lost', 'stuck'
    ];
    return emotionalKeywords.some(kw => text.toLowerCase().includes(kw));
  }
}
```

### GlassDock Toggle

```jsx
// Add to GlassDock toolbar
<button
  className={`icon-btn ${humeEnabled ? 'active' : ''}`}
  onClick={() => setHumeEnabled(!humeEnabled)}
  data-tip="Empathic Mode"
>
  <span className="icon">favorite</span>
</button>
```

---

## Conclusion

**Best Strategy**: **Hybrid System**

- **Gemini** remains the primary orchestrator for all functional tasks
- **Hume** adds emotional intelligence layer for Academic Mods and CalendarAI
- Users toggle between systems or auto-switch based on conversation type
- Combines Gemini's context awareness with Hume's emotional intelligence

**Next Steps:**
1. Set up Hume API credentials
2. Build proof-of-concept integration
3. Test with real student interactions
4. Measure user satisfaction vs Gemini-only baseline

---

**Last Updated**: 2025-10-03
**Author**: GenBooth Development Team
**Related Files**:
- `src/lib/voice/genAIProxyClient.js` (Gemini implementation)
- `empathic-ai/` (Hume EVI starter)
- `docs/context-awareness.md`
