/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Voice System Integration Module
 *
 * This module provides a unified interface for voice interactions, supporting both:
 * - Web Speech API (for basic voice commands)
 * - Gemini Live API (for advanced conversational AI)
 *
 * Export structure:
 * - Core Components: GenAILiveClient, AudioRecorder, AudioStreamer
 * - React Hooks: useLiveAPI
 * - Constants: voice options, available voices
 * - Utilities: audio context, base64 conversion
 */

// Core Gemini Live API client
export { GenAILiveClient } from './genAILiveClient.js';

// Audio components
export { AudioRecorder } from './audioRecorder.js';
export { AudioStreamer } from './audioStreamer.js';

// React hooks
export { useLiveAPI } from './useLiveAPI.js';

// Constants and configuration
export { DEFAULT_LIVE_API_MODEL, DEFAULT_VOICE, AVAILABLE_VOICES } from './constants.js';

// Utilities
export { audioContext, base64ToArrayBuffer } from './utils.js';

// Enhanced voice system (existing)
export { enhancedVoiceSystem, EnhancedVoiceSystem } from './enhancedVoiceSystem.js';

// Voice personalities and functions
export { getVoicePersonality, getVoiceConfig } from './voicePersonalities.js';
export { voiceFunctionManager } from './voiceFunctionManager.js';