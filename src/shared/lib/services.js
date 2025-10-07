/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { google } from 'googleapis';
import fetch from 'node-fetch';
import logger from './logger.js';

// Service configurations
const services = {
    github: {
        name: 'GitHub',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userUrl: 'https://api.github.com/user',
        scopes: ['user:email', 'repo'],
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    notion: {
        name: 'Notion',
        authUrl: 'https://api.notion.com/v1/oauth/authorize',
        tokenUrl: 'https://api.notion.com/v1/oauth/token',
        userUrl: 'https://api.notion.com/v1/users/me',
        scopes: [], // Notion doesn't use traditional scopes
        clientId: process.env.NOTION_CLIENT_ID,
        clientSecret: process.env.NOTION_CLIENT_SECRET,
        requiresOwner: true, // Notion requires 'owner=user' parameter
    },
    googledrive: {
        name: 'Google Drive',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/userinfo.profile'],
        clientId: process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    },
    googlephotos: {
        name: 'Google Photos',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scopes: ['https://www.googleapis.com/auth/photoslibrary', 'https://www.googleapis.com/auth/userinfo.profile'],
        clientId: process.env.GOOGLE_PHOTOS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_PHOTOS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    },
    googlecalendar: {
        name: 'Google Calendar',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/userinfo.profile'],
        clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    },
    gmail: {
        name: 'Gmail',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.profile'],
        clientId: process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    },
    figma: {
        name: 'Figma',
        authUrl: 'https://www.figma.com/oauth',
        tokenUrl: 'https://www.figma.com/api/oauth/token',
        userUrl: 'https://api.figma.com/v1/me',
        scopes: ['file_read'],
        clientId: process.env.FIGMA_CLIENT_ID,
        clientSecret: process.env.FIGMA_CLIENT_SECRET,
    },
    // AI Services (API key based)
    openai: {
        name: 'OpenAI',
        requiresApiKey: true,
        apiUrl: 'https://api.openai.com/v1',
        testEndpoint: '/models'
    },
    claude: {
        name: 'Anthropic Claude',
        requiresApiKey: true,
        apiUrl: 'https://api.anthropic.com',
        testEndpoint: '/v1/messages'
    },
    gemini: {
        name: 'Google Gemini',
        requiresApiKey: true,
        apiUrl: 'https://generativelanguage.googleapis.com',
        testEndpoint: '/v1/models'
    },
    ollama: {
        name: 'Ollama',
        requiresUrl: true,
        defaultUrl: 'http://localhost:11434',
        testEndpoint: '/api/tags',
        // New 2025 cloud API features
        supportsApiKey: true,
        cloudApiUrl: 'https://ollama.com/api',
        webSearchEndpoint: '/web_search',
        webFetchEndpoint: '/web_fetch'
    },
    googlesearch: {
        name: 'Google Search',
        requiresApiKey: true,
        apiUrl: 'https://www.googleapis.com/customsearch/v1',
        testEndpoint: ''
    }
};

/**
 * Generate OAuth authorization URL for a service
 */
export function getAuthUrl(serviceId, redirectUri, state) {
    const service = services[serviceId];
    if (!service) {
        throw new Error(`Unknown service: ${serviceId}`);
    }

    if (!service.clientId) {
        throw new Error(`${service.name} client ID not configured`);
    }

    const params = new URLSearchParams({
        client_id: service.clientId,
        redirect_uri: redirectUri,
        state: state,
        response_type: 'code',
    });

    if (service.scopes.length > 0) {
        params.append('scope', service.scopes.join(' '));
    }

    // Special handling for different services
    if (serviceId === 'notion') {
        params.append('owner', 'user');
        params.append('response_type', 'code');
    }

    return `${service.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(serviceId, code, redirectUri) {
    const service = services[serviceId];
    if (!service) {
        throw new Error(`Unknown service: ${serviceId}`);
    }

    const tokenData = {
        client_id: service.clientId,
        client_secret: service.clientSecret,
        code: code,
        redirect_uri: redirectUri,
    };

    if (serviceId === 'github') {
        tokenData.grant_type = 'authorization_code';
    } else if (serviceId === 'googledrive') {
        tokenData.grant_type = 'authorization_code';
    }

    try {
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        if (serviceId === 'notion') {
            // Notion requires basic auth
            const auth = Buffer.from(`${service.clientId}:${service.clientSecret}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
            tokenData.grant_type = 'authorization_code';
        }

        const response = await fetch(service.tokenUrl, {
            method: 'POST',
            headers,
            body: new URLSearchParams(tokenData).toString(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`Token exchange failed for ${serviceId}:`, errorText);
            throw new Error(`Token exchange failed: ${response.status}`);
        }

        const tokenResponse = await response.json();
        
        if (tokenResponse.error) {
            throw new Error(tokenResponse.error_description || tokenResponse.error);
        }

        return tokenResponse;
    } catch (error) {
        logger.error(`Token exchange error for ${serviceId}:`, error);
        throw error;
    }
}

