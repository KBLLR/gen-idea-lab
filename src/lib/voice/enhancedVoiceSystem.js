/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getVoicePersonality, getVoiceConfig } from './voicePersonalities.js';
import { voiceFunctionManager } from './voiceFunctionManager.js';
import useStore from '../store.js';

/**
 * Enhanced Voice System with Personality-aware Function Calling
 * This will eventually be replaced with Gemini Live API for full conversational AI
 */
export class EnhancedVoiceSystem {
  constructor() {
    this.recognition = null;
    this.synthesis = null;
    this.isListening = false;
    this.isSupported = false;
    this.hasPermission = false;
    this.permissionChecked = false;
    this.currentPersonality = null;
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
    this.onPersonalityChange = null;

    this.init();
    this.setupSpeechSynthesis();
  }

  init() {
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.isSupported = true;
    this.recognition = new SpeechRecognition();

    // Configure recognition
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Setup event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStart) this.onStart();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) this.onEnd();
    };

    this.recognition.onresult = (event) => {
      const result = event.results[0][0].transcript.toLowerCase().trim();
      const confidence = event.results[0][0].confidence;

      if (this.onResult) this.onResult(result, confidence);
      this.processVoiceInput(result, confidence);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (this.onError) this.onError(event.error);
    };
  }

  setupSpeechSynthesis() {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    this.synthesis = window.speechSynthesis;
  }

  /**
   * Process voice input with personality-aware function calling
   */
  async processVoiceInput(text, confidence) {
    if (confidence < 0.6) {
      this.speak("I didn't quite catch that. Could you repeat?");
      return;
    }

    // Get current context
    const context = this.getCurrentContext();
    const personality = getVoicePersonality(context);

    // Update current personality if changed
    if (this.currentPersonality?.name !== personality.name) {
      this.currentPersonality = personality;
      if (this.onPersonalityChange) {
        this.onPersonalityChange(personality);
      }
    }

    // Try to understand the intent and execute appropriate function
    const intent = this.parseIntent(text, context);

    if (intent.function) {
      try {
        const result = await voiceFunctionManager.executeFunction(
          intent.function,
          intent.args,
          context
        );

        if (result.success) {
          this.speak(this.generateResponse(intent, result, personality));
        } else {
          this.speak(`Sorry, I encountered an error: ${result.error}`);
        }
      } catch (error) {
        this.speak("Something went wrong while processing your request.");
        console.error('Voice function execution error:', error);
      }
    } else {
      // No specific function detected, provide general help
      this.speak(this.generateHelpResponse(text, personality));
    }
  }

  /**
   * Parse user intent from voice input
   */
  parseIntent(text, context) {
    const intent = { function: null, args: {} };

    // Navigation intents
    if (text.includes('switch to') || text.includes('go to') || text.includes('open')) {
      if (text.includes('module') || text.includes('subject')) {
        // Extract module name/topic
        intent.function = 'switch_module';
        // This is simplified - in full implementation would use NLP
        intent.args = { moduleId: this.extractModuleId(text) };
      } else if (text.includes('chat') || text.includes('assistant')) {
        intent.function = 'start_chat';
      } else if (text.includes('settings')) {
        intent.function = 'open_settings';
      } else if (text.includes('system info') || text.includes('system information')) {
        intent.function = 'show_system_info';
      }
    }

    // Learning intents
    else if (text.includes('explain') || text.includes('what is') || text.includes('tell me about')) {
      intent.function = 'explain_concept';
      intent.args = { concept: this.extractConcept(text) };
    }

    // Search intents
    else if (text.includes('search') || text.includes('find') || text.includes('look up')) {
      intent.function = 'search_knowledge';
      intent.args = { query: this.extractSearchQuery(text) };
    }

    // Programming intents (when in CS module)
    else if (context.activeModuleId?.startsWith('SE_')) {
      if (text.includes('run code') || text.includes('execute')) {
        intent.function = 'run_code';
        intent.args = {
          language: this.extractLanguage(text) || 'javascript',
          code: this.extractCode(text)
        };
      } else if (text.includes('debug') || text.includes('error')) {
        intent.function = 'debug_error';
        intent.args = { error_message: text };
      }
    }

    // Design intents (when in Design module)
    else if (context.activeModuleId?.startsWith('DS_')) {
      if (text.includes('color') && (text.includes('palette') || text.includes('scheme'))) {
        intent.function = 'suggest_color_palette';
        intent.args = {
          mood: this.extractMood(text) || 'modern',
          style: this.extractStyle(text)
        };
      } else if (text.includes('analyze') && text.includes('composition')) {
        intent.function = 'analyze_composition';
        intent.args = { image_url: 'current design' };
      }
    }

    return intent;
  }

  /**
   * Get current application context
   */
  getCurrentContext() {
    const state = useStore.getState();
    return {
      activeModuleId: state.activeModuleId,
      activeApp: state.activeApp,
      isOrchestrator: !state.activeModuleId || state.isOrchestratorOpen
    };
  }

  /**
   * Generate personality-appropriate response
   */
  generateResponse(intent, result, personality) {
    const responses = {
      switch_module: [
        `${personality.prompts?.module_switch?.replace('{moduleName}', result.data?.moduleName || 'the new module') || 'Switching modules now!'}`,
        "Let me help you with this new subject!",
        "Perfect! Ready to explore this topic together."
      ],
      explain_concept: [
        `Let me explain ${intent.args.concept} for you.`,
        `${intent.args.concept} is an important concept. Here's what you need to know...`,
        "Great question! This is a fundamental topic."
      ],
      search_knowledge: [
        `I found some information about ${intent.args.query}.`,
        "Here's what I discovered in our knowledge base.",
        `Let me share what I know about ${intent.args.query}.`
      ]
    };

    const responseList = responses[intent.function] || ["Task completed successfully!"];
    return responseList[Math.floor(Math.random() * responseList.length)];
  }

  /**
   * Generate helpful response when no specific function is detected
   */
  generateHelpResponse(text, personality) {
    const helpResponses = [
      personality.prompts?.help_offer || "How can I help you today?",
      "I'm here to assist with your learning. What would you like to explore?",
      "Feel free to ask me questions or request help with any topic!",
      "You can ask me to explain concepts, switch modules, or search for information."
    ];

    return helpResponses[Math.floor(Math.random() * helpResponses.length)];
  }

  /**
   * Text-to-speech with personality voice
   */
  speak(text, context = null) {
    if (!this.synthesis) return;

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Get voice configuration for current personality
    const voiceConfig = getVoiceConfig(context || this.getCurrentContext());

    // Apply voice settings
    utterance.rate = this.getRate(voiceConfig.speed);
    utterance.pitch = this.getPitch(voiceConfig.pitch);
    utterance.volume = 0.8;

    // Try to find appropriate voice
    const voices = this.synthesis.getVoices();
    const preferredVoice = this.findVoice(voices, voiceConfig);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synthesis.speak(utterance);
  }

  /**
   * Find appropriate voice based on configuration
   */
  findVoice(voices, config) {
    // Try to find voice matching gender and accent preferences
    const genderKeywords = config.gender === 'female' ? ['female', 'woman'] : ['male', 'man'];
    const accentKeywords = config.accent?.includes('british') ? ['uk', 'british', 'en-gb'] : ['us', 'american', 'en-us'];

    for (const voice of voices) {
      const voiceName = voice.name.toLowerCase();
      const hasGender = genderKeywords.some(keyword => voiceName.includes(keyword));
      const hasAccent = accentKeywords.some(keyword => voiceName.includes(keyword) || voice.lang.includes(keyword));

      if (hasGender && hasAccent) return voice;
    }

    // Fallback to any voice with correct gender
    for (const voice of voices) {
      const voiceName = voice.name.toLowerCase();
      if (genderKeywords.some(keyword => voiceName.includes(keyword))) return voice;
    }

    return null;
  }

  /**
   * Convert speed setting to speech rate
   */
  getRate(speed) {
    const rates = {
      'very-slow': 0.5,
      'slow': 0.7,
      'normal': 1.0,
      'slightly-fast': 1.2,
      'fast': 1.5,
      'very-fast': 2.0
    };
    return rates[speed] || 1.0;
  }

  /**
   * Convert pitch setting to speech pitch
   */
  getPitch(pitch) {
    const pitches = {
      'very-low': 0.5,
      'low': 0.7,
      'medium-low': 0.8,
      'medium': 1.0,
      'medium-high': 1.2,
      'high': 1.5,
      'very-high': 2.0
    };
    return pitches[pitch] || 1.0;
  }

  // Utility methods for parsing voice input (simplified)
  extractModuleId(text) {
    // This would use NLP to properly extract module references
    // For now, return a placeholder
    return 'SE_01'; // Default to a software engineering module
  }

  extractConcept(text) {
    // Extract the concept being asked about
    const conceptMatch = text.match(/(?:explain|what is|tell me about)\s+(.+)/i);
    return conceptMatch ? conceptMatch[1] : 'general concept';
  }

  extractSearchQuery(text) {
    const queryMatch = text.match(/(?:search|find|look up)\s+(.+)/i);
    return queryMatch ? queryMatch[1] : text;
  }

  extractLanguage(text) {
    const languages = ['javascript', 'python', 'java', 'cpp', 'c++', 'typescript'];
    for (const lang of languages) {
      if (text.includes(lang)) return lang;
    }
    return null;
  }

  extractCode(text) {
    // This would extract code from voice input - complex NLP task
    return 'console.log("Hello World");'; // Placeholder
  }

  extractMood(text) {
    const moods = ['modern', 'vintage', 'minimalist', 'bold', 'calm', 'energetic'];
    for (const mood of moods) {
      if (text.includes(mood)) return mood;
    }
    return null;
  }

  extractStyle(text) {
    const styles = ['corporate', 'creative', 'academic', 'playful'];
    for (const style of styles) {
      if (text.includes(style)) return style;
    }
    return null;
  }

  // Control methods
  async startListening() {
    if (!this.isSupported || this.isListening) return false;

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      if (this.onError) this.onError('Failed to start listening');
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Get current personality info
  getCurrentPersonality() {
    return this.currentPersonality || getVoicePersonality(this.getCurrentContext());
  }
}

// Export singleton instance
export const enhancedVoiceSystem = new EnhancedVoiceSystem();
export default enhancedVoiceSystem;