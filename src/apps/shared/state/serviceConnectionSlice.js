/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { DEFAULT_IMAGE_MODELS, ALWAYS_AVAILABLE_IMAGE_PROVIDERS } from '@shared/lib/imageProviders.js';

function resolveImageProvider(currentProvider, connectedServices = {}) {
  const normalizedCurrent = currentProvider || 'gemini'
  if (
    ALWAYS_AVAILABLE_IMAGE_PROVIDERS.has(normalizedCurrent) ||
    connectedServices[normalizedCurrent]?.connected
  ) {
    return normalizedCurrent
  }

  for (const provider of ALWAYS_AVAILABLE_IMAGE_PROVIDERS) { // Changed from IMAGE_PROVIDER_PRIORITY
    if (
      ALWAYS_AVAILABLE_IMAGE_PROVIDERS.has(provider) ||
      connectedServices[provider]?.connected
    ) {
      return provider
    }
  }

  return 'gemini'
}

function syncImageProviderState(state, { forceModelReset = false } = {}) {
  const previousProvider = state.imageProvider
  const resolvedProvider = resolveImageProvider(previousProvider, state.connectedServices)

  state.imageProvider = resolvedProvider

  const providerChanged = previousProvider !== resolvedProvider

  if (providerChanged || forceModelReset || state.imageModel === undefined) {
    state.imageModel = DEFAULT_IMAGE_MODELS[resolvedProvider] ?? null
  }
}

