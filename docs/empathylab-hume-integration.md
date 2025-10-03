# EmpathyLab + Hume Integration Strategy

## Vision: Complete Multimodal Empathy

Combine **Human** (visual intelligence) + **Hume** (vocal intelligence) to create the most advanced empathic AI system for education and research.

```
👁️ Human detects:          🎤 Hume detects:           🧠 Combined Intelligence:
- Face position            - Voice emotions (48)      - "User looks away + anxious voice
- Facial expressions       - Prosody patterns           = Offer simplified explanation"
- Gaze direction          - Tone, pitch, rhythm
- Body posture            - Conversational cues      - "Excited voice + forward lean
- Hand gestures                                        + wide eyes = Highly engaged"
- 7 basic emotions
```

---

## Architecture Overview

### Three-Layer Integration

```
┌─────────────────────────────────────────────────────────────┐
│ 1. EmpathyLab App (Dedicated Research Environment)         │
│    - Full multimodal tracking + empathic chat               │
│    - Session recording with visual + vocal emotions         │
│    - Research data export (timestamped emotion fusion)      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. GlassDock Global Toggle (Cross-App Empathy)             │
│    - "Empathic Mode" button next to voice chat             │
│    - Enables Hume voice + Human face tracking everywhere   │
│    - Orchestrator gets emotional context in all apps        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. Shared Emotion Fusion Engine                            │
│    - Combines Hume prosody + Human facial emotions          │
│    - Resolves conflicts (happy voice but sad face?)         │
│    - Provides unified emotion vector to AI                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: EmpathyLab Enhancement (Recommended Start)

#### 1.1 Update EmpathyLabSidebar - Model Status Panel

Replace "Privacy Settings" with **dual-column layout**:

**Left Column**: Privacy & Tracking Controls (existing)
**Right Column**: Model Status & Activation

```jsx
// EmpathyLabSidebar.jsx - Add Model Status Panel

