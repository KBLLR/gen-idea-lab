/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { WebSocketServer } from 'ws';
import { verifyJWT } from './auth.js';
import logger from './logger.js';

const DEFAULT_LIVE_API_MODEL = 'models/gemini-2.0-flash-exp';

/**
 * Setup WebSocket proxy for Gemini Live API
 * This proxies client WebSocket connections through the backend,
 * keeping the API key secure on the server side.
 *
 * @param {import('http').Server} server - HTTP server instance
 * @param {string} apiKey - Gemini API key
 */
export function setupLiveApiProxy(server, apiKey) {
  if (!apiKey) {
    logger.warn('Live API proxy not initialized: GEMINI_API_KEY not configured');
    return;
  }

  const wss = new WebSocketServer({
    server,
    path: '/ws/live-api',
    // Verify origin in production
    verifyClient: (info, callback) => {
      const isDev = process.env.NODE_ENV !== 'production';
      const origin = info.origin;

      // In development, allow all origins
      if (isDev) {
        callback(true);
        return;
      }

      // In production, verify origin
      const allowedOrigins = [
        'https://kbllr.com',
        'https://www.kbllr.com',
        process.env.FRONTEND_URL
      ].filter(Boolean);

      const isAllowed = allowedOrigins.some(allowed => origin?.startsWith(allowed));
      callback(isAllowed);
    }
  });

  wss.on('connection', async (clientWs, req) => {
    logger.info('[Live API Proxy] Client connected');

    let geminiSession = null;
    let isAuthenticated = false;

    // Extract and verify auth token from cookie or query param
    const cookieHeader = req.headers.cookie;
    const cookies = parseCookies(cookieHeader || '');
    const tokenFromCookie = cookies.auth_token;

    // Also check query parameter for WebSocket auth
    const url = new URL(req.url, `http://${req.headers.host}`);
    const tokenFromQuery = url.searchParams.get('token');

    const token = tokenFromCookie || tokenFromQuery;

    // Require authentication token (no bypass in any environment)
    if (!token) {
      logger.warn('[Live API Proxy] No authentication token provided');
      clientWs.close(4001, 'Authentication required');
      return;
    }

    if (token) {
      try {
        const user = verifyJWT(token);
        isAuthenticated = true;
        logger.info(`[Live API Proxy] User authenticated: ${user.email}`);
      } catch (err) {
        logger.warn('[Live API Proxy] Invalid authentication token:', err.message);
        clientWs.close(4001, 'Invalid authentication token');
        return;
      }
    }

    // Initialize Gemini client
    const genAI = new GoogleGenAI({ apiKey });

    // Handle messages from client
    clientWs.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Handle connection request
        if (data.type === 'connect') {
          logger.info('[Live API Proxy] Connecting to Gemini Live API...');

          const model = data.model || DEFAULT_LIVE_API_MODEL;
          const config = data.config || {};

          try {
            geminiSession = await genAI.live.connect({
              model,
              config,
              callbacks: {
                onopen: () => {
                  logger.info('[Live API Proxy] Gemini session opened');
                  clientWs.send(JSON.stringify({ type: 'open' }));
                },
                onmessage: (msg) => {
                  // Forward Gemini messages to client
                  clientWs.send(JSON.stringify({
                    type: 'message',
                    data: msg
                  }));
                },
                onerror: (err) => {
                  logger.error('[Live API Proxy] Gemini error:', err);
                  clientWs.send(JSON.stringify({
                    type: 'error',
                    error: { message: err.message || 'Gemini API error' }
                  }));
                },
                onclose: (event) => {
                  logger.info('[Live API Proxy] Gemini session closed');
                  clientWs.send(JSON.stringify({
                    type: 'close',
                    code: event.code,
                    reason: event.reason
                  }));
                }
              }
            });

            logger.info('[Live API Proxy] Gemini session created successfully');
          } catch (err) {
            logger.error('[Live API Proxy] Failed to connect to Gemini:', err);
            clientWs.send(JSON.stringify({
              type: 'error',
              error: { message: err.message || 'Failed to connect to Gemini API' }
            }));
          }
          return;
        }

        // Forward other messages to Gemini session
        if (!geminiSession) {
          clientWs.send(JSON.stringify({
            type: 'error',
            error: { message: 'Not connected to Gemini API' }
          }));
          return;
        }

        if (data.type === 'send') {
          geminiSession.sendClientContent({
            turns: data.parts,
            turnComplete: data.turnComplete !== false
          });
        } else if (data.type === 'realtimeInput') {
          data.chunks.forEach(chunk => {
            geminiSession.sendRealtimeInput({ media: chunk });
          });
        } else if (data.type === 'toolResponse') {
          if (data.toolResponse.functionResponses) {
            geminiSession.sendToolResponse({
              functionResponses: data.toolResponse.functionResponses
            });
          }
        } else if (data.type === 'disconnect') {
          if (geminiSession) {
            geminiSession.close();
            geminiSession = null;
          }
        }

      } catch (err) {
        logger.error('[Live API Proxy] Error handling client message:', err);
        clientWs.send(JSON.stringify({
          type: 'error',
          error: { message: err.message || 'Internal proxy error' }
        }));
      }
    });

    // Handle client disconnect
    clientWs.on('close', (code, reason) => {
      logger.info(`[Live API Proxy] Client disconnected: ${code} ${reason}`);
      if (geminiSession) {
        geminiSession.close();
        geminiSession = null;
      }
    });

    // Handle client errors
    clientWs.on('error', (err) => {
      logger.error('[Live API Proxy] Client WebSocket error:', err);
    });
  });

  wss.on('error', (err) => {
    logger.error('[Live API Proxy] WebSocket server error:', err);
  });

  logger.info('[Live API Proxy] WebSocket server initialized at /ws/live-api');
}

/**
 * Parse cookie header string into object
 * @param {string} cookieHeader - Cookie header string
 * @returns {Object} Parsed cookies
 */
function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    cookies[name?.trim()] = rest.join('=')?.trim();
  });
  return cookies;
}
