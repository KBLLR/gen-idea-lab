/**
 * Notion MCP Server
 *
 * Handles Notion integration for module assistants.
 * Provides tools for creating pages, databases, and managing knowledge bases.
 */

import { MCPServer } from '../../base.js';
import { notionTools } from './tools.js';
import { NotionClient } from './client.js';

/**
 * Notion MCP Server Class
 */
export class NotionMCPServer extends MCPServer {
  constructor(config = {}) {
    super('notion', notionTools, config);
  }

  /**
   * Connect to Notion with user's OAuth credentials
   *
   * @param {string} userId - User ID
   * @param {object} credentials - OAuth credentials with accessToken
   */
  async connect(userId, credentials) {
    try {
      if (!credentials || !credentials.accessToken) {
        throw new Error('Missing Notion access token');
      }

      this.userId = userId;
      this.client = new NotionClient(credentials.accessToken);
      this.connected = true;

      console.log(`[NotionMCP] Connected for user ${userId}`);

      return { success: true };
    } catch (error) {
      console.error('[NotionMCP] Connection error:', error);
      throw error;
    }
  }

  /**
   * Execute a Notion tool
   *
   * @param {string} toolName - Tool name
   * @param {object} parameters - Tool parameters
   * @param {object} context - Additional context (moduleCode, etc.)
   */
  async executeTool(toolName, parameters, context = {}) {
    if (!this.connected || !this.client) {
      throw new Error('Notion client not connected');
    }

    try {
      let result;

      switch (toolName) {
        case 'notion_create_page':
          result = await this.client.createPage(parameters);
          this.logExecution(toolName, parameters, result);
          return result;

        case 'notion_append_content':
          result = await this.client.appendContent(parameters);
          this.logExecution(toolName, parameters, result);
          return result;

        case 'notion_search_pages':
          result = await this.client.searchPages(parameters);
          this.logExecution(toolName, parameters, result);
          return result;

        case 'notion_create_database':
          result = await this.client.createDatabase(parameters);
          this.logExecution(toolName, parameters, result);
          return result;

        case 'notion_get_page':
          result = await this.client.getPage(parameters);
          this.logExecution(toolName, parameters, result);
          return result;

        case 'notion_update_page':
          result = await this.client.updatePage(parameters);
          this.logExecution(toolName, parameters, result);
          return result;

        default:
          throw new Error(`Unknown Notion tool: ${toolName}`);
      }
    } catch (error) {
      return this.handleError(error, toolName);
    }
  }

  /**
   * Disconnect from Notion
   */
  async disconnect() {
    this.client = null;
    this.connected = false;
    this.userId = null;

    console.log('[NotionMCP] Disconnected');
  }
}

// Export server class and tools for registry
export default NotionMCPServer;
export const tools = notionTools;
