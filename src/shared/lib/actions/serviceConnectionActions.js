/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../store';

const set = useStore.setState;

// Service connection actions
export const connectService = async (serviceId, credentials = null) => {
  try {
    // Handle API key based connections
    if (credentials?.apiKey) {
      const response = await fetch('/auth/connect/apikey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          serviceId,
          apiKey: credentials.apiKey
        }),
      });

      if (response.ok) {
        const result = await response.json();
        set(state => {
          state.connectedServices[serviceId] = {
            connected: true,
            type: 'apikey',
            connectedAt: new Date().toISOString(),
            ...result
          };
        });
        return { success: true };
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect service');
      }
    }

    // Handle URL based connections (like Ollama)
    if (credentials?.url) {
      const response = await fetch('/auth/connect/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          serviceId,
          url: credentials.url
        }),
      });

      if (response.ok) {
        const result = await response.json();
        set(state => {
          state.connectedServices[serviceId] = {
            connected: true,
            type: 'url',
            connectedAt: new Date().toISOString(),
            ...result
          };
        });
        return { success: true };
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect service');
      }
    }

    // Handle OAuth based connections
    const popup = window.open(
      `/auth/connect/${serviceId}`,
      'connect-service',
      'width=600,height=600,scrollbars=yes,resizable=yes'
    );

    // Wait for OAuth completion
    const result = await new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('OAuth popup was closed'));
        }
      }, 1000);

      window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'OAUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup.close();
          resolve(event.data.payload);
        } else if (event.data.type === 'OAUTH_ERROR') {
          clearInterval(checkClosed);
          popup.close();
          reject(new Error(event.data.error));
        }
      });
    });

    // Update state with successful connection
    set(state => {
      state.connectedServices[serviceId] = {
        connected: true,
        type: 'oauth',
        ...result
      };
    });

    return { success: true };
  } catch (error) {
    console.error(`Failed to connect ${serviceId}:`, error);
    return { success: false, error: error.message };
  }
};

export const disconnectService = async (serviceId) => {
  try {
    const response = await fetch(`/auth/disconnect/${serviceId}`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      set(state => {
        delete state.connectedServices[serviceId];
      });
      return { success: true };
    } else {
      throw new Error('Failed to disconnect service');
    }
  } catch (error) {
    console.error(`Failed to disconnect ${serviceId}:`, error);
    return { success: false, error: error.message };
  }
};

export const loadConnectedServices = async () => {
  try {
    const response = await fetch('/auth/services', {
      credentials: 'include',
    });

    if (response.ok) {
      const services = await response.json();
      set(state => {
        state.connectedServices = services;
      });
    }
  } catch (error) {
    console.error('Failed to load connected services:', error);
  }
};