/**
 * Get user information from service API
 */
export async function getUserInfo(serviceId, accessToken) {
    const service = services[serviceId];
    if (!service) {
        throw new Error(`Unknown service: ${serviceId}`);
    }

    try {
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        };

        if (serviceId === 'github') {
            headers['User-Agent'] = 'GenBooth-App';
        } else if (serviceId === 'notion') {
            headers['Notion-Version'] = '2022-06-28';
        }

        const response = await fetch(service.userUrl, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`User info fetch failed for ${serviceId}:`, errorText);
            throw new Error(`User info fetch failed: ${response.status}`);
        }

        const userInfo = await response.json();
        return userInfo;
    } catch (error) {
        logger.error(`User info error for ${serviceId}:`, error);
        throw error;
    }
}

/**
 * Revoke access token for a service
 */
export async function revokeToken(serviceId, accessToken) {
    try {
        if (serviceId === 'github') {
            // GitHub token revocation
            const response = await fetch(`https://api.github.com/applications/${services.github.clientId}/token`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${services.github.clientId}:${services.github.clientSecret}`).toString('base64')}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
                body: JSON.stringify({ access_token: accessToken }),
            });
            return response.ok;
        } else if (serviceId === 'googledrive') {
            // Google token revocation
            const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
                method: 'POST',
            });
            return response.ok;
        }
        // For other services, we just remove from our storage
        return true;
    } catch (error) {
        logger.error(`Token revocation error for ${serviceId}:`, error);
        return false;
    }
}

/**
 * Test API key based service connection
 */
export async function testApiKeyConnection(serviceId, apiKey) {
    const service = services[serviceId];
    if (!service || !service.requiresApiKey) {
        throw new Error(`Service ${serviceId} does not support API key authentication`);
    }

    try {
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        };

        // Special handling for different APIs
        if (serviceId === 'claude') {
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
            delete headers['Authorization'];
        } else if (serviceId === 'gemini') {
            // Gemini uses query param instead of header
            const testUrl = `${service.apiUrl}${service.testEndpoint}?key=${apiKey}`;
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            return response.ok;
        }

        const testUrl = `${service.apiUrl}${service.testEndpoint}`;
        const response = await fetch(testUrl, {
            method: 'GET',
            headers,
        });

        return response.ok;
    } catch (error) {
        logger.error(`API key test failed for ${serviceId}:`, error);
        return false;
    }
}

/**
 * Test URL based service connection (like Ollama)
 */
export async function testUrlConnection(serviceId, url) {
    const service = services[serviceId];
    if (!service || !service.requiresUrl) {
        throw new Error(`Service ${serviceId} does not support URL configuration`);
    }

    try {
        const testUrl = `${url}${service.testEndpoint}`;
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000, // 5 second timeout for local services
        });

        return response.ok;
    } catch (error) {
        logger.error(`URL test failed for ${serviceId} at ${url}:`, error);
        return false;
    }
}

/**
 * Store service credentials securely
 */
export function storeServiceCredentials(serviceId, credentials) {
    // In a production app, you'd encrypt these and store in a secure database
    // For now, we'll store in memory/localStorage with basic obfuscation
    const encoded = Buffer.from(JSON.stringify(credentials)).toString('base64');
    return { serviceId, encoded, connectedAt: new Date().toISOString() };
}

/**
 * Retrieve service credentials
 */
export function getServiceCredentials(serviceId, encoded) {
    try {
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
        return JSON.parse(decoded);
    } catch (error) {
        logger.error(`Failed to decode credentials for ${serviceId}:`, error);
        return null;
    }
}

export { services };
