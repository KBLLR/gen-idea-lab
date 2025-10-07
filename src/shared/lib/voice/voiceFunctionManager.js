/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getVoicePersonality, getAvailableTools } from './voicePersonalities.js';
import useStore from '../store.js';

/**
 * Voice Function Call Manager
 * Handles function calling for voice interactions with different module personalities
 * Integrates workflow tools and assistant tools for robust voice interactions
 */
export class VoiceFunctionManager {
  constructor() {
    this.functions = new Map();
    this.pendingCalls = new Map(); // Track pending tool calls
    this.callHistory = []; // Track call history for debugging
    this.maxRetries = 3;
    this.retryDelay = 1000; // ms

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
   * Execute a function call with retry logic and integration with workflow/assistant tools
   */
  async executeFunction(functionName, args, context = {}, callId = null) {
    const startTime = Date.now();
    let attempt = 0;
    let lastError = null;

    // Track this call
    if (callId) {
      this.pendingCalls.set(callId, {
        functionName,
        args,
        context,
        startTime,
        status: 'executing'
      });
    }

    // Try local function first
    const functionDef = this.functions.get(functionName);

    if (functionDef) {
      try {
        const result = await functionDef.handler(args, context);

        // Record successful call
        this.recordCall(callId, functionName, args, result, Date.now() - startTime);

        // Dispatch event for UI updates
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

        if (callId) this.pendingCalls.delete(callId);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`[VoiceFunctionManager] Local function ${functionName} failed:`, error);
      }
    }

    // Try workflow tools
    try {
      const { executeTool } = await import('../workflowTools.js');
      const result = await this.executeWithRetry(
        () => executeTool(functionName, args),
        this.maxRetries
      );

      this.recordCall(callId, functionName, args, result, Date.now() - startTime);
      if (callId) this.pendingCalls.delete(callId);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`[VoiceFunctionManager] Workflow tool ${functionName} failed:`, error);
    }

