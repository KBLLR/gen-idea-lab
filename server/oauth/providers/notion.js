/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Notion OAuth provider
 */

import logger from '../../../src/shared/lib/logger.js';
import { PROVIDERS, getClientId, getRedirectUri } from '../config.js';

/**
 * Build Notion OAuth authorization URL
 */
export function buildAuthUrl(req, state) {
  const config = PROVIDERS.notion;
  const clientId = getClientId('notion');
  const redirectUri = getRedirectUri(req, 'notion');

  const authUrl = `${config.authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${encodeURIComponent(state)}&owner=user`;

  logger.info('Notion OAuth start', { redirectUri });
  return authUrl;
}

/**
 * Test Notion connection
 */
export async function testConnection(connection) {
  if (connection.type !== 'oauth') {
    throw new Error('Notion requires OAuth connection');
  }

  const response = await fetch('https://api.notion.com/v1/users/me', {
    headers: {
      'Authorization': `Bearer ${connection.accessToken}`,
      'Notion-Version': '2022-06-28',
    },
  });

  const userData = await response.json();
  return {
    connected: true,
    service: 'notion',
    info: {
      name: userData.name,
      type: userData.type,
    },
  };
}
