# Data Layer Migration Guide

This guide shows how to migrate components from manual data fetching to the new centralized data layer.

## Overview

The new data layer provides:
- ✅ **Automatic caching** - Fetch once, use everywhere
- ✅ **Request deduplication** - Multiple components = 1 network request
- ✅ **Built-in loading/error states** - No manual state management
- ✅ **Automatic refetching** - On window focus, intervals, reconnect
- ✅ **Optimistic updates** - Instant UI feedback
- ✅ **Consistent error handling** - Integrated with `handleAsyncError`

## Core Files

```
src/shared/
├── lib/dataLayer/
│   ├── queryClient.js      # Cache manager
│   └── endpoints.js        # All API definitions
└── hooks/
    ├── useQuery.js         # Data fetching hook
    └── useMutation.js      # Data mutation hook
```

## Migration Patterns

### Pattern 1: Simple Data Fetching

**Before:**
```javascript
import { useEffect, useState } from 'react';

function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch('/api/services', {
          credentials: 'include',
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          throw new Error('Failed to fetch');
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>{/* render data */}</div>;
}
```

**After:**
```javascript
import { useQuery } from '@shared/hooks/useQuery';
import { api, queryKeys } from '@shared/lib/dataLayer/endpoints';

function MyComponent() {
  const { data, isLoading, error } = useQuery(
    queryKeys.services,
    api.services.list,
    { context: 'Loading services' }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>{/* render data */}</div>;
}
```

**Benefits:**
- 20+ lines reduced to 3
- Automatic caching across all components
- Error handling via `handleAsyncError`
- No manual cleanup needed

---

### Pattern 2: Data Mutations (POST/PUT/DELETE)

**Before:**
```javascript
function MyComponent() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (serviceId, credentials) => {
    setIsConnecting(true);
    try {
      const response = await fetch(`/api/services/${serviceId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Connection failed');
      }

      const result = await response.json();

      // Manually refetch services list
      fetchServices();

      alert('Connected!');
    } catch (error) {
      console.error('Connection failed:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <button onClick={() => handleConnect('github', { apiKey: 'xxx' })} disabled={isConnecting}>
      {isConnecting ? 'Connecting...' : 'Connect'}
    </button>
  );
}
```

**After:**
```javascript
import { useMutation, invalidateQueries } from '@shared/hooks/useMutation';
import { api, queryKeys } from '@shared/lib/dataLayer/endpoints';

function MyComponent() {
  const connectMutation = useMutation(
    ({ serviceId, credentials }) => api.services.connect(serviceId, credentials),
    {
      context: 'Connecting service',
      onSuccess: invalidateQueries(queryKeys.services), // Auto-refetch services
    }
  );

  return (
    <button
      onClick={() => connectMutation.mutate({ serviceId: 'github', credentials: { apiKey: 'xxx' } })}
      disabled={connectMutation.isLoading}
    >
      {connectMutation.isLoading ? 'Connecting...' : 'Connect'}
    </button>
  );
}
```

**Benefits:**
- Automatic query invalidation (refetches services list)
- No manual loading state management
- Built-in error toasts
- Cleaner async handling

---

### Pattern 3: Refetching & Polling

**Before:**
```javascript
function TaskStatus({ taskId }) {
  const [task, setTask] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/rigging/status/${taskId}`);
      const data = await response.json();
      setTask(data);

      if (data.status === 'SUCCEEDED' || data.status === 'FAILED') {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [taskId]);

  return <div>Status: {task?.status}</div>;
}
```

**After:**
```javascript
import { useQuery } from '@shared/hooks/useQuery';
import { api, queryKeys } from '@shared/lib/dataLayer/endpoints';

function TaskStatus({ taskId }) {
  const { data: task } = useQuery(
    queryKeys.riggingTask(taskId),
    () => api.rigging.status(taskId),
    {
      refetchInterval: task?.status === 'PENDING' || task?.status === 'IN_PROGRESS' ? 5000 : false,
      context: `Checking rigging task ${taskId}`,
    }
  );

  return <div>Status: {task?.status}</div>;
}
```

**Benefits:**
- Automatic polling with conditional intervals
- Auto-stops when task completes
- Shared cache if multiple components need same task

---

### Pattern 4: Dependent Queries

**Before:**
```javascript
function FileList() {
  const [folderId, setFolderId] = useState('root');
  const [files, setFiles] = useState([]);

  useEffect(() => {
    async function fetchFiles() {
      const response = await fetch(`/api/services/googleDrive/files?folderId=${folderId}`);
      const data = await response.json();
      setFiles(data);
    }
    fetchFiles();
  }, [folderId]);

  return (
    <div>
      <select onChange={(e) => setFolderId(e.target.value)}>
        <option value="root">Root</option>
        <option value="folder1">Folder 1</option>
      </select>
      {/* render files */}
    </div>
  );
}
```

**After:**
```javascript
import { useQuery } from '@shared/hooks/useQuery';
import { api, queryKeys } from '@shared/lib/dataLayer/endpoints';

function FileList() {
  const [folderId, setFolderId] = useState('root');

  const { data: files } = useQuery(
    queryKeys.driveFiles(folderId), // Unique key per folder
    () => api.googleDrive.files(folderId),
    { context: 'Loading Drive files' }
  );

  return (
    <div>
      <select onChange={(e) => setFolderId(e.target.value)}>
        <option value="root">Root</option>
        <option value="folder1">Folder 1</option>
      </select>
      {/* render files */}
    </div>
  );
}
```

**Benefits:**
- Each folder is cached separately
- Switching folders shows cached data instantly
- Background refetch for stale data

---

### Pattern 5: Optimistic Updates

**After only (new pattern):**
```javascript
import { useMutation, optimisticUpdate } from '@shared/hooks/useMutation';
import { api, queryKeys } from '@shared/lib/dataLayer/endpoints';

function ServiceToggle({ serviceId }) {
  const toggleMutation = useMutation(
    (enabled) => api.services[enabled ? 'connect' : 'disconnect'](serviceId),
    {
      onMutate: optimisticUpdate(queryKeys.services, (oldServices, enabled) => ({
        ...oldServices,
        [serviceId]: { connected: enabled },
      })),
      onSuccess: invalidateQueries(queryKeys.services), // Sync with server
    }
  );

  return (
    <button onClick={() => toggleMutation.mutate(true)}>
      Toggle Service
    </button>
  );
}
```

**Benefits:**
- Instant UI feedback (no waiting for server)
- Auto-rollback on error
- Server sync on success

---

## Adding New Endpoints

When you need a new API endpoint:

### 1. Add to `endpoints.js`

```javascript
// src/shared/lib/dataLayer/endpoints.js

export const api = {
  // ... existing endpoints

  myNewService: {
    /**
     * Fetch my data
     * @param {string} id - Entity ID
     * @returns {Promise<Object>}
     */
    get: async (id) => {
      const response = await fetch(`/api/my-service/${id}`, {
        credentials: 'include',
      });
      return parseResponse(response);
    },

    /**
     * Update my data
     * @param {string} id - Entity ID
     * @param {Object} data - Update payload
     * @returns {Promise<Object>}
     */
    update: async (id, data) => {
      const response = await fetch(`/api/my-service/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return parseResponse(response);
    },
  },
};

