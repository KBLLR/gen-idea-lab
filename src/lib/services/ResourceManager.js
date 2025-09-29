/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * LRU Cache implementation for memory-safe resource management
 */
class LRUCache {
  constructor(maxSize = 50, maxMemoryMB = 100) {
    this.maxSize = maxSize;
    this.maxMemory = maxMemoryMB * 1024 * 1024; // Convert to bytes
    this.cache = new Map();
    this.currentMemory = 0;
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;

    // Move to end (mark as recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value.data;
  }

  set(key, data) {
    const size = this.estimateSize(data);

    // Remove existing entry if updating
    if (this.cache.has(key)) {
      const existing = this.cache.get(key);
      this.currentMemory -= existing.size;
      this.cache.delete(key);
    }

    // Evict until we have space
    while ((this.cache.size >= this.maxSize ||
            this.currentMemory + size > this.maxMemory) &&
           this.cache.size > 0) {
      this.evictOldest();
    }

    // Add new entry
    this.cache.set(key, { data, size, timestamp: Date.now() });
    this.currentMemory += size;
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      this.currentMemory -= entry.size;
      this.cache.delete(key);
    }
  }

  evictOldest() {
    if (this.cache.size === 0) return;

    const firstKey = this.cache.keys().next().value;
    const entry = this.cache.get(firstKey);
    this.currentMemory -= entry.size;
    this.cache.delete(firstKey);
  }

  evictByPattern(pattern) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.delete(key));
  }

  estimateSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // Fallback rough estimation
      return JSON.stringify(data).length * 2;
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsed: this.currentMemory,
      maxMemory: this.maxMemory,
      memoryUtilization: (this.currentMemory / this.maxMemory * 100).toFixed(1) + '%'
    };
  }

  clear() {
    this.cache.clear();
    this.currentMemory = 0;
  }
}

/**
 * ResourceManager - Handles lazy loading and memory-safe caching of module resources
 */
export class ResourceManager {
  constructor(options = {}) {
    this.cache = new LRUCache(options.maxCacheSize || 50, options.maxMemoryMB || 100);
    this.loadingPromises = new Map();
    this.indexes = new Map(); // Store lightweight indexes
    this.options = {
      preloadRecentCount: 10,
      batchSize: 20,
      ...options
    };
  }

  /**
   * Get resource index for a module (lightweight metadata)
   */
  async getResourceIndex(moduleId, resourceType) {
    const indexKey = `index:${moduleId}:${resourceType}`;

    if (this.indexes.has(indexKey)) {
      return this.indexes.get(indexKey);
    }

    try {
      const response = await fetch(`/api/modules/${moduleId}/resources/${resourceType}/index`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to load ${resourceType} index: ${response.statusText}`);
      }

      const index = await response.json();
      this.indexes.set(indexKey, index);
      return index;
    } catch (error) {
      console.warn(`Failed to load ${resourceType} index for module ${moduleId}:`, error);
      return { recent: [], total: 0, items: [] };
    }
  }

  /**
   * Get full resource data (with caching and lazy loading)
   */
  async getResource(moduleId, resourceType, resourceId) {
    const cacheKey = `${moduleId}:${resourceType}:${resourceId}`;

    // Return from cache if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Prevent duplicate loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // Load resource on demand
    const promise = this.loadResource(moduleId, resourceType, resourceId);
    this.loadingPromises.set(cacheKey, promise);

    try {
      const resource = await promise;
      this.cache.set(cacheKey, resource);
      return resource;
    } catch (error) {
      console.error(`Failed to load resource ${cacheKey}:`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Load resource from API
   */
  async loadResource(moduleId, resourceType, resourceId) {
    const response = await fetch(`/api/modules/${moduleId}/resources/${resourceType}/${resourceId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to load resource: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Batch load multiple resources
   */
  async loadResourceBatch(moduleId, resourceType, resourceIds) {
    const promises = resourceIds.map(id => this.getResource(moduleId, resourceType, id));
    return Promise.allSettled(promises);
  }

  /**
   * Preload recent resources for a module
   */
  async preloadRecentResources(moduleId) {
    const resourceTypes = ['chats', 'workflows', 'documentation'];

    for (const resourceType of resourceTypes) {
      try {
        const index = await this.getResourceIndex(moduleId, resourceType);
        const recentIds = index.recent?.slice(0, this.options.preloadRecentCount).map(item => item.id) || [];

        // Preload in background without blocking
        this.loadResourceBatch(moduleId, resourceType, recentIds).catch(error => {
          console.warn(`Preload failed for ${moduleId}:${resourceType}:`, error);
        });
      } catch (error) {
        console.warn(`Failed to preload ${resourceType} for ${moduleId}:`, error);
      }
    }
  }

  /**
   * Clean up resources for a module (when deactivated)
   */
  evictModuleResources(moduleId) {
    this.cache.evictByPattern(moduleId);

    // Clear indexes for this module
    const indexKeysToDelete = [];
    for (const key of this.indexes.keys()) {
      if (key.startsWith(`index:${moduleId}:`)) {
        indexKeysToDelete.push(key);
      }
    }
    indexKeysToDelete.forEach(key => this.indexes.delete(key));
  }

  /**
   * Search resources across types for a module
   */
  async searchResources(moduleId, query, resourceTypes = ['chats', 'workflows', 'documentation']) {
    const results = [];

    for (const resourceType of resourceTypes) {
      try {
        const response = await fetch(`/api/modules/${moduleId}/resources/${resourceType}/search?q=${encodeURIComponent(query)}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const typeResults = await response.json();
          results.push(...typeResults.map(item => ({ ...item, resourceType })));
        }
      } catch (error) {
        console.warn(`Search failed for ${resourceType}:`, error);
      }
    }

    return results;
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    return {
      cache: this.cache.getStats(),
      loadingPromises: this.loadingPromises.size,
      indexes: this.indexes.size
    };
  }

  /**
   * Force cache cleanup
   */
  cleanup() {
    this.cache.clear();
    this.loadingPromises.clear();
    this.indexes.clear();
  }
}

// Global instance
let globalResourceManager = null;

export function getResourceManager() {
  if (!globalResourceManager) {
    globalResourceManager = new ResourceManager();
  }
  return globalResourceManager;
}

export default ResourceManager;