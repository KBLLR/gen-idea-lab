/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { useLiveAPI } from '../lib/voice';
import { AudioRecorder } from '../lib/voice';
import { AVAILABLE_VOICES, DEFAULT_VOICE } from '../lib/voice';
import useStore from '../lib/store';
import '../styles/components/live-voice-chat.css';

export default function LiveVoiceChat() {
  const isOpen = useStore(state => state.isLiveVoiceChatOpen);
  const setIsOpen = useStore(state => state.actions.setIsLiveVoiceChatOpen);

  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [speakerVolume, setSpeakerVolume] = useState(0);
  const [messages, setMessages] = useState([]);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);

  const recorderRef = useRef(null);
  const messagesEndRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const { client, setConfig, connect, disconnect, connected, volume } = useLiveAPI({
    apiKey,
  });

  // Update speaker volume
  useEffect(() => {
    setSpeakerVolume(volume);
  }, [volume]);

  // Setup Live API event listeners
  useEffect(() => {
    if (!client) return;

    const onOpen = () => {
      addMessage('system', 'Connected to Gemini Live');
    };

    const onClose = (event) => {
      console.log('[LiveVoiceChat] Connection closed:', event);
      addMessage('system', 'Disconnected from Gemini Live');
      setIsRecording(false);

      // Clean up recorder
      if (recorderRef.current) {
        recorderRef.current.stop();
        recorderRef.current = null;
      }
    };

    const onContent = (content) => {
      if (content.modelTurn?.parts) {
        content.modelTurn.parts.forEach(part => {
          if (part.text) {
            addMessage('assistant', part.text);
          }
        });
      }
    };

    const onToolCall = (toolCall) => {
      console.log('Tool call received:', toolCall);
      // Handle tool calls here
      const functionCall = toolCall.functionCalls?.[0];
      if (functionCall) {
        addMessage('system', `Calling function: ${functionCall.name}`);
        // Execute the function and send response
        handleToolCall(functionCall);
      }
    };

    const onInputTranscription = (text, isFinal) => {
      if (isFinal) {
        setInputTranscript(text);
        addMessage('user', text);
      }
    };

    const onOutputTranscription = (text, isFinal) => {
      setOutputTranscript(text);
    };

    const onError = (error) => {
      console.error('[LiveVoiceChat] Live API error:', error);
      addMessage('error', `Error: ${error.message || error.type || 'Connection error'}`);

      // Stop recording on error
      if (recorderRef.current) {
        recorderRef.current.stop();
        recorderRef.current = null;
      }
      setIsRecording(false);
    };

    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('content', onContent);
    client.on('toolcall', onToolCall);
    client.on('inputTranscription', onInputTranscription);
    client.on('outputTranscription', onOutputTranscription);
    client.on('error', onError);

    return () => {
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('content', onContent);
      client.off('toolcall', onToolCall);
      client.off('inputTranscription', onInputTranscription);
      client.off('outputTranscription', onOutputTranscription);
      client.off('error', onError);
    };
  }, [client]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, timestamp: Date.now() }]);
  };

  const handleConnect = async () => {
    if (connected) {
      // Stop recording if active
      if (recorderRef.current) {
        recorderRef.current.stop();
        recorderRef.current = null;
      }
      disconnect();
      setIsRecording(false);
      return;
    }

    try {
      console.log('[LiveVoiceChat] Starting connection...');

      // Configure Live API with voice and tools
      const config = {
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: selectedVoice
              }
            }
          }
        },
        systemInstruction: {
          parts: [{
            text: `You are a helpful AI assistant integrated into GenBooth Idea Lab.
You can help users with:
- Navigation between apps (planner, archiva, idea lab, image booth, workflows)
- Opening settings and system information
- Answering questions about their work
- Providing creative suggestions

Be concise, friendly, and helpful. Match the personality of the selected voice.`
          }]
        },
        tools: getAvailableTools(),
      };

      console.log('[LiveVoiceChat] Connecting to Gemini Live API with config:', config);
      await connect(config);
      console.log('[LiveVoiceChat] Connected successfully');

      // Start audio recording
      console.log('[LiveVoiceChat] Starting audio recorder...');
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorder(16000);

        recorderRef.current.on('data', (base64Audio) => {
          if (client && client.status === 'connected') {
            client.sendRealtimeInput([{
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio
            }]);
          }
        });

        recorderRef.current.on('volume', (volume) => {
          setMicVolume(volume);
        });
      }

      await recorderRef.current.start();
      setIsRecording(true);
      console.log('[LiveVoiceChat] Audio recorder started');
    } catch (error) {
      console.error('[LiveVoiceChat] Connection failed:', error);
      addMessage('error', `Failed to connect: ${error.message}`);

      // Clean up on error
      if (recorderRef.current) {
        recorderRef.current.stop();
        recorderRef.current = null;
      }
      setIsRecording(false);
    }
  };

  const handleToolCall = async (functionCall) => {
    const { name, args } = functionCall;
    let result = { success: false };

    try {
      // Execute the tool based on name
      switch (name) {
        case 'switch_app':
          useStore.getState().actions.setActiveApp(args.appName);
          result = { success: true, message: `Switched to ${args.appName}` };
          break;

        case 'open_settings':
          useStore.getState().actions.setIsSettingsOpen(true);
          result = { success: true, message: 'Settings opened' };
          break;

        case 'open_orchestrator':
          useStore.getState().actions.setIsOrchestratorOpen(true);
          result = { success: true, message: 'Orchestrator opened' };
          break;

        case 'show_system_info':
          useStore.getState().actions.setIsSystemInfoOpen(true);
          result = { success: true, message: 'System info opened' };
          break;

        default:
          result = { success: false, error: `Unknown function: ${name}` };
      }
    } catch (error) {
      result = { success: false, error: error.message };
    }

    // Send tool response back to API
    if (client && connected) {
      client.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: functionCall.name,
          response: result
        }]
      });
    }
  };

  const getAvailableTools = () => {
    return [
      {
        functionDeclarations: [
          {
            name: 'switch_app',
            description: 'Switch to a different app in the GenBooth interface',
            parameters: {
              type: 'object',
              properties: {
                appName: {
                  type: 'string',
                  enum: ['ideaLab', 'imageBooth', 'archiva', 'planner', 'workflows'],
                  description: 'The name of the app to switch to'
                }
              },
              required: ['appName']
            }
          },
          {
            name: 'open_settings',
            description: 'Open the settings modal',
            parameters: { type: 'object', properties: {} }
          },
          {
            name: 'open_orchestrator',
            description: 'Open the orchestrator chat',
            parameters: { type: 'object', properties: {} }
          },
          {
            name: 'show_system_info',
            description: 'Show system information modal',
            parameters: { type: 'object', properties: {} }
          }
        ]
      }
    ];
  };

  const clearChat = () => {
    setMessages([]);
    setInputTranscript('');
    setOutputTranscript('');
  };

  if (!isOpen) return null;

  return (
    <div className="live-voice-chat">
      <div className="live-voice-header">
        <div className="header-left">
          <span className="icon">mic</span>
          <h3>Live Voice Chat</h3>
          {connected && <span className="status-badge connected">Live</span>}
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => setShowVoiceSelector(!showVoiceSelector)}
            title="Select voice"
          >
            <span className="icon">voice_over_off</span>
          </button>
          <button
            className="icon-btn"
            onClick={clearChat}
            title="Clear chat"
          >
            <span className="icon">delete</span>
          </button>
          <button
            className="icon-btn close-btn"
            onClick={() => {
              if (connected) disconnect();
              setIsOpen(false);
            }}
          >
            <span className="icon">close</span>
          </button>
        </div>
      </div>

      {showVoiceSelector && (
        <div className="voice-selector">
          <label>Voice:</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            disabled={connected}
          >
            {AVAILABLE_VOICES.map(voice => (
              <option key={voice} value={voice}>{voice}</option>
            ))}
          </select>
        </div>
      )}

      <div className="live-voice-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message message-${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {inputTranscript && !messages.find(m => m.content === inputTranscript) && (
          <div className="message message-user message-transcribing">
            <div className="message-content">{inputTranscript}</div>
          </div>
        )}
        {outputTranscript && (
          <div className="message message-assistant message-transcribing">
            <div className="message-content">{outputTranscript}</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="live-voice-controls">
        <div className="volume-indicators">
          <div className="volume-indicator">
            <span className="icon">mic</span>
            <div className="volume-bar">
              <div
                className="volume-fill mic-volume"
                style={{ width: `${Math.min(micVolume * 200, 100)}%` }}
              />
            </div>
          </div>
          <div className="volume-indicator">
            <span className="icon">volume_up</span>
            <div className="volume-bar">
              <div
                className="volume-fill speaker-volume"
                style={{ width: `${Math.min(speakerVolume * 200, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <button
          className={`connect-btn ${connected ? 'connected' : ''}`}
          onClick={handleConnect}
        >
          <span className="icon">{connected ? 'stop' : 'play_arrow'}</span>
          <span>{connected ? 'Disconnect' : 'Connect'}</span>
        </button>
      </div>

      {!apiKey && (
        <div className="api-key-warning">
          <span className="icon">warning</span>
          <span>GEMINI_API_KEY not configured</span>
        </div>
      )}
    </div>
  );
}