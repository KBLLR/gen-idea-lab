/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import logger from '../../src/shared/lib/logger.js'

export function runStartupChecks() {
  const isDev = process.env.NODE_ENV !== 'production'

  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || null
  const backendUrl = process.env.BACKEND_URL || null

  const clientId = process.env.GOOGLE_CLIENT_ID || null
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || null
  const authSecret = process.env.AUTH_SECRET || null
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null

  const oauthConfigured = Boolean(clientId && clientSecret)
  const authSecretPresent = Boolean(authSecret)
  const geminiConfigured = Boolean(geminiKey)

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_ORIGIN,
    process.env.BACKEND_URL,
    process.env.DOMAIN ? `https://${process.env.DOMAIN}` : null,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean)

  // Log friendly messages once on startup
  if (!oauthConfigured) {
    logger.warn('[Startup] Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server, and VITE_GOOGLE_CLIENT_ID on the client.')
  }
  if (!authSecretPresent) {
    logger.warn('[Startup] AUTH_SECRET missing. Set a strong secret or JWT validation will be insecure.')
  }
  if (!geminiConfigured) {
    logger.warn('[Startup] Live API: GEMINI_API_KEY/GOOGLE_API_KEY not set. Voice panel will not connect.')
  }
  if (!frontendUrl) {
    logger.warn('[Startup] FRONTEND_URL/CLIENT_ORIGIN not set. CORS allowlist will fall back to localhost.')
  }

  return {
    env: process.env.NODE_ENV || 'development',
    isDev,
    urls: { frontendUrl, backendUrl },
    oauth: {
      clientIdPresent: Boolean(clientId),
      clientSecretPresent: Boolean(clientSecret),
      configured: oauthConfigured,
    },
    auth: {
      authSecretPresent,
    },
    liveApi: {
      geminiConfigured,
    },
    cors: {
      allowedOrigins,
    },
  }
}

