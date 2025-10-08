/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GitHub OAuth provider
 */

import logger from '../../../src/shared/lib/logger.js';
import { PROVIDERS, getClientId, getRedirectUri } from '../config.js';

/**
 * Build GitHub OAuth authorization URL
 */
export function buildAuthUrl(req, state) {
  const config = PROVIDERS.github;
  const clientId = getClientId('github');
  const redirectUri = getRedirectUri(req, 'github');

  const authUrl = `${config.authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scope)}&state=${encodeURIComponent(state)}`;

  logger.info('GitHub OAuth start', { redirectUri });
  return authUrl;
}

/**
 * Test GitHub connection
 */
export async function testConnection(connection) {
  if (connection.type !== 'oauth') {
    throw new Error('GitHub requires OAuth connection');
  }

  const response = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `token ${connection.accessToken}` },
  });

  const userData = await response.json();
  return {
    connected: true,
    service: 'github',
    info: {
      username: userData.login,
      name: userData.name,
    },
  };
}
