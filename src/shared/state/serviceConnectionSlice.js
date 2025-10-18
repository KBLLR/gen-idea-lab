/**
 * @file serviceConnectionSlice - Service integration and OAuth management
 * @license SPDX-License-Identifier: Apache-2.0
 * MIGRATED: Now uses centralized API endpoints
 */
import { DEFAULT_IMAGE_MODELS, ALWAYS_AVAILABLE_IMAGE_PROVIDERS } from '@shared/lib/imageProviders.js';
import { api } from '@shared/lib/dataLayer/endpoints.js';

/**
 * Service connection status
 * @typedef {'connected'|'disconnected'|'connecting'|'error'} ServiceStatus
 */

/**
 * Service connection information
 * @typedef {Object} ServiceConnection
 * @property {boolean} connected - Whether service is currently connected
 * @property {ServiceStatus} status - Current connection status
 * @property {Object} [info] - Service-specific connection info (e.g., user data, endpoint)
 * @property {string} [lastChecked] - ISO timestamp of last status check
 * @property {string} [error] - Error message if status is 'error'
 */

/**
 * Service configuration from server
 * @typedef {Object} ServiceConfig
 * @property {boolean} configured - Whether service has required env vars configured
 * @property {string[]} [missing] - Missing environment variables
 * @property {string} [redirectUri] - OAuth redirect URI for service setup
 */

/**
 * Service credentials (API keys, tokens, URLs)
 * @typedef {Object} ServiceCredentials
 * @property {string} [apiKey] - API key for service
 * @property {string} [url] - Custom endpoint URL for service
 * @property {string} [transport] - Transport protocol (e.g., 'http', 'grpc')
 * @property {string} storedAt - ISO timestamp when credentials were stored
 */

/**
 * Options for syncing image provider state
 * @typedef {Object} SyncImageProviderOptions
 * @property {boolean} [forceModelReset] - Force model reset even if provider unchanged
 */

/**
 * Resolve the active image provider based on availability
 * @param {string} [currentProvider] - Currently selected provider
 * @param {Record<string, ServiceConnection>} [connectedServices] - Service connection status
 * @returns {string} Resolved provider name
 */
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

/**
 * Synchronize image provider state after service connection changes
 * @param {Object} state - Zustand state object
 * @param {SyncImageProviderOptions} [options] - Sync options
 */
function syncImageProviderState(state, { forceModelReset = false } = {}) {
  const previousProvider = state.imageProvider
  const resolvedProvider = resolveImageProvider(previousProvider, state.connectedServices)

  state.imageProvider = resolvedProvider

  const providerChanged = previousProvider !== resolvedProvider

  if (providerChanged || forceModelReset || state.imageModel === undefined) {
    state.imageModel = DEFAULT_IMAGE_MODELS[resolvedProvider] ?? null
  }
}

/**
 * Service connection slice state
 * @typedef {Object} ServiceConnectionSliceState
 * @property {Record<string, ServiceConnection>} connectedServices - Map of service ID to connection status
 * @property {Record<string, ServiceConfig>} serviceConfig - Map of service ID to server configuration
 * @property {Record<string, ServiceCredentials>} serviceCredentials - Map of service ID to stored credentials
 */

/**
 * Service connection slice actions
 * @typedef {Object} ServiceConnectionSliceActions
 * @property {(services: Record<string, ServiceConnection>) => void} setConnectedServices - Set all service connections
 * @property {(serviceId: string, connectionInfo: Partial<ServiceConnection>) => void} updateServiceConnection - Update single service connection
 * @property {(serviceId: string) => void} removeServiceConnection - Remove service connection
 * @property {(serviceId: string, credentials: ServiceCredentials) => void} storeServiceCredentials - Store service credentials
 * @property {(serviceId: string, enabled: boolean) => Promise<void>} toggleService - Toggle service on/off using stored credentials
 * @property {(serviceId: string, credentials?: ServiceCredentials) => Promise<Object>} connectService - Connect to a service with optional credentials
 * @property {(serviceId: string) => Promise<Object>} disconnectService - Disconnect from a service
 * @property {() => Promise<void>} fetchConnectedServices - Fetch all connected services from server
 * @property {() => Promise<void>} fetchServiceConfig - Fetch service configuration from server
 * @property {(serviceId: string) => Promise<Object>} testServiceConnection - Test service connection
 */

/**
 * @typedef {ServiceConnectionSliceState & ServiceConnectionSliceActions} ServiceConnectionSlice
 */

/**
 * Create service connection slice for Zustand store
 * Manages OAuth connections, API key services, and image provider state
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 * @returns {ServiceConnectionSlice} Service connection slice state and actions
 */
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

      // Use centralized API endpoint
      const result = await api.services.connect(serviceId, credentials);

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
            connected: true,
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

      // Use centralized API endpoint
      const result = await api.services.disconnect(serviceId);

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

      return result;
    } catch (error) {
      console.error(`Failed to disconnect ${serviceId}:`, error);
      throw error;
    }
  },

  fetchConnectedServices: async () => {
    try {
      // Use centralized API endpoint
      const services = await api.services.list();
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
    } catch (error) {
      console.error('Failed to fetch connected services:', error);
    }
  },

  fetchServiceConfig: async () => {
    try {
      // Use centralized API endpoint
      const config = await api.services.config();
      set((state) => {
        state.serviceConfig = config || {};
      });
    } catch (error) {
      console.error('Failed to fetch service configuration:', error);
    }
  },

  testServiceConnection: async (serviceId) => {
    try {
      // Use centralized API endpoint
      const result = await api.services.test(serviceId);
      set((state) => {
        state.connectedServices[serviceId] = {
          ...(state.connectedServices[serviceId] || {}),
          connected: true,
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
