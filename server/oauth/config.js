/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * OAuth provider configuration and environment variable management.
 */

import { getBaseUrl } from '../config/env.js';

/**
 * Provider definitions with OAuth endpoints and scopes
 */
export const PROVIDERS = {
  github: {
    name: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: 'repo user',
    requiresClientId: true,
    requiresClientSecret: true,
  },
  notion: {
    name: 'Notion',
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scope: '',
    requiresClientId: true,
    requiresClientSecret: true,
  },
  figma: {
    name: 'Figma',
    authUrl: 'https://www.figma.com/oauth',
    tokenUrl: 'https://www.figma.com/api/oauth/token',
    scope: 'files:read',
    requiresClientId: true,
    requiresClientSecret: true,
  },
  googleDrive: {
    name: 'Google Drive',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    requiresClientId: true,
    requiresClientSecret: true,
    usesGoogleCreds: true,
  },
  googlePhotos: {
    name: 'Google Photos',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
    requiresClientId: true,
    requiresClientSecret: true,
    usesGoogleCreds: true,
  },
  googleCalendar: {
    name: 'Google Calendar',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    requiresClientId: true,
    requiresClientSecret: true,
    usesGoogleCreds: true,
  },
  gmail: {
    name: 'Gmail',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    requiresClientId: true,
    requiresClientSecret: true,
    usesGoogleCreds: true,
  },
  openai: {
    name: 'OpenAI',
    type: 'api_key',
    requiresApiKey: true,
  },
  claude: {
    name: 'Claude (Anthropic)',
    type: 'api_key',
    requiresApiKey: true,
  },
  gemini: {
    name: 'Gemini',
    type: 'api_key',
    requiresApiKey: true,
  },
  ollama: {
    name: 'Ollama',
    type: 'hybrid', // Supports both API key (cloud) and endpoint (local)
    requiresApiKeyOrEndpoint: true,
  },
  drawthings: {
    name: 'DrawThings',
    type: 'endpoint',
    requiresEndpoint: true,
  },
};

/**
 * Get client ID for a provider
 */
export function getClientId(service) {
  const provider = PROVIDERS[service];
  if (!provider) return null;

  // Google services use the same client ID
  if (provider.usesGoogleCreds) {
    return process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  }

  // Map service name to env var
  const envKey = `${service.toUpperCase()}_CLIENT_ID`;
  const viteEnvKey = `VITE_${envKey}`;
  return process.env[envKey] || process.env[viteEnvKey];
}

/**
 * Get client secret for a provider
 */
export function getClientSecret(service) {
  const provider = PROVIDERS[service];
  if (!provider) return null;

  // Google services use the same client secret
  if (provider.usesGoogleCreds) {
    return process.env.GOOGLE_CLIENT_SECRET;
  }

  // Map service name to env var
  const envKey = `${service.toUpperCase()}_CLIENT_SECRET`;
  return process.env[envKey];
}

/**
 * Get redirect URI for a provider
 */
export function getRedirectUri(req, service) {
  return `${getBaseUrl(req)}/api/services/${service}/callback`;
}

/**
 * Check if a provider is configured
 */
export function isProviderConfigured(service) {
  const provider = PROVIDERS[service];
  if (!provider) return { configured: false, missing: ['unknown_provider'] };

  const missing = [];

  if (provider.requiresClientId) {
    const clientId = getClientId(service);
    if (!clientId) {
      missing.push(provider.usesGoogleCreds ? 'GOOGLE_CLIENT_ID' : `${service.toUpperCase()}_CLIENT_ID`);
    }
  }

  if (provider.requiresClientSecret) {
    const clientSecret = getClientSecret(service);
    if (!clientSecret) {
      missing.push(provider.usesGoogleCreds ? 'GOOGLE_CLIENT_SECRET' : `${service.toUpperCase()}_CLIENT_SECRET`);
    }
  }

  return {
    configured: missing.length === 0,
    missing,
  };
}

/**
 * Get configuration status for all providers
 */
export function getAllProviderConfigs(req) {
  const configs = {};

  for (const [service, provider] of Object.entries(PROVIDERS)) {
    const status = isProviderConfigured(service);
    configs[service] = {
      name: provider.name,
      type: provider.type || 'oauth',
      configured: status.configured,
      missing: status.missing,
      redirectUri: provider.type === 'oauth' || !provider.type ? getRedirectUri(req, service) : undefined,
    };
  }

  return configs;
}
