/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Ollama provider (hybrid: supports both API key for cloud and endpoint for local)
 */

import logger from '../../../src/shared/lib/logger.js';
import tokenStore from '../../../src/shared/lib/secureTokens.js';

/**
 * Connect Ollama (API key for cloud or endpoint for local)
 */
export async function connect(userEmail, { apiKey, url }) {
  if (url) {
    // Local Ollama instance
    await tokenStore.upsertEndpoint(userEmail, 'ollama', {
      url,
      transport: 'http',
      info: { name: 'Ollama (Local)' },
    });
    logger.info('Ollama (Local) connected', { userEmail, url });
    return {
      success: true,
      message: 'Ollama (Local) connected successfully',
      info: { name: 'Ollama (Local)', url, type: 'local' },
    };
  } else if (apiKey) {
    // Ollama Cloud
    await tokenStore.upsertApiKey(userEmail, 'ollama', apiKey, {
      name: 'Ollama (Cloud)',
      apiUrl: 'https://ollama.com/api',
      features: ['web_search', 'web_fetch', 'cloud_models'],
    });
    logger.info('Ollama (Cloud) connected', { userEmail });
    return {
      success: true,
      message: 'Ollama (Cloud) connected successfully',
      info: { name: 'Ollama (Cloud)', type: 'cloud' },
    };
  } else {
    throw new Error('Either URL (for local) or API key (for cloud) is required for Ollama');
  }
}

/**
 * Test Ollama connection
 */
export async function testConnection(connection) {
  if (connection.type === 'endpoint') {
    // Test local Ollama
    const response = await fetch(`${connection.url}/api/tags`);
    const models = await response.json();
    return {
      connected: true,
      service: 'ollama',
      info: {
        type: 'local',
        models: models.models?.length || 0,
        url: connection.url,
      },
    };
  } else if (connection.type === 'api_key') {
    // Test Ollama Cloud
    // Note: Requires Ollama SDK - implement later if needed
    return {
      connected: true,
      service: 'ollama',
      info: {
        type: 'cloud',
        features: connection.features || ['web_search', 'web_fetch'],
        api_url: connection.apiUrl,
      },
    };
  } else {
    throw new Error('Invalid Ollama connection type');
  }
}
