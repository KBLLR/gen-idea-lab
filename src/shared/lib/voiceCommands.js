/**
 * Voice Commands System
 * Provides speech recognition and voice-controlled navigation
 */

export class VoiceCommandSystem {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSupported = false;
    this.hasPermission = false;
    this.permissionChecked = false;
    this.commands = new Map();
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
    this.onPermissionChange = null;

    this.init();
    this.setupCommands();
    this.checkMicrophonePermission();
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
      this.processCommand(result, confidence);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (this.onError) this.onError(event.error);
    };
  }

  setupCommands() {
    // Navigation commands - using store actions instead of URL navigation
    this.addCommand(['go to planner', 'open planner', 'show planner'], () => {
      this.switchToApp('planner');
    });

    this.addCommand(['go to archiva', 'open archiva', 'show archiva'], () => {
      this.switchToApp('archiva');
    });

    this.addCommand(['go to modules', 'open modules', 'show modules', 'go to idea lab'], () => {
      this.switchToApp('ideaLab');
    });

    this.addCommand(['go to booth', 'open booth', 'show booth', 'image booth'], () => {
      this.switchToApp('imageBooth');
    });

    this.addCommand(['go to workflows', 'open workflows', 'show workflows'], () => {
      this.switchToApp('workflows');
    });

    this.addCommand(['go home', 'home page', 'main page'], () => {
      this.switchToApp('ideaLab');
    });

    // Settings commands
    this.addCommand(['open settings', 'show settings', 'settings'], () => {
      this.openSettings();
    });

    // App switching commands
    this.addCommand(['switch app', 'change app', 'app switcher'], () => {
      this.openAppSwitcher();
    });

    // Chat commands
    this.addCommand(['start chat', 'open chat', 'talk to assistant'], () => {
      this.openChat();
    });

    // Workflow commands
    this.addCommand(['new workflow', 'create workflow'], () => {
      this.createWorkflow();
    });

    this.addCommand(['run workflow', 'execute workflow'], () => {
      this.runWorkflow();
    });

    // University commands
    this.addCommand(['show university', 'university data', 'student info'], () => {
      this.showUniversityData();
    });

    // Voice control commands
    this.addCommand(['stop listening', 'stop voice', 'turn off voice'], () => {
      this.stopListening();
    });

    this.addCommand(['help', 'voice help', 'what can you do'], () => {
      this.showHelp();
    });

    // System info command
    this.addCommand(['system info', 'show system info', 'system status'], () => {
      this.showSystemInfo();
    });
  }

  addCommand(phrases, action, description = '') {
    phrases.forEach(phrase => {
      this.commands.set(phrase, { action, description });
    });
  }

  processCommand(text, confidence) {
    // Require minimum confidence
    if (confidence < 0.6) {
      if (this.onError) this.onError('Low confidence in speech recognition');
      return;
    }

    // Find matching command
    const command = this.commands.get(text);
    if (command) {
      try {
        command.action();
      } catch (error) {
        console.error('Voice command execution failed:', error);
        if (this.onError) this.onError('Command execution failed');
      }
    } else {
      // Try partial matching
      const partialMatch = this.findPartialMatch(text);
      if (partialMatch) {
        try {
          partialMatch.action();
        } catch (error) {
          console.error('Voice command execution failed:', error);
          if (this.onError) this.onError('Command execution failed');
        }
      } else {
        if (this.onError) this.onError(`Command not recognized: "${text}"`);
      }
    }
  }

  findPartialMatch(text) {
    for (const [phrase, command] of this.commands) {
      if (text.includes(phrase) || phrase.includes(text)) {
        return command;
      }
    }
    return null;
  }

  async checkMicrophonePermission() {
    if (typeof window === 'undefined' || !navigator.permissions) {
      this.permissionChecked = true;
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'microphone' });
      this.hasPermission = permission.state === 'granted';
      this.permissionChecked = true;

      if (this.onPermissionChange) {
        this.onPermissionChange(permission.state);
      }

      // Listen for permission changes
      permission.addEventListener('change', () => {
        this.hasPermission = permission.state === 'granted';
        if (this.onPermissionChange) {
          this.onPermissionChange(permission.state);
        }
      });
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
      this.permissionChecked = true;
    }
  }

  async requestMicrophonePermission() {
    if (!this.isSupported) {
      if (this.onError) this.onError('Speech recognition not supported');
      return false;
    }

    try {
      // Try to access microphone using getUserMedia to trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Close the stream immediately, we only needed it for permission
      stream.getTracks().forEach(track => track.stop());

      this.hasPermission = true;
      if (this.onPermissionChange) {
        this.onPermissionChange('granted');
      }

      return true;
    } catch (error) {
      console.warn('Microphone permission denied:', error);
      this.hasPermission = false;
      if (this.onPermissionChange) {
        this.onPermissionChange('denied');
      }
      if (this.onError) {
        this.onError('Microphone permission is required for voice commands');
      }
      return false;
    }
  }

  async startListening() {
    if (!this.isSupported) {
      if (this.onError) this.onError('Speech recognition not supported');
      return false;
    }

    if (this.isListening) {
      return false;
    }

    // Check permission first
    if (!this.hasPermission && this.permissionChecked) {
      const granted = await this.requestMicrophonePermission();
      if (!granted) {
        return false;
      }
    }

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

  // Navigation helpers
  switchToApp(appName) {
    const event = new CustomEvent('voice-command', {
      detail: { action: 'switch-app', data: appName }
    });
    window.dispatchEvent(event);
  }

  navigateTo(path) {
    window.location.href = path;
  }

  openSettings() {
    const event = new CustomEvent('voice-command', {
      detail: { action: 'open-settings' }
    });
    window.dispatchEvent(event);
  }

  openAppSwitcher() {
    const event = new CustomEvent('voice-command', {
      detail: { action: 'open-app-switcher' }
    });
    window.dispatchEvent(event);
  }

  openChat() {
    const event = new CustomEvent('voice-command', {
      detail: { action: 'open-chat' }
    });
    window.dispatchEvent(event);
  }

  createWorkflow() {
    const event = new CustomEvent('voice-command', {
      detail: { action: 'create-workflow' }
    });
    window.dispatchEvent(event);
  }

  runWorkflow() {
    const event = new CustomEvent('voice-command', {
      detail: { action: 'run-workflow' }
    });
    window.dispatchEvent(event);
  }

  showUniversityData() {
    const event = new CustomEvent('voice-command', {
      detail: { action: 'show-university-data' }
    });
    window.dispatchEvent(event);
  }

  showHelp() {
    const commands = Array.from(this.commands.keys()).slice(0, 10);
    const helpText = `Available voice commands: ${commands.join(', ')}`;

    const event = new CustomEvent('voice-command', {
      detail: { action: 'show-help', data: helpText }
    });
    window.dispatchEvent(event);
  }

  showSystemInfo() {
    const event = new CustomEvent('voice-command', {
      detail: { action: 'show-system-info' }
    });
    window.dispatchEvent(event);
  }

  // Utility methods
  getAvailableCommands() {
    return Array.from(this.commands.keys());
  }

  async requestPermissionOnLoad() {
    // Only request permission automatically in user-initiated contexts
    // This method can be called after a user interaction
    if (!this.hasPermission && this.permissionChecked) {
      return await this.requestMicrophonePermission();
    }
    return this.hasPermission;
  }

  setLanguage(lang) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  destroy() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.commands.clear();
  }
}

// Export singleton instance
export const voiceCommands = new VoiceCommandSystem();