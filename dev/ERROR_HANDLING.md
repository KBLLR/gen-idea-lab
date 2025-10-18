# Error Handling Guide

This document describes the standardized error handling patterns used throughout the GenBooth Idea Lab application.

## Overview

The application uses a centralized error handling system that provides:
- Consistent user feedback via toast notifications
- Automatic error classification (network, auth, validation, etc.)
- Proper loading state management
- Error logging and debugging tools
- React error boundaries for component errors

## Core Utilities

All error handling utilities are available in `src/shared/lib/errorHandler.js`.

### handleAsyncError

The primary error handler that logs errors and shows user-friendly toast notifications.

```javascript
import { handleAsyncError } from '@shared/lib/errorHandler';

try {
  await fetchData();
} catch (error) {
  handleAsyncError(error, {
    context: 'Loading data',
    showToast: true,
    fallbackMessage: 'Failed to load data. Please try again.'
  });
}
```

**Options:**
- `context` (string): Description of what failed (e.g., 'Loading models')
- `showToast` (boolean): Show toast notification (default: true)
- `silent` (boolean): Don't log to console (default: false)
- `fallbackMessage` (string): Custom user-facing error message
- `onError` (function): Custom error handler function
- `severity` ('error' | 'warning'): Toast type (default: 'error')

### withErrorHandling

Wrap an async function with automatic error handling.

```javascript
import { withErrorHandling } from '@shared/lib/errorHandler';

const safeFetchModels = withErrorHandling(
  async () => {
    const response = await fetch('/api/models');
    return response.json();
  },
  { context: 'Loading models', showToast: true }
);

// Use it
await safeFetchModels();
```

### withLoadingAndError

Wrap an async function with loading state management and error handling.

```javascript
import { withLoadingAndError } from '@shared/lib/errorHandler';

const fetchWithLoading = withLoadingAndError(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    loadingKey: 'dataLoading', // Key in Zustand store
    context: 'Loading data'
  }
);
```

This automatically:
- Sets `store.dataLoading = true` before executing
- Handles errors with toast notifications
- Sets `store.dataLoading = false` when done (success or error)

### safeAction

Create a safe version of a Zustand action that catches and handles errors without re-throwing.

```javascript
import { safeAction } from '@shared/lib/errorHandler';

// In store.js
actions: {
  fetchModels: safeAction(async (set, get) => {
    set({ modelsLoading: true });
    const response = await fetch('/api/models');
    const models = await response.json();
    set({ models, modelsLoading: false });
  }, { context: 'Loading models' })
}
```

### safeFetch

A fetch wrapper with built-in error handling.

```javascript
import { safeFetch } from '@shared/lib/errorHandler';

const data = await safeFetch('/api/models', {
  method: 'GET',
  context: 'Loading models',
  showToast: true
});
```

This handles:
- HTTP status errors (non-2xx responses)
- Network errors
- JSON parsing
- Content-type validation

### withRetry

Wrap a function with automatic retry logic for transient failures.

```javascript
import { withRetry } from '@shared/lib/errorHandler';

const fetchWithRetry = withRetry(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    maxRetries: 3,
    delay: 1000, // ms
    shouldRetry: (error) => error.message.includes('Network')
  }
);
```

## React Error Boundaries

For catching errors during React rendering, use the ErrorBoundary component.

```javascript
import ErrorBoundary from '@shared/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      context="MyApp"
      fallbackMessage="Something went wrong in MyApp"
      onError={(error, errorInfo) => {
        // Custom error handling
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

**Props:**
- `context` (string): Error context for logging
- `fallback` (ReactNode): Custom fallback UI
- `fallbackMessage` (string): Message to show in default fallback
- `showToast` (boolean): Show toast notification (default: true)
- `onError` (function): Custom error handler

### Custom Fallback UI

```javascript
import ErrorBoundary, { ErrorFallback } from '@shared/components/ErrorBoundary';

<ErrorBoundary fallback={<ErrorFallback />}>
  <MyComponent />
</ErrorBoundary>
```

## Error Types

The system automatically classifies errors:

- **NETWORK**: Fetch failures, connection issues
- **AUTH**: 401/403 status, authentication failures
- **VALIDATION**: 400 status, invalid input
- **NOT_FOUND**: 404 status, missing resources
- **SERVER**: 5xx status, server errors
- **UNKNOWN**: Unclassified errors

Each type has a user-friendly default message:

```javascript
import { ErrorTypes, classifyError, getUserMessage } from '@shared/lib/errorHandler';

