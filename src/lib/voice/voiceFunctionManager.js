/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getVoicePersonality, getAvailableTools } from './voicePersonalities.js';
import useStore from '../store.js';

/**
 * Voice Function Call Manager
 * Handles function calling for voice interactions with different module personalities
 */
export class VoiceFunctionManager {
  constructor() {
    this.functions = new Map();
    this.setupCoreFunctions();
  }

  /**
   * Setup core functions available to all voice personalities
   */
  setupCoreFunctions() {
    // Navigation functions
    this.registerFunction('switch_module', {
      description: 'Switch to a specific academic module',
      parameters: {
        moduleId: { type: 'string', description: 'The module ID to switch to' }
      },
      handler: (args) => {
        const { selectModule } = useStore.getState().actions;
        selectModule(args.moduleId);
        return { success: true, message: `Switched to module ${args.moduleId}` };
      }
    });

    this.registerFunction('open_app', {
      description: 'Open a specific application',
      parameters: {
        appName: { type: 'string', description: 'The app to open (ideaLab, imageBooth, archiva, workflows, planner)' }
      },
      handler: (args) => {
        const { setActiveApp } = useStore.getState().actions;
        setActiveApp(args.appName);
        return { success: true, message: `Opened ${args.appName}` };
      }
    });

    this.registerFunction('show_system_info', {
      description: 'Display system information modal',
      parameters: {},
      handler: () => {
        const { setIsSystemInfoOpen } = useStore.getState().actions;
        setIsSystemInfoOpen(true);
        return { success: true, message: 'System information displayed' };
      }
    });

    // Orchestrator functions
    this.registerFunction('start_chat', {
      description: 'Open the orchestrator chat',
      parameters: {},
      handler: () => {
        const { setIsOrchestratorOpen } = useStore.getState().actions;
        setIsOrchestratorOpen(true);
        return { success: true, message: 'Orchestrator chat opened' };
      }
    });

    this.registerFunction('open_settings', {
      description: 'Open the settings modal',
      parameters: {},
      handler: () => {
        const { setIsSettingsOpen } = useStore.getState().actions;
        setIsSettingsOpen(true);
        return { success: true, message: 'Settings opened' };
      }
    });

    // Learning functions
    this.registerFunction('explain_concept', {
      description: 'Explain a concept related to the current module',
      parameters: {
        concept: { type: 'string', description: 'The concept to explain' }
      },
      handler: (args) => {
        // This would integrate with the orchestrator to provide explanations
        return {
          success: true,
          message: `Explaining concept: ${args.concept}`,
          action: 'explanation_requested',
          data: { concept: args.concept }
        };
      }
    });

    this.registerFunction('search_knowledge', {
      description: 'Search the knowledge base for information',
      parameters: {
        query: { type: 'string', description: 'The search query' }
      },
      handler: (args) => {
        return {
          success: true,
          message: `Searching for: ${args.query}`,
          action: 'knowledge_search',
          data: { query: args.query }
        };
      }
    });

    // Computer Science specific functions
    this.registerFunction('run_code', {
      description: 'Execute code in a specified language',
      parameters: {
        language: { type: 'string', description: 'Programming language' },
        code: { type: 'string', description: 'Code to execute' }
      },
      handler: (args) => {
        return {
          success: true,
          message: `Executing ${args.language} code`,
          action: 'code_execution',
          data: { language: args.language, code: args.code }
        };
      }
    });

    this.registerFunction('debug_error', {
      description: 'Help debug a programming error',
      parameters: {
        error_message: { type: 'string', description: 'The error message to debug' }
      },
      handler: (args) => {
        return {
          success: true,
          message: `Analyzing error: ${args.error_message}`,
          action: 'debug_assistance',
          data: { error: args.error_message }
        };
      }
    });

    // Design specific functions
    this.registerFunction('analyze_composition', {
      description: 'Analyze the composition of an image or design',
      parameters: {
        image_url: { type: 'string', description: 'URL or description of the image' }
      },
      handler: (args) => {
        return {
          success: true,
          message: `Analyzing composition of: ${args.image_url}`,
          action: 'composition_analysis',
          data: { image: args.image_url }
        };
      }
    });

    this.registerFunction('suggest_color_palette', {
      description: 'Suggest a color palette for a design',
      parameters: {
        mood: { type: 'string', description: 'The mood or feeling desired' },
        style: { type: 'string', description: 'Design style (optional)' }
      },
      handler: (args) => {
        return {
          success: true,
          message: `Suggesting ${args.mood} color palette`,
          action: 'color_palette_suggestion',
          data: { mood: args.mood, style: args.style }
        };
      }
    });

    // Learning progress functions
    this.registerFunction('track_progress', {
      description: 'Track learning progress in current module',
      parameters: {},
      handler: () => {
        const { activeModuleId } = useStore.getState();
        return {
          success: true,
          message: `Tracking progress for ${activeModuleId}`,
          action: 'progress_tracking',
          data: { moduleId: activeModuleId }
        };
      }
    });

    this.registerFunction('create_quiz', {
      description: 'Create a quiz on a specific topic',
      parameters: {
        topic: { type: 'string', description: 'The topic for the quiz' }
      },
      handler: (args) => {
        return {
          success: true,
          message: `Creating quiz on: ${args.topic}`,
          action: 'quiz_creation',
          data: { topic: args.topic }
        };
      }
    });
  }

