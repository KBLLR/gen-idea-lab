/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Emotion Fusion Engine
 * Combines Human's 7 facial emotions with Hume's 48 voice emotions
 * Detects conflicts and provides unified emotion vector
 */

// Map Human's 7 basic emotions to Hume's 48 emotions
const EMOTION_MAPPING = {
  happy: ['Joy', 'Amusement', 'Excitement', 'Pride', 'Satisfaction', 'Relief'],
  sad: ['Sadness', 'Disappointment', 'Guilt', 'Shame', 'Grief', 'Empathic Pain'],
  angry: ['Anger', 'Contempt', 'Disgust', 'Annoyance', 'Rage'],
  surprise: ['Surprise', 'Realization', 'Awe', 'Excitement'],
  fear: ['Fear', 'Anxiety', 'Distress', 'Horror', 'Nervousness'],
  disgust: ['Disgust', 'Contempt', 'Aversion'],
  neutral: ['Calmness', 'Concentration', 'Contemplation', 'Contentment']
};

// Inverse mapping: Hume emotion → Human emotion family
const HUME_TO_HUMAN_MAP = {};
Object.entries(EMOTION_MAPPING).forEach(([humanEmotion, humeEmotions]) => {
  humeEmotions.forEach(humeEmotion => {
    HUME_TO_HUMAN_MAP[humeEmotion] = humanEmotion;
  });
});

/**
 * Fuses Hume voice emotions with Human facial emotions
 * @param {Object} humeEmotions - Hume prosody scores { 'Joy': 0.8, 'Sadness': 0.1, ... }
 * @param {Object} humanEmotions - Human emotion scores { 'happy': 0.7, 'sad': 0.2, ... }
 * @returns {Object} Fused emotion state with conflicts and confidence
 */
export function fuseEmotions(humeEmotions, humanEmotions) {
  const fused = {};

  // Start with Hume's detailed emotions (48 dimensions)
  if (humeEmotions) {
    Object.entries(humeEmotions).forEach(([emotion, score]) => {
      fused[emotion] = score;
    });
  }

  // Boost scores where Human confirms the same emotion family
  if (humanEmotions && humeEmotions) {
    Object.entries(humanEmotions).forEach(([humanEmotion, humanScore]) => {
      const relatedHumeEmotions = EMOTION_MAPPING[humanEmotion] || [];

      relatedHumeEmotions.forEach(humeEmotion => {
        if (fused[humeEmotion] !== undefined) {
          // Weighted average: Hume 60%, Human 40%
          // This gives slight preference to voice (more nuanced)
          fused[humeEmotion] = (fused[humeEmotion] * 0.6) + (humanScore * 0.4);
        }
      });
    });
  }

  // Detect conflicts between voice and face
  const conflicts = detectEmotionConflicts(humeEmotions, humanEmotions);

  // Calculate fusion confidence
  const confidence = calculateFusionConfidence(humeEmotions, humanEmotions);

  return {
    fusedEmotions: fused,
    conflicts,
    confidence,
    dominant: getDominantEmotion(fused),
    valence: calculateValence(fused),
    arousal: calculateArousal(fused)
  };
}

/**
 * Detect conflicts between voice and face emotions
 */