const errorType = classifyError(error); // Returns ErrorTypes.NETWORK, etc.
const message = getUserMessage(error); // Returns user-friendly message
```

## Best Practices

### 1. Always Handle Errors in Async Operations

❌ **Bad:**
```javascript
export const fetchModels = async () => {
  const response = await fetch('/api/models');
  const models = await response.json();
  set({ models });
};
```

✅ **Good:**
```javascript
import { handleAsyncError } from '@shared/lib/errorHandler';

export const fetchModels = async () => {
  try {
    const response = await fetch('/api/models');
    const models = await response.json();
    set({ models });
  } catch (error) {
    handleAsyncError(error, {
      context: 'Loading models',
      showToast: true
    });
  }
};
```

### 2. Clear Loading States on Error

❌ **Bad:**
```javascript
set({ loading: true });
const data = await fetchData(); // If this throws, loading stays true!
set({ data, loading: false });
```

✅ **Good:**
```javascript
set({ loading: true });
try {
  const data = await fetchData();
  set({ data });
} catch (error) {
  handleAsyncError(error, { context: 'Fetching data' });
} finally {
  set({ loading: false });
}
```

Or use the helper:
```javascript
const fetchWithLoading = withLoadingAndError(
  fetchData,
  { loadingKey: 'loading', context: 'Fetching data' }
);
await fetchWithLoading();
```

### 3. Use Appropriate Error Context

Provide clear, user-facing context for errors:

✅ **Good contexts:**
- "Loading models"
- "Saving character"
- "Connecting to Google Drive"
- "Generating 3D model"

❌ **Bad contexts:**
- "Error in function X" (too technical)
- "Failed" (too vague)
- "fetchModels" (function name, not user-facing)

### 4. Wrap Critical UI Components in Error Boundaries

```javascript
// App.jsx
import ErrorBoundary from '@shared/components/ErrorBoundary';

<ErrorBoundary context="Application Root">
  <Routes>
    <Route path="/chat" element={
      <ErrorBoundary context="Chat App">
        <Chat />
      </ErrorBoundary>
    } />
  </Routes>
</ErrorBoundary>
```

### 5. Use Custom Messages for User-Facing Operations

```javascript
handleAsyncError(error, {
  context: 'Saving character',
  fallbackMessage: 'Failed to save character. Your changes may not be saved.',
  showToast: true
});
```

## Migration Examples

### Before: Console-only Error Handling

```javascript
try {
  const response = await fetch('/api/data');
  const data = await response.json();
  set({ data });
} catch (error) {
  console.error('Failed to fetch data:', error);
}
```

### After: Standardized Error Handling

```javascript
import { handleAsyncError } from '@shared/lib/errorHandler';

try {
  const response = await fetch('/api/data');
  const data = await response.json();
  set({ data });
} catch (error) {
  handleAsyncError(error, {
    context: 'Loading data',
    showToast: true
  });
}
```

### Before: No Loading State Management

```javascript
const fetchData = async () => {
  set({ loading: true });
  const data = await fetch('/api/data').then(r => r.json());
  set({ data, loading: false });
};
```

### After: Automatic Loading State Management

```javascript
import { withLoadingAndError } from '@shared/lib/errorHandler';

const fetchData = withLoadingAndError(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  { loadingKey: 'loading', context: 'Loading data' }
);
```

## Testing Error Handling

Test error scenarios in development:

```javascript
// Simulate network error
throw new Error('Failed to fetch');

// Simulate auth error
throw Object.assign(new Error('Unauthorized'), { status: 401 });

// Simulate validation error
throw Object.assign(new Error('Invalid input'), { status: 400 });
```

## Debugging

All errors are logged to the console with context:

```
[Error - Loading models] Error: Failed to fetch
```

In development, error details are shown in the ErrorBoundary fallback UI.

## Related Files

- `src/shared/lib/errorHandler.js` - Core utilities
- `src/shared/components/ErrorBoundary.jsx` - React error boundary
- `src/shared/lib/store.js` (lines 76-94) - Toast notification system
- `src/shared/lib/actions/assistantActions.js` - Example usage

## See Also

- [Data Flow Architecture](./DATA_FLOW_ARCHITECTURE.md)
- [Store Documentation](./STORE.md)
- Toast system in `src/shared/lib/store.js`
