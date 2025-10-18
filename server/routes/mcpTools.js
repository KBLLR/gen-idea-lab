/**
 * MCP Tools API Routes
 *
 * Exposes MCP integration tools to module assistants.
 * Handles tool discovery and execution with permission checks.
 */

import express from 'express';
import { getMCPManager } from '../mcp/manager.js';

const router = express.Router();
const mcpManager = getMCPManager();

/**
 * Get available tools for a module
 *
 * GET /api/mcp/tools/:moduleCode
 *
 * Returns tools available for this module based on:
 * - Module's integration configuration
 * - User's connected services
 * - Tool priorities
 */
router.get('/tools/:moduleCode', async (req, res) => {
  try {
    const { moduleCode } = req.params;
    const userId = req.session?.userId || 'anonymous';

    console.log(`[MCP API] Getting tools for module ${moduleCode}, user ${userId}`);

    const tools = await mcpManager.getToolsForModule(moduleCode, userId);

    // Organize tools by service for easier UI rendering
    const toolsByService = tools.reduce((acc, tool) => {
      if (!acc[tool.service]) {
        acc[tool.service] = {
          serviceName: tool.service,
          priority: tool.servicePriority,
          purpose: tool.servicePurpose,
          suggestedUse: tool.suggestedUse,
          isConnected: tool.isConnected,
          tools: []
        };
      }
      acc[tool.service].tools.push({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        available: tool.available !== false
      });
      return acc;
    }, {});

    res.json({
      success: true,
      moduleCode,
      tools,
      toolsByService,
      totalTools: tools.length,
      connectedServices: Object.values(toolsByService).filter(s => s.isConnected).length
    });
  } catch (error) {
    console.error('[MCP API] Error getting tools:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute an MCP tool
 *
 * POST /api/mcp/execute
 *
 * Body:
 * {
 *   toolName: string,
 *   parameters: object,
 *   context: {
 *     moduleCode: string,
 *     conversationId: string,
 *     ...
 *   }
 * }
 */
router.post('/execute', async (req, res) => {
  try {
    const { toolName, parameters, context = {} } = req.body;
    const userId = req.session?.userId || 'anonymous';

    if (!toolName) {
      return res.status(400).json({
        success: false,
        error: 'Tool name is required'
      });
    }

    console.log(`[MCP API] Executing tool ${toolName} for user ${userId}`);
    console.log(`[MCP API] Parameters:`, parameters);
    console.log(`[MCP API] Context:`, context);

    const result = await mcpManager.executeTool(
      userId,
      toolName,
      parameters,
      context
    );

    res.json(result);
  } catch (error) {
    console.error('[MCP API] Error executing tool:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'EXECUTION_ERROR'
    });
  }
});

/**
 * Get module integration configuration
 *
 * GET /api/mcp/config/:moduleCode
 *
 * Returns the integration configuration for a module
 */
router.get('/config/:moduleCode', async (req, res) => {
  try {
    const { moduleCode } = req.params;

    console.log(`[MCP API] Getting integration config for ${moduleCode}`);

    const config = await mcpManager.getModuleIntegrationConfig(moduleCode);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: `No integration config found for module ${moduleCode}`
      });
    }

    res.json({
      success: true,
      moduleCode,
      config
    });
  } catch (error) {
    console.error('[MCP API] Error getting config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get user's connected services
 *
 * GET /api/mcp/connections
 *
 * Returns list of services the user has connected
 */
router.get('/connections', async (req, res) => {
  try {
    const userId = req.session?.userId || 'anonymous';

    // Import getUserConnections dynamically to avoid circular deps
    const { getUserConnections } = await import('../lib/userConnections.js');
    const connections = await getUserConnections(userId);

    res.json({
      success: true,
      connections: connections.map(conn => ({
        service: conn.service,
        status: conn.status,
        connectedAt: conn.connectedAt,
        lastUsed: conn.lastUsed
      }))
    });
  } catch (error) {
    console.error('[MCP API] Error getting connections:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get MCP manager statistics
 *
 * GET /api/mcp/stats
 *
 * Returns connection pool stats (for debugging)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = mcpManager.getStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('[MCP API] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Disconnect from an MCP service
 *
 * POST /api/mcp/disconnect/:service
 *
 * Disconnects the MCP server connection for a service
 */
router.post('/disconnect/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const userId = req.session?.userId || 'anonymous';

    console.log(`[MCP API] Disconnecting ${service} for user ${userId}`);

    await mcpManager.disconnect(userId, service);

    res.json({
      success: true,
      message: `Disconnected from ${service}`
    });
  } catch (error) {
    console.error('[MCP API] Error disconnecting:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check endpoint
 *
 * GET /api/mcp/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    manager: 'initialized'
  });
});

export default router;