export const queryKeys = {
  // ... existing keys
  myData: (id) => `my-data-${id}`,
};
```

### 2. Use in Component

```javascript
import { useQuery, useMutation } from '@shared/hooks';
import { api, queryKeys } from '@shared/lib/dataLayer/endpoints';

function MyComponent({ id }) {
  // Fetch data
  const { data, isLoading } = useQuery(
    queryKeys.myData(id),
    () => api.myNewService.get(id)
  );

  // Update data
  const updateMutation = useMutation(
    (newData) => api.myNewService.update(id, newData),
    { onSuccess: invalidateQueries(queryKeys.myData(id)) }
  );

  return (
    <div>
      {isLoading ? 'Loading...' : data.name}
      <button onClick={() => updateMutation.mutate({ name: 'New Name' })}>
        Update
      </button>
    </div>
  );
}
```

---

## Advanced Features

### Conditional Queries

```javascript
const { data } = useQuery(
  queryKeys.services,
  api.services.list,
  { enabled: user?.isAuthenticated } // Only run if authenticated
);
```

### Manual Refetch

```javascript
const { data, refetch } = useQuery(queryKeys.services, api.services.list);

// Later...
<button onClick={refetch}>Refresh</button>
```

### Stale Time

```javascript
const { data } = useQuery(
  queryKeys.services,
  api.services.list,
  { staleTime: 60000 } // Consider fresh for 1 minute
);
```

### Window Focus Refetch

```javascript
const { data } = useQuery(
  queryKeys.services,
  api.services.list,
  { refetchOnWindowFocus: true } // Refetch when user returns to tab
);
```

---

## Migration Checklist

When migrating a component:

- [ ] Import `useQuery` or `useMutation`
- [ ] Import `api` and `queryKeys` from endpoints
- [ ] Replace manual `useState` for data/loading/error
- [ ] Replace manual `useEffect` fetch logic
- [ ] Replace manual error handling with `context` option
- [ ] Add query key to `queryKeys` if needed
- [ ] Add endpoint to `api` if needed
- [ ] Remove manual refetch logic (use `invalidateQueries`)
- [ ] Test loading, error, and success states
- [ ] Verify caching works across components

---

## Troubleshooting

### Query not refetching

Check `staleTime` - data might still be considered fresh:
```javascript
useQuery(key, fn, { staleTime: 0 }) // Always fetch
```

### Data not updating after mutation

Ensure you're invalidating the right query key:
```javascript
useMutation(fn, {
  onSuccess: invalidateQueries(queryKeys.services) // Must match query key
})
```

### Multiple network requests

Ensure all components use the same query key:
```javascript
// ❌ Bad - different keys
useQuery('services-1', api.services.list)
useQuery('services-2', api.services.list)

// ✅ Good - same key
useQuery(queryKeys.services, api.services.list)
useQuery(queryKeys.services, api.services.list)
```

---

## Next Steps

1. Start with simple GET endpoints (services, models)
2. Migrate mutations one at a time
3. Add polling for long-running tasks
4. Use optimistic updates for instant feedback

For questions or issues, check the query client debug info:
```javascript
// In browser console
window.__queryClient.cache // View all cached queries
window.__queryClient.isFetching() // Check if any queries loading
```