function detectEmotionConflicts(hume, human) {
  if (!hume || !human) return [];

  const conflicts = [];

  // Get top emotion from each source
  const humeTop = getTopEmotion(hume);
  const humanTop = getTopEmotion(human);

  if (!humeTop || !humanTop) return [];

  // Check if they're in opposite valence (happy vs sad)
  const humeFamily = HUME_TO_HUMAN_MAP[humeTop.name];
  const polarOpposites = {
    happy: 'sad',
    sad: 'happy',
    angry: 'happy',
    fear: 'happy',
    disgust: 'happy'
  };

  if (polarOpposites[humeFamily] === humanTop.name || polarOpposites[humanTop.name] === humeFamily) {
    conflicts.push({
      type: 'polarity_mismatch',
      voice: humeTop.name,
      voiceScore: humeTop.score,
      face: humanTop.name,
      faceScore: humanTop.score,
      interpretation: `Voice shows ${humeTop.name} but face shows ${humanTop.name} - user may be masking true feelings`,
      severity: Math.abs(humeTop.score - humanTop.score)
    });
  }

  // Detect suppressed anxiety (voice anxious but face calm/happy)
  if ((hume.Anxiety > 0.6 || hume.Fear > 0.5) && (human.happy > 0.4 || human.neutral > 0.5)) {
    conflicts.push({
      type: 'suppressed_anxiety',
      voice: 'Anxiety/Fear',
      voiceScore: Math.max(hume.Anxiety || 0, hume.Fear || 0),
      face: human.happy > human.neutral ? 'Happy' : 'Neutral',
      faceScore: Math.max(human.happy || 0, human.neutral || 0),
      interpretation: 'User may be anxious but trying to appear confident or calm',
      severity: Math.max(hume.Anxiety || 0, hume.Fear || 0)
    });
  }

  // Detect forced positivity (happy voice but sad/angry face)
  if ((hume.Joy > 0.5 || hume.Amusement > 0.5) && (human.sad > 0.5 || human.angry > 0.4)) {
    conflicts.push({
      type: 'forced_positivity',
      voice: 'Joy/Amusement',
      voiceScore: Math.max(hume.Joy || 0, hume.Amusement || 0),
      face: human.sad > human.angry ? 'Sad' : 'Angry',
      faceScore: Math.max(human.sad || 0, human.angry || 0),
      interpretation: 'User trying to sound positive despite negative feelings',
      severity: Math.max(human.sad || 0, human.angry || 0)
    });
  }

  // Detect hidden frustration (frustrated voice but neutral face)
  if ((hume.Anger > 0.5 || hume.Annoyance > 0.5) && human.neutral > 0.6) {
    conflicts.push({
      type: 'hidden_frustration',
      voice: 'Anger/Annoyance',
      voiceScore: Math.max(hume.Anger || 0, hume.Annoyance || 0),
      face: 'Neutral',
      faceScore: human.neutral,
      interpretation: 'User sounds frustrated but maintaining composed expression',
      severity: Math.max(hume.Anger || 0, hume.Annoyance || 0)
    });
  }

  return conflicts;
}

/**
 * Calculate fusion confidence based on agreement between sources
 */
function calculateFusionConfidence(hume, human) {
  if (!hume || !human) return 0.5; // Medium confidence with single source

  const humeTop = getTopEmotion(hume);
  const humanTop = getTopEmotion(human);

  if (!humeTop || !humanTop) return 0.5;

  // Check if they're in the same emotion family
  const humeFamily = HUME_TO_HUMAN_MAP[humeTop.name];

  if (humeFamily === humanTop.name) {
    // Both sources agree - high confidence
    return 0.9;
  }

  // Check if they're related (e.g., both positive or both negative)
  const positiveEmotions = ['happy', 'surprise'];
  const negativeEmotions = ['sad', 'angry', 'fear', 'disgust'];

  const humeIsPositive = positiveEmotions.includes(humeFamily);
  const humanIsPositive = positiveEmotions.includes(humanTop.name);
  const humeIsNegative = negativeEmotions.includes(humeFamily);
  const humanIsNegative = negativeEmotions.includes(humanTop.name);

  if ((humeIsPositive && humanIsPositive) || (humeIsNegative && humanIsNegative)) {
    // Same valence - moderate confidence
    return 0.7;
  }

  // Sources diverge - low confidence
  return 0.4;
}

/**
 * Get top emotion from emotion scores
 */
function getTopEmotion(emotions) {
  if (!emotions || Object.keys(emotions).length === 0) return null;

  const entries = Object.entries(emotions);
  if (entries.length === 0) return null;

  const sorted = entries.sort((a, b) => b[1] - a[1]);
  return { name: sorted[0][0], score: sorted[0][1] };
}

/**
 * Get dominant emotion from fused scores
 */
function getDominantEmotion(fusedEmotions) {
  return getTopEmotion(fusedEmotions);
}

/**
 * Calculate valence (negative -1.0 to positive +1.0)
 */
