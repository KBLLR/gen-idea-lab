# Hume EVI Integration Guide

## Overview

This guide provides step-by-step instructions for integrating Hume's Empathic Voice Interface (EVI) into GenBooth's GlassDock as a complementary emotional intelligence layer alongside the existing Gemini Live API orchestrator.

---

## Prerequisites

### 1. Hume AI Account Setup

1. **Sign up** at [https://beta.hume.ai](https://beta.hume.ai)
2. **Get API credentials** from [API Keys page](https://beta.hume.ai/settings/keys):
   - `HUME_API_KEY`
   - `HUME_SECRET_KEY`
3. **(Optional)** Create an EVI configuration:
   - Navigate to EVI Configurations
   - Create a custom voice personality
   - Note the `CONFIG_ID`

### 2. Install Dependencies

```bash
npm install @humeai/voice-react hume
```

**Package purposes:**
- `@humeai/voice-react`: React hooks and components for Hume EVI
- `hume`: Server-side SDK for access token generation

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      GlassDock                          │
│                                                         │
│  ┌───────────────┐              ┌──────────────┐      │
│  │ Voice System  │              │   Emotion    │      │
│  │   Switcher    │◄────────────►│   Toggle     │      │
│  └───────┬───────┘              └──────────────┘      │
│          │                                             │
│          ├──────────┬──────────────────────────┐      │
│          ▼          ▼                          ▼       │
│  ┌───────────┐ ┌──────────┐          ┌─────────────┐ │
│  │  Gemini   │ │   Hume   │          │   Hybrid    │ │
│  │   Live    │ │   EVI    │          │  Detection  │ │
│  │   (Task)  │ │(Emotion) │          │   Router    │ │
│  └───────────┘ └──────────┘          └─────────────┘ │
│       │              │                       │         │
│       └──────────────┴───────────────────────┘         │
│                      │                                  │
│                      ▼                                  │
│            ┌──────────────────┐                        │
│            │  Message History │                        │
│            │   & Transcript   │                        │
│            └──────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Environment Variables

Add to `.env`:

```bash
# Hume AI Credentials
HUME_API_KEY=your_hume_api_key_here
HUME_SECRET_KEY=your_hume_secret_key_here
HUME_CONFIG_ID=your_optional_config_id
```

Add to `.env.example`:

```bash
# Hume AI (Optional - for empathic voice mode)
HUME_API_KEY=
HUME_SECRET_KEY=
HUME_CONFIG_ID=
```

---

### Step 2: Server-Side Access Token Generation

**Create**: `src/lib/hume/getHumeAccessToken.js`

```javascript
import Hume from 'hume';

/**
 * Generate Hume access token server-side
 * Token is scoped to specific user and expires after configured time
 */
export async function getHumeAccessToken(userId) {
  const apiKey = process.env.HUME_API_KEY;
  const secretKey = process.env.HUME_SECRET_KEY;

  if (!apiKey || !secretKey) {
    console.error('[Hume] API credentials not configured');
    return null;
  }

  try {
    const client = new Hume.HumeClient({
      apiKey,
      secretKey
    });

    const accessToken = await client.empathicVoice.chat.getAccessToken({
      userId: userId || 'anonymous',
      // Token expires in 30 minutes
      expiresIn: 1800
    });

    return accessToken;
  } catch (error) {
    console.error('[Hume] Failed to generate access token:', error);
    return null;
  }
}
```

---

### Step 3: Server Endpoint for Token Generation

**Add to** `server.js`:

```javascript
import { getHumeAccessToken } from './src/lib/hume/getHumeAccessToken.js';

// Hume EVI: Generate access token
app.post('/api/hume/access-token', requireAuth, async (req, res) => {
  try {
    const userId = req.user.email;
    const accessToken = await getHumeAccessToken(userId);

    if (!accessToken) {
      return res.status(500).json({ error: 'Failed to generate Hume access token' });
    }

    res.json({ accessToken });
  } catch (error) {
    logger.error('Hume access token generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

### Step 4: Hume Voice Client Component

**Create**: `src/lib/voice/HumeVoiceClient.jsx`

```jsx
import React, { useRef, useCallback } from 'react';
import { VoiceProvider, useVoice } from '@humeai/voice-react';

export const HumeVoiceProvider = ({ children, onMessage, onError }) => {
  const configId = process.env.HUME_CONFIG_ID;

  return (
    <VoiceProvider
      configId={configId}
      onMessage={onMessage}
      onError={onError}
      onOpen={() => console.log('[Hume] Connection opened')}
      onClose={() => console.log('[Hume] Connection closed')}
    >
      {children}
    </VoiceProvider>
  );
};

export const useHumeVoice = () => {
  const {
    connect,
    disconnect,
    sendSessionSettings,
    sendUserInput,
    sendAssistantInput,
    status,
    messages,
    isPlaying,
    isMuted,
    micFft,
    error
  } = useVoice();

  const [accessToken, setAccessToken] = React.useState(null);

  // Fetch access token from server
  const initializeHume = useCallback(async () => {
    try {
      const response = await fetch('/api/hume/access-token', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get Hume access token');
      }

      const { accessToken } = await response.json();
      setAccessToken(accessToken);

      // Connect to Hume
      await connect({ accessToken });
    } catch (err) {
      console.error('[Hume] Initialization failed:', err);
      throw err;
    }
  }, [connect]);

  return {
    connect: initializeHume,
    disconnect,
    sendUserInput,
    sendAssistantInput,
    status,
    messages,
    isPlaying,
    isMuted,
    micFft,
    error,
    isConnected: status === 'connected'
  };
};
```

---

### Step 5: Voice System Manager (Dual System)

**Create**: `src/lib/voice/VoiceSystemManager.js`

```javascript
/**
 * Manages switching between Gemini and Hume voice systems
 */
export class VoiceSystemManager {
  constructor() {
    this.activeSystem = 'gemini'; // 'gemini' | 'hume'
    this.emotionalKeywords = [
      'stressed', 'frustrated', 'confused', 'overwhelmed',
      'scared', 'worried', 'anxious', 'lost', 'stuck',
      'tired', 'exhausted', 'give up', 'can\'t do',
      'don\'t understand', 'don\'t get it'
    ];
  }

  /**
   * Detect if message needs emotional support
   */
  needsEmotionalSupport(text) {
    const lowerText = text.toLowerCase();
    return this.emotionalKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Detect if message is a task/query
   */
  isTaskQuery(text) {
    const taskKeywords = [
      'show me', 'open', 'create', 'add', 'delete',
      'change', 'update', 'set', 'get', 'find',
      'search', 'run', 'execute', 'navigate'
    ];
    const lowerText = text.toLowerCase();
    return taskKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Recommend which system to use
   */
  recommendSystem(text, context) {
    // Always use Gemini for task queries
    if (this.isTaskQuery(text)) {
      return 'gemini';
    }

    // Use Hume for emotional support if enabled
    if (this.needsEmotionalSupport(text) && context.humeEnabled) {
      return 'hume';
    }

    // Default to active system
    return this.activeSystem;
  }

  setActiveSystem(system) {
    this.activeSystem = system;
  }

  getActiveSystem() {
    return this.activeSystem;
  }
}

export const voiceSystemManager = new VoiceSystemManager();
```

---

### Step 6: Update GlassDock with Hume Toggle

**Add to** `src/components/GlassDock.jsx`:

```jsx
import { HumeVoiceProvider, useHumeVoice } from '../lib/voice/HumeVoiceClient';
import { voiceSystemManager } from '../lib/voice/VoiceSystemManager';

export default function GlassDock() {
  // ... existing state
  const [humeEnabled, setHumeEnabled] = useState(false);
  const [activeVoiceSystem, setActiveVoiceSystem] = useState('gemini');

  // Hume voice hooks (only when enabled)
  const humeVoice = humeEnabled ? useHumeVoice() : null;

  // Toggle Hume empathic mode
  const toggleHumeMode = useCallback(() => {
    setHumeEnabled(prev => !prev);
    if (!humeEnabled) {
      setActiveVoiceSystem('hume');
      voiceSystemManager.setActiveSystem('hume');
    } else {
      setActiveVoiceSystem('gemini');
      voiceSystemManager.setActiveSystem('gemini');
    }
  }, [humeEnabled]);

  // Handle voice input (route to appropriate system)
  const handleVoiceInput = useCallback(async (transcript) => {
    const context = {
      humeEnabled,
      activeApp: useStore.getState().activeApp,
      screenContext: getCurrentScreenContext()
    };

    const recommendedSystem = voiceSystemManager.recommendSystem(transcript, context);

    if (recommendedSystem === 'hume' && humeEnabled && humeVoice) {
      // Use Hume for emotional support
      await humeVoice.sendUserInput(transcript);
    } else {
      // Use Gemini for tasks
      const fullPrompt = context.screenContext + '\n\n' + transcript;
      await geminiClient.send(fullPrompt);
    }
  }, [humeEnabled, humeVoice, geminiClient]);

  // ... rest of component

  return (
    <div className="glass-dock">
      {/* Existing toolbar */}
      <GlassDockToolbar
        // ... existing props
        humeEnabled={humeEnabled}
        onToggleHume={toggleHumeMode}
      />

      {/* Wrap with Hume provider if enabled */}
      {humeEnabled ? (
        <HumeVoiceProvider
          onMessage={(msg) => {
            console.log('[Hume] Message:', msg);
            // Add to message history
          }}
          onError={(err) => {
            console.error('[Hume] Error:', err);
          }}
        >
          {/* Voice chat UI */}
        </HumeVoiceProvider>
      ) : (
        /* Regular Gemini voice chat */
      )}
    </div>
  );
}
```

---

### Step 7: Add Hume Toggle to Toolbar

**Update** `src/components/glassdock/GlassDockToolbar.jsx`:

```jsx
export default function GlassDockToolbar({
  // ... existing props
  humeEnabled,
  onToggleHume
}) {
  return (
    <div className="glassdock-toolbar">
      {/* ... existing buttons */}

      {/* Empathic Mode Toggle */}
      <button
        className={`icon-btn ${humeEnabled ? 'active empathic' : ''}`}
        onClick={onToggleHume}
        data-tip="Empathic Mode"
        title="Toggle emotional intelligence (Hume AI)"
      >
        <span className="icon">favorite</span>
      </button>
    </div>
  );
}
```

**Add CSS** to `src/styles/components/glass-dock.css`:

```css
.icon-btn.empathic.active {
  background: linear-gradient(135deg, #ff6b9d, #c06c84);
  color: white;
}

.icon-btn.empathic.active .icon {
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  10%, 30% { transform: scale(1.1); }
  20%, 40% { transform: scale(1); }
}
```

---

### Step 8: Emotion Visualization Component

**Create**: `src/components/EmotionIndicator.jsx`

```jsx
import React from 'react';
import '../styles/components/emotion-indicator.css';

export default function EmotionIndicator({ emotions }) {
  if (!emotions || emotions.length === 0) return null;

  // Get top 3 detected emotions
  const topEmotions = emotions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="emotion-indicator">
      <div className="emotion-label">Detected emotions:</div>
      <div className="emotion-list">
        {topEmotions.map((emotion, i) => (
          <div key={i} className="emotion-badge" style={{
            '--intensity': emotion.score
          }}>
            <span className="emotion-name">{emotion.name}</span>
            <div className="emotion-bar">
              <div
                className="emotion-fill"
                style={{ width: `${emotion.score * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Create**: `src/styles/components/emotion-indicator.css`

```css
.emotion-indicator {
  padding: 12px;
  background: color-mix(in lab, var(--color-surface) 70%, black);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--border-radius-md);
  margin: 8px 0;
}

.emotion-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.emotion-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.emotion-badge {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.emotion-name {
  font-size: 12px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.emotion-bar {
  height: 4px;
  background: color-mix(in lab, var(--color-surface) 85%, white 5%);
  border-radius: 2px;
  overflow: hidden;
}

.emotion-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b9d, #c06c84);
  transition: width 0.3s ease;
  opacity: var(--intensity);
}
```

---

## Testing the Integration

### 1. Test Emotional Detection

**Scenario 1: Stressed Student**
```
User: "I'm so stressed about this Creative Coding assignment..."

Expected (Hume):
[Warm, reassuring tone]
"I can hear that you're feeling overwhelmed right now. Creative Coding can be
challenging, but you're not alone in this. What specific part is stressing you out?"
```

**Scenario 2: Excited About Progress**
```
User: "I finally got the particle system working!"

Expected (Hume):
[Enthusiastic, matching energy]
"That's amazing! I can tell you're really excited about this - and you should be!
Particle systems are tricky. What made it click for you?"
```

### 2. Test System Switching

**Scenario: Emotional → Task**
```
User: "I'm confused about this..." [Hume responds with empathy]
User: "Show me the p5.js docs" [Auto-switches to Gemini, opens resources]
User: "I still don't understand..." [Switches back to Hume for support]
```

### 3. Test Voice Quality

Compare naturalness and emotional tone:
- Record Gemini response to "I'm frustrated"
- Record Hume response to same phrase
- Listen for prosody differences (tone, warmth, pacing)

---

## Configuration Options

### Hume EVI Configuration

Create custom voice configurations at [https://beta.hume.ai/evi/configurations](https://beta.hume.ai/evi/configurations):

```json
{
  "name": "Kai - Creative Mentor",
  "systemPrompt": "You are Kai, a warm and encouraging creative technologist mentor. You help students with Creative Coding assignments, providing emotional support alongside technical guidance. You recognize when students are frustrated and adapt your tone to be more reassuring. You celebrate their successes with genuine enthusiasm.",
  "voice": {
    "provider": "hume",
    "voiceId": "kai_empathic"
  },
  "languageModel": {
    "provider": "openai",
    "modelId": "gpt-4"
  },
  "emotionalExpression": {
    "enabled": true,
    "adaptiveness": "high"
  }
}
```

---

## Monitoring & Analytics

### Track Emotional Metrics

```javascript
// Add to GlassDock analytics
const trackEmotionMetrics = (emotions) => {
  const topEmotion = emotions[0];

  // Log to analytics
  console.log('[Analytics] Emotion detected:', {
    emotion: topEmotion.name,
    intensity: topEmotion.score,
    timestamp: new Date().toISOString()
  });

  // Could send to analytics service
  // analytics.track('emotion_detected', { ... });
};
```

### Monitor System Switches

```javascript
// Track which system is being used
const trackSystemUsage = (system, reason) => {
  console.log('[Analytics] Voice system:', {
    system,
    reason,
    timestamp: new Date().toISOString()
  });
};
```

---

## Troubleshooting

### "Failed to get Hume access token"

**Cause**: Missing or invalid Hume credentials

**Solution**:
1. Check `.env` has correct `HUME_API_KEY` and `HUME_SECRET_KEY`
2. Verify credentials at [https://beta.hume.ai/settings/keys](https://beta.hume.ai/settings/keys)
3. Restart server after adding credentials

---

### "Hume connection fails"

**Cause**: WebRTC/WebSocket issues

**Solution**:
1. Check browser console for WebRTC errors
2. Ensure HTTPS in production (required for microphone access)
3. Check firewall/proxy settings

---

### "Emotion detection not working"

**Cause**: Silent or low-quality audio input

**Solution**:
1. Check microphone permissions
2. Test with louder, clearer speech
3. Verify microphone in browser settings
4. Check `micFft` values (should show audio activity)

---

### "System doesn't auto-switch correctly"

**Cause**: Keyword detection too sensitive/insensitive

**Solution**:
1. Adjust `emotionalKeywords` array in `VoiceSystemManager.js`
2. Add app-specific routing logic
3. Allow manual override via toggle

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up Hume credentials
3. ✅ Implement server endpoint
4. ✅ Create Hume client component
5. ✅ Add toggle to GlassDock
6. ✅ Test with Academic Mods
7. ✅ Configure module personalities
8. ✅ Monitor and iterate

---

## Additional Resources

- [Hume AI Documentation](https://hume.docs.buildwithfern.com/)
- [EVI React SDK Reference](https://hume.docs.buildwithfern.com/docs/empathic-voice-interface-evi/react-sdk)
- [Emotion Classification](https://hume.docs.buildwithfern.com/docs/empathic-voice-interface-evi/emotion-models)
- [Voice Configurations](https://beta.hume.ai/evi/configurations)

---

**Last Updated**: 2025-10-03
**Author**: GenBooth Development Team
**Related Files**:
- `docs/voice-systems-comparison.md`
- `docs/context-awareness.md`
- `empathic-ai/` (starter template)
