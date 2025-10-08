/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Figma OAuth provider
 */

import logger from '../../../src/shared/lib/logger.js';
import { PROVIDERS, getClientId, getRedirectUri } from '../config.js';

/**
 * Build Figma OAuth authorization URL
 */
export function buildAuthUrl(req, state) {
  const config = PROVIDERS.figma;
  const clientId = getClientId('figma');
  const redirectUri = getRedirectUri(req, 'figma');

  const authUrl = `${config.authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scope)}&response_type=code&state=${encodeURIComponent(state)}`;

  logger.info('Figma OAuth start', { redirectUri });
  return authUrl;
}

/**
 * Test Figma connection
 */
export async function testConnection(connection) {
  if (connection.type !== 'oauth') {
    throw new Error('Figma requires OAuth connection');
  }

  // Figma API test - get user info
  const response = await fetch('https://api.figma.com/v1/me', {
    headers: { 'Authorization': `Bearer ${connection.accessToken}` },
  });

  const userData = await response.json();
  return {
    connected: true,
    service: 'figma',
    info: {
      name: userData.handle || userData.email,
    },
  };
}
