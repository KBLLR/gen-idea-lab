/**
 * Base MCP Server Class
 *
 * Abstract base class for all MCP servers.
 * Provides common functionality and defines the interface.
 */

/**
 * Base MCP Server
 */
export class MCPServer {
  constructor(serviceName, tools = [], config = {}) {
    this.serviceName = serviceName;
    this.tools = tools;
    this.config = config;
    this.client = null;
    this.connected = false;
  }

  /**
   * Connect to the external service
   * Must be implemented by subclasses
   *
   * @param {string} userId - User ID
   * @param {object} credentials - OAuth credentials
   */
  async connect(userId, credentials) {
    throw new Error('connect() must be implemented by subclass');
  }

  /**
   * Execute a tool
   * Must be implemented by subclasses
   *
   * @param {string} toolName - Tool name
   * @param {object} parameters - Tool parameters
   * @param {object} context - Additional context
   * @returns {Promise<object>} Tool result
   */
  async executeTool(toolName, parameters, context) {
    throw new Error('executeTool() must be implemented by subclass');
  }

  /**
   * Disconnect from the service
   * Optional - override if cleanup needed
   */
  async disconnect() {
    this.connected = false;
    this.client = null;
  }

  /**
   * Get tool definitions
   */
  getTools() {
    return this.tools;
  }

  /**
   * Validate tool parameters
   */
  validateParameters(toolDefinition, parameters) {
    const required = toolDefinition.parameters.required || [];

    for (const param of required) {
      if (!(param in parameters)) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    }

    return true;
  }

  /**
   * Handle errors gracefully
   */
  handleError(error, toolName) {
    console.error(`[${this.serviceName}] Error in ${toolName}:`, error);

    return {
      success: false,
      error: error.message,
      code: error.code || 'TOOL_ERROR',
      service: this.serviceName,
      tool: toolName
    };
  }

  /**
   * Log tool execution
   */
  logExecution(toolName, parameters, result) {
    console.log(`[${this.serviceName}] ${toolName}:`, {
      params: Object.keys(parameters),
      success: result.success !== false,
      timestamp: new Date().toISOString()
    });
  }
}

export default MCPServer;
