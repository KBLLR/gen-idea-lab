/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Google OAuth provider (Drive, Photos, Calendar, Gmail)
 */

import logger from '../../../src/shared/lib/logger.js';
import { PROVIDERS, getClientId, getRedirectUri } from '../config.js';

/**
 * Build Google OAuth authorization URL
 * @param {string} service - One of: googleDrive, googlePhotos, googleCalendar, gmail
 */
export function buildAuthUrl(req, service, state) {
  const config = PROVIDERS[service];
  if (!config || !config.usesGoogleCreds) {
    throw new Error(`Invalid Google service: ${service}`);
  }

  const clientId = getClientId(service);
  const redirectUri = getRedirectUri(req, service);

  const authUrl = `${config.authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scope)}&response_type=code&state=${encodeURIComponent(state)}&access_type=offline`;

  logger.info(`${service} OAuth start`, { redirectUri });
  return authUrl;
}

/**
 * Test Google service connection
 */
export async function testConnection(connection, service) {
  if (connection.type !== 'oauth') {
    throw new Error(`${service} requires OAuth connection`);
  }

  // Google services share user info endpoint
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${connection.accessToken}` },
  });

  const userData = await response.json();
  return {
    connected: true,
    service,
    info: {
      email: userData.email,
      name: userData.name,
    },
  };
}