  /**
   * Register a new function
   */
  registerFunction(name, definition) {
    this.functions.set(name, definition);
  }

  /**
   * Get functions available for current context
   */
  getAvailableFunctions(context = {}) {
    const tools = getAvailableTools(context);
    const availableFunctions = [];

    tools.forEach(toolName => {
      // Extract function name from tool signature (e.g., "run_code(language, code)" -> "run_code")
      const functionName = toolName.split('(')[0];
      const functionDef = this.functions.get(functionName);

      if (functionDef) {
        availableFunctions.push({
          name: functionName,
          description: functionDef.description,
          parameters: {
            type: 'OBJECT',
            properties: this.convertParametersToGeminiFormat(functionDef.parameters),
            required: Object.keys(functionDef.parameters || {})
          }
        });
      }
    });

    return availableFunctions;
  }

  /**
   * Convert our parameter format to Gemini function calling format
   */
  convertParametersToGeminiFormat(parameters) {
    const geminiParams = {};

    Object.entries(parameters || {}).forEach(([name, param]) => {
      geminiParams[name] = {
        type: param.type.toUpperCase(),
        description: param.description
      };
    });

    return geminiParams;
  }

  /**
   * Execute a function call
   */
  async executeFunction(functionName, args, context = {}) {
    const functionDef = this.functions.get(functionName);

    if (!functionDef) {
      return {
        success: false,
        error: `Function ${functionName} not found`
      };
    }

    try {
      const result = await functionDef.handler(args, context);

      // Dispatch event for UI updates if needed
      if (result.action) {
        window.dispatchEvent(new CustomEvent('voice-function-call', {
          detail: {
            function: functionName,
            args,
            result,
            context
          }
        }));
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get function call prompt for current personality
   */
  getFunctionCallPrompt(context = {}) {
    const personality = getVoicePersonality(context);
    const functions = this.getAvailableFunctions(context);

    return `
You are ${personality.name}, ${personality.personality?.expertise || 'a helpful assistant'}.

Voice characteristics:
${personality.personality?.traits?.map(trait => `- ${trait}`).join('\n') || ''}

Speech patterns:
${personality.personality?.speech_patterns?.map(pattern => `- ${pattern}`).join('\n') || ''}

Available functions:
${functions.map(func => `- ${func.name}: ${func.description}`).join('\n')}

Respond naturally and use function calls when appropriate to help the student learn and navigate the system.
`;
  }
}

// Export singleton instance
export const voiceFunctionManager = new VoiceFunctionManager();
export default voiceFunctionManager;