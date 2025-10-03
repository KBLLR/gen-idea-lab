# Human Library Integration Guide

## Overview

**Human** by Vladimir Mandic is a comprehensive computer vision library that brings multimodal AI-powered perception to GenBooth Idea Lab. Combined with Hume's voice emotion detection, it creates a complete multimodal intelligence system for educational research and empathic AI interactions.

**Repository**: https://github.com/vladmandic/human
**License**: MIT
**Bundle Size**: ~1.2MB (minified)
**Browser Support**: Chrome/Edge (primary), Firefox, Safari (secondary)
**Node Support**: 14.x - 22.x

---

## Core Capabilities

Human detects and tracks:

| Feature | Description | Output |
|---------|-------------|--------|
| **3D Face Detection** | Face bounding box with 3D rotation angles | `{x, y, width, height, roll, pitch, yaw}` |
| **Face Description** | 1024-dimension embedding for recognition | `descriptor: Float32Array(1024)` |
| **Face Recognition** | Match faces across frames | `similarity: 0.0-1.0` |
| **Facial Emotion** | 7 basic emotions (happy, sad, angry, etc.) | `{happy: 0.8, sad: 0.1, ...}` |
| **Age & Gender** | Demographic estimation | `{age: 24, gender: 'female', genderScore: 0.92}` |
| **Gaze Tracking** | Eye direction and focus | `{bearing: -12, strength: 0.85}` |
| **Iris Analysis** | Pupil size and position | `{x, y, size}` |
| **Body Pose** | 17-point skeleton tracking | `keypoints: [{x, y, z, score}, ...]` |
| **Hand Tracking** | 21 landmarks per hand | `landmarks: [{x, y, z}, ...]` |
| **Gesture Recognition** | Pre-trained gestures (thumbs up, peace, etc.) | `['thumbs up', 'victory']` |
| **Body Segmentation** | Person isolation from background | `segmentation: ImageData` |

---

## Why Human + Hume?

### Multimodal Emotion Intelligence

**Hume** reads *what you say and how you say it* → 48 vocal emotions
**Human** reads *what you show and how you show it* → facial expressions, body language, gaze

Together they create **contextual empathy**:

```javascript
// Example: Detecting user confusion
Hume detects:  { confusion: 0.7, concentration: 0.6, anxiety: 0.4 }
Human detects: {
  face: { emotion: { surprise: 0.5, sadness: 0.3 } },
  gaze: { bearing: -45, strength: 0.2 },  // looking away
  body: { posture: 'slouched' }
}

Orchestrator interpretation:
"User is confused and disengaged - they're looking away and their
posture suggests frustration. Offer simplified explanation."
```

---

## Educational Use Cases

### For CODE University Students

#### 1. **UX Research & Testing**
- Test prototypes with real emotion and attention tracking
- Capture genuine reactions (not self-reported)
- Generate heatmaps showing where users look
- Detect micro-expressions revealing true feelings

**Example Study**:
```
Research Question: "Do users understand our onboarding flow?"

Traditional method: Ask users after completion
EmpathyLab method:
  - Track gaze (do they find the "Next" button?)
  - Detect confusion (furrowed brows, head tilt)
  - Measure engagement (looking at screen vs. away)
  - Time analysis (how long stuck on each step?)
```

#### 2. **Presentation Training**
- Practice public speaking with AI feedback
- Track body language (posture, hand gestures, eye contact)
- Detect nervous habits (touching face, fidgeting)
- Measure confidence through vocal + visual cues

**Feedback Example**:
```
Voice (Hume):     "Anxiety detected, pitch variance low (monotone)"
Visual (Human):   "Looking down 60% of time, minimal gestures"
Suggestion:       "Try maintaining eye contact with camera, use hand
                   gestures to emphasize key points"
```

#### 3. **Accessibility Research**
- Study how users with different abilities interact
- Track gaze patterns for vision-impaired workflows
- Analyze gesture-based interactions
- Measure cognitive load through facial expressions

#### 4. **Design Thinking Workshops**
- Capture authentic reactions during ideation
- Detect when team members disengage
- Measure excitement vs. skepticism for ideas
- Generate participation analytics (who speaks, who listens)

#### 5. **Learning Analytics**
- Detect when students are confused during lectures
- Measure attention span during different activities
- Identify optimal study postures and environments
- Track fatigue and suggest breaks

---

## Technical Architecture

### Installation

```bash
npm install @vladmandic/human
```

### Basic Setup

