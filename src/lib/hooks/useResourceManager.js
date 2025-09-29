/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getResourceManager } from '../services/ResourceManager.js';

/**
 * React hook for managing module resources with lazy loading
 */
export function useResourceManager(moduleId) {
  const [indexes, setIndexes] = useState({
    chats: { recent: [], total: 0, items: [], loading: true },
    workflows: { recent: [], total: 0, items: [], loading: true },
    documentation: { recent: [], total: 0, items: [], loading: true }
  });

  const [loadedResources, setLoadedResources] = useState(new Map());
  const [loadingResources, setLoadingResources] = useState(new Set());
  const resourceManager = useRef(getResourceManager());
  const mountedRef = useRef(true);

  // Load indexes when module changes
  useEffect(() => {
    if (!moduleId) return;

    mountedRef.current = true;
    loadResourceIndexes();

    // Preload recent resources in background
    resourceManager.current.preloadRecentResources(moduleId);

    return () => {
      mountedRef.current = false;
    };
  }, [moduleId]);

  // Cleanup when unmounting
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (moduleId) {
        resourceManager.current.evictModuleResources(moduleId);
      }
    };
  }, []);

  const loadResourceIndexes = useCallback(async () => {
    if (!moduleId) return;

    const resourceTypes = ['chats', 'workflows', 'documentation'];

    // Load all indexes in parallel
    const indexPromises = resourceTypes.map(async (type) => {
      try {
        const index = await resourceManager.current.getResourceIndex(moduleId, type);
        return { type, index, error: null };
      } catch (error) {
        console.warn(`Failed to load ${type} index:`, error);
        return { type, index: { recent: [], total: 0, items: [] }, error };
      }
    });

    const results = await Promise.all(indexPromises);

    if (mountedRef.current) {
      setIndexes(prev => {
        const newIndexes = { ...prev };
        results.forEach(({ type, index, error }) => {
          newIndexes[type] = {
            ...index,
            loading: false,
            error
          };
        });
        return newIndexes;
      });
    }
  }, [moduleId]);

  const loadResource = useCallback(async (resourceType, resourceId) => {
    if (!moduleId || !resourceId) return null;

    const resourceKey = `${moduleId}:${resourceType}:${resourceId}`;

    // Return cached resource if available
    if (loadedResources.has(resourceKey)) {
      return loadedResources.get(resourceKey);
    }

    // Prevent duplicate loading
    if (loadingResources.has(resourceKey)) {
      return null;
    }

    setLoadingResources(prev => new Set(prev).add(resourceKey));

    try {
      const resource = await resourceManager.current.getResource(moduleId, resourceType, resourceId);

      if (mountedRef.current) {
        setLoadedResources(prev => new Map(prev).set(resourceKey, resource));
      }

      return resource;
    } catch (error) {
      console.error(`Failed to load resource ${resourceKey}:`, error);
      return null;
    } finally {
      if (mountedRef.current) {
        setLoadingResources(prev => {
          const next = new Set(prev);
          next.delete(resourceKey);
          return next;
        });
      }
    }
  }, [moduleId, loadedResources, loadingResources]);

  const loadResourceBatch = useCallback(async (resourceType, resourceIds) => {
    if (!moduleId || !resourceIds?.length) return [];

    const batchPromises = resourceIds.map(id => loadResource(resourceType, id));
    return Promise.allSettled(batchPromises);
  }, [moduleId, loadResource]);

  const searchResources = useCallback(async (query, resourceTypes) => {
    if (!moduleId || !query.trim()) return [];

    try {
      return await resourceManager.current.searchResources(moduleId, query, resourceTypes);
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }, [moduleId]);

  const refreshIndex = useCallback(async (resourceType) => {
    if (!moduleId) return;

    // Clear cached index
    const indexKey = `index:${moduleId}:${resourceType}`;
    resourceManager.current.indexes.delete(indexKey);

    // Reload index
    try {
      const index = await resourceManager.current.getResourceIndex(moduleId, resourceType);

      if (mountedRef.current) {
        setIndexes(prev => ({
          ...prev,
          [resourceType]: {
            ...index,
            loading: false,
            error: null
          }
        }));
      }
    } catch (error) {
      console.error(`Failed to refresh ${resourceType} index:`, error);
    }
  }, [moduleId]);

  const getResourceFromCache = useCallback((resourceType, resourceId) => {
    const resourceKey = `${moduleId}:${resourceType}:${resourceId}`;
    return loadedResources.get(resourceKey);
  }, [moduleId, loadedResources]);

  const isResourceLoading = useCallback((resourceType, resourceId) => {
    const resourceKey = `${moduleId}:${resourceType}:${resourceId}`;
    return loadingResources.has(resourceKey);
  }, [moduleId, loadingResources]);

  const getMemoryStats = useCallback(() => {
    return resourceManager.current.getMemoryStats();
  }, []);

  return {
    // Data
    indexes,
    loadedResources: Object.fromEntries(loadedResources),

    // Loading states
    isIndexLoading: Object.values(indexes).some(index => index.loading),
    loadingResources: Array.from(loadingResources),

    // Actions
    loadResource,
    loadResourceBatch,
    searchResources,
    refreshIndex,

    // Utilities
    getResourceFromCache,
    isResourceLoading,
    getMemoryStats,

    // Raw access for advanced use
    resourceManager: resourceManager.current
  };
}

/**
 * Hook for managing a specific resource type
 */
export function useResourceList(moduleId, resourceType) {
  const {
    indexes,
    loadResource,
    getResourceFromCache,
    isResourceLoading,
    refreshIndex
  } = useResourceManager(moduleId);

  const index = indexes[resourceType] || { recent: [], total: 0, items: [], loading: true };

  const loadItem = useCallback(async (itemId) => {
    return await loadResource(resourceType, itemId);
  }, [loadResource, resourceType]);

  const getItem = useCallback((itemId) => {
    return getResourceFromCache(resourceType, itemId);
  }, [getResourceFromCache, resourceType]);

  const isItemLoading = useCallback((itemId) => {
    return isResourceLoading(resourceType, itemId);
  }, [isResourceLoading, resourceType]);

  const refresh = useCallback(() => {
    return refreshIndex(resourceType);
  }, [refreshIndex, resourceType]);

  return {
    // Data
    items: index.items || [],
    recent: index.recent || [],
    total: index.total || 0,

    // Loading state
    isLoading: index.loading,
    error: index.error,

    // Actions
    loadItem,
    getItem,
    isItemLoading,
    refresh
  };
}

export default useResourceManager;