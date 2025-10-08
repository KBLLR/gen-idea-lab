/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Client-side OAuth utility for service connections
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

/**
 * Fetch service configuration status
 * @returns {Promise<Object>} Service configuration map
 */
export async function fetchServiceConfig() {
  const response = await fetch(`${API_BASE}/api/services/config`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch service config: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch connected services
 * @returns {Promise<Object>} Connected services map
 */
export async function fetchConnectedServices() {
  const response = await fetch(`${API_BASE}/api/services`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch connected services: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Open OAuth popup and handle callback
 * @param {string} authUrl - OAuth authorization URL
 * @param {string} service - Service name
 * @returns {Promise<Object>} Result of OAuth flow
 */
function openOAuthPopup(authUrl, service) {
  return new Promise((resolve, reject) => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      `oauth_${service}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no`
    );

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for OAuth to work.'));
      return;
    }

    // Listen for postMessage from callback (optional - currently using redirect)
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'oauth_success' && event.data.service === service) {
        window.removeEventListener('message', handleMessage);
        popup.close();
        resolve({ success: true, service });
      } else if (event.data.type === 'oauth_error' && event.data.service === service) {
        window.removeEventListener('message', handleMessage);
        popup.close();
        reject(new Error(event.data.error || 'OAuth failed'));
      }
    };

    window.addEventListener('message', handleMessage);

    // Poll for popup close (fallback)
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        window.removeEventListener('message', handleMessage);

        // Check if service is now connected
        fetchConnectedServices()
          .then((services) => {
            if (services[service]?.connected) {
              resolve({ success: true, service });
            } else {
              reject(new Error('OAuth window closed without completing authentication'));
            }
          })
          .catch(() => {
            reject(new Error('OAuth window closed without completing authentication'));
          });
      }
    }, 500);

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(pollTimer);
      window.removeEventListener('message', handleMessage);
      if (!popup.closed) {
        popup.close();
      }
      reject(new Error('OAuth timeout'));
    }, 5 * 60 * 1000);
  });
}

/**
 * Connect a service (OAuth, API key, or endpoint)
 * @param {string} service - Service name
 * @param {Object} options - Connection options (apiKey, url, transport)
 * @returns {Promise<Object>} Connection result
 */
export async function connectService(service, options = {}) {
  const { apiKey, url, transport } = options;

  const response = await fetch(`${API_BASE}/api/services/${service}/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ apiKey, url, transport }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Connection failed');
  }

  const result = await response.json();

  // If OAuth flow, open popup
  if (result.authUrl) {
    return await openOAuthPopup(result.authUrl, service);
  }

  // For API key/endpoint connections
  return result;
}

/**
 * Disconnect a service
 * @param {string} service - Service name
 * @returns {Promise<Object>} Disconnection result
 */
export async function disconnectService(service) {
  const response = await fetch(`${API_BASE}/api/services/${service}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Disconnection failed');
  }

  return await response.json();
}

/**
 * Test a service connection
 * @param {string} service - Service name
 * @returns {Promise<Object>} Test result
 */
export async function testServiceConnection(service) {
  const response = await fetch(`${API_BASE}/api/services/${service}/test`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Connection test failed');
  }

  return await response.json();
}
