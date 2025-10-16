/**
 * ErrorBoundary.jsx
 * React Error Boundary for catching and handling component errors
 *
 * Usage:
 *   import ErrorBoundary from '@shared/components/ErrorBoundary';
 *
 *   <ErrorBoundary fallback={<ErrorFallback />}>
 *     <MyComponent />
 *   </ErrorBoundary>
 */

import React from 'react';
import { handleAsyncError } from '../lib/errorHandler.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('[ErrorBoundary] Component error caught:', error, errorInfo);

    // Store error info for display
    this.setState({ errorInfo });

    // Use standard error handler
    handleAsyncError(error, {
      context: this.props.context || 'Component',
      showToast: this.props.showToast !== false,
      silent: false,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--color-text-primary, #333)',
        }}>
          <h2>Something went wrong</h2>
          <p style={{ color: 'var(--color-text-secondary, #666)' }}>
            {this.props.fallbackMessage || 'An error occurred while rendering this component.'}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '1rem',
              textAlign: 'left',
              padding: '1rem',
              background: 'var(--color-surface, #f5f5f5)',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Error Details
              </summary>
              <pre style={{
                marginTop: '0.5rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: 'var(--color-accent, #007bff)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary (for functional components that need error handling)
 * Note: This doesn't catch errors in the component itself, only in async operations
 */
export function useErrorHandler() {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}

/**
 * Default error fallback component
 */
export function ErrorFallback({ error, resetError }) {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      color: 'var(--color-text-primary, #333)',
    }}>
      <h2>Oops! Something went wrong</h2>
      <p style={{ color: 'var(--color-text-secondary, #666)', marginTop: '0.5rem' }}>
        We encountered an unexpected error. Please try again.
      </p>
      {resetError && (
        <button
          onClick={resetError}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: 'var(--color-accent, #007bff)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorBoundary;
