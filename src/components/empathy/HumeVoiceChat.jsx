/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useRef } from 'react';
import { VoiceProvider, useVoice } from '@humeai/voice-react';
import Button from '../ui/Button.jsx';
import Panel from '../ui/Panel.jsx';

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
    <div className="hume-voice-chat-wrapper">
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
            console.error('[HumeVoiceChat] Error type:', typeof error);
            console.error('[HumeVoiceChat] Error keys:', Object.keys(error || {}));
            setError(error?.message || String(error));
          }}
        >
          <VoiceChatInterface onEmotionUpdate={onEmotionUpdate} />
        </VoiceProvider>
      )}
    </div>
  );
}

function VoiceChatInterface({ onEmotionUpdate }) {
  const voice = useVoice();
  const { connect, disconnect, sendSessionSettings, messages, isPlaying, status } = voice;
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const hasConfiguredRef = useRef(false);

  // Debug: Log full voice object
  useEffect(() => {
    console.log('[HumeVoiceChat] Full voice object:', {
      status: typeof status,
      statusValue: status,
      isPlaying,
      messagesCount: messages.length,
      isConnected,
      allVoiceKeys: Object.keys(voice)
    });
  }, [status, isPlaying, messages.length, isConnected, voice]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract and send emotions to parent
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      const emotions = latestMessage?.models?.prosody?.scores;

      if (emotions && onEmotionUpdate) {
        // Get top 5 emotions
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
      console.log('[HumeVoiceChat] Attempting to connect...');
      console.log('[HumeVoiceChat] Current status before connect:', status);
      await connect({
        audioConstraints: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('[HumeVoiceChat] Connect promise resolved');
      console.log('[HumeVoiceChat] Status after connect:', status);
      setIsConnected(true);
    } catch (err) {
      console.error('[HumeVoiceChat] Connection error:', err);
      console.error('[HumeVoiceChat] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
    }
  };

  const handleDisconnect = () => {
    console.log('[HumeVoiceChat] Disconnecting...');
    disconnect();
    setIsConnected(false);
    hasConfiguredRef.current = false;
    console.log('[HumeVoiceChat] Disconnected');
  };

  // Configure session settings when connected
  useEffect(() => {
    console.log('[HumeVoiceChat] Session config effect triggered:', {
      isConnected,
      hasConfigured: hasConfiguredRef.current,
      status,
      statusType: typeof status
    });

    if (!isConnected || hasConfiguredRef.current) {
      console.log('[HumeVoiceChat] Skipping session config:', {
        reason: !isConnected ? 'not connected' : 'already configured'
      });
      return;
    }

    const statusText = typeof status === 'string' ? status : (status && typeof status.value === 'string' ? status.value : '');
    console.log('[HumeVoiceChat] Extracted status text:', statusText);
    console.log('[HumeVoiceChat] Testing status regex:', /connected|ready|open/i.test(statusText));

    if (statusText && /connected|ready|open/i.test(statusText)) {
      console.log('[HumeVoiceChat] Sending session settings...');
      sendSessionSettings({
        type: 'session_settings',
        systemPrompt: 'You are an empathic AI assistant integrated with multimodal emotion detection. You can sense emotions from both voice and facial expressions. Be warm, understanding, and supportive. When you detect emotional conflicts (e.g., happy words but anxious voice), gently acknowledge what you notice.'
      }).then(() => {
        console.log('[HumeVoiceChat] Session settings sent successfully');
        hasConfiguredRef.current = true;
      }).catch((e) => {
        console.error('[HumeVoiceChat] Failed to send session settings:', e);
      });
    } else {
      console.log('[HumeVoiceChat] Status not ready for config yet:', statusText);
    }
  }, [isConnected, status, sendSessionSettings]);

  // Extract emotions from latest message for display
  const latestEmotions = messages.length > 0
    ? messages[messages.length - 1]?.models?.prosody?.scores
    : null;

  const topEmotions = latestEmotions
    ? Object.entries(latestEmotions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  const statusText = typeof status === 'string' ? status : (status && typeof status.value === 'string' ? status.value : '');

  console.log('[HumeVoiceChat] Rendering UI with:', {
    isConnected,
    statusText,
    isPlaying,
    showWaves: isConnected,
    showEmotions: !!latestEmotions,
    messagesCount: messages.length
  });

  return (
    <div className="hume-voice-chat-interface" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Connection Controls */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--color-surface-border)',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center'
      }}>
        {!isConnected ? (
          <Button variant="primary" icon="call" onClick={handleConnect}>
            Start Voice Chat
          </Button>
        ) : (
          <Button variant="secondary" icon="call_end" onClick={handleDisconnect}>
            End Chat
          </Button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            {statusText || 'disconnected'}
          </span>
          <span
            className="icon"
            style={{
              color: isConnected ? '#6e42cc' : '#9E9E9E',
              fontSize: '1.25rem'
            }}
          >
            {isConnected ? 'mic' : 'mic_off'}
          </span>
        </div>
      </div>

      {/* Hume Listening Indicator (Purple Waves) */}
      {isConnected && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-surface-border)'
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
            <span className="icon">mic</span>
            <br />
            {isPlaying ? 'Listening...' : 'Start speaking...'}
          </div>
        </div>
      )}

      {/* Emotion Display - Top 5 from Hume */}
      {latestEmotions && (
        <div style={{
          padding: '1rem',
          background: 'rgba(110, 66, 204, 0.05)',
          borderBottom: '1px solid rgba(110, 66, 204, 0.2)'
        }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#6e42cc' }}>
            Voice Emotions (Hume)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {topEmotions.map(([emotion, score]) => (
              <div key={emotion} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '120px', fontSize: '0.875rem' }}>{emotion}</div>
                <div style={{
                  flex: 1,
                  height: '20px',
                  background: 'rgba(110, 66, 204, 0.1)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${score * 100}%`,
                    background: '#6e42cc',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.3s ease'
                  }} />
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
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--color-text-secondary)'
          }}>
            <span className="icon" style={{ fontSize: '3rem', opacity: 0.3 }}>mic</span>
            <p style={{ margin: '0.5rem 0 0 0' }}>
              {isConnected ? 'Start speaking...' : 'Connect to start chatting'}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            if (msg.type !== 'user_message' && msg.type !== 'assistant_message') return null;

            const isUser = msg.type === 'user_message';
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
                  background: isUser ? '#6e42cc' : 'var(--color-surface)',
                  border: isUser ? 'none' : '1px solid var(--color-surface-border)',
                  borderRadius: 'var(--radius-md)',
                  color: isUser ? 'white' : 'var(--color-text-primary)'
                }}
              >
                <div style={{
                  fontSize: '0.7rem',
                  opacity: 0.7,
                  marginBottom: '0.25rem',
                  textTransform: 'capitalize'
                }}>
                  {roleText}
                </div>
                <div style={{ fontSize: '0.875rem' }}>{contentText}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
