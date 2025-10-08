/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useRef } from 'react';
import { VoiceProvider, useVoice } from '@humeai/voice-react';
import { Button, Panel } from '@ui';

// Hume Expression Colors (simplified from empathic-ai)
const EXPRESSION_COLORS = {
  Joy: '#ffd600',
  Sadness: '#305575',
  Anger: '#b21816',
  Fear: '#d1c9ef',
  Surprise: '#70e63a',
  Disgust: '#1a7a41',
  Anxiety: '#6e42cc',
  Excitement: '#fff974',
  Amusement: '#febf52',
  Confusion: '#c66a26',
  Calmness: '#a9cce1'
};

export default function HumeTest() {
  const [accessToken, setAccessToken] = useState(null);
  const [configId, setConfigId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch access token and optional config from backend
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

      // Set configId if available from env (optional)
      if (data.configId) {
        setConfigId(data.configId);
        console.log('Hume access token and config fetched successfully');
      } else {
        console.log('Hume access token fetched successfully (no configId - will use session settings)');
      }
    } catch (err) {
      console.error('Token fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hume-test" style={{ padding: '2rem' }}>
      <Panel title="Hume EVI Test" icon="psychology">
        {error && (
          <div className="error-display" style={{ marginBottom: '1rem' }}>
            <span className="icon">error</span>
            <div>
              <h4>Error</h4>
              <p>{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <span className="icon">close</span>
            </button>
          </div>
        )}

        {!accessToken ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ marginBottom: '1rem' }}>
              Click below to fetch Hume access token and start empathic voice chat.
            </p>
            <Button
              variant="primary"
              icon="mic"
              onClick={fetchToken}
              disabled={isLoading}
            >
              {isLoading ? 'Fetching Token...' : 'Start Hume Chat'}
            </Button>
          </div>
        ) : (
          <VoiceProvider
            auth={{ type: 'accessToken', value: accessToken }}
            configId={configId}
            onError={(error) => {
              console.error('Hume error:', error);
              setError(error.message);
            }}
          >
            <HumeChat />
          </VoiceProvider>
        )}
      </Panel>
    </div>
  );
}

