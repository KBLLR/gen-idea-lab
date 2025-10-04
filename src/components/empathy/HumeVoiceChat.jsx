/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useRef } from 'react';
import { VoiceProvider, useVoice } from '@humeai/voice-react';
import Button from '../ui/Button.jsx';

// Import Hume emotion colors
const EMOTION_COLORS = {
    'Admiration': '#ffc58f',
    'Adoration': '#ffc6cc',
    'Aesthetic Appreciation': '#e2cbff',
    'Amusement': '#febf52',
    'Anger': '#b21816',
    'Annoyance': '#ffffff',
    'Anxiety': '#6e42cc',
    'Awe': '#7dabd3',
    'Awkwardness': '#d7d99d',
    'Boredom': '#a4a4a4',
    'Calmness': '#a9cce1',
    'Concentration': '#336cff',
    'Contemplation': '#b0aeef',
    'Confusion': '#c66a26',
    'Contempt': '#76842d',
    'Contentment': '#e5c6b4',
    'Craving': '#54591c',
    'Determination': '#ff5c00',
    'Disappointment': '#006c7c',
    'Disapproval': '#ffffff',
    'Disgust': '#1a7a41',
    'Distress': '#c5f264',
    'Doubt': '#998644',
    'Ecstasy': '#ff48a4',
    'Embarrassment': '#63c653',
    'Empathic Pain': '#ca5555',
    'Enthusiasm': '#ffffff',
    'Entrancement': '#7554d6',
    'Envy': '#1d4921',
    'Excitement': '#fff974',
    'Fear': '#d1c9ef',
    'Gratitude': '#ffffff',
    'Guilt': '#879aa1',
    'Horror': '#772e7a',
    'Interest': '#a9cce1',
    'Joy': '#ffd600',
    'Love': '#f44f4c',
    'Nostalgia': '#b087a1',
    'Pain': '#8c1d1d',
    'Pride': '#9a4cb6',
    'Realization': '#217aa8',
    'Relief': '#fe927a',
    'Romance': '#f0cc86',
    'Sadness': '#305575',
    'Sarcasm': '#ffffff',
    'Satisfaction': '#a6ddaf',
    'Sexual Desire': '#aa0d59',
    'Shame': '#8a6262',
    'Surprise': '#70e63a',
    'Surprise (Negative)': '#70e63a',
    'Surprise (Positive)': '#7affff',
    'Sympathy': '#7f88e0',
    'Tiredness': '#757575',
    'Triumph': '#ec8132'
};

export default function HumeVoiceChat({ onEmotionUpdate, selectedConfigId }) {
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch access token from backend
  const fetchToken = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/services/hume/token', {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch token');
      }

      const data = await response.json();
      setAccessToken(data.accessToken);
      console.log('[HumeVoiceChat] Access token fetched successfully');
    } catch (err) {
      console.error('[HumeVoiceChat] Token fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hume-voice-chat-wrapper" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <div className="error-display" style={{
          padding: '1rem',
          background: 'rgba(244, 67, 54, 0.1)',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="icon">error</span>
            <div>
              <h4 style={{ margin: 0 }}>Error</h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{error}</p>
            </div>
            <button onClick={() => setError(null)} style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}>
              <span className="icon">close</span>
            </button>
          </div>
        </div>
      )}

      {!accessToken ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
            Connect to Hume EVI to enable empathic voice chat with emotion analysis.
          </p>
          <Button
            variant="primary"
            icon="mic"
            onClick={fetchToken}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect Hume Voice'}
          </Button>
        </div>
      ) : (
        <VoiceProvider
          auth={{ type: 'accessToken', value: accessToken }}
          configId={selectedConfigId}
          onMessage={(msg) => {
            console.log('[HumeVoiceChat] Hume message:', msg);
          }}
          onError={(error) => {
            console.error('[HumeVoiceChat] Hume VoiceProvider error:', error);
            setError(error?.message || String(error));
          }}
        >
          <VoiceChatInterface onEmotionUpdate={onEmotionUpdate} />
        </VoiceProvider>
      )}
    </div>
  );
}

