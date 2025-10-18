/**
 * MCP Connection Manager
 *
 * Manages on-demand connections to MCP servers for module assistant integrations.
 *
 * Features:
 * - Lazy loading - Only load MCP servers when tools are called
 * - Connection pooling - Reuse connections across requests
 * - Permission checks - Verify OAuth before execution
 * - Graceful fallbacks - Handle missing integrations
 * - Tool discovery - Expose available tools per module
 */

import { mcpRegistry } from './registry.js';
import { getUserConnections } from '../lib/userConnections.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * MCP Connection Manager Class
 */
export class MCPConnectionManager {
  constructor() {
    // Active MCP server instances { userId: { serviceName: serverInstance } }
    this.connections = new Map();

    // Tool execution cache { toolCallId: result }
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds

    // Connection idle timeout
    this.idleTimeout = 300000; // 5 minutes
    this.idleTimers = new Map();
  }

  /**
   * Get available tools for a module
   *
   * @param {string} moduleCode - Module code (e.g., "OS_01")
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of tool definitions with metadata
   */
  async getToolsForModule(moduleCode, userId) {
    const config = await this.getModuleIntegrationConfig(moduleCode);
    if (!config || !config.services) {
      return [];
    }

    const tools = [];
    const userConnections = await getUserConnections(userId);

    for (const service of config.services) {
      // Check if user has this integration connected
      const isConnected = userConnections.some(
        conn => conn.service === service.name && conn.status === 'connected'
      );

      // Get server tools
      const serverTools = await this.getServerTools(service.name);

      // Enrich tools with service metadata
      const enrichedTools = serverTools.map(tool => ({
        ...tool,
        service: service.name,
        servicePriority: service.priority,
        servicePurpose: service.purpose,
        suggestedUse: service.suggestedUse,
        isConnected,
        required: service.required || false
      }));

      // If not required or user has it connected, include tools
      if (!service.required || isConnected) {
        tools.push(...enrichedTools);
      } else {
        // Include but mark as unavailable if required but not connected
        tools.push(...enrichedTools.map(t => ({
          ...t,
          available: false,
          connectMessage: `Connect ${service.name} to use this tool`
        })));
      }
    }

    // Sort by priority: high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    tools.sort((a, b) => {
      const aPriority = priorityOrder[a.servicePriority] || 0;
      const bPriority = priorityOrder[b.servicePriority] || 0;
      return bPriority - aPriority;
    });

    return tools;
  }

  /**
   * Get tool definitions from an MCP server
   *
   * @param {string} serviceName - Service name (e.g., "notion")
   * @returns {Promise<Array>} Tool definitions
   */
  async getServerTools(serviceName) {
    const serverModule = mcpRegistry[serviceName];
    if (!serverModule) {
      console.warn(`[MCPManager] Unknown service: ${serviceName}`);
      return [];
    }

    try {
      const { tools } = await serverModule();
      return tools || [];
    } catch (error) {
      console.error(`[MCPManager] Error loading tools for ${serviceName}:`, error);
      return [];
    }
  }

  /**
   * Execute a tool from an MCP server
   *
   * @param {string} userId - User ID
   * @param {string} toolName - Tool name (e.g., "notion_create_page")
   * @param {object} parameters - Tool parameters
   * @param {object} context - Additional context (moduleCode, etc.)
   * @returns {Promise<object>} Tool execution result
   */
  async executeTool(userId, toolName, parameters = {}, context = {}) {
    // Check cache first
    const cacheKey = this.getCacheKey(userId, toolName, parameters);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`[MCPManager] Cache hit for ${toolName}`);
        return cached.result;
      }
      this.cache.delete(cacheKey);
    }

    // Determine which service this tool belongs to
    const serviceName = this.getServiceForTool(toolName);
    if (!serviceName) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    // Check if user has permission for this integration
    const hasPermission = await this.hasPermission(userId, serviceName);
    if (!hasPermission) {
      return {
        success: false,
        error: `Missing ${serviceName} connection`,
        action: {
          type: 'connect_integration',
          service: serviceName,
          message: `Connect ${serviceName} in Settings to use this feature`
        }
      };
    }

    try {
      // Get or create MCP server connection
      const server = await this.getOrCreateConnection(userId, serviceName);

      // Execute tool
      console.log(`[MCPManager] Executing ${toolName} for user ${userId}`);
      const result = await server.executeTool(toolName, parameters, context);

      // Cache result
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      // Reset idle timer
      this.resetIdleTimer(userId, serviceName);

      return result;
    } catch (error) {
      console.error(`[MCPManager] Tool execution failed:`, error);

      return {
        success: false,
        error: error.message,
        code: error.code || 'EXECUTION_ERROR',
        fallback: this.suggestFallback(toolName, parameters)
      };
    }
  }

  /**
   * Get or create MCP server connection (lazy loading)
   *
   * @param {string} userId - User ID
   * @param {string} serviceName - Service name
   * @returns {Promise<object>} MCP server instance
   */
  async getOrCreateConnection(userId, serviceName) {
    // Check if already connected
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Map());
    }

    const userConnections = this.connections.get(userId);

    if (userConnections.has(serviceName)) {
      console.log(`[MCPManager] Reusing connection to ${serviceName}`);
      return userConnections.get(serviceName);
    }

    // Lazy load MCP server
    console.log(`[MCPManager] Lazy loading ${serviceName} MCP server`);
    const serverModule = mcpRegistry[serviceName];
    if (!serverModule) {
      throw new Error(`MCP server not found: ${serviceName}`);
    }

    const { default: ServerClass } = await serverModule();
    const server = new ServerClass();

    // Get user's OAuth credentials
    const credentials = await this.getUserCredentials(userId, serviceName);

    // Connect server
    await server.connect(userId, credentials);

    // Store connection
    userConnections.set(serviceName, server);

    // Set idle timeout
    this.setIdleTimer(userId, serviceName);

    console.log(`[MCPManager] Connected to ${serviceName} for user ${userId}`);

    return server;
  }

  /**
   * Check if user has permission for integration
   *
   * @param {string} userId - User ID
   * @param {string} serviceName - Service name
   * @returns {Promise<boolean>}
   */
  async hasPermission(userId, serviceName) {
    try {
      const userConnections = await getUserConnections(userId);
      const connection = userConnections.find(
        conn => conn.service === serviceName
      );

      return connection && connection.status === 'connected';
    } catch (error) {
      console.error(`[MCPManager] Error checking permission:`, error);
      return false;
    }
  }

  /**
   * Get user's OAuth credentials for service
   *
   * @param {string} userId - User ID
   * @param {string} serviceName - Service name
   * @returns {Promise<object>} Credentials
   */
  async getUserCredentials(userId, serviceName) {
    const userConnections = await getUserConnections(userId);
    const connection = userConnections.find(
      conn => conn.service === serviceName
    );

    if (!connection || !connection.credentials) {
      throw new Error(`No credentials found for ${serviceName}`);
    }

    return connection.credentials;
  }

  /**
   * Determine which service a tool belongs to based on prefix
   *
   * @param {string} toolName - Tool name (e.g., "notion_create_page")
   * @returns {string|null} Service name
   */
  getServiceForTool(toolName) {
    const prefix = toolName.split('_')[0];

    const serviceMap = {
      notion: 'notion',
      github: 'github',
      figma: 'figma',
      drive: 'google-drive',
      calendar: 'google-calendar',
      gmail: 'gmail'
    };

    return serviceMap[prefix] || null;
  }

  /**
   * Get module integration configuration
   *
   * @param {string} moduleCode - Module code (e.g., "OS_01", "DS_103")
   * @returns {Promise<object>} Integration config with services array
   */
  async getModuleIntegrationConfig(moduleCode) {
    try {
      // Load JSON config using readFileSync for better compatibility
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const configPath = join(__dirname, 'config', 'moduleIntegrations.json');

      const configData = readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);

      // Try exact match first (e.g., OS_01)
      if (config.integrations[moduleCode]) {
        return config.integrations[moduleCode];
      }

      // Try discipline-level fallback (e.g., DS_* for DS_103)
      const discipline = moduleCode.split('_')[0]; // Extract "DS" from "DS_103"
      if (config.integrations[discipline]) {
        return {
          ...config.integrations[discipline],
          moduleCode // Override with actual module code
        };
      }

      // Return fallback config
      console.log(`[MCPManager] Using fallback config for ${moduleCode}`);
      return config.fallbackConfig;
    } catch (error) {
      console.error('[MCPManager] Error loading module config:', error);
      return null;
    }
  }

  /**
   * Check if user is connected to integration
   *
   * @param {string} userId - User ID
   * @param {string} serviceName - Service name
   * @returns {Promise<boolean>}
   */
  async isConnected(userId, serviceName) {
    return this.hasPermission(userId, serviceName);
  }

  /**
   * Disconnect MCP server
   *
   * @param {string} userId - User ID
   * @param {string} serviceName - Service name
   */
  async disconnect(userId, serviceName) {
    if (!this.connections.has(userId)) {
      return;
    }

    const userConnections = this.connections.get(userId);
    const server = userConnections.get(serviceName);

    if (server) {
      console.log(`[MCPManager] Disconnecting ${serviceName} for user ${userId}`);

      if (typeof server.disconnect === 'function') {
        await server.disconnect();
      }

      userConnections.delete(serviceName);

      // Clear idle timer
      this.clearIdleTimer(userId, serviceName);
    }
  }

  /**
   * Disconnect all MCP servers for user
   *
   * @param {string} userId - User ID
   */
  async disconnectAll(userId) {
    if (!this.connections.has(userId)) {
      return;
    }

    const userConnections = this.connections.get(userId);
    const services = Array.from(userConnections.keys());

    for (const serviceName of services) {
      await this.disconnect(userId, serviceName);
    }

    this.connections.delete(userId);
  }

  /**
   * Set idle timer to auto-disconnect
   */
  setIdleTimer(userId, serviceName) {
    const key = `${userId}:${serviceName}`;

    this.idleTimers.set(key, setTimeout(() => {
      console.log(`[MCPManager] Idle timeout for ${serviceName}, disconnecting`);
      this.disconnect(userId, serviceName);
    }, this.idleTimeout));
  }

  /**
   * Reset idle timer (called on tool execution)
   */
  resetIdleTimer(userId, serviceName) {
    const key = `${userId}:${serviceName}`;

    if (this.idleTimers.has(key)) {
      clearTimeout(this.idleTimers.get(key));
    }

    this.setIdleTimer(userId, serviceName);
  }

  /**
   * Clear idle timer
   */
  clearIdleTimer(userId, serviceName) {
    const key = `${userId}:${serviceName}`;

    if (this.idleTimers.has(key)) {
      clearTimeout(this.idleTimers.get(key));
      this.idleTimers.delete(key);
    }
  }

  /**
   * Generate cache key for tool execution
   */
  getCacheKey(userId, toolName, parameters) {
    const paramsStr = JSON.stringify(parameters);
    return `${userId}:${toolName}:${paramsStr}`;
  }

  /**
   * Suggest fallback for failed tool execution
   */
  suggestFallback(toolName, parameters) {
    // Map tools to fallback actions
    const fallbacks = {
      notion_create_page: 'save_to_knowledge_base',
      github_create_repo: null, // No fallback
      figma_create_file: null,
      drive_upload_file: 'save_locally',
      calendar_create_event: 'add_to_todos'
    };

    return fallbacks[toolName] || null;
  }

  /**
   * Clear all caches (useful for testing)
   */
  clearCaches() {
    this.cache.clear();
  }

  /**
   * Get connection stats
   */
  getStats() {
    const totalConnections = Array.from(this.connections.values())
      .reduce((sum, userConns) => sum + userConns.size, 0);

    return {
      totalUsers: this.connections.size,
      totalConnections,
      cacheSize: this.cache.size,
      activeTimers: this.idleTimers.size
    };
  }
}

// Singleton instance
let managerInstance = null;

/**
 * Get singleton instance of MCP Connection Manager
 */
export function getMCPManager() {
  if (!managerInstance) {
    managerInstance = new MCPConnectionManager();
  }
  return managerInstance;
}

export default MCPConnectionManager;
