/**
 * @file Standardized error handling utilities for consistent user feedback
 * @description Centralized error handling with automatic classification and toast notifications
 *
 * @example
 * import { handleAsyncError, withErrorHandling } from '@shared/lib/errorHandler';
 *
 * // In action:
 * try {
 *   await fetchData();
 * } catch (err) {
 *   handleAsyncError(err, { context: 'fetchData', showToast: true });
 * }
 *
 * // Or wrap async function:
 * const safeFetch = withErrorHandling(fetchData, {
 *   context: 'Fetching data',
 *   silent: false
 * });
 */

/**
 * @typedef {'network' | 'auth' | 'validation' | 'not_found' | 'server' | 'unknown'} ErrorType
 */

/**
 * @typedef {(...args: any[]) => Promise<any>} AsyncFunction
 */

/**
 * @typedef {Object} GetUserMessageOptions
 * @property {string} [fallback] - Fallback message to use instead of default
 * @property {boolean} [includeDetails=false] - Include technical error details
 */

/**
 * @typedef {Object} ErrorHandlerOptions
 * @property {string} [context] - Context description (e.g., 'Loading models')
 * @property {boolean} [showToast=true] - Show toast notification
 * @property {boolean} [silent=false] - Don't log to console
 * @property {string} [fallbackMessage] - Custom error message
 * @property {Function} [onError] - Custom error handler
 * @property {'error' | 'warning'} [severity='error'] - Toast type
 */

/**
 * @typedef {Object} ErrorHandlerResult
 * @property {Error} error - Original error object
 * @property {ErrorType} type - Classified error type
 * @property {string} message - User-friendly error message
 */

/**
 * @typedef {Object} LoadingErrorOptions
 * @property {string} [loadingKey] - Store key toggled while the async function runs
 * @property {string} [context] - Context to display in error logs/toasts
 * @property {boolean} [showToast=true] - Whether to emit a toast when an error occurs
 */

/**
 * @typedef {Object} RetryOptions
 * @property {number} [maxRetries=3] - Maximum retry attempts
 * @property {number} [delay=1000] - Delay between retries in milliseconds
 * @property {(error: Error) => boolean} [shouldRetry] - Predicate to determine if retry should occur
 */

/**
 * @typedef {RequestInit & {
 *   context?: string,
 *   showToast?: boolean,
 *   fallbackMessage?: string
 * }} SafeFetchOptions
 */

import useStore from './store.js';

/**
 * Error type classification
 */
export const ErrorTypes = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  UNKNOWN: 'unknown',
};

/**
 * User-friendly error messages by type
 */
const ERROR_MESSAGES = {
  [ErrorTypes.NETWORK]: 'Network error. Please check your connection.',
  [ErrorTypes.AUTH]: 'Authentication failed. Please log in again.',
  [ErrorTypes.VALIDATION]: 'Invalid input. Please check your data.',
  [ErrorTypes.NOT_FOUND]: 'Requested resource not found.',
  [ErrorTypes.SERVER]: 'Server error. Please try again later.',
  [ErrorTypes.UNKNOWN]: 'Something went wrong. Please try again.',
};

/**
 * Classify error based on error object properties
 * @param {Error | null | undefined} error - The error to classify
 * @returns {ErrorType} Classified error type
 * @example
 * const error = new Error('Failed to fetch');
 * const type = classifyError(error); // Returns 'network'
 */
export function classifyError(error) {
  if (!error) return ErrorTypes.UNKNOWN;

  const message = error.message || '';
  const status = error.status || error.statusCode;

  // Network errors
  if (message.includes('fetch') || message.includes('Network') || message === 'Failed to fetch') {
    return ErrorTypes.NETWORK;
  }

  // Auth errors
  if (status === 401 || status === 403 || message.includes('Unauthorized') || message.includes('authentication')) {
    return ErrorTypes.AUTH;
  }

  // Validation errors
  if (status === 400 || message.includes('validation') || message.includes('invalid')) {
    return ErrorTypes.VALIDATION;
  }

  // Not found
  if (status === 404 || message.includes('not found') || message.includes('endpoint not available')) {
    return ErrorTypes.NOT_FOUND;
  }

  // Server errors
  if (status >= 500 || message.includes('server error')) {
    return ErrorTypes.SERVER;
  }

  return ErrorTypes.UNKNOWN;
}

/**
 * Get user-friendly error message based on error classification
 * @param {Error} error - The error object
 * @param {GetUserMessageOptions} [options] - Message options
 * @returns {string} User-friendly error message
 * @example
 * const error = new Error('Network request failed');
 * const message = getUserMessage(error, { includeDetails: true });
 * // Returns: "Network error. Please check your connection. (Network request failed)"
 */
export function getUserMessage(error, options = {}) {
  const { fallback, includeDetails = false } = options;

  const errorType = classifyError(error);
  const baseMessage = ERROR_MESSAGES[errorType];

  if (fallback) {
    return fallback;
  }

  if (includeDetails && error.message) {
    return `${baseMessage} (${error.message})`;
  }

  return baseMessage;
}

