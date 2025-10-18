/**
 * @file queryClient - Centralized query cache and request management
 * @license SPDX-License-Identifier: Apache-2.0
 */

/**
 * Query state
 * @typedef {'idle'|'loading'|'success'|'error'} QueryStatus
 */

/**
 * Query cache entry
 * @typedef {Object} QueryCacheEntry
 * @property {any} data - Cached data
 * @property {QueryStatus} status - Current query status
 * @property {string|null} error - Error message if status is 'error'
 * @property {number} dataUpdatedAt - Timestamp when data was last updated
 * @property {number} errorUpdatedAt - Timestamp when error occurred
 * @property {Promise|null} promise - Active promise for request deduplication
 * @property {number} refetchCount - Number of times refetched
 */

/**
 * Query client for managing cached queries and request deduplication
 */
class QueryClient {
  constructor() {
    /** @type {Map<string, QueryCacheEntry>} */
    this.cache = new Map();

    /** @type {Set<Function>} */
    this.listeners = new Set();

    /** @type {Map<string, NodeJS.Timeout>} */
    this.refetchIntervals = new Map();
  }

  /**
   * Subscribe to query changes
   * @param {Function} listener - Callback for cache updates
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of cache change
   */
  notify() {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Get query from cache
   * @param {string} queryKey - Unique query identifier
   * @returns {QueryCacheEntry|undefined}
   */
  getQuery(queryKey) {
    return this.cache.get(queryKey);
  }

  /**
   * Set query in cache
   * @param {string} queryKey - Unique query identifier
   * @param {Partial<QueryCacheEntry>} updates - Updates to apply
   */
  setQuery(queryKey, updates) {
    const existing = this.cache.get(queryKey) || {
      data: undefined,
      status: 'idle',
      error: null,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      promise: null,
      refetchCount: 0,
    };

    this.cache.set(queryKey, { ...existing, ...updates });
    this.notify();
  }

  /**
   * Invalidate a query (mark as stale, will refetch on next access)
   * @param {string} queryKey - Query to invalidate
   */
  invalidateQuery(queryKey) {
    const query = this.cache.get(queryKey);
    if (query) {
      this.cache.delete(queryKey);
      this.notify();
    }
  }

  /**
   * Invalidate all queries matching a prefix
   * @param {string} prefix - Query key prefix to match
   */
  invalidateQueries(prefix) {
    const keysToInvalidate = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToInvalidate.push(key);
      }
    }
    keysToInvalidate.forEach(key => this.invalidateQuery(key));
  }

  /**
   * Remove a query from cache
   * @param {string} queryKey - Query to remove
   */
  removeQuery(queryKey) {
    this.cache.delete(queryKey);

    // Clear any active refetch interval
    const interval = this.refetchIntervals.get(queryKey);
    if (interval) {
      clearInterval(interval);
      this.refetchIntervals.delete(queryKey);
    }

    this.notify();
  }

  /**
   * Clear all cached queries
   */
  clear() {
    this.cache.clear();

    // Clear all refetch intervals
    for (const interval of this.refetchIntervals.values()) {
      clearInterval(interval);
    }
    this.refetchIntervals.clear();

    this.notify();
  }

  /**
   * Get all queries with a specific status
   * @param {QueryStatus} status - Status to filter by
   * @returns {Array<{key: string, query: QueryCacheEntry}>}
   */
  getQueriesByStatus(status) {
    const queries = [];
    for (const [key, query] of this.cache.entries()) {
      if (query.status === status) {
        queries.push({ key, query });
      }
    }
    return queries;
  }

  /**
   * Check if any queries are currently loading
   * @returns {boolean}
   */
  isFetching() {
    return this.getQueriesByStatus('loading').length > 0;
  }

  /**
   * Set up automatic refetching for a query
   * @param {string} queryKey - Query to refetch
   * @param {number} intervalMs - Refetch interval in milliseconds
   * @param {Function} refetchFn - Function to call for refetch
   */
  setupRefetchInterval(queryKey, intervalMs, refetchFn) {
    // Clear existing interval if any
    const existing = this.refetchIntervals.get(queryKey);
    if (existing) {
      clearInterval(existing);
    }

    // Set up new interval
    const interval = setInterval(() => {
      refetchFn();
    }, intervalMs);

    this.refetchIntervals.set(queryKey, interval);
  }

  /**
   * Clear refetch interval for a query
   * @param {string} queryKey - Query key
   */
  clearRefetchInterval(queryKey) {
    const interval = this.refetchIntervals.get(queryKey);
    if (interval) {
      clearInterval(interval);
      this.refetchIntervals.delete(queryKey);
    }
  }
}

// Global singleton instance
export const queryClient = new QueryClient();

// Export for testing/debugging
if (typeof window !== 'undefined') {
  window.__queryClient = queryClient;
}