function ModelStatusPanel({ humanActive, humeActive, onToggleHume }) {
  return (
    <Panel variant="sidebar" title="Detection Models" icon="model_training">
      <div className="model-grid">
        {/* Human Library */}
        <div className={`model-card ${humanActive ? 'active' : 'inactive'}`}>
          <div className="model-header">
            <span className="icon">visibility</span>
            <h4>Human (Visual)</h4>
            <span className={`status-badge ${humanActive ? 'active' : ''}`}>
              {humanActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="model-features">
            <div className="feature-item">
              <span className="icon">face</span>
              <span>Face Detection</span>
            </div>
            <div className="feature-item">
              <span className="icon">mood</span>
              <span>7 Emotions</span>
            </div>
            <div className="feature-item">
              <span className="icon">visibility</span>
              <span>Gaze Tracking</span>
            </div>
            <div className="feature-item">
              <span className="icon">accessibility</span>
              <span>Body Pose</span>
            </div>
            <div className="feature-item">
              <span className="icon">back_hand</span>
              <span>Hand Gestures</span>
            </div>
          </div>

          <div className="model-stats">
            <div className="stat">
              <strong>Backend:</strong> WebGL
            </div>
            <div className="stat">
              <strong>FPS:</strong> 30
            </div>
            <div className="stat">
              <strong>Latency:</strong> 15ms
            </div>
          </div>
        </div>

        {/* Hume EVI */}
        <div className={`model-card ${humeActive ? 'active' : 'inactive'}`}>
          <div className="model-header">
            <span className="icon">mic</span>
            <h4>Hume EVI (Voice)</h4>
            <span className={`status-badge ${humeActive ? 'active' : ''}`}>
              {humeActive ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="model-features">
            <div className="feature-item">
              <span className="icon">psychology</span>
              <span>48 Emotions</span>
            </div>
            <div className="feature-item">
              <span className="icon">graphic_eq</span>
              <span>Prosody Analysis</span>
            </div>
            <div className="feature-item">
              <span className="icon">chat</span>
              <span>Empathic Chat</span>
            </div>
            <div className="feature-item">
              <span className="icon">sentiment_satisfied</span>
              <span>Tone Detection</span>
            </div>
          </div>

          <div className="model-stats">
            <div className="stat">
              <strong>Status:</strong> {humeActive ? 'Streaming' : 'Ready'}
            </div>
            <div className="stat">
              <strong>Latency:</strong> {humeActive ? '120ms' : 'N/A'}
            </div>
          </div>

          <Button
            variant={humeActive ? 'secondary' : 'primary'}
            icon={humeActive ? 'stop' : 'play_arrow'}
            onClick={onToggleHume}
          >
            {humeActive ? 'Disconnect' : 'Start Empathic Chat'}
          </Button>
        </div>

        {/* Emotion Fusion Engine */}
        {humanActive && humeActive && (
          <div className="model-card fusion">
            <div className="model-header">
              <span className="icon">hub</span>
              <h4>Multimodal Fusion</h4>
              <span className="status-badge active">Fusing</span>
            </div>

            <div className="fusion-visualization">
              {/* Show combined emotion state */}
              <EmotionFusionVisualization />
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
```

#### 1.2 Main Canvas Layout - Split Screen

```
┌─────────────────────────────────────────────────────────────┐
│                         BoothHeader                         │
│  EmpathyLab | Multimodal Intelligence | Status: Tracking    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────────┐
│  Webcam + Visual Overlay │    Hume Empathic Chat            │
│                          │                                  │
│  [Video Feed]            │  [Chat Messages with Emotions]   │
│  - Face detection        │                                  │
│  - Emotion labels        │  User: "I'm stuck on this..."    │
│  - Gaze arrows           │  😟 Confusion: 0.72              │
│  - Body skeleton         │  😰 Anxiety: 0.45                │
│  - Hand landmarks        │                                  │
│                          │  AI: "Let's break it down..."    │
│                          │  😊 Contentment: 0.68            │
│                          │  🤗 Empathic Pain: 0.52          │
│  [Detection Stats]       │                                  │
│  Emotion: Confused 68%   │  [Voice Controls]                │
│  Gaze: Looking Away      │  [Mic FFT Visualization]         │
│  Posture: Slouched       │                                  │
└──────────────────────────┴──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 Combined Emotion Timeline                    │
│  [Chart showing Hume (voice) + Human (face) over time]      │
└─────────────────────────────────────────────────────────────┘
```

#### 1.3 Emotion Fusion Logic

```javascript
// lib/emotionFusion.js

/**
 * Fuses Hume voice emotions with Human facial emotions
 * Resolves conflicts and provides unified emotion vector
 */
export function fuseEmotions(humeEmotions, humanEmotions) {
  // Map Human's 7 emotions to Hume's 48
  const emotionMapping = {
    happy: ['Joy', 'Amusement', 'Excitement', 'Pride'],
    sad: ['Sadness', 'Disappointment', 'Guilt', 'Grief'],
    angry: ['Anger', 'Contempt', 'Disgust', 'Annoyance'],
    surprise: ['Surprise', 'Realization', 'Awe'],
    fear: ['Fear', 'Anxiety', 'Distress', 'Horror'],
    disgust: ['Disgust', 'Contempt'],
    neutral: ['Calmness', 'Concentration', 'Contemplation']
  };

  const fused = {};

  // Start with Hume's detailed emotions
  Object.entries(humeEmotions || {}).forEach(([emotion, score]) => {
    fused[emotion] = score;
  });

  // Boost scores where Human confirms the same emotion family
  Object.entries(humanEmotions || {}).forEach(([humanEmotion, score]) => {
    const relatedHumeEmotions = emotionMapping[humanEmotion] || [];

    relatedHumeEmotions.forEach(humeEmotion => {
      if (fused[humeEmotion] !== undefined) {
        // Average the two sources with slight weight to Hume (0.6)
        fused[humeEmotion] = (fused[humeEmotion] * 0.6) + (score * 0.4);
      }
    });
  });

  // Detect conflicts (e.g., happy voice but sad face)
  const conflicts = detectEmotionConflicts(humeEmotions, humanEmotions);

  return {
    fusedEmotions: fused,
    conflicts,
    confidence: calculateFusionConfidence(humeEmotions, humanEmotions)
  };
}

function detectEmotionConflicts(hume, human) {
  const conflicts = [];

  // Example: If Hume says "Joy" but Human says "sad"
  if (hume?.Joy > 0.5 && human?.sad > 0.5) {
    conflicts.push({
      type: 'polarity_mismatch',
      voice: 'Joy',
      face: 'Sadness',
      interpretation: 'User may be masking true feelings (forced positivity)'
    });
  }

  if (hume?.Anxiety > 0.6 && human?.happy > 0.4) {
    conflicts.push({
      type: 'suppressed_anxiety',
      voice: 'Anxiety',
      face: 'Happy',
      interpretation: 'User may be anxious but trying to appear confident'
    });
  }

  return conflicts;
}

function calculateFusionConfidence(hume, human) {
  // Higher confidence when both sources agree
  const humeTop = Object.entries(hume || {}).sort((a, b) => b[1] - a[1])[0];
  const humanTop = Object.entries(human || {}).sort((a, b) => b[1] - a[1])[0];

  if (!humeTop || !humanTop) return 0.5;

  // Check if they're in the same family
  const emotionMapping = {
    happy: ['Joy', 'Amusement', 'Excitement'],
    sad: ['Sadness', 'Disappointment'],
    // ... etc
  };

  const humanFamily = Object.entries(emotionMapping).find(([key]) => key === humanTop[0]);
  if (humanFamily && humanFamily[1].includes(humeTop[0])) {
    return 0.9; // High confidence - both agree
  }

  return 0.6; // Moderate confidence - sources diverge
}
```

#### 1.4 Integrate Hume Chat into EmpathyLab

```jsx
// EmpathyLab.jsx - Add Hume integration

import { VoiceProvider, useVoice } from '@humeai/voice-react';
import HumeMessages from './hume/Messages';
import HumeControls from './hume/Controls';
import { fuseEmotions } from '../lib/emotionFusion';

export default function EmpathyLab() {
  const [humeAccessToken, setHumeAccessToken] = useState(null);
  const [isHumeActive, setIsHumeActive] = useState(false);
  const [fusedEmotions, setFusedEmotions] = useState(null);

  // ... existing Human tracking code ...

  // Fetch Hume access token
  const initHume = async () => {
    try {
      const response = await fetch('/api/services/hume/token', {
        credentials: 'include'
      });
      const { accessToken } = await response.json();
      setHumeAccessToken(accessToken);
      setIsHumeActive(true);
    } catch (err) {
      console.error('Failed to get Hume token:', err);
    }
  };

  // Fuse emotions whenever either updates
  useEffect(() => {
    if (results?.face?.[0]?.emotion && humeEmotions) {
      const humanEmotionMap = {};
      results.face[0].emotion.forEach(e => {
        humanEmotionMap[e.emotion] = e.score;
      });

      const fused = fuseEmotions(humeEmotions, humanEmotionMap);
      setFusedEmotions(fused);

      // Log conflicts for research purposes
      if (fused.conflicts.length > 0) {
        console.log('Emotion conflicts detected:', fused.conflicts);
      }
    }
  }, [results, humeEmotions]);

  return (
    <div className="empathy-lab">
      <BoothHeader {...headerProps} />

      <div className="empathy-lab-main split-view">
        {/* Left: Visual Tracking */}
        <div className="visual-tracking-panel">
          <div className="video-container">
            <canvas ref={canvasRef} />
            <canvas ref={overlayCanvasRef} />
          </div>
          <VisualEmotionStats results={results} />
        </div>

        {/* Right: Hume Empathic Chat */}
        {isHumeActive && humeAccessToken ? (
          <VoiceProvider
            auth={{ type: 'accessToken', value: humeAccessToken }}
            onMessage={(msg) => {
              // Extract Hume emotions
              if (msg.models?.prosody?.scores) {
                setHumeEmotions(msg.models.prosody.scores);
              }
            }}
          >
            <div className="hume-chat-panel">
              <HumeMessages />
              <HumeControls />
            </div>
          </VoiceProvider>
        ) : (
          <div className="hume-placeholder">
            <span className="icon">mic_off</span>
            <p>Empathic chat not active</p>
            <Button onClick={initHume}>Start Empathic Chat</Button>
          </div>
        )}
      </div>

      {/* Bottom: Combined Timeline */}
      {fusedEmotions && (
        <Panel title="Multimodal Emotion Timeline">
          <EmotionFusionTimeline
            fusedData={fusedEmotions}
            conflicts={fusedEmotions.conflicts}
          />
        </Panel>
      )}
    </div>
  );
}
```

---

### Phase 2: GlassDock Global Toggle

Enable empathic mode across ALL apps (Academic Mods, Archiva, Planner, etc.)

#### 2.1 Add "Empathic Mode" Button to GlassDock

```jsx
// GlassDock.jsx

const [isEmpathicModeActive, setIsEmpathicModeActive] = useState(false);

// Add button next to voice chat toggle
<DockButton
  icon={isEmpathicModeActive ? "psychology" : "psychology_alt"}
  label="Empathic Mode"
  active={isEmpathicModeActive}
  onClick={() => setIsEmpathicModeActive(!isEmpathicModeActive)}
  tooltip="Enable emotional awareness (face + voice)"
/>
```

#### 2.2 Global Emotion Context Provider

```jsx
// lib/emotionContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { fuseEmotions } from './emotionFusion';

const EmotionContext = createContext();

export function EmotionProvider({ children }) {
  const [emotions, setEmotions] = useState(null);
  const [isActive, setIsActive] = useState(false);

  // Global emotion state available to all apps
  return (
    <EmotionContext.Provider value={{ emotions, isActive, setIsActive }}>
      {children}
    </EmotionContext.Provider>
  );
}

export function useEmotions() {
  return useContext(EmotionContext);
}
```

#### 2.3 Inject Emotions into Orchestrator Prompts

```javascript
// lib/assistant.js - Enhance prompts with emotional context

export async function getAssistantResponse(userMessage, conversationHistory) {
  const emotions = useStore.getState().globalEmotions;

  let systemPrompt = baseSystemPrompt;

  if (emotions?.isActive && emotions?.current) {
    const topEmotions = Object.entries(emotions.current.fusedEmotions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, score]) => `${name} (${(score * 100).toFixed(0)}%)`)
      .join(', ');

    systemPrompt += `\n\n**EMOTIONAL CONTEXT**:\nUser's current emotional state: ${topEmotions}\n`;

    if (emotions.current.conflicts?.length > 0) {
      systemPrompt += `\nConflicts detected: ${emotions.current.conflicts[0].interpretation}\n`;
    }

    systemPrompt += `\nAdjust your response to be empathetic and supportive. If the user seems confused or anxious, offer to simplify or break down complex topics.`;
  }

  // ... rest of assistant logic
}
```

---

### Phase 3: Advanced Features

#### 3.1 Session Recording with Multimodal Data

```javascript
// Export research data with synchronized timestamps

const sessionExport = {
  sessionId: crypto.randomUUID(),
  startTime: sessionStart,
  endTime: Date.now(),

  timeline: [
    {
      timestamp: 1000,
      human: {
        face: { emotion: 'happy', score: 0.8, gaze: { bearing: 0, strength: 0.9 } },
        body: { posture: 'upright' }
      },
      hume: {
        topEmotion: 'Joy',
        score: 0.75,
        prosody: { pitch: 'high', energy: 'medium' }
      },
      fused: {
        primaryEmotion: 'Joy',
        confidence: 0.88,
        conflicts: []
      },
      userMessage: "This is amazing!",
      assistantResponse: "I'm glad you're excited! Let's dive deeper."
    },
    // ... more timestamped entries
  ],

  summary: {
    dominantEmotions: ['Joy', 'Excitement', 'Interest'],
    emotionalJourney: 'Started confused, became excited, ended satisfied',
    conflicts: 2,
    avgGazeStrength: 0.72,
    totalDuration: 180000
  }
};
```

#### 3.2 Live Emotional Interventions

```javascript
// Orchestrator detects emotional patterns and offers help

function useEmotionalInterventions() {
  useEffect(() => {
    const { fusedEmotions } = emotionState;

    // Detect prolonged confusion
    if (fusedEmotions.Confusion > 0.7 && confusionDuration > 30000) {
      notifyOrchestrator({
        type: 'intervention',
        emotion: 'Confusion',
        duration: confusionDuration,
        suggestion: 'User has been confused for 30+ seconds. Offer alternative explanation or break down the topic.'
      });
    }

    // Detect frustration building
    if (fusedEmotions.Anger > 0.5 && fusedEmotions.Distress > 0.4) {
      notifyOrchestrator({
        type: 'intervention',
        emotion: 'Frustration',
        suggestion: 'User is getting frustrated. Suggest taking a break or trying a different approach.'
      });
    }

    // Detect disengagement
    if (gazeStrength < 0.3 && fusedEmotions.Boredom > 0.6) {
      notifyOrchestrator({
        type: 'intervention',
        emotion: 'Disengagement',
        suggestion: 'User is disengaged (looking away + bored). Ask if they want to switch topics or take a break.'
      });
    }
  }, [emotionState]);
}
```

---

## Educational Use Cases

### 1. **UX Research with Emotional Validation**
Students test prototypes while EmpathyLab records:
- What users SAY (transcribed speech)
- What users FEEL (voice + face emotions)
- Where users LOOK (gaze heatmaps)
- How users MOVE (body language)

**Export**: Synchronized video + emotion timeline + interaction logs

### 2. **Presentation Training with Empathic Feedback**
AI coach analyzes:
- Voice: "You sound anxious, try slowing down"
- Face: "Maintain eye contact with camera"
- Body: "Your posture is slouched - stand tall!"
- Combined: "Your voice shows confidence but your body language doesn't match. Try power posing before you start."

### 3. **Design Thinking with Authentic Reactions**
During ideation sessions:
- Detect who is genuinely excited (not just polite)
- Identify when skepticism arises
- Measure engagement levels
- Flag moments of breakthrough (sudden joy + forward lean)

### 4. **Accessibility Studies**
Track how users with different abilities interact:
- Gaze patterns for vision-impaired workflows
- Gesture usage for motor-impaired interfaces
- Emotional responses to accessibility features
- Cognitive load indicators (confusion + looking away)

---

## Privacy Considerations

### Consent Levels

```jsx
const consentLevels = {
  minimal: {
    human: { face: true },
    hume: false,
    recording: false
  },

  presentation: {
    human: { face: true, emotion: true, gaze: true },
    hume: true,
    recording: false
  },

  research: {
    human: { face: true, emotion: true, gaze: true, body: true, hands: true },
    hume: true,
    recording: true,
    export: true
  }
};
```

### Data Retention Policy

- **Live mode**: Data processed in real-time, not stored
- **Session mode**: Data stored in memory only, cleared on tab close
- **Research mode**: Data stored with explicit consent, exportable, deletable

---

## Next Steps

1. **Create Hume token endpoint** (`/api/services/hume/token`)
2. **Port Hume UI components** from TypeScript to JSX
3. **Implement emotion fusion engine** (`lib/emotionFusion.js`)
4. **Update EmpathyLabSidebar** with model status panel
5. **Split main canvas** (webcam left, chat right)
6. **Add multimodal timeline** visualization
7. **Test with real scenarios** (student testing prototype, presentation practice)
8. **Add GlassDock toggle** for global empathic mode

---

## Technical Requirements

- `@humeai/voice-react` SDK
- Hume API key + config ID
- Server-side access token generation
- WebSocket support (Hume uses WS for real-time)
- Emotion mapping between Human (7) and Hume (48)

---

**This creates the world's most advanced empathic AI for education.** 🗿
