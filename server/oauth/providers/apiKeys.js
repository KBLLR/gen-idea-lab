/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * API key-based providers (OpenAI, Claude, Gemini)
 */

import logger from '../../../src/shared/lib/logger.js';
import tokenStore from '../../../src/shared/lib/secureTokens.js';

/**
 * Connect an API key-based service
 */
export async function connect(userEmail, service, apiKey) {
  if (!apiKey) {
    throw new Error(`API key is required for ${service}`);
  }

  const serviceNames = {
    openai: 'OpenAI',
    claude: 'Claude (Anthropic)',
    gemini: 'Gemini',
  };

  await tokenStore.upsertApiKey(userEmail, service, apiKey, {
    name: serviceNames[service] || service,
  });

  logger.info(`${service} connected`, { userEmail });

  return {
    success: true,
    message: `${serviceNames[service] || service} connected successfully`,
  };
}

/**
 * Test API key-based connection (placeholder - actual testing requires API calls)
 */
export async function testConnection(connection, service) {
  if (connection.type !== 'api_key') {
    throw new Error(`${service} requires API key connection`);
  }

  // For now, just return connected status
  // TODO: Implement actual API key validation per service
  return {
    connected: true,
    service,
    info: {
      name: connection.info?.name || service,
    },
  };
}
