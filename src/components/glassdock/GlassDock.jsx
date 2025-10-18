/**
 * @file GlassDock - Voice-enabled dock interface with AI interaction
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '@store';
import { handleAsyncError } from '@shared/lib/errorHandler.js';
import { voiceCommands } from '@shared/lib/voiceCommands.js';
import { enhancedVoiceSystem, getVoicePersonality, voiceFunctionManager, useLiveAPI, AudioRecorder, AVAILABLE_VOICES, DEFAULT_VOICE } from '@shared/lib/voice';
import NodeModePanel from '../panels/NodeModePanel.jsx';
import { ActionBar } from '@ui';
import GlassDockToolbar from './GlassDockToolbar.jsx';
import VoiceChatPanel from './VoiceChatPanel.jsx';
// Legacy DockItemsRow removed in favor of unified toolbar
import MinimizedDock from './MinimizedDock.jsx';
import './glass-dock.css';
import '../panels/node-mode-panel.css';
import { getAppPath } from '@routes';
import { useDockContentNode } from '@shared/lib/layoutSlots';

function OrchestratorSlot() {
  // Optional provider; if absent, render nothing
  try {
    const node = useDockContentNode();
    return node ? <div className="orchestrator-frame">{node}</div> : null;
  } catch {
    return null;
  }
}

const DOCK_ITEM_SIZE = 56;
const DOCK_PADDING = 12;
const DOCK_GAP = 8;

export default function GlassDock() {
  const navigate = useNavigate();
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const dockMinimized = useStore((state) => state.dockMinimized);
  const setDockMinimized = useStore((state) => state.actions.setDockMinimized);
  const [isMinimized, setIsMinimized] = useState(dockMinimized);

  // Sync store state with local state
  useEffect(() => {
    setIsMinimized(dockMinimized);
  }, [dockMinimized]);
  // Legacy dock items replaced by toolbar; keep a constant count for sizing
  const TOOLBAR_ITEM_COUNT = 6; // live, mic, awareness, subtitles, help, settings
  // Fallback array to satisfy any legacy width calculations if hot-reload lags
  const dockItems = Array.from({ length: TOOLBAR_ITEM_COUNT }, (_, i) => ({ id: `toolbar_${i}` }));
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  const [isScreenAware, setIsScreenAware] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [currentPersonality, setCurrentPersonality] = useState(null);
  const [useEnhancedVoice, setUseEnhancedVoice] = useState(false);
  const [showCapabilitiesInfo, setShowCapabilitiesInfo] = useState(false);
  const [localDockDimensions, setLocalDockDimensions] = useState({ width: 0, height: 0 });
  const dockRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 });

  // Live Voice Chat state
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [speakerVolume, setSpeakerVolume] = useState(0);
  const [messages, setMessages] = useState([]);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [voiceChatWidth, setVoiceChatWidth] = useState(340);
  const [voiceChatHeight, setVoiceChatHeight] = useState(420);
  const recorderRef = useRef(null);
  const messagesEndRef = useRef(null);
  const resizeRef = useRef(null);

  // Store actions
  const setIsSettingsOpen = useStore((state) => state.actions.setIsSettingsOpen);
  const setIsSystemInfoOpen = useStore((state) => state.actions.setIsSystemInfoOpen);
  const setIsLiveVoiceChatOpen = useStore((state) => state.actions.setIsLiveVoiceChatOpen);
  const setActiveApp = useStore((state) => state.actions.setActiveApp);
  const setDockPosition = useStore((state) => state.actions.setDockPosition);
  const setDockDimensions = useStore((state) => state.actions.setDockDimensions);
  const activeApp = useStore((state) => state.activeApp);
  const activeModuleId = useStore((state) => state.activeModuleId);
  const isLiveVoiceChatOpen = useStore((state) => state.isLiveVoiceChatOpen);
  const orchestratorNarration = useStore((state) => state.orchestratorNarration);
  const setOrchestratorNarration = useStore((state) => state.actions.setOrchestratorNarration);

  // Dock mode state
  const dockMode = useStore((state) => state.dockMode);
  const activeNodeId = useStore((state) => state.activeNodeId);
  const currentNodeConfig = useStore((state) => state.currentNodeConfig);
  const returnToChat = useStore((state) => state.actions.returnToChat);
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  // Live API setup - uses secure backend proxy (no API key needed on frontend)
  const { client, setConfig, connect, disconnect, connected, volume } = useLiveAPI({});

  // Sync position to store
  useEffect(() => {
    setDockPosition(position);
  }, [position, setDockPosition]);

  // Handle state transitions and positioning
  useEffect(() => {
    // Expand when voice chat opens or entering node mode
    if (isLiveVoiceChatOpen || dockMode === 'node') {
      setIsMinimized(false);

      // Center the dock when voice chat opens
      if (isLiveVoiceChatOpen) {
        const centerX = (window.innerWidth - voiceChatWidth) / 2;
        const centerY = (window.innerHeight - voiceChatHeight) / 2;
        setPosition({ x: centerX, y: centerY });
      }
    }
    // NOTE: Removed auto-minimize on chat mode - user controls minimize via Escape or explicit click
  }, [isLiveVoiceChatOpen, dockMode, voiceChatWidth, voiceChatHeight]);

  // Position dock at bottom-left when minimized
  useEffect(() => {
    // Guard: avoid overriding center-on-open during voice-chat toggle
    if (isMinimized && !isLiveVoiceChatOpen) {
      setPosition({ x: 20, y: window.innerHeight - 80 });
    }
  }, [isMinimized, isLiveVoiceChatOpen]);

  // Keyboard shortcut: Escape to minimize or close voice chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && dockMode === 'chat') {
        e.preventDefault();
        if (isLiveVoiceChatOpen) {
          // First close voice chat if open
          console.log('[GlassDock] Escape pressed - closing voice chat');
          setIsLiveVoiceChatOpen(false);
        } else if (!isMinimized) {
          // Then minimize dock if expanded
          console.log('[GlassDock] Escape pressed - minimizing dock');
          setIsMinimized(true);
          setDockMinimized(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMinimized, dockMode, isLiveVoiceChatOpen, setIsLiveVoiceChatOpen]);

  // Setup voice commands
  useEffect(() => {
    if (!voiceCommands.isSupported) return;

    voiceCommands.onStart = () => {
      setIsVoiceListening(true);
      setVoiceStatus('Listening...');
    };

    voiceCommands.onEnd = () => {
      setIsVoiceListening(false);
      setVoiceStatus('');
    };

    voiceCommands.onError = (error) => {
      setIsVoiceListening(false);
      setVoiceStatus(`Error: ${error}`);
      setTimeout(() => setVoiceStatus(''), 3000);
    };

    voiceCommands.onResult = (result, confidence) => {
      setVoiceStatus(`Heard: "${result}" (${Math.round(confidence * 100)}%)`);
      setTimeout(() => setVoiceStatus(''), 2000);
    };

    // Setup voice command event listener
    const handleVoiceCommand = (event) => {
      const { action, data } = event.detail;
      switch (action) {
        case 'switch-app':
          setActiveApp(data);
          navigate(getAppPath(data));
          break;
        case 'open-settings':
          setIsSettingsOpen(true);
          break;
        case 'open-chat':
          setIsMinimized(false);
          setDockMinimized(false);
          break;
        case 'show-help':
          alert(data);
          break;
        case 'show-system-info':
          setIsSystemInfoOpen(true);
          break;
        default:
          console.log('Unknown voice command action:', action);
      }
    };

    window.addEventListener('voice-command', handleVoiceCommand);

    return () => {
      window.removeEventListener('voice-command', handleVoiceCommand);
    };
  }, [setActiveApp, setIsSettingsOpen, setIsSystemInfoOpen, setIsMinimized, setDockMinimized]);

  // Update current personality when module changes
  useEffect(() => {
    const context = { activeModuleId, activeApp, isOrchestrator: !activeModuleId };
    const personality = getVoicePersonality(context);
    setCurrentPersonality(personality);
  }, [activeModuleId, activeApp]);

  // Setup enhanced voice system
  useEffect(() => {
    if (!enhancedVoiceSystem.isSupported) return;

    enhancedVoiceSystem.onStart = () => {
      setIsVoiceListening(true);
      setVoiceStatus('Listening...');
    };

    enhancedVoiceSystem.onEnd = () => {
      setIsVoiceListening(false);
      setVoiceStatus('');
    };

    enhancedVoiceSystem.onError = (error) => {
      setIsVoiceListening(false);
      setVoiceStatus(`Error: ${error}`);
      setTimeout(() => setVoiceStatus(''), 3000);
    };

    enhancedVoiceSystem.onResult = (result, confidence) => {
      setVoiceStatus(`Processing: "${result}" (${Math.round(confidence * 100)}%)`);
      setTimeout(() => setVoiceStatus(''), 3000);
    };

    enhancedVoiceSystem.onPersonalityChange = (personality) => {
      setCurrentPersonality(personality);
      if (personality.name === 'Puck') {
        setVoiceStatus('🎭 Puck is here to help!');
      } else {
        setVoiceStatus(`🎓 ${personality.name} is ready to teach`);
      }
      setTimeout(() => setVoiceStatus(''), 2000);
    };

    return () => {
      // Cleanup would go here
    };
  }, []);

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
      addMessage('system', 'Disconnected from Gemini Live');
      setIsRecording(false);

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
      const functionCall = toolCall.functionCalls?.[0];
      if (functionCall) {
        addMessage('system', `Calling function: ${functionCall.name}`);
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
      // Update orchestrator narration for subtitle display
      if (text && isFinal) {
        setOrchestratorNarration(text);
      }
    };

    const onError = (error) => {
      handleAsyncError(error, {
        context: 'GlassDock Live API connection',
        showToast: true,
        fallbackMessage: 'Voice connection error. Please check your microphone and try again.'
      });
      addMessage('error', `Error: ${error.message || error.type || 'Connection error'}`);

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

  // Periodically update screen context when awareness is enabled
  useEffect(() => {
    if (!isScreenAware) return;

    // Update context immediately
    window.screenContext = extractDOMContext();

    // Set up periodic updates every 5 seconds
    const intervalId = setInterval(() => {
      if (isScreenAware) {
        window.screenContext = extractDOMContext();
        console.log('[Screen Awareness] Context refreshed');
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isScreenAware, activeApp, activeModuleId]);

  // Toggle voice listening
  const toggleVoiceListening = async () => {
    if (isVoiceListening) {
      if (useEnhancedVoice) {
        enhancedVoiceSystem.stopListening();
      } else {
        voiceCommands.stopListening();
      }
    } else {
      if (useEnhancedVoice) {
        await enhancedVoiceSystem.startListening();
      } else {
        await voiceCommands.startListening();
      }
    }
  };

  // DOM context extraction for screen awareness
  const extractDOMContext = () => {
    // Detect actual app from DOM if state is stale
    const bodyText = document.body.innerText || document.body.textContent;
    let detectedApp = activeApp;

    // Smart app detection based on page content
    if (bodyText.includes('ArchivAI') || bodyText.includes('TEMPLATES') && (bodyText.includes('Code Notebook') || bodyText.includes('Design Sketchbook'))) {
      detectedApp = 'archiva';
    } else if (bodyText.includes('VizGen') || bodyText.includes('Generate') && bodyText.includes('Input Image')) {
      detectedApp = 'imageBooth';
    } else if (bodyText.includes('PlannerAI') || bodyText.includes('workflow graph')) {
      detectedApp = 'planner';
    }

    // Sync detected app back to store if different
    if (detectedApp !== activeApp) {
      console.log(`[Screen Awareness] Detected app mismatch: store="${activeApp}" detected="${detectedApp}" - syncing...`);
      setActiveApp(detectedApp);
    }

    const context = {
      url: window.location.href,
      title: document.title,
      activeApp: detectedApp,
      activeModule: detectedApp === 'ideaLab' ? activeModuleId : null,
      timestamp: new Date().toISOString(),
      visibleText: '',
      headings: [],
      buttons: [],
      inputs: []
    };

    // Get visible text content
    context.visibleText = bodyText.substring(0, 2000); // Limit to first 2000 chars

    // Extract headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    context.headings = Array.from(headings).slice(0, 10).map(h => ({
      level: h.tagName.toLowerCase(),
      text: h.textContent.trim()
    }));

    // Extract visible buttons
    const buttons = document.querySelectorAll('button:not([style*="display: none"])');
    context.buttons = Array.from(buttons).slice(0, 15).map(btn =>
      btn.textContent.trim() || btn.getAttribute('title') || btn.getAttribute('aria-label') || ''
    ).filter(text => text);

    // Extract input fields
    const inputs = document.querySelectorAll('input, textarea, select');
    context.inputs = Array.from(inputs).slice(0, 10).map(input => ({
      type: input.type || input.tagName.toLowerCase(),
      placeholder: input.placeholder || '',
      label: input.getAttribute('aria-label') || input.name || ''
    }));

    return context;
  };

  // Toggle screen awareness
  const toggleScreenAwareness = () => {
    const newState = !isScreenAware;
    setIsScreenAware(newState);

    if (newState) {
      // Extract DOM context when enabling
      const context = extractDOMContext();
      console.log('[Screen Awareness] Enabled - Context:', context);

      // Store context for AI to use
      window.screenContext = context;

      // Don't add message - will show eye icon instead
    } else {
      console.log('[Screen Awareness] Disabled');
      window.screenContext = null;
    }
  };

  // Toggle subtitles display
  const toggleSubtitles = () => {
    setShowSubtitles(!showSubtitles);
  };

  // Live Voice Chat functions
  const addMessage = (role, content) => {
    const newMessage = { role, content, timestamp: Date.now(), id: Date.now() + Math.random() };
    setMessages(prev => [...prev, newMessage]);

    // Auto-remove system messages after 3 seconds
    if (role === 'system') {
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
      }, 3000);
    }
  };

  const handleToolCall = async (functionCall) => {
    const { name, args, id } = functionCall;

    console.log('[GlassDock] Tool call received:', name, args);

    // Get context for tool execution
    const context = {
      activeModuleId,
      activeApp,
      conversationId: `voice_${Date.now()}`,
      isVoice: true
    };

    try {
      // Use voiceFunctionManager for robust tool execution with fallbacks
      const result = await voiceFunctionManager.executeFunction(
        name,
        args,
        context,
        id
      );

      // Show system message for UI actions
      if (result.success && result.message) {
        addMessage('system', result.message);
      }

      // If it's the become_planner_node action, show additional message
      if (name === 'become_planner_node' && result.success) {
        addMessage('system', `Now in node mode. Configure your AI agent node.`);
      }

      // Send tool response back to Gemini
      if (client && connected) {
        client.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: functionCall.name,
            response: result
          }]
        });
      }

      console.log(`[GlassDock] Tool ${name} completed:`, result);
    } catch (error) {
      handleAsyncError(error, {
        context: `Executing GlassDock tool: ${name}`,
        showToast: false, // Error sent to chat
        silent: false
      });

      // Send error response
      if (client && connected) {
        client.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: functionCall.name,
            response: {
              success: false,
              error: error.message || 'Tool execution failed'
            }
          }]
        });
      }
    }
  };

  const getAvailableTools = async () => {
    const context = {
      activeModuleId,
      activeApp,
      isOrchestrator: true
    };

    try {
      // Get all available tools from voiceFunctionManager
      const allTools = await voiceFunctionManager.getAllAvailableTools(context);

      console.log(`[GlassDock] Loaded ${allTools.length} tools for Gemini Live API`);

      // Format for Gemini Live API
      return [{
        functionDeclarations: allTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }))
      }];
    } catch (error) {
      handleAsyncError(error, {
        context: 'Loading GlassDock tools configuration',
        showToast: false, // Fallback to minimal set
        silent: false
      });

      // Fallback to minimal set
      return [{
        functionDeclarations: [
          {
            name: 'switch_app',
            description: 'Switch to a different app',
            parameters: {
              type: 'OBJECT',
              properties: {
                appName: {
                  type: 'STRING',
                  enum: ['ideaLab', 'imageBooth', 'archiva', 'planner', 'workflows'],
                  description: 'App name'
                }
              },
              required: ['appName']
            }
          }
        ]
      }];
    }
  };

  const handleConnect = async () => {
    if (connected) {
      if (recorderRef.current) {
        recorderRef.current.stop();
        recorderRef.current = null;
      }
      disconnect();
      setIsRecording(false);
      return;
    }

    // Check authentication before connecting
    if (!isAuthenticated) {
      console.warn('[GlassDock] Cannot connect to Live Voice: User not authenticated');
      alert('Please log in with Google to use Live Voice features.\n\nThe Live Voice feature requires authentication to securely connect to the Gemini API through our backend proxy.');
      return;
    }

    try {
      // Build system instruction with optional screen context
      let systemInstructionText = `You are a helpful AI assistant integrated into GenBooth Idea Lab.
You can help users with:
- Navigation between apps (planner, archiva, idea lab, image booth, workflows)
- Opening settings and system information
- Answering questions about their work
- Providing creative suggestions

Be concise, friendly, and helpful. Match the personality of the selected voice.`;

      // Add screen context if awareness is enabled
      if (isScreenAware && window.screenContext) {
        const ctx = window.screenContext;
        systemInstructionText += `\n\nCURRENT SCREEN CONTEXT:
- Active App: ${ctx.activeApp}
- Page Title: ${ctx.title}
- Visible Headings: ${ctx.headings.map(h => h.text).join(', ')}
- Available Actions: ${ctx.buttons.slice(0, 8).join(', ')}

Use this context to provide more relevant and specific answers about what the user is currently viewing.`;
      }

      // Load tools asynchronously
      const tools = await getAvailableTools();

      const config = {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: selectedVoice
            }
          }
        },
        systemInstruction: {
          parts: [{
            text: systemInstructionText
          }]
        },
        tools: tools,
      };

      console.log('[GlassDock] Connecting with config:', {
        voice: selectedVoice,
        toolCount: tools[0]?.functionDeclarations?.length || 0
      });

      await connect(config);

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
    } catch (error) {
      handleAsyncError(error, {
        context: 'Connecting GlassDock voice interface',
        showToast: true,
        fallbackMessage: 'Failed to connect to voice interface. Please check your microphone permissions.'
      });
      addMessage('error', `Failed to connect: ${error.message}`);

      if (recorderRef.current) {
        recorderRef.current.stop();
        recorderRef.current = null;
      }
      setIsRecording(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInputTranscript('');
    setOutputTranscript('');
  };

  // Calculate dock dimensions
  const getDockDimensions = useCallback(() => {
    const itemsLen = TOOLBAR_ITEM_COUNT;
    const width = itemsLen * DOCK_ITEM_SIZE + (itemsLen - 1) * DOCK_GAP + (DOCK_PADDING * 2);
    const baseHeight = DOCK_ITEM_SIZE + (DOCK_PADDING * 2);
    const subtitleHeight = showSubtitles ? 80 : 0; // Add height for subtitle area
    const height = baseHeight + subtitleHeight;
    return { width, height };
  }, [showSubtitles]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // If voice chat is open, re-center the dock
      if (isLiveVoiceChatOpen) {
        const centerX = (window.innerWidth - voiceChatWidth) / 2;
        const centerY = (window.innerHeight - voiceChatHeight) / 2;
        setPosition({ x: centerX, y: centerY });
      } else {
        // Otherwise, just keep it within bounds
        const { width, height } = getDockDimensions();
        const maxX = window.innerWidth - width;
        const maxY = window.innerHeight - height;

        setPosition(prev => ({
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY)
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getDockDimensions, isLiveVoiceChatOpen, voiceChatWidth, voiceChatHeight]);

  // Drag handlers
  const handleMouseDown = useCallback((e) => {
    // Don't drag when clicking toolbar/buttons or voice chat content
    if (e.target.closest('.ui-ActionBar')) return;
    if (e.target.closest('.voice-chat-section')) return; // Don't drag when interacting with voice chat
    if (e.target.closest('.voice-chat-resize-handle')) return; // Don't drag when resizing
    if (e.target.closest('.primary-talk-btn')) return; // Don't drag when pressing primary talk button
    if (e.target.closest('.capabilities-info-panel')) return; // Don't drag when interacting with capabilities panel

    setIsDragging(true);
    const rect = dockRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const { width, height } = getDockDimensions();
    const newX = Math.max(0, Math.min(e.clientX - dragRef.current.offsetX, window.innerWidth - width));
    const newY = Math.max(0, Math.min(e.clientY - dragRef.current.offsetY, window.innerHeight - height));

    setPosition({ x: newX, y: newY });
  }, [isDragging, getDockDimensions]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Attach global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Auto-hide/show dock - DISABLED
  // Keep dock always visible
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const { width, height } = getDockDimensions();

  if (!isVisible) return null;

  // Minimized view - single orchestrator icon
  if (isMinimized && dockMode === 'chat' && !isLiveVoiceChatOpen) {
    return (
      <MinimizedDock position={position} onOpen={() => { setIsMinimized(false); setDockMinimized(false); }} />
    );
  }

  return (
    <div
      ref={dockRef}
      className={`glass-dock ${isDragging ? 'dragging' : ''} ${isLiveVoiceChatOpen ? 'voice-chat-expanded' : ''} ${dockMode === 'node' ? 'node-mode' : 'chat-mode'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        ...(isLiveVoiceChatOpen ? {} : {
          width: `${width}px`,
          height: `${height}px`
        })
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Node Mode Panel */}
      {dockMode === 'node' && (
        <NodeModePanel
          nodeId={activeNodeId}
          config={currentNodeConfig}
          onReturnToChat={returnToChat}
        />
      )}

      {/* Expandable Voice Chat Section */}
      {dockMode === 'chat' && isLiveVoiceChatOpen && (
        <VoiceChatPanel
          connected={connected}
          recording={isRecording}
          screenAware={isScreenAware}
          selectedVoice={selectedVoice}
          messages={messages}
          inputTranscript={inputTranscript}
          outputTranscript={outputTranscript}
          endRef={messagesEndRef}
          width={voiceChatWidth}
          height={voiceChatHeight}
          onClose={(e) => {
            e?.stopPropagation?.();
            if (connected) {
              disconnect();
              if (recorderRef.current) {
                recorderRef.current.stop();
                recorderRef.current = null;
              }
              setIsRecording(false);
            }
            setIsLiveVoiceChatOpen(false);
          }}
          onResizeStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = voiceChatWidth;
            const startHeight = voiceChatHeight;
            const handleMouseMove = (moveEvent) => {
              moveEvent.preventDefault();
              moveEvent.stopPropagation();
              const deltaX = moveEvent.clientX - startX;
              const deltaY = moveEvent.clientY - startY;
          const maxWidth = Math.min(window.innerWidth - 40, 1400);
          const maxHeight = Math.min(window.innerHeight - 120, 1200);
          const newWidth = Math.max(300, Math.min(startWidth + deltaX, maxWidth));
          const newHeight = Math.max(350, Math.min(startHeight + deltaY, maxHeight));
          setVoiceChatWidth(newWidth);
          setVoiceChatHeight(newHeight);
        };
            const handleMouseUp = (upEvent) => {
              upEvent.preventDefault();
              upEvent.stopPropagation();
              window.removeEventListener('mousemove', handleMouseMove);
              window.removeEventListener('mouseup', handleMouseUp);
              document.body.style.cursor = '';
              document.body.style.userSelect = '';
            };
            document.body.style.cursor = 'nwse-resize';
            document.body.style.userSelect = 'none';
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
          }}
        />
      )}

      {/* Dock Toolbar (Square Icon Actions) - only show when NOT in voice chat */}
      {dockMode === 'chat' && !isLiveVoiceChatOpen && (
        <GlassDockToolbar
          liveOpen={isLiveVoiceChatOpen}
          listening={isVoiceListening}
          awarenessOn={isScreenAware}
          subtitlesOn={showSubtitles}
          onToggleLive={async () => {
            setIsLiveVoiceChatOpen(true);
            try { await handleConnect(); } catch (e) {}
          }}
          onToggleListen={toggleVoiceListening}
          onToggleAwareness={toggleScreenAwareness}
          onToggleSubtitles={toggleSubtitles}
          onOpenHelp={() => setShowCapabilitiesInfo(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onMinimize={() => { setIsMinimized(true); setDockMinimized(true); }}
        />
      )}

      {/* Primary Talk Button (prominent CTA) */}
      {dockMode === 'chat' && !isLiveVoiceChatOpen && (
        <button
          className="primary-talk-btn"
          title="Talk to the Orchestrator"
          onClick={async (e) => {
            e.stopPropagation();
            if (!isLiveVoiceChatOpen) {
              setIsLiveVoiceChatOpen(true);
              try { await handleConnect(); } catch (e) {}
            }
          }}
        >
          <span className="icon" aria-hidden>psychology</span>
          <span className="sr-only">Talk to the Orchestrator</span>
        </button>
      )}

      {/* Extensible content frame for orchestrator (chat-mode) */}
      {dockMode === 'chat' && !isLiveVoiceChatOpen && (
        // Consumers can inject content via DockContentProvider/useDockContent
        <OrchestratorSlot />
      )}

      <div className="dock-handle">
        <span className="icon">drag_indicator</span>
      </div>

      {voiceStatus && (
        <div className="voice-status-dock">
          {voiceStatus}
        </div>
      )}

      {showSubtitles && orchestratorNarration && (
        <div className="subtitle-area">
          <div className="subtitle-text">
            {orchestratorNarration}
          </div>
        </div>
      )}


      {showCapabilitiesInfo && (
        <div className="capabilities-info-panel" onClick={(e) => e.stopPropagation()} style={{ height: `${isLiveVoiceChatOpen ? voiceChatHeight : 420}px` }}>
          <div className="capabilities-header">
            <div className="capabilities-title">
              <span className="icon">help</span>
              <h4>Voice Commands & Capabilities</h4>
            </div>
            <button
              className="icon-btn close-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowCapabilitiesInfo(false);
              }}
              title="Close"
            >
              <span className="icon">close</span>
            </button>
          </div>

          <div className="capabilities-content">
            <div className="capabilities-section">
              <div className="section-title">
                <span className="icon">mic</span>
                <h5>Voice Commands</h5>
              </div>
              <ul className="command-list">
                <li><code>open [app name]</code> - Switch to an app</li>
                <li><code>show settings</code> - Open settings</li>
                <li><code>open chat</code> - Open orchestrator</li>
                <li><code>show help</code> - Display help</li>
                <li><code>system info</code> - Show system information</li>
              </ul>
            </div>

            <div className="capabilities-section">
              <div className="section-title">
                <span className="icon">forum</span>
                <h5>Live Voice Chat</h5>
              </div>
              <ul className="command-list">
                <li>Real-time voice conversation with Gemini AI</li>
                <li>Multiple voice personalities to choose from</li>
                <li>Can navigate apps and open settings</li>
                <li>Provides creative suggestions and answers</li>
                <li>Transcribes your speech in real-time</li>
              </ul>
            </div>

            <div className="capabilities-section">
              <div className="section-title">
                <span className="icon">visibility</span>
                <h5>Screen Awareness</h5>
              </div>
              <ul className="command-list">
                <li>Reads current page content (headings, buttons, text)</li>
                <li>Knows which app and module you're viewing</li>
                <li>Provides context-aware responses</li>
                <li>Updates automatically every 5 seconds</li>
                <li>Toggle on/off from dock for privacy</li>
              </ul>
            </div>

            <div className="capabilities-tip">
              <span className="icon">lightbulb</span>
              <p>Tip: Use Voice Commands for quick actions, or Live Voice Chat for natural conversations. Toggle Screen Awareness anytime for context!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