```javascript
import Human from '@vladmandic/human';

// Configuration for education/research use
const config = {
  backend: 'webgpu',           // or 'webgl', 'wasm', 'cpu'
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models',

  // Face analysis
  face: {
    enabled: true,
    detector: { rotation: true },
    mesh: { enabled: true },
    iris: { enabled: true },
    description: { enabled: true },  // for face recognition
    emotion: { enabled: true },
    age: { enabled: true },
    gender: { enabled: true }
  },

  // Body tracking
  body: {
    enabled: true,
    modelPath: 'blazepose.json'
  },

  // Hand tracking
  hand: {
    enabled: true,
    landmarks: true
  },

  // Gesture recognition
  gesture: {
    enabled: true
  },

  // Segmentation (optional, heavy)
  segmentation: {
    enabled: false  // enable for background blur/replace
  }
};

const human = new Human(config);
```

### Real-Time Detection Loop

```javascript
export default function EmpathyLab() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const humanRef = useRef(null);
  const [results, setResults] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  // Initialize Human library
  useEffect(() => {
    humanRef.current = new Human(config);
    return () => humanRef.current?.destroy();
  }, []);

  // Start webcam
  const startTracking = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 }
    });
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
    setIsTracking(true);
    detectLoop();
  };

  // Detection loop
  const detectLoop = async () => {
    if (!isTracking) return;

    const result = await humanRef.current.detect(videoRef.current);
    setResults(result);

    // Draw overlays
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      humanRef.current.draw.all(canvasRef.current, result);
    }

    requestAnimationFrame(detectLoop);
  };

  return (
    <div className="empathy-lab">
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} />
      {results && <ResultsPanel results={results} />}
    </div>
  );
}
```

---

## Data Structures

### Face Detection Result
```javascript
{
  id: 0,
  score: 0.99,
  box: [x, y, width, height],
  boxRaw: [x, y, width, height],
  mesh: [[x, y, z], ...],  // 468 facial landmarks
  annotations: {
    leftEye: [[x, y, z], ...],
    rightEye: [[x, y, z], ...],
    lips: [[x, y, z], ...],
    // ... more regions
  },
  rotation: {
    angle: { roll: 0, yaw: 12, pitch: -5 },
    gaze: { bearing: -12, strength: 0.85 }
  },
  age: 24,
  gender: 'female',
  genderScore: 0.92,
  emotion: [
    { score: 0.82, emotion: 'happy' },
    { score: 0.10, emotion: 'neutral' },
    { score: 0.05, emotion: 'surprise' },
    // ... more emotions
  ],
  iris: 0.42,
  descriptor: Float32Array(1024)  // for face recognition
}
```

### Body Pose Result
```javascript
{
  id: 0,
  score: 0.95,
  box: [x, y, width, height],
  keypoints: [
    { part: 'nose', position: [x, y, z], score: 0.99 },
    { part: 'leftEye', position: [x, y, z], score: 0.98 },
    { part: 'rightEye', position: [x, y, z], score: 0.97 },
    { part: 'leftShoulder', position: [x, y, z], score: 0.95 },
    // ... 17 total keypoints
  ]
}
```

### Hand Tracking Result
```javascript
{
  id: 0,
  score: 0.94,
  box: [x, y, width, height],
  landmarks: [
    [x, y, z],  // wrist
    [x, y, z],  // thumb_cmc
    [x, y, z],  // thumb_mcp
    // ... 21 total landmarks
  ],
  annotations: {
    thumb: [[x, y, z], ...],
    indexFinger: [[x, y, z], ...],
    // ... all fingers
  }
}
```

### Gesture Recognition Result
```javascript
[
  { name: 'thumbs up', confidence: 0.89 },
  { name: 'victory', confidence: 0.15 }
]
```

---

## UI Visualization Strategies

### 1. Face Emotion Overlay

Display dominant emotion with color-coded border:

```jsx
function FaceEmotionOverlay({ face }) {
  const topEmotion = face.emotion[0];
  const emotionColors = {
    happy: '#4CAF50',
    sad: '#2196F3',
    angry: '#F44336',
    surprise: '#FF9800',
    fear: '#9C27B0',
    disgust: '#795548',
    neutral: '#9E9E9E'
  };

  return (
    <div
      className="face-overlay"
      style={{
        position: 'absolute',
        left: face.box[0],
        top: face.box[1],
        width: face.box[2],
        height: face.box[3],
        border: `3px solid ${emotionColors[topEmotion.emotion]}`,
        borderRadius: '8px'
      }}
    >
      <div className="emotion-label">
        {topEmotion.emotion} {Math.round(topEmotion.score * 100)}%
      </div>
      <div className="metadata">
        Age: {face.age} • {face.gender}
      </div>
    </div>
  );
}
```

### 2. Gaze Heatmap

Track where users look over time:

