/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { fuseEmotions } from '../lib/emotionFusion.js';
import { Panel } from '@ui';

export default function EmotionFusionDisplay({ humanEmotions, humeEmotions }) {
  // If we don't have both sources, show individual displays
  if (!humanEmotions || !humeEmotions) {
    return (
      <Panel title="Multimodal Emotions" icon="psychology">
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <p style={{ fontSize: '0.875rem' }}>
            Start both tracking systems to see fused emotion analysis.
          </p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
            {!humanEmotions && '• Enable facial emotion tracking'}
            <br/>
            {!humeEmotions && '• Connect Hume voice chat'}
          </div>
        </div>
      </Panel>
    );
  }

  // Convert Human emotions array to object format
  const humanEmotionObj = {};
  if (humanEmotions && Array.isArray(humanEmotions)) {
    humanEmotions.forEach(e => {
      humanEmotionObj[e.emotion] = e.score;
    });
  }

  // Fuse emotions
  const fusion = fuseEmotions(humeEmotions, humanEmotionObj);

  return (
    <Panel title="Multimodal Emotion Fusion" icon="auto_awesome">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>

        {/* Dominant Emotion */}
        {fusion.dominant && (
          <div style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(110, 66, 204, 0.1), rgba(110, 66, 204, 0.05))',
            border: '1px solid rgba(110, 66, 204, 0.3)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>
              Dominant Emotion
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6e42cc' }}>
              {fusion.dominant.name}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              {Math.round(fusion.dominant.score * 100)}% confidence
            </div>
          </div>
        )}

        {/* Valence & Arousal */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem'
        }}>
          <div style={{
            padding: '0.75rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-surface-border)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>
              Valence
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: fusion.valence > 0 ? '#4CAF50' : '#F44336'
            }}>
              {fusion.valence > 0 ? '+' : ''}{fusion.valence.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
              {fusion.valence > 0 ? 'Positive' : 'Negative'}
            </div>
          </div>

          <div style={{
            padding: '0.75rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-surface-border)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>
              Arousal
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#FF9800'
            }}>
              {fusion.arousal.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
              {fusion.arousal > 0.5 ? 'High energy' : 'Low energy'}
            </div>
          </div>
        </div>

        {/* Emotion Conflicts */}
        {fusion.conflicts && fusion.conflicts.length > 0 && (
          <div style={{
            padding: '0.75rem',
            background: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#FF9800'
            }}>
              <span className="icon">warning</span>
              Emotion Conflicts Detected
            </div>
            {fusion.conflicts.map((conflict, i) => (
              <div key={i} style={{
                fontSize: '0.75rem',
                padding: '0.5rem',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 'var(--radius-sm)',
                marginTop: '0.5rem'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {conflict.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div style={{ opacity: 0.8 }}>
                  {conflict.interpretation}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fusion Confidence */}
        <div style={{
          padding: '0.75rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-surface-border)',
          borderRadius: 'var(--radius-md)'
        }}>
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem' }}>
            Fusion Confidence
          </div>
          <div style={{
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${fusion.confidence * 100}%`,
              background: fusion.confidence > 0.7 ? '#4CAF50' : fusion.confidence > 0.4 ? '#FF9800' : '#F44336',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.25rem', textAlign: 'right' }}>
            {Math.round(fusion.confidence * 100)}%
          </div>
        </div>
      </div>
    </Panel>
  );
}
