/**
 * @file useMutation - React hook for data mutations (POST, PUT, DELETE)
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { queryClient } from '@shared/lib/dataLayer/queryClient.js';
import { handleAsyncError } from '@shared/lib/errorHandler.js';

/**
 * Mutation options
 * @typedef {Object} UseMutationOptions
 * @property {Function} [onSuccess] - Callback when mutation succeeds
 * @property {Function} [onError] - Callback when mutation fails
 * @property {Function} [onSettled] - Callback when mutation completes (success or error)
 * @property {string} [context] - Error context for handleAsyncError
 * @property {boolean} [showToast=true] - Whether to show error toast
 * @property {string} [fallbackMessage] - Fallback error message
 */

/**
 * Mutation result
 * @typedef {Object} UseMutationResult
 * @property {Function} mutate - Trigger mutation with variables
 * @property {Function} mutateAsync - Trigger mutation and return promise
 * @property {boolean} isLoading - Whether mutation is in progress
 * @property {boolean} isError - Whether mutation has errored
 * @property {boolean} isSuccess - Whether mutation succeeded
 * @property {string|null} error - Error message
 * @property {any} data - Mutation result data
 * @property {Function} reset - Reset mutation state
 */

/**
 * React hook for data mutations with automatic error handling
 * @param {Function} mutationFn - Async function that performs mutation
 * @param {UseMutationOptions} [options={}] - Mutation configuration
 * @returns {UseMutationResult}
 */
export function useMutation(mutationFn, options = {}) {
  const {
    onSuccess,
    onError,
    onSettled,
    context,
    showToast = true,
    fallbackMessage,
  } = options;

  const [state, setState] = useState({
    status: 'idle',
    data: undefined,
    error: null,
  });

  /**
   * Reset mutation state
   */
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      data: undefined,
      error: null,
    });
  }, []);

  /**
   * Execute mutation (async with promise return)
   */
  const mutateAsync = useCallback(
    async (variables) => {
      setState({
        status: 'loading',
        data: undefined,
        error: null,
      });

      try {
        const data = await mutationFn(variables);

        setState({
          status: 'success',
          data,
          error: null,
        });

        // Call onSuccess callback
        if (onSuccess) {
          onSuccess(data, variables);
        }

        // Call onSettled callback
        if (onSettled) {
          onSettled(data, null, variables);
        }

        return data;
      } catch (err) {
        const errorResult = handleAsyncError(err, {
          context: context || 'Mutation',
          showToast,
          fallbackMessage,
          silent: false,
        });

        setState({
          status: 'error',
          data: undefined,
          error: errorResult.message,
        });

        // Call onError callback
        if (onError) {
          onError(err, variables);
        }

        // Call onSettled callback
        if (onSettled) {
          onSettled(undefined, err, variables);
        }

        throw err;
      }
    },
    [mutationFn, context, showToast, fallbackMessage, onSuccess, onError, onSettled]
  );

  /**
   * Execute mutation (fire and forget)
   */
  const mutate = useCallback(
    (variables, mutationOptions = {}) => {
      mutateAsync(variables).catch((err) => {
        // Error already handled by mutateAsync, but log for debugging
        console.error('[useMutation] Mutation failed:', err);
      });

      // If mutation-specific callbacks provided, they override hook-level ones
      if (mutationOptions.onSuccess) {
        state.data && mutationOptions.onSuccess(state.data, variables);
      }
      if (mutationOptions.onError) {
        state.error && mutationOptions.onError(state.error, variables);
      }
    },
    [mutateAsync, state.data, state.error]
  );

  return {
    mutate,
    mutateAsync,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
    isIdle: state.status === 'idle',
    error: state.error,
    data: state.data,
    status: state.status,
    reset,
  };
}

/**
 * Helper: Invalidate queries after successful mutation
 * @param {string|string[]} queryKeys - Query keys to invalidate
 * @returns {Function} onSuccess callback for useMutation
 */
export function invalidateQueries(queryKeys) {
  return () => {
    const keys = Array.isArray(queryKeys) ? queryKeys : [queryKeys];
    keys.forEach((key) => {
      queryClient.invalidateQuery(key);
    });
  };
}

/**
 * Helper: Update query data optimistically
 * @param {string} queryKey - Query key to update
 * @param {Function} updater - Function that receives old data and returns new data
 * @returns {Function} onMutate callback for useMutation
 */
export function optimisticUpdate(queryKey, updater) {
  return (variables) => {
    const query = queryClient.getQuery(queryKey);
    if (query && query.data) {
      const newData = updater(query.data, variables);
      queryClient.setQuery(queryKey, {
        data: newData,
        dataUpdatedAt: Date.now(),
      });
    }
  };
}