    // Try assistant tools
    try {
const { executeAssistantTool } = await import("../assistant/tools.js");
      const state = useStore.getState();
      const assistantContext = {
        moduleId: state.activeModuleId,
        userId: state.user?.email || 'anonymous',
        conversationId: context.conversationId || `voice_${Date.now()}`
      };

      const result = await this.executeWithRetry(
        () => executeAssistantTool(functionName, args, assistantContext),
        this.maxRetries
      );

      this.recordCall(callId, functionName, args, result, Date.now() - startTime);
      if (callId) this.pendingCalls.delete(callId);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`[VoiceFunctionManager] Assistant tool ${functionName} failed:`, error);
    }

    // All attempts failed
    const errorResult = {
      success: false,
      error: `Function ${functionName} not found or failed to execute: ${lastError?.message || 'Unknown error'}`
    };

    this.recordCall(callId, functionName, args, errorResult, Date.now() - startTime);
    if (callId) this.pendingCalls.delete(callId);
    return errorResult;
  }

  /**
   * Execute with retry logic
   */
  async executeWithRetry(fn, maxRetries = 3) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        console.warn(`[VoiceFunctionManager] Attempt ${attempt + 1}/${maxRetries} failed:`, error.message);

        if (attempt < maxRetries - 1) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Record function call for debugging and analytics
   */
  recordCall(callId, functionName, args, result, duration) {
    const record = {
      callId,
      functionName,
      args,
      result,
      duration,
      timestamp: Date.now(),
      success: result.success !== false
    };

    this.callHistory.push(record);

    // Keep only last 100 calls
    if (this.callHistory.length > 100) {
      this.callHistory = this.callHistory.slice(-100);
    }

    console.log(`[VoiceFunctionManager] ${functionName} completed in ${duration}ms:`, result);
  }

  /**
   * Get call statistics
   */
  getCallStats() {
    const stats = {
      totalCalls: this.callHistory.length,
      successfulCalls: this.callHistory.filter(c => c.success).length,
      failedCalls: this.callHistory.filter(c => !c.success).length,
      averageDuration: 0,
      functionBreakdown: {}
    };

    if (this.callHistory.length > 0) {
      stats.averageDuration = this.callHistory.reduce((sum, c) => sum + c.duration, 0) / this.callHistory.length;

      this.callHistory.forEach(call => {
        if (!stats.functionBreakdown[call.functionName]) {
          stats.functionBreakdown[call.functionName] = { count: 0, successes: 0, failures: 0 };
        }
        stats.functionBreakdown[call.functionName].count++;
        if (call.success) {
          stats.functionBreakdown[call.functionName].successes++;
        } else {
          stats.functionBreakdown[call.functionName].failures++;
        }
      });
    }

    return stats;
  }

  /**
   * Clear call history
   */
  clearHistory() {
    this.callHistory = [];
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

  /**
   * Get all available tools including workflow and assistant tools
   */
  async getAllAvailableTools(context = {}) {
    const tools = [];

    // Get local functions
    const localFunctions = this.getAvailableFunctions(context);
    tools.push(...localFunctions);

    // Get workflow tools
    try {
      const { WORKFLOW_TOOLS } = await import('../workflowTools.js');
      Object.values(WORKFLOW_TOOLS).forEach(tool => {
        // Avoid duplicates
        if (!tools.find(t => t.name === tool.name)) {
          tools.push({
            name: tool.name,
            description: tool.description,
            parameters: this.convertToGeminiLiveFormat(tool.parameters)
          });
        }
      });
    } catch (error) {
      console.warn('[VoiceFunctionManager] Could not load workflow tools:', error);
    }

    // Get assistant tools
    try {
      const { ASSISTANT_TOOLS } = await import('../assistantTools.js');
      Object.values(ASSISTANT_TOOLS).forEach(tool => {
        // Avoid duplicates
        if (!tools.find(t => t.name === tool.name)) {
          tools.push({
            name: tool.name,
            description: tool.description,
            parameters: this.convertToGeminiLiveFormat(tool.parameters)
          });
        }
      });
    } catch (error) {
      console.warn('[VoiceFunctionManager] Could not load assistant tools:', error);
    }

    console.log(`[VoiceFunctionManager] Loaded ${tools.length} total tools`);
    return tools;
  }

  /**
   * Convert tool parameters to Gemini Live API format
   */
  convertToGeminiLiveFormat(parameters) {
    if (!parameters || !parameters.properties) {
      return parameters;
    }

    const converted = {
      type: 'OBJECT',
      properties: {},
      required: parameters.required || []
    };

    Object.entries(parameters.properties).forEach(([name, param]) => {
      converted.properties[name] = {
        type: this.normalizeType(param.type),
        description: param.description || ''
      };

      // Handle array items schema
      if (param.type === 'array' && param.items) {
        converted.properties[name].items = this.convertItemSchema(param.items);
      }

      // Handle object properties schema
      if (param.type === 'object' && param.properties) {
        converted.properties[name].properties = {};
        Object.entries(param.properties).forEach(([propName, propSchema]) => {
          converted.properties[name].properties[propName] = {
            type: this.normalizeType(propSchema.type),
            description: propSchema.description || ''
          };
        });
      }

      if (param.enum) {
        converted.properties[name].enum = param.enum;
      }

      if (param.default !== undefined) {
        converted.properties[name].default = param.default;
      }
    });

    return converted;
  }

  /**
   * Convert array items schema to Gemini Live API format
   */
  convertItemSchema(items) {
    if (!items) return undefined;

    // Simple type
    if (typeof items.type === 'string') {
      const converted = {
        type: this.normalizeType(items.type),
      };

      if (items.description) {
        converted.description = items.description;
      }

      if (items.enum) {
        converted.enum = items.enum;
      }

      // Nested object in array
      if (items.type === 'object' && items.properties) {
        converted.properties = {};
        Object.entries(items.properties).forEach(([name, prop]) => {
          converted.properties[name] = {
            type: this.normalizeType(prop.type),
            description: prop.description || ''
          };

          if (prop.enum) {
            converted.properties[name].enum = prop.enum;
          }
        });

        if (items.required) {
          converted.required = items.required;
        }
      }

      return converted;
    }

    // Already formatted
    return items;
  }

  /**
   * Normalize type names to Gemini Live API format
   */
  normalizeType(type) {
    const typeMap = {
      'string': 'STRING',
      'number': 'NUMBER',
      'integer': 'NUMBER',
      'boolean': 'BOOLEAN',
      'array': 'ARRAY',
      'object': 'OBJECT'
    };

    return typeMap[type.toLowerCase()] || type.toUpperCase();
  }

  /**
   * Get pending calls count
   */
  getPendingCallsCount() {
    return this.pendingCalls.size;
  }

  /**
   * Cancel a pending call
   */
  cancelCall(callId) {
    if (this.pendingCalls.has(callId)) {
      this.pendingCalls.delete(callId);
      console.log(`[VoiceFunctionManager] Cancelled call ${callId}`);
      return true;
    }
    return false;
  }

  /**
   * Cancel all pending calls
   */
  cancelAllCalls() {
    const count = this.pendingCalls.size;
    this.pendingCalls.clear();
    console.log(`[VoiceFunctionManager] Cancelled ${count} pending calls`);
    return count;
  }
}

// Export singleton instance
export const voiceFunctionManager = new VoiceFunctionManager();
export default voiceFunctionManager;