function calculateValence(emotions) {
  if (!emotions) return 0;

  const positiveEmotions = ['Joy', 'Amusement', 'Excitement', 'Pride', 'Satisfaction', 'Relief', 'Contentment', 'Calmness'];
  const negativeEmotions = ['Sadness', 'Anger', 'Fear', 'Disgust', 'Anxiety', 'Distress', 'Disappointment', 'Shame', 'Guilt'];

  let positiveScore = 0;
  let negativeScore = 0;

  Object.entries(emotions).forEach(([emotion, score]) => {
    if (positiveEmotions.includes(emotion)) {
      positiveScore += score;
    } else if (negativeEmotions.includes(emotion)) {
      negativeScore += score;
    }
  });

  // Normalize to -1.0 to +1.0
  const total = positiveScore + negativeScore;
  if (total === 0) return 0;

  return (positiveScore - negativeScore) / total;
}

/**
 * Calculate arousal (low 0.0 to high 1.0)
 */
function calculateArousal(emotions) {
  if (!emotions) return 0.5;

  const highArousalEmotions = ['Excitement', 'Anger', 'Fear', 'Surprise', 'Distress', 'Anxiety', 'Amusement'];
  const lowArousalEmotions = ['Calmness', 'Contentment', 'Sadness', 'Boredom', 'Tiredness', 'Contemplation'];

  let highScore = 0;
  let lowScore = 0;

  Object.entries(emotions).forEach(([emotion, score]) => {
    if (highArousalEmotions.includes(emotion)) {
      highScore += score;
    } else if (lowArousalEmotions.includes(emotion)) {
      lowScore += score;
    }
  });

  // Normalize to 0.0 to 1.0
  const total = highScore + lowScore;
  if (total === 0) return 0.5;

  return highScore / total;
}

/**
 * Format fusion result for display
 */
export function formatFusionResult(fusionResult) {
  if (!fusionResult) return null;

  const { dominant, valence, arousal, confidence, conflicts } = fusionResult;

  let description = '';

  // Describe dominant emotion
  if (dominant) {
    description += `Primary emotion: ${dominant.name} (${(dominant.score * 100).toFixed(0)}%)`;
  }

  // Describe valence
  if (valence > 0.3) {
    description += `, Positive mood`;
  } else if (valence < -0.3) {
    description += `, Negative mood`;
  } else {
    description += `, Neutral mood`;
  }

  // Describe arousal
  if (arousal > 0.6) {
    description += `, High energy`;
  } else if (arousal < 0.4) {
    description += `, Low energy`;
  }

  // Add conflicts
  if (conflicts.length > 0) {
    description += `\n⚠️ ${conflicts.length} conflict(s) detected`;
  }

  return {
    ...fusionResult,
    description,
    summary: `${dominant?.name || 'Unknown'} (confidence: ${(confidence * 100).toFixed(0)}%)`
  };
}

/**
 * Track emotion over time for pattern detection
 */
export class EmotionTracker {
  constructor(windowSize = 30) {
    this.windowSize = windowSize; // seconds
    this.history = [];
  }

  addEntry(fusionResult) {
    this.history.push({
      timestamp: Date.now(),
      ...fusionResult
    });

    // Keep only recent history
    const cutoff = Date.now() - (this.windowSize * 1000);
    this.history = this.history.filter(entry => entry.timestamp > cutoff);
  }

  getAverageValence() {
    if (this.history.length === 0) return 0;
    const sum = this.history.reduce((acc, entry) => acc + entry.valence, 0);
    return sum / this.history.length;
  }

  getAverageArousal() {
    if (this.history.length === 0) return 0.5;
    const sum = this.history.reduce((acc, entry) => acc + entry.arousal, 0);
    return sum / this.history.length;
  }

  getDominantPattern() {
    if (this.history.length === 0) return null;

    // Count occurrences of each dominant emotion
    const emotionCounts = {};
    this.history.forEach(entry => {
      if (entry.dominant) {
        const name = entry.dominant.name;
        emotionCounts[name] = (emotionCounts[name] || 0) + 1;
      }
    });

    // Find most common
    const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;

    return {
      emotion: sorted[0][0],
      frequency: sorted[0][1] / this.history.length
    };
  }

  getConflictFrequency() {
    if (this.history.length === 0) return 0;
    const withConflicts = this.history.filter(entry => entry.conflicts.length > 0).length;
    return withConflicts / this.history.length;
  }
}
