/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Provider-agnostic OAuth callback handling.
 */

import logger from '../../src/shared/lib/logger.js';
import tokenStore from '../../src/shared/lib/secureTokens.js';
import { getFrontendBaseUrl } from '../config/env.js';
import { PROVIDERS, getClientId, getClientSecret, getRedirectUri } from './config.js';

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForToken(service, code, req) {
  const provider = PROVIDERS[service];
  if (!provider || !provider.tokenUrl) {
    throw new Error(`Token exchange not supported for ${service}`);
  }

  const clientId = getClientId(service);
  const clientSecret = getClientSecret(service);
  const redirectUri = getRedirectUri(req, service);

  let response;

  if (service === 'github') {
    response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });
  } else if (service === 'notion') {
    response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });
  } else if (service === 'figma') {
    response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
        grant_type: 'authorization_code',
      }),
    });
  } else if (provider.usesGoogleCreds) {
    // Google services (Drive, Photos, Calendar, Gmail)
    response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
        grant_type: 'authorization_code',
      }),
    });
  } else {
    throw new Error(`Unsupported OAuth provider: ${service}`);
  }

  if (!response.ok) {
    const text = await response.text();
    logger.error(`Token exchange failed for ${service}`, { status: response.status, text });
    throw new Error('Token exchange failed');
  }

  return await response.json();
}

/**
 * Handle OAuth callback (provider-agnostic)
 */
export async function handleOAuthCallback(service, req, res) {
  const { code, state, error } = req.query;

  if (error) {
    const front = getFrontendBaseUrl(req);
    return res.redirect(`${front}/?error=oauth_error&service=${service}`);
  }

  if (!code || !state) {
    const front = getFrontendBaseUrl(req);
    return res.redirect(`${front}/?error=missing_params&service=${service}`);
  }

  const [userEmail] = state.split(':');
  if (!userEmail) {
    const front = getFrontendBaseUrl(req);
    return res.redirect(`${front}/?error=invalid_state&service=${service}`);
  }

  try {
    const tokenResponse = await exchangeCodeForToken(service, code, req);

    if (tokenResponse.error) {
      logger.error(`OAuth error for ${service}:`, tokenResponse.error);
      const front = getFrontendBaseUrl(req);
      return res.redirect(`${front}/?error=token_exchange&service=${service}`);
    }

    await tokenStore.upsertOAuthToken(userEmail, service, {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      scopes: (tokenResponse.scope || '').split(' ').filter(Boolean),
      expiresAt: tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : null,
      info: { name: PROVIDERS[service]?.name || service },
    });

    logger.info(`Successfully connected ${service} for user ${userEmail}`);
    const front = getFrontendBaseUrl(req);
    res.redirect(`${front}/?success=connected&service=${service}`);
  } catch (error) {
    logger.error(`Error during ${service} OAuth callback:`, error);
    const front = getFrontendBaseUrl(req);
    res.redirect(`${front}/?error=callback_error&service=${service}`);
  }
}