function HumeChat() {
  const voice = useVoice();
  const { connect, disconnect, sendSessionSettings, messages, isPlaying, status } = voice;
  const [isConnected, setIsConnected] = useState(false);

  // Debug: log all available methods from useVoice
  useEffect(() => {
    console.log('[HumeTest] useVoice hook methods:', Object.keys(voice));
  }, [voice]);

  const handleConnect = async () => {
    try {
      console.log('[HumeTest] Attempting to connect to Hume...');
      await connect({
        audioConstraints: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('[HumeTest] Connected successfully');
      setIsConnected(true);
    } catch (err) {
      console.error('[HumeTest] Connection error:', err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsConnected(false);
  };

  // Configure session settings when socket is connected/open
  const hasConfiguredRef = useRef(false);
  useEffect(() => {
    if (!isConnected || hasConfiguredRef.current) return;
    const statusText = typeof status === 'string' ? status : (status && typeof status.value === 'string' ? status.value : '');
    console.log('[HumeTest] Status update:', statusText);
    if (statusText && /connected|ready|open/i.test(statusText)) {
      console.log('[HumeTest] Sending session settings...');
      sendSessionSettings({
        type: 'session_settings',
        systemPrompt: 'You are an empathic AI assistant. Be warm, understanding, and supportive.'
      }).then(() => {
        console.log('[HumeTest] Session settings sent successfully');
        hasConfiguredRef.current = true;
      }).catch((e) => {
        console.warn('[HumeTest] Failed to send session settings:', e);
      });
    }
  }, [isConnected, status, sendSessionSettings]);

  // Debug: log messages
  useEffect(() => {
    if (messages.length > 0) {
      console.log('[HumeTest] Messages updated:', messages);
    }
  }, [messages]);

  // Extract emotions from latest message
  const latestEmotions = messages.length > 0
    ? messages[messages.length - 1]?.models?.prosody?.scores
    : null;

  const topEmotions = latestEmotions
    ? Object.entries(latestEmotions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    : [];

  return (
    <div className="hume-chat-test">
      {/* Connection Controls */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {!isConnected ? (
          <Button variant="primary" icon="call" onClick={handleConnect}>
            Connect to Hume
          </Button>
        ) : (
          <Button variant="secondary" icon="call_end" onClick={handleDisconnect}>
            Disconnect
          </Button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {(() => {
            const statusText = typeof status === 'string' ? status : (status && typeof status.value === 'string' ? status.value : '');
            return (
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Status: {statusText || 'disconnected'}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Hume Listening Indicator (Purple Waves) */}
      {isConnected && (
        <div className="hume-listening-indicator" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          marginBottom: '1rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-surface-border)',
          borderRadius: 'var(--radius-md)'
        }}>
          <div className="hume-voice-waves" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            height: '60px',
            marginBottom: '0.5rem'
          }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`hume-wave ${isPlaying ? 'active' : ''}`}
                style={{
                  width: '3px',
                  height: '16px',
                  background: 'rgba(110, 66, 204, 0.3)',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease',
                  willChange: 'height, background',
                  animationDelay: `${i * 0.15}s`
                }}
              />
            ))}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            textAlign: 'center'
          }}>
            {isPlaying ? '🎤 Listening...' : '👂 Ready to listen'}
          </div>
        </div>
      )}

      {/* Emotion Display */}
      {latestEmotions && (
        <div
          className="emotion-display"
          style={{
            padding: '1rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-surface-border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem'
          }}
        >
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 600 }}>
            Detected Emotions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {topEmotions.map(([emotion, score]) => (
              <div key={emotion} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '120px', fontSize: '0.875rem' }}>{emotion}</div>
                <div
                  style={{
                    flex: 1,
                    height: '20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${score * 100}%`,
                      background: EXPRESSION_COLORS[emotion] || '#9E9E9E',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
                <div style={{ width: '50px', fontSize: '0.875rem', textAlign: 'right' }}>
                  {Math.round(score * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="messages-container"
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
            <span className="icon" style={{ fontSize: '3rem', opacity: 0.3 }}>
              mic
            </span>
            <p style={{ margin: '0.5rem 0 0 0' }}>
              {isConnected ? 'Start speaking...' : 'Connect to start chatting'}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            if (msg.type !== 'user_message' && msg.type !== 'assistant_message') return null;

            const isUser = msg.type === 'user_message';
            const emotions = msg.models?.prosody?.scores;
            const topEmotion = emotions
              ? Object.entries(emotions).sort((a, b) => b[1] - a[1])[0]
              : null;
            const roleText = typeof msg.message?.role === 'string' ? msg.message.role : String(msg.message?.role || '');
            let contentText = '';
            const rawContent = msg.message?.content;
            if (typeof rawContent === 'string') {
              contentText = rawContent;
            } else if (Array.isArray(rawContent)) {
              contentText = rawContent.map((part) => (typeof part === 'string' ? part : (part?.text || ''))).join(' ');
            } else if (rawContent && typeof rawContent.value === 'string') {
              contentText = rawContent.value;
            } else if (rawContent) {
              try { contentText = JSON.stringify(rawContent); } catch { contentText = '' }
            }

            return (
              <div
                key={index}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '0.75rem',
                  background: isUser
                    ? 'var(--color-accent)'
                    : 'var(--color-surface)',
                  border: isUser ? 'none' : '1px solid var(--color-surface-border)',
                  borderRadius: 'var(--radius-md)',
                  color: isUser ? 'white' : 'var(--color-text-primary)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem',
                    fontSize: '0.75rem',
                    opacity: 0.7
                  }}
                >
                  <span>{roleText}</span>
                  {topEmotion && (
                    <span>
                      {topEmotion[0]}: {Math.round(topEmotion[1] * 100)}%
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.875rem' }}>{contentText}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Instructions */}
      {isConnected && messages.length === 0 && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem'
          }}
        >
          <strong>💡 Tip:</strong> Try saying "I'm feeling anxious about my presentation" or
          "This is so exciting!" to see emotion detection in action.
          <br /><br />
          <strong>🔍 Debug:</strong> Check the browser console (F12) for detailed connection logs and status updates.
        </div>
      )}
    </div>
  );
}

// Add animations for Hume purple waves and pulse
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes hume-wave-pulse {
    0%, 100% {
      height: 16px;
      background: rgba(110, 66, 204, 0.3);
      transform: scaleY(1);
    }
    50% {
      height: 48px;
      background: #6e42cc;
      transform: scaleY(1.05);
    }
  }

  .hume-wave.active {
    animation: hume-wave-pulse 1.2s infinite ease-in-out;
  }
`;
document.head.appendChild(style);
