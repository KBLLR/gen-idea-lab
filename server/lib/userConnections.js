/**
 * Centralized user connections store
 * Keeps state in-memory for dev; can be wired to Redis or MongoDB later
 *
 * This manages OAuth connections for MCP integrations (Notion, GitHub, Figma, etc.)
 * and AI service connections (OpenAI, Claude, Gemini, Ollama).
 */

// In-memory store: Map<userId, Array<connectionObject>>
const userConnections = new Map();

/**
 * Get user's connected services as array
 *
 * @param {string} userId - User ID
 * @returns {Array} Array of connection objects
 *
 * Format:
 * [
 *   {
 *     service: 'notion',
 *     status: 'connected',
 *     connectedAt: '2025-10-18T...',
 *     credentials: { accessToken: '...', refreshToken: '...' }
 *   }
 * ]
 */
export function getUserConnections(userId) {
  if (!userConnections.has(userId)) {
    // Initialize empty connections array for new user
    userConnections.set(userId, []);
  }
  return userConnections.get(userId);
}

/**
 * Save or update user connection
 *
 * @param {string} userId - User ID
 * @param {string} service - Service name (e.g., 'notion', 'github')
 * @param {object} credentials - OAuth credentials { accessToken, refreshToken, ... }
 * @param {string} status - Connection status ('connected', 'expired', 'error')
 * @returns {object} Saved connection object
 */
export function saveUserConnection(userId, service, credentials, status = 'connected') {
  const connections = getUserConnections(userId);

  // Remove existing connection for this service
  const filtered = connections.filter(conn => conn.service !== service);

  // Add new connection
  const connection = {
    service,
    status,
    connectedAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    credentials
  };

  filtered.push(connection);
  userConnections.set(userId, filtered);

  console.log(`[UserConnections] Saved ${service} connection for user ${userId}`);

  return connection;
}

/**
 * Remove user connection (disconnect)
 *
 * @param {string} userId - User ID
 * @param {string} service - Service name
 * @returns {boolean} Success status
 */
export function removeUserConnection(userId, service) {
  const connections = getUserConnections(userId);

  const filtered = connections.filter(conn => conn.service !== service);

  if (filtered.length < connections.length) {
    userConnections.set(userId, filtered);
    console.log(`[UserConnections] Removed ${service} connection for user ${userId}`);
    return true;
  }

  return false;
}

/**
 * Check if user has active connection to service
 *
 * @param {string} userId - User ID
 * @param {string} service - Service name
 * @returns {boolean}
 */
export function hasConnection(userId, service) {
  const connections = getUserConnections(userId);
  return connections.some(
    conn => conn.service === service && conn.status === 'connected'
  );
}

/**
 * Get specific connection by service name
 *
 * @param {string} userId - User ID
 * @param {string} service - Service name
 * @returns {object|null} Connection object or null
 */
export function getConnection(userId, service) {
  const connections = getUserConnections(userId);
  return connections.find(conn => conn.service === service) || null;
}

/**
 * Update connection last used timestamp
 *
 * @param {string} userId - User ID
 * @param {string} service - Service name
 */
export function updateConnectionLastUsed(userId, service) {
  const connections = getUserConnections(userId);
  const connection = connections.find(conn => conn.service === service);

  if (connection) {
    connection.lastUsed = new Date().toISOString();
  }
}

/**
 * Get all connections for all users (admin/debugging)
 *
 * @returns {Map} All connections
 */
export function getAllConnections() {
  return userConnections;
}

/**
 * Clear all connections for a user
 *
 * @param {string} userId - User ID
 */
export function clearUserConnections(userId) {
  userConnections.delete(userId);
  console.log(`[UserConnections] Cleared all connections for user ${userId}`);
}

export default {
  getUserConnections,
  saveUserConnection,
  removeUserConnection,
  hasConnection,
  getConnection,
  updateConnectionLastUsed,
  getAllConnections,
  clearUserConnections
};