// Emotion card component (like empathic-ai Expressions)
function EmotionCard({ emotions }) {
  if (!emotions || Object.keys(emotions).length === 0) return null;

  // Get top 3 emotions sorted by score
  const top3 = Object.entries(emotions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '0.75rem',
      padding: '0.75rem',
      borderTop: '1px solid var(--color-surface-border)',
      background: 'rgba(0, 0, 0, 0.2)'
    }}>
      {top3.map(([emotionName, score]) => {
        const color = EMOTION_COLORS[emotionName] || '#9E9E9E';
        return (
          <div key={emotionName} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
              <span style={{ fontWeight: 500, opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {emotionName}
              </span>
              <span style={{ opacity: 0.5, fontWeight: 600, marginLeft: '0.25rem' }}>
                {(score * 100).toFixed(0)}
              </span>
            </div>
            <div style={{
              height: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${Math.min(score * 100, 100)}%`,
                background: color,
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// MicFFT visualization component (like empathic-ai MicFFT)
function MicFFT({ fft = [] }) {
  const bars = 24;
  return (
    <svg viewBox="0 0 192 32" width="192" height="32" style={{ display: 'block' }}>
      {Array.from({ length: bars }).map((_, index) => {
        const value = (fft[index] || 0) / 4;
        const h = Math.min(Math.max(32 * value, 2), 32);
        const yOffset = 16 - h / 2;
        return (
          <rect
            key={`fft-${index}`}
            height={h}
            width={2}
            x={2 + (index * (192 - 4)) / bars}
            y={yOffset}
            rx={2}
            fill="currentColor"
            style={{ transition: 'height 0.1s ease, y 0.1s ease' }}
          />
        );
      })}
    </svg>
  );
}

function VoiceChatInterface({ onEmotionUpdate }) {
  const voice = useVoice();
  const { connect, disconnect, sendSessionSettings, messages, isMuted, mute, unmute, micFft, status } = voice;
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const hasConfiguredRef = useRef(false);

  // Auto-scroll messages with delay
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [messages]);

  // Extract and send emotions to parent
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      const emotions = latestMessage?.models?.prosody?.scores;

      if (emotions && onEmotionUpdate) {
        const topEmotions = Object.entries(emotions)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, score]) => ({ name, score }));

        onEmotionUpdate({
          emotions,
          topEmotions,
          timestamp: Date.now()
        });
      }
    }
  }, [messages, onEmotionUpdate]);

  const handleConnect = async () => {
    try {
      await connect({
        audioConstraints: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setIsConnected(true);
    } catch (err) {
      console.error('[HumeVoiceChat] Connection error:', err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsConnected(false);
    hasConfiguredRef.current = false;
  };

  // Configure session settings when connected
  useEffect(() => {
    if (!isConnected || hasConfiguredRef.current) return;

    const statusText = typeof status === 'string' ? status : (status && typeof status.value === 'string' ? status.value : '');

    if (statusText && /connected|ready|open/i.test(statusText)) {
      sendSessionSettings({
        type: 'session_settings',
        systemPrompt: 'You are an empathic AI assistant integrated with multimodal emotion detection. You can sense emotions from both voice and facial expressions. Be warm, understanding, and supportive. When you detect emotional conflicts (e.g., happy words but anxious voice), gently acknowledge what you notice.'
      }).then(() => {
        hasConfiguredRef.current = true;
      }).catch((e) => {
        console.error('[HumeVoiceChat] Failed to send session settings:', e);
      });
    }
  }, [isConnected, status, sendSessionSettings]);

  const statusText = typeof status === 'string' ? status : (status && typeof status.value === 'string' ? status.value : '');

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Scrollable Messages */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1rem',
          paddingBottom: '6rem' // Space for floating controls
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--color-text-secondary)'
          }}>
            <span className="icon" style={{ fontSize: '3rem', opacity: 0.3 }}>mic</span>
            <p style={{ margin: '0.5rem 0 0 0' }}>
              {isConnected ? 'Start speaking...' : 'Connect to start chatting'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, index) => {
              if (msg.type !== 'user_message' && msg.type !== 'assistant_message') return null;

              const isUser = msg.type === 'user_message';
              const roleText = String(msg.message?.role || '');
              let contentText = '';
              const rawContent = msg.message?.content;

              if (typeof rawContent === 'string') {
                contentText = rawContent;
              } else if (Array.isArray(rawContent)) {
                contentText = rawContent.map(part => typeof part === 'string' ? part : (part?.text || '')).join(' ');
              } else if (rawContent && typeof rawContent.value === 'string') {
                contentText = rawContent.value;
              } else if (rawContent) {
                try { contentText = JSON.stringify(rawContent); } catch { contentText = '' }
              }

              const emotions = msg.models?.prosody?.scores;

              return (
                <div
                  key={`${msg.type}-${index}`}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-surface-border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    fontSize: '0.7rem',
                    textTransform: 'capitalize',
                    opacity: 0.5,
                    fontWeight: 500
                  }}>
                    <span>{roleText}</span>
                    <span>
                      {msg.receivedAt ? new Date(msg.receivedAt).toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit'
                      }) : ''}
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '0 0.75rem 0.75rem 0.75rem', fontSize: '0.875rem' }}>
                    {contentText}
                  </div>

                  {/* Emotion Card */}
                  <EmotionCard emotions={emotions} />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Controls Bar (empathic-ai style) */}
      {!isConnected ? (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center',
          background: 'linear-gradient(to top, var(--color-surface) 0%, var(--color-surface) 70%, transparent 100%)'
        }}>
          <Button variant="primary" icon="call" onClick={handleConnect}>
            Start Voice Chat
          </Button>
        </div>
      ) : (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(to top, var(--color-surface) 0%, rgba(var(--color-surface-rgb, 30, 30, 35), 0.9) 70%, transparent 100%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-surface-border)',
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Mute toggle */}
            <button
              onClick={() => isMuted ? unmute() : mute()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: isMuted ? 'var(--color-surface)' : '#6e42cc',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: 'white'
              }}
            >
              <span className="icon">{isMuted ? 'mic_off' : 'mic'}</span>
            </button>

            {/* FFT Visualization */}
            <div style={{
              width: '192px',
              height: '32px',
              color: '#6e42cc'
            }}>
              <MicFFT fft={micFft || []} />
            </div>

            {/* End Call Button */}
            <Button
              variant="secondary"
              icon="call_end"
              onClick={handleDisconnect}
              style={{
                borderRadius: 'var(--radius-full)',
                background: '#ef5350',
                color: 'white',
                border: 'none'
              }}
            >
              End Call
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