/**
 * Handle async errors with consistent logging and user feedback
 * @param {Error} error - The error to handle
 * @param {ErrorHandlerOptions} [options] - Configuration options
 * @returns {ErrorHandlerResult} Error handling result with type and message
 * @example
 * try {
 *   await fetchData();
 * } catch (error) {
 *   handleAsyncError(error, {
 *     context: 'Loading data',
 *     showToast: true,
 *     fallbackMessage: 'Failed to load data. Please try again.'
 *   });
 * }
 */
export function handleAsyncError(error, options = {}) {
  const {
    context = 'Operation',
    showToast = true,
    silent = false,
    fallbackMessage,
    onError,
    severity = 'error',
  } = options;

  // Log to console
  if (!silent) {
    const prefix = `[Error${context ? ` - ${context}` : ''}]`;
    console.error(prefix, error);
  }

  // Get user-friendly message
  const userMessage = fallbackMessage || getUserMessage(error);

  // Show toast notification
  if (showToast) {
    const toastType = severity === 'warning' ? 'warning' : 'error';
    useStore.getState().showToast(userMessage, toastType);
  }

  // Call custom error handler if provided
  if (onError && typeof onError === 'function') {
    try {
      onError(error);
    } catch (handlerError) {
      console.error('[Error Handler] Custom error handler failed:', handlerError);
    }
  }

  return {
    error,
    type: classifyError(error),
    message: userMessage,
  };
}

/**
 * Wrap an async function with automatic error handling
 * @param {AsyncFunction} asyncFn - Async function to wrap
 * @param {ErrorHandlerOptions} [options] - Error handling options (same as handleAsyncError)
 * @returns {AsyncFunction} Wrapped function
 *
 * @example
 * const safeFetchModels = withErrorHandling(
 *   async () => { ... },
 *   { context: 'Loading models', showToast: true }
 * );
 * await safeFetchModels();
 */
export function withErrorHandling(asyncFn, options = {}) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleAsyncError(error, options);
      // Re-throw so caller can handle if needed
      throw error;
    }
  };
}

/**
 * Wrap an async function with loading state management and error handling
 * @param {AsyncFunction} asyncFn - Async function to wrap
 * @param {LoadingErrorOptions} [options] - Configuration
 * @returns {AsyncFunction} Wrapped function
 *
 * @example
 * const fetchWithLoading = withLoadingAndError(
 *   async () => { ... },
 *   { loadingKey: 'modelsLoading', context: 'Loading models' }
 * );
 */
export function withLoadingAndError(asyncFn, options = {}) {
  const { loadingKey, context, showToast = true } = options;

  return async (...args) => {
    const store = useStore.getState();

    // Set loading state
    if (loadingKey && store[loadingKey] !== undefined) {
      store[loadingKey] = true;
    }

    try {
      const result = await asyncFn(...args);
      return result;
    } catch (error) {
      handleAsyncError(error, { context, showToast });
      throw error;
    } finally {
      // Clear loading state
      if (loadingKey && store[loadingKey] !== undefined) {
        store[loadingKey] = false;
      }
    }
  };
}

/**
 * Create a safe version of an action that catches and handles errors
 * @param {AsyncFunction} actionFn - Store action function
 * @param {ErrorHandlerOptions} [options] - Error handling options
 * @returns {AsyncFunction} Safe action
 *
 * @example
 * // In store actions:
 * fetchModels: safeAction(async (set, get) => {
 *   set({ modelsLoading: true });
 *   const models = await fetch('/api/models').then(r => r.json());
 *   set({ models, modelsLoading: false });
 * }, { context: 'Loading models' })
 */
export function safeAction(actionFn, options = {}) {
  return async (...args) => {
    try {
      return await actionFn(...args);
    } catch (error) {
      handleAsyncError(error, options);
      // Don't re-throw in actions - errors are already handled
      return null;
    }
  };
}

/**
 * Retry wrapper for flaky operations
 * @param {AsyncFunction} asyncFn - Function to retry
 * @param {RetryOptions} [options] - Retry options
 * @returns {AsyncFunction} Wrapped function with retry logic
 */
export function withRetry(asyncFn, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    shouldRetry = (error) => classifyError(error) === ErrorTypes.NETWORK,
  } = options;

  return async (...args) => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await asyncFn(...args);
      } catch (error) {
        lastError = error;

        // Don't retry if this is the last attempt or error is not retryable
        if (attempt === maxRetries || !shouldRetry(error)) {
          break;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }

    throw lastError;
  };
}

/**
 * Fetch wrapper with built-in error handling
 * @param {string} url - URL to fetch
 * @param {SafeFetchOptions} [options] - Fetch options + error handling options
 * @returns {Promise<any>} Response data
 *
 * @example
 * const data = await safeFetch('/api/models', {
 *   method: 'GET',
 *   context: 'Loading models',
 *   showToast: true
 * });
 */
export async function safeFetch(url, options = {}) {
  const {
    context = `Fetching ${url}`,
    showToast = true,
    fallbackMessage,
    ...fetchOptions
  } = options;

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.statusCode = response.status;
      throw error;
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    handleAsyncError(error, { context, showToast, fallbackMessage });
    throw error;
  }
}

export default {
  handleAsyncError,
  withErrorHandling,
  withLoadingAndError,
  safeAction,
  withRetry,
  safeFetch,
  classifyError,
  getUserMessage,
  ErrorTypes,
};