```javascript
function GazeHeatmap() {
  const [gazePoints, setGazePoints] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!results?.face?.[0]?.rotation?.gaze) return;

    const { bearing, strength } = results.face[0].rotation.gaze;
    const faceCenter = {
      x: results.face[0].box[0] + results.face[0].box[2] / 2,
      y: results.face[0].box[1] + results.face[0].box[3] / 2
    };

    // Project gaze direction
    const gazePoint = {
      x: faceCenter.x + Math.cos(bearing * Math.PI / 180) * strength * 200,
      y: faceCenter.y + Math.sin(bearing * Math.PI / 180) * strength * 200,
      timestamp: Date.now()
    };

    setGazePoints(prev => [...prev.slice(-100), gazePoint]);
  }, [results]);

  // Render heatmap with gradient
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    gazePoints.forEach((point, i) => {
      const age = Date.now() - point.timestamp;
      const alpha = Math.max(0, 1 - age / 5000);  // fade over 5s

      ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 20, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [gazePoints]);

  return <canvas ref={canvasRef} className="gaze-heatmap" />;
}
```

### 3. Pose Skeleton Overlay

Visualize body language:

```jsx
function PoseSkeletonOverlay({ body }) {
  const connections = [
    ['leftShoulder', 'rightShoulder'],
    ['leftShoulder', 'leftElbow'],
    ['leftElbow', 'leftWrist'],
    ['rightShoulder', 'rightElbow'],
    ['rightElbow', 'rightWrist'],
    ['leftShoulder', 'leftHip'],
    ['rightShoulder', 'rightHip'],
    ['leftHip', 'rightHip'],
    ['leftHip', 'leftKnee'],
    ['leftKnee', 'leftAnkle'],
    ['rightHip', 'rightKnee'],
    ['rightKnee', 'rightAnkle']
  ];

  return (
    <svg className="pose-overlay">
      {/* Draw connections */}
      {connections.map(([start, end], i) => {
        const startPoint = body.keypoints.find(k => k.part === start);
        const endPoint = body.keypoints.find(k => k.part === end);

        if (!startPoint || !endPoint) return null;

        return (
          <line
            key={i}
            x1={startPoint.position[0]}
            y1={startPoint.position[1]}
            x2={endPoint.position[0]}
            y2={endPoint.position[1]}
            stroke="rgba(0, 255, 0, 0.8)"
            strokeWidth="3"
          />
        );
      })}

      {/* Draw keypoints */}
      {body.keypoints.map((kp, i) => (
        <circle
          key={i}
          cx={kp.position[0]}
          cy={kp.position[1]}
          r="6"
          fill={kp.score > 0.5 ? '#00ff00' : '#ffff00'}
        />
      ))}
    </svg>
  );
}
```

### 4. Gesture Recognition Feedback

```jsx
function GestureIndicator({ gestures }) {
  const gestureEmojis = {
    'thumbs up': '👍',
    'victory': '✌️',
    'i love you': '🤟',
    'thumbs down': '👎',
    'pointing up': '☝️'
  };

  return (
    <div className="gesture-indicator">
      {gestures
        .filter(g => g.confidence > 0.7)
        .map((gesture, i) => (
          <motion.div
            key={i}
            className="gesture-badge"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <span className="gesture-emoji">
              {gestureEmojis[gesture.name] || '🤚'}
            </span>
            <span className="gesture-name">{gesture.name}</span>
            <span className="gesture-confidence">
              {Math.round(gesture.confidence * 100)}%
            </span>
          </motion.div>
        ))}
    </div>
  );
}
```

### 5. Attention Timeline

Track engagement over time:

```jsx
function AttentionTimeline({ sessionData }) {
  return (
    <div className="attention-timeline">
      <h4>Attention & Engagement</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={sessionData}>
          <XAxis dataKey="timestamp" />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Legend />

          {/* Gaze strength (looking at screen) */}
          <Line
            type="monotone"
            dataKey="gazeStrength"
            stroke="#2196F3"
            name="Gaze Focus"
          />

          {/* Positive emotions */}
          <Line
            type="monotone"
            dataKey="positiveEmotion"
            stroke="#4CAF50"
            name="Positive Emotion"
          />

          {/* Confusion/frustration */}
          <Line
            type="monotone"
            dataKey="confusion"
            stroke="#FF9800"
            name="Confusion"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## Privacy & Ethics

### Data Handling Best Practices

1. **Explicit Consent**
   - Show clear permission dialog before webcam access
   - Explain what data is captured and why
   - Allow granular controls (face only, no emotion, etc.)

2. **Client-Side Processing**
   - All Human detection runs in browser
   - No video/images sent to servers
   - Only anonymized metrics exported (if user opts in)

3. **Data Minimization**
   - Don't record raw video unless explicitly requested
   - Store only aggregated analytics (emotion scores, not frames)
   - Auto-delete session data after export

4. **Visual Indicators**
   - Red dot when tracking is active
   - Toast notification when recording starts
   - Clear "Stop Tracking" button always visible

### GDPR Compliance

```jsx
function PrivacyControls() {
  const [consent, setConsent] = useState({
    faceDetection: false,
    emotionAnalysis: false,
    bodyTracking: false,
    dataExport: false,
    recording: false
  });

  return (
    <Panel title="Privacy Settings">
      <FormField label="Face Detection">
        <input
          type="checkbox"
          checked={consent.faceDetection}
          onChange={(e) => setConsent({...consent, faceDetection: e.target.checked})}
        />
        <span>Detect face position and rotation</span>
      </FormField>

      <FormField label="Emotion Analysis">
        <input
          type="checkbox"
          checked={consent.emotionAnalysis}
          disabled={!consent.faceDetection}
          onChange={(e) => setConsent({...consent, emotionAnalysis: e.target.checked})}
        />
        <span>Analyze facial expressions for emotions</span>
      </FormField>

      {/* ... more granular controls */}

      <div className="privacy-notice">
        All processing happens locally in your browser. No video or images
        are sent to servers. Data is deleted when you close this session.
      </div>
    </Panel>
  );
}
```

---

## Performance Optimization

### Backend Selection

```javascript
// Automatic backend selection based on device
const selectBackend = () => {
  if (navigator.gpu) return 'webgpu';       // Best performance
  if (navigator.userAgent.includes('Chrome')) return 'webgl';
  return 'wasm';                            // Fallback
};

