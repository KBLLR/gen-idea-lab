/**
 * MCP Server Registry
 *
 * Central registry for all MCP servers with lazy loading.
 * Each entry is a dynamic import function that loads the server on-demand.
 */

/**
 * MCP Server Registry
 * Maps service names to their loader functions
 */
export const mcpRegistry = {
  /**
   * Notion MCP Server
   * Tools: create_page, append_content, search_pages, create_database
   */
  notion: () => import('./servers/notion/index.js'),

  /**
   * GitHub MCP Server
   * Tools: create_repo, review_code, create_issue, analyze_commits
   */
  github: () => import('./servers/github/index.js'),

  /**
   * Figma MCP Server
   * Tools: create_file, review_design, add_comment, export_assets
   */
  figma: () => import('./servers/figma/index.js'),

  /**
   * Google Drive MCP Server
   * Tools: create_folder, upload_file, share_file
   */
  'google-drive': () => import('./servers/google-drive/index.js'),

  /**
   * Google Calendar MCP Server
   * Tools: create_event, find_availability
   */
  'google-calendar': () => import('./servers/google-calendar/index.js'),

  /**
   * Gmail MCP Server
   * Tools: send_email, draft_email
   */
  gmail: () => import('./servers/gmail/index.js'),
};

/**
 * Get list of available MCP servers
 */
export function getAvailableServers() {
  return Object.keys(mcpRegistry);
}

/**
 * Check if MCP server exists
 */
export function hasServer(serviceName) {
  return serviceName in mcpRegistry;
}

export default mcpRegistry;