export const createServiceConnectionSlice = (set, get) => ({
  // Service connections state
  // connectedServices[serviceId] shape:
  // { connected: boolean, status: 'connected'|'disconnected'|'connecting'|'error', info?: any, lastChecked?: string, error?: string }
  connectedServices: {},
  // Service configuration readiness (env vars on server)
  serviceConfig: {},
  // Service credentials (stored separately from connection status)
  serviceCredentials: {},

  // Service management actions
  setConnectedServices: (services) => set((state) => {
    const now = new Date().toISOString();
    const next = {};
    for (const [id, data] of Object.entries(services || {})) {
      next[id] = {
        connected: !!data?.connected,
        status: data?.connected ? 'connected' : 'disconnected',
        info: data?.info || null,
        lastChecked: now,
        error: null,
      };
    }
    state.connectedServices = next;
    syncImageProviderState(state);
  }),

  updateServiceConnection: (serviceId, connectionInfo) => set((state) => {
    state.connectedServices[serviceId] = {
      ...(state.connectedServices[serviceId] || {}),
      ...connectionInfo,
    };
    syncImageProviderState(state);
  }),

  removeServiceConnection: (serviceId) => set((state) => {
    delete state.connectedServices[serviceId];
    syncImageProviderState(state, { forceModelReset: true });
  }),

  // Store service credentials separately from connection status
  storeServiceCredentials: (serviceId, credentials) => set((state) => {
    state.serviceCredentials[serviceId] = {
      ...credentials,
      storedAt: new Date().toISOString()
    };
  }),

  // Toggle service on/off using stored credentials
  toggleService: async (serviceId, enabled) => {
    const credentials = get().serviceCredentials[serviceId];
    if (!credentials) {
      throw new Error('No stored credentials found for this service');
    }

    try {
      if (enabled) {
        // Re-enable service using stored credentials
        const response = await fetch(`/api/services/${serviceId}/connect`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to enable service');
        }

        const result = await response.json();

        if (result.authUrl) {
          window.location.href = result.authUrl;
          return;
        }

        if (result.success) {
          set((state) => {
            state.connectedServices[serviceId] = {
              connected: true,
              info: result.info || { name: serviceId }
            };
            syncImageProviderState(state);
          });
        }
      } else {
        // Disable service (but keep credentials)
        const response = await fetch(`/api/services/${serviceId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to disable service');
        }

        set((state) => {
          state.connectedServices[serviceId] = {
            connected: false,
            info: null
          };
          syncImageProviderState(state, { forceModelReset: true });
        });
      }
    } catch (error) {
      console.error(`Failed to toggle ${serviceId}:`, error);
      throw error;
    }
  },

  // Service connection API calls
  connectService: async (serviceId, credentials) => {
    try {
      // mark as connecting for optimistic UI
      set((state) => {
        state.connectedServices[serviceId] = {
          ...(state.connectedServices[serviceId] || {}),
          status: 'connecting',
          error: null,
        };
      });
      const response = await fetch(`/api/services/${serviceId}/connect`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        let errorMessage = `Failed to connect service (${response.status})`;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // Response body might be empty or not JSON
          const text = await response.text().catch(() => '');
          if (text) errorMessage = text;
        }
        set((state) => {
          state.connectedServices[serviceId] = {
            ...(state.connectedServices[serviceId] || {}),
            status: 'error',
            error: errorMessage,
          };
        });
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
      } catch (e) {
        // Empty or invalid JSON response
        result = { success: false, error: 'Invalid response from service' };
      }

      // For OAuth services, redirect to auth URL
      if (result.authUrl) {
        window.location.href = result.authUrl;
        return;
      }

      // For API key/URL services, update the connection immediately
      if (result.success) {
        // Store credentials for future use
        get().actions.storeServiceCredentials(serviceId, credentials);
        // Refresh connected services
        await get().actions.fetchConnectedServices();
        set((state) => {
          state.connectedServices[serviceId] = {
            ...(state.connectedServices[serviceId] || {}),
            status: 'connected',
            error: null,
          };
        });
      }

      return result;
    } catch (error) {
      console.error(`Failed to connect ${serviceId}:`, error);
      set((state) => {
        state.connectedServices[serviceId] = {
          ...(state.connectedServices[serviceId] || {}),
          status: 'error',
          error: error.message,
        };
      });
      throw error;
    }
  },

  disconnectService: async (serviceId) => {
    try {
      set((state) => {
        state.connectedServices[serviceId] = {
          ...(state.connectedServices[serviceId] || {}),
          status: 'connecting',
          error: null,
        };
      });
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        set((state) => {
          state.connectedServices[serviceId] = {
            ...(state.connectedServices[serviceId] || {}),
            status: 'error',
            error: error.error || 'Failed to disconnect service',
          };
        });
        throw new Error(error.error || 'Failed to disconnect service');
      }

      // Update local state
      set((state) => {
        state.connectedServices[serviceId] = {
          connected: false,
          status: 'disconnected',
          info: null,
          lastChecked: new Date().toISOString(),
          error: null,
        };
      });

      return await response.json();
    } catch (error) {
      console.error(`Failed to disconnect ${serviceId}:`, error);
      throw error;
    }
  },

  fetchConnectedServices: async () => {
    try {
      const response = await fetch('/api/services', {
        credentials: 'include'
      });

      if (response.ok) {
        const services = await response.json();
        const now = new Date().toISOString();
        set((state) => {
          for (const [id, data] of Object.entries(services || {})) {
            state.connectedServices[id] = {
              connected: !!data?.connected,
              status: data?.connected ? 'connected' : 'disconnected',
              info: data?.info || null,
              lastChecked: now,
              error: null,
            };
          }
          syncImageProviderState(state);
        });
      }
    } catch (error) {
      console.error('Failed to fetch connected services:', error);
    }
  },

  fetchServiceConfig: async () => {
    try {
      const response = await fetch('/api/services/config', {
        credentials: 'include'
      });
      if (response.ok) {
        const config = await response.json();
        set((state) => {
          state.serviceConfig = config || {};
        });
      }
    } catch (error) {
      console.error('Failed to fetch service configuration:', error);
    }
  },

  testServiceConnection: async (serviceId) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/test`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Connection test failed');
      }

      const result = await response.json();
      set((state) => {
        state.connectedServices[serviceId] = {
          ...(state.connectedServices[serviceId] || {}),
          status: 'connected',
          info: {
            ...(state.connectedServices[serviceId]?.info || {}),
            ...(result.info || {}),
          },
          lastChecked: new Date().toISOString(),
          error: null,
        };
      });
      return result;
    } catch (error) {
      console.error(`Failed to test ${serviceId} connection:`, error);
      set((state) => {
        state.connectedServices[serviceId] = {
          ...(state.connectedServices[serviceId] || {}),
          status: 'error',
          error: error.message,
          lastChecked: new Date().toISOString(),
        };
      });
      throw error;
    }
  },
});