const config = {
  backend: selectBackend(),
  // ...
};
```

### Model Loading

```javascript
// Lazy load models only when needed
const human = new Human({
  ...config,
  face: { enabled: false },  // don't load face models yet
  body: { enabled: false }
});

// Later, when user enables face tracking
await human.load({ face: { enabled: true } });
```

### Frame Skipping

```javascript
// Only process every Nth frame for better performance
let frameCount = 0;
const PROCESS_EVERY = 3;  // process every 3rd frame

const detectLoop = async () => {
  frameCount++;

  if (frameCount % PROCESS_EVERY === 0) {
    const result = await human.detect(video);
    setResults(result);
  } else {
    // Use interpolation or previous result
  }

  requestAnimationFrame(detectLoop);
};
```

---

## Integration with Existing Apps

### Academic Mods: Confusion Detection

```javascript
// Detect when student is confused and offer help
function useConfusionDetection(humanResults, humeEmotions) {
  useEffect(() => {
    if (!humanResults?.face?.[0] || !humeEmotions) return;

    const face = humanResults.face[0];
    const faceConfusion = face.emotion.find(e => e.emotion === 'surprise')?.score || 0;
    const voiceConfusion = humeEmotions.find(e => e.name === 'Confusion')?.score || 0;

    // Look away + furrowed brow + confused voice = stuck
    const isLookingAway = face.rotation.gaze.strength < 0.3;
    const combinedConfusion = (faceConfusion + voiceConfusion) / 2;

    if (isLookingAway && combinedConfusion > 0.6) {
      // Trigger orchestrator intervention
      notifyOrchestrator({
        type: 'confusion_detected',
        context: 'User appears stuck - looking away, confused expression and voice',
        suggestion: 'Offer simplified explanation or alternative approach'
      });
    }
  }, [humanResults, humeEmotions]);
}
```

### Planner: Attention Analytics

```javascript
// Track which nodes user looks at during planning
function usePlannerGazeTracking(humanResults, plannerNodes) {
  const [nodeAttention, setNodeAttention] = useState({});

  useEffect(() => {
    const gaze = humanResults?.face?.[0]?.rotation?.gaze;
    if (!gaze) return;

    // Project gaze onto canvas
    const gazePoint = projectGazeToCanvas(gaze);

    // Find which node user is looking at
    const lookedAtNode = plannerNodes.find(node =>
      isPointInNode(gazePoint, node)
    );

    if (lookedAtNode) {
      setNodeAttention(prev => ({
        ...prev,
        [lookedAtNode.id]: (prev[lookedAtNode.id] || 0) + 1
      }));
    }
  }, [humanResults, plannerNodes]);

  return nodeAttention;
}
```

---

## Next Steps

1. **Install Human library**: `npm install @vladmandic/human`
2. **Build EmpathyLab prototype** (see separate component file)
3. **Test performance** on different devices (MacBook, iPad, etc.)
4. **Design privacy UI** for consent and controls
5. **Create session export format** (JSON/CSV for research)
6. **Integrate with Hume** for multimodal emotion fusion

---

## Resources

- **Official Docs**: https://vladmandic.github.io/human/
- **GitHub Repo**: https://github.com/vladmandic/human
- **Live Demo**: https://vladmandic.github.io/human/demo/
- **API Reference**: https://vladmandic.github.io/human/typedoc/

---

**Next**: See `EmpathyLab.jsx` for working prototype implementation.
