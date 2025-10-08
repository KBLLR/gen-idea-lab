/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DrawThings provider (endpoint-based, local GPU service)
 */

import logger from '../../../src/shared/lib/logger.js';
import tokenStore from '../../../src/shared/lib/secureTokens.js';
import { sanitizeEndpointUrl } from '../../config/env.js';

/**
 * Connect DrawThings (endpoint-based)
 */
export async function connect(userEmail, { url, transport }) {
  const endpoint = sanitizeEndpointUrl(url);
  if (!endpoint) {
    throw new Error('Endpoint URL is required for DrawThings');
  }

  const rawTransport = (transport || '').toString().toLowerCase();
  const inferredTransport = endpoint.startsWith('grpc') ? 'grpc' : 'http';
  const finalTransport = ['http', 'grpc'].includes(rawTransport) ? rawTransport : inferredTransport;

  const connectionName = finalTransport === 'grpc' ? 'DrawThings (gRPC)' : 'DrawThings (HTTP)';

  await tokenStore.upsertEndpoint(userEmail, 'drawthings', {
    url: endpoint,
    transport: finalTransport,
    info: { name: connectionName },
  });

  logger.info('DrawThings connected', { userEmail, url: endpoint, transport: finalTransport });

  return {
    success: true,
    message: 'DrawThings connected successfully',
    info: {
      name: connectionName,
      transport: finalTransport,
      url: endpoint,
    },
  };
}

/**
 * Test DrawThings connection
 */
export async function testConnection(connection) {
  if (connection.type !== 'endpoint') {
    throw new Error('DrawThings requires endpoint connection');
  }

  return {
    connected: true,
    service: 'drawthings',
    info: {
      type: 'local',
      transport: connection.transport || 'http',
      url: connection.url,
    },
  };
}
