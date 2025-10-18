/**
 * @file useQuery - React hook for declarative data fetching with caching
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { queryClient } from '@shared/lib/dataLayer/queryClient.js';
import { handleAsyncError } from '@shared/lib/errorHandler.js';

/**
 * Query options
 * @typedef {Object} UseQueryOptions
 * @property {boolean} [enabled=true] - Whether query should run automatically
 * @property {number} [staleTime=0] - Time in ms before data is considered stale
 * @property {number} [cacheTime=300000] - Time in ms to keep unused data in cache (5 min default)
 * @property {number} [refetchInterval] - Interval in ms to automatically refetch
 * @property {boolean} [refetchOnWindowFocus=false] - Refetch when window regains focus
 * @property {boolean} [refetchOnReconnect=true] - Refetch when connection is restored
 * @property {string} [context] - Error context for handleAsyncError
 * @property {boolean} [showToast=true] - Whether to show error toast
 * @property {string} [fallbackMessage] - Fallback error message
 * @property {Function} [onSuccess] - Callback when query succeeds
 * @property {Function} [onError] - Callback when query fails
 */

/**
 * Query result
 * @typedef {Object} UseQueryResult
 * @property {any} data - Query data
 * @property {boolean} isLoading - Whether query is loading
 * @property {boolean} isFetching - Whether query is actively fetching
 * @property {boolean} isError - Whether query has errored
 * @property {boolean} isSuccess - Whether query succeeded
 * @property {string|null} error - Error message
 * @property {Function} refetch - Manually trigger refetch
 * @property {number} dataUpdatedAt - Timestamp of last successful fetch
 */

/**
 * React hook for data fetching with automatic caching and state management
 * @param {string} queryKey - Unique identifier for this query
 * @param {Function} queryFn - Async function that returns data
 * @param {UseQueryOptions} [options={}] - Query configuration
 * @returns {UseQueryResult}
 */
export function useQuery(queryKey, queryFn, options = {}) {
  const {
    enabled = true,
    staleTime = 0,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    refetchInterval,
    refetchOnWindowFocus = false,
    refetchOnReconnect = true,
    context,
    showToast = true,
    fallbackMessage,
    onSuccess,
    onError,
  } = options;

  const [, forceUpdate] = useState(0);
  const isMountedRef = useRef(true);
  const refetchIntervalRef = useRef(null);

  // Get query from cache
  const query = queryClient.getQuery(queryKey) || {
    data: undefined,
    status: 'idle',
    error: null,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    promise: null,
    refetchCount: 0,
  };

  /**
   * Execute the query function
   */
  const executeQuery = useCallback(async () => {
    // If there's already a pending request, return its promise (deduplication)
    if (query.promise) {
      return query.promise;
    }

    // Mark as loading
    queryClient.setQuery(queryKey, {
      status: 'loading',
      error: null,
    });

    // Create promise for deduplication
    const promise = (async () => {
      try {
        const data = await queryFn();

        if (isMountedRef.current) {
          queryClient.setQuery(queryKey, {
            data,
            status: 'success',
            error: null,
            dataUpdatedAt: Date.now(),
            promise: null,
            refetchCount: query.refetchCount + 1,
          });

          // Call onSuccess callback
          if (onSuccess) {
            onSuccess(data);
          }
        }

        return data;
      } catch (err) {
        const errorResult = handleAsyncError(err, {
          context: context || `Fetching ${queryKey}`,
          showToast,
          fallbackMessage,
          silent: false,
        });

        if (isMountedRef.current) {
          queryClient.setQuery(queryKey, {
            status: 'error',
            error: errorResult.message,
            errorUpdatedAt: Date.now(),
            promise: null,
          });

          // Call onError callback
          if (onError) {
            onError(err);
          }
        }

        throw err;
      }
    })();

    queryClient.setQuery(queryKey, { promise });

    return promise;
  }, [queryKey, queryFn, context, showToast, fallbackMessage, onSuccess, onError]);

  /**
   * Refetch query (manual trigger)
   */
  const refetch = useCallback(() => {
    return executeQuery();
  }, [executeQuery]);

  // Subscribe to query client changes
  useEffect(() => {
    const unsubscribe = queryClient.subscribe(() => {
      if (isMountedRef.current) {
        forceUpdate(n => n + 1);
      }
    });

    return unsubscribe;
  }, []);

  // Initial fetch or when enabled changes
  useEffect(() => {
    if (!enabled) return;

    const cachedQuery = queryClient.getQuery(queryKey);

    // Determine if we should fetch
    const shouldFetch =
      !cachedQuery || // No cached data
      cachedQuery.status === 'idle' || // Never fetched
      cachedQuery.status === 'error' || // Previous error
      (cachedQuery.status === 'success' &&
       Date.now() - cachedQuery.dataUpdatedAt > staleTime); // Data is stale

    if (shouldFetch) {
      executeQuery();
    }
  }, [queryKey, enabled, staleTime, executeQuery]);

  // Auto-refetch interval
  useEffect(() => {
    if (!enabled || !refetchInterval) return;

    queryClient.setupRefetchInterval(queryKey, refetchInterval, refetch);

    return () => {
      queryClient.clearRefetchInterval(queryKey);
    };
  }, [queryKey, enabled, refetchInterval, refetch]);

  // Refetch on window focus
  useEffect(() => {
    if (!enabled || !refetchOnWindowFocus) return;

    const handleFocus = () => {
      const cachedQuery = queryClient.getQuery(queryKey);
      if (cachedQuery && cachedQuery.status === 'success') {
        // Only refetch if data is stale
        if (Date.now() - cachedQuery.dataUpdatedAt > staleTime) {
          refetch();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryKey, enabled, refetchOnWindowFocus, staleTime, refetch]);

  // Refetch on reconnect
  useEffect(() => {
    if (!enabled || !refetchOnReconnect) return;

    const handleOnline = () => {
      const cachedQuery = queryClient.getQuery(queryKey);
      if (cachedQuery && cachedQuery.status === 'error') {
        refetch();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [queryKey, enabled, refetchOnReconnect, refetch]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Schedule cache cleanup after cacheTime
      if (cacheTime > 0) {
        setTimeout(() => {
          // Only remove if no other components are using this query
          queryClient.removeQuery(queryKey);
        }, cacheTime);
      }
    };
  }, [queryKey, cacheTime]);

  return {
    data: query.data,
    isLoading: query.status === 'loading' && !query.data, // Initial load
    isFetching: query.status === 'loading', // Any fetch
    isError: query.status === 'error',
    isSuccess: query.status === 'success',
    error: query.error,
    refetch,
    dataUpdatedAt: query.dataUpdatedAt,
  };
}
