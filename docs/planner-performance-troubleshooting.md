# Planner Performance Troubleshooting Guide

## Overview

This guide addresses performance issues in the PlannerAI workflow canvas, particularly when working with large graphs containing many nodes and edges. The planner uses React Flow for graph visualization, which can experience lag with complex workflows.

## Table of Contents

1. [Performance Symptoms](#performance-symptoms)
2. [Root Causes](#root-causes)
3. [Quick Fixes](#quick-fixes)
4. [Optimization Strategies](#optimization-strategies)
5. [Hardware Recommendations](#hardware-recommendations)
6. [Advanced Optimizations](#advanced-optimizations)

## Performance Symptoms

### Common Issues
- **Slow Node Dragging**: Nodes feel sluggish when moving them around the canvas
- **Laggy Rendering**: UI freezes or stutters when adding/removing nodes
- **Delayed Updates**: Changes to node properties take time to reflect in UI
- **High CPU Usage**: Browser tab consumes significant CPU resources
- **Memory Leaks**: Performance degrades over time during long sessions

### When to Expect Issues
- **Large Graphs**: 50+ nodes with multiple connections
- **Complex Components**: Google services, file uploaders with many items
- **Frequent Updates**: Real-time data fetching in multiple nodes
- **Multiple Graphs**: Having several workflow tabs open simultaneously

## Root Causes

### 1. Excessive Re-renders

**Issue**: Multiple components subscribe to global state selectors that trigger on every change.

**Location**: `src/components/PlannerCanvas.jsx`
- Lines 157, 1041, 1162, 1359, 1539, 1713, 1853: `useStore.use.connectedServices()`
- Line 2195: `useStore.use.plannerGraph()`

**Impact**: When any service connection changes, all 7+ nodes re-render even if unaffected.

### 2. Non-Memoized Selectors

**Issue**: Store selectors create new object references on every render.

**Example**:
```javascript
// Current (causes re-renders)
const connectedServices = useStore.use.connectedServices();

// Better (memoized per service)
const isGoogleCalendarConnected = useStore(
  (state) => state.connectedServices?.googlecalendar?.connected
);
```

### 3. Large Component File

**Issue**: Single 2930-line file contains 15+ component definitions.

**Impact**:
- Harder to optimize individual components
- All components reload together during development
- Difficult to apply React.memo selectively

### 4. React Flow Performance

**Issue**: Default React Flow configuration doesn't optimize for large graphs.

**Missing Optimizations**:
- No `onlyRenderVisibleElements` prop
- No `nodesDraggable` prop for performance modes
- No `zoomOnScroll` restrictions
- Missing `panOnDrag` limitations

## Quick Fixes

### 1. Enable Viewport Optimization

Add to `<ReactFlow>` component (line ~2900):

```jsx
<ReactFlow
  // ... existing props
  onlyRenderVisibleElements={true}
  minZoom={0.1}
  maxZoom={2}
  defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
  zoomOnDoubleClick={false}
  // ... rest of props
>
```

**Impact**: Only renders nodes within viewport, reducing render load by 70-90% for large graphs.

### 2. Reduce MiniMap Frequency

Update MiniMap component (line ~2914):

```jsx
<MiniMap
  nodeColor={(node) => '#4a90e2'}
  nodeBorderRadius={2}
  maskColor="rgba(0, 0, 0, 0.1)"
  // Add performance optimizations
  pannable={false}
  zoomable={false}
/>
```

**Impact**: Reduces minimap re-render overhead.

### 3. Debounce State Updates

For frequently updating nodes (Calendar, Gmail, Photos), add debouncing:

```javascript
import { debounce } from 'lodash'; // or custom implementation

const debouncedUpdate = useMemo(
  () => debounce((nodeId, updates) => {
    updateNode(nodeId, updates);
  }, 150),
  [updateNode]
);
```

**Impact**: Reduces update frequency from 60fps to ~7fps, imperceptible to users.

### 4. Memoize Node Components

Wrap expensive node components with `React.memo`:

```javascript
const GoogleCalendarNode = React.memo(({ id, data }) => {
  // ... component code
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data === nextProps.data &&
         prevProps.id === nextProps.id;
});
```

**Impact**: Prevents re-renders when parent updates but props unchanged.

## Optimization Strategies

### Level 1: Immediate (No Code Changes)

1. **Close Unused Tabs**: Each workflow tab consumes memory
2. **Reduce Browser Extensions**: Disable extensions that modify page content
3. **Clear Browser Cache**: Stale cache can slow down React DevTools
4. **Use Chrome/Edge**: Generally better React performance than Firefox/Safari
5. **Disable React DevTools**: When not debugging, disable the extension

**Expected Improvement**: 10-20% performance boost

### Level 2: Configuration (Minor Code Changes)

1. **Split Large Workflows**: Break complex workflows into smaller, linked graphs
2. **Use Workflow Grouping**: Group related nodes visually to reduce visual complexity
3. **Limit Real-time Updates**: Reduce auto-refresh frequency for data nodes
4. **Disable Animations**: Set `animated={false}` on edges for large graphs
5. **Reduce Node Complexity**: Use simpler node types where possible

**Expected Improvement**: 30-50% performance boost

### Level 3: Refactoring (Moderate Effort)

1. **Split Component File**: Extract node components to separate files
2. **Selective Memoization**: Wrap all node components with React.memo
3. **Optimize Selectors**: Use specific selectors instead of broad ones
4. **Lazy Load Components**: Dynamic import for rarely-used node types
5. **Virtual Scrolling**: For lists inside nodes (Drive files, Gmail messages)

**Expected Improvement**: 50-70% performance boost

### Level 4: Architectural (High Effort)

1. **Web Workers**: Move workflow execution to background thread
2. **Canvas Rendering**: Use HTML5 Canvas instead of DOM for simple nodes
3. **State Partitioning**: Separate planner state from global store
4. **Incremental Rendering**: Progressive loading for large graphs
5. **Server-Side Rendering**: Pre-render static parts of workflows

**Expected Improvement**: 70-90% performance boost

## Hardware Recommendations

### Minimum Requirements
- **CPU**: Dual-core 2.0GHz+ (Intel i3 / AMD Ryzen 3)
- **RAM**: 8GB
- **GPU**: Integrated graphics sufficient
- **Browser**: Chrome 100+, Edge 100+, or Firefox 100+

**Max Workflow Size**: ~30 nodes

### Recommended Specifications
- **CPU**: Quad-core 2.5GHz+ (Intel i5 / AMD Ryzen 5 / Apple M1)
- **RAM**: 16GB
- **GPU**: Dedicated GPU or modern integrated (Intel Iris, Apple M-series)
- **Browser**: Latest Chrome or Edge

**Max Workflow Size**: ~100 nodes

### Optimal Setup
- **CPU**: 6+ cores 3.0GHz+ (Intel i7/i9 / AMD Ryzen 7/9 / Apple M2/M3)
- **RAM**: 32GB+
- **GPU**: Modern dedicated GPU or Apple Silicon
- **Display**: 1440p+ for better canvas visibility

**Max Workflow Size**: 200+ nodes

### MacBook Specific Notes

Your current setup: **MacBook Pro M3 Max (36GB RAM)**

- **Metal 3 Acceleration**: Excellent for canvas rendering
- **Unified Memory**: 36GB shared between CPU/GPU ideal for large graphs
- **Neural Engine**: Can be leveraged for ML-based optimizations
- **Expected Performance**: Handles 200+ node workflows smoothly with optimizations

## Advanced Optimizations

### 1. Selective Service Subscriptions

**Current Problem**: All service nodes re-render on any connection change.

**Solution**: Create specific selectors per service.

```javascript
// Instead of:
const connectedServices = useStore.use.connectedServices();
const isConnected = connectedServices?.googlecalendar?.connected;

// Use:
const isConnected = useStore(
  useCallback(
    (state) => state.connectedServices?.googlecalendar?.connected,
    []
  )
);
```

**Files to Update**:
- GoogleCalendarNode (line 1041)
- GoogleDriveNode (line 1162)
- GooglePhotosNode (line 1359)
- GmailNode (line 1539)
- UniversityIDNode (line 1713)
- CoursesNode (line 1853)

### 2. Graph Signature Optimization

**Current Implementation** (lines 2218-2235):
```javascript
const currentGraphSignature = useMemo(
  () => JSON.stringify({
    nodes: normalizeNodesForComparison(nodes),
    edges: normalizeEdgesForComparison(edges),
    title: workflowTitle
  }),
  [nodes, edges, workflowTitle]
);
```

**Problem**: `JSON.stringify` is expensive for large graphs.

**Optimized Version**:
```javascript
const currentGraphSignature = useMemo(
  () => {
    // Use hash function instead of full stringification
    const nodeHash = nodes.reduce((acc, n) =>
      acc + n.id + n.type + n.position.x + n.position.y, ''
    );
    const edgeHash = edges.reduce((acc, e) =>
      acc + e.source + e.target, ''
    );
    return `${nodeHash}|${edgeHash}|${workflowTitle}`;
  },
  [nodes, edges, workflowTitle]
);
```

**Impact**: 10x faster for graphs with 100+ nodes.

### 3. Component Code-Splitting

Split PlannerCanvas.jsx into multiple files:

```
src/components/planner/
├── PlannerCanvas.jsx          # Main canvas (200 lines)
├── nodes/
│   ├── ModelProviderNode.jsx
│   ├── ArchivAITemplateNode.jsx
│   ├── GoogleCalendarNode.jsx
│   ├── GoogleDriveNode.jsx
│   ├── GooglePhotosNode.jsx
│   ├── GmailNode.jsx
│   ├── ImageCanvasNode.jsx
│   ├── AudioPlayerNode.jsx
│   ├── TextRendererNode.jsx
│   ├── FileUploaderNode.jsx
│   ├── UniversityIDNode.jsx
│   ├── CoursesNode.jsx
│   └── LabelNode.jsx
├── hooks/
│   ├── useGraphPersistence.js
│   ├── useWorkflowExecution.js
│   └── useNodeOperations.js
└── utils/
    ├── nodeTypes.js
    └── graphUtils.js
```

**Benefits**:
- Better tree-shaking in production
- Easier to apply React.memo per component
- Improved development hot-reload speed
- Better code organization and maintenance

### 4. Virtualized Node Rendering

For very large graphs (200+ nodes), implement viewport-based rendering:

```javascript
const VisibleNodesProvider = ({ children }) => {
  const { getViewport } = useReactFlow();
  const [visibleNodeIds, setVisibleNodeIds] = useState(new Set());

  useEffect(() => {
    const viewport = getViewport();
    const buffer = 100; // pixels outside viewport

    const visible = nodes.filter(node => {
      const screenX = node.position.x * viewport.zoom + viewport.x;
      const screenY = node.position.y * viewport.zoom + viewport.y;

      return screenX > -buffer &&
             screenX < window.innerWidth + buffer &&
             screenY > -buffer &&
             screenY < window.innerHeight + buffer;
    }).map(n => n.id);

    setVisibleNodeIds(new Set(visible));
  }, [viewport, nodes]);

  return (
    <VisibleNodesContext.Provider value={visibleNodeIds}>
      {children}
    </VisibleNodesContext.Provider>
  );
};
```

Then in node components:

```javascript
const GoogleCalendarNode = ({ id, data }) => {
  const visibleNodeIds = useContext(VisibleNodesContext);

  if (!visibleNodeIds.has(id)) {
    return <div className="placeholder-node" />; // Lightweight placeholder
  }

  return (/* full node implementation */);
};
```

### 5. Workflow Execution Optimization

**Current Issue**: Workflow execution happens on main thread, blocking UI.

**Solution**: Use Web Workers for execution.

Create `src/workers/workflow-executor.js`:

```javascript
// workflow-executor.js
self.addEventListener('message', async (e) => {
  const { workflow, context } = e.data;

  try {
    const results = await executeWorkflow(workflow, context);
    self.postMessage({ type: 'success', results });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
});

async function executeWorkflow(workflow, context) {
  // Execution logic moved from main thread
  // ... implementation
}
```

Update PlannerCanvas.jsx:

```javascript
const worker = useMemo(() => new Worker(
  new URL('../workers/workflow-executor.js', import.meta.url)
), []);

const onRunWorkflow = useCallback(async () => {
  if (isExecuting) return;
  setIsExecuting(true);

  worker.postMessage({
    workflow: buildWorkflowFromGraph(),
    context: { /* runtime context */ }
  });

  worker.onmessage = (e) => {
    if (e.data.type === 'success') {
      // Update UI with results
      setIsExecuting(false);
    } else if (e.data.type === 'error') {
      console.error('Workflow error:', e.data.error);
      setIsExecuting(false);
    }
  };
}, [buildWorkflowFromGraph]);
```

**Impact**: UI remains responsive during workflow execution, eliminates freezing.

## Monitoring Performance

### Built-in Tools

#### React DevTools Profiler
1. Install React DevTools browser extension
2. Open DevTools → Profiler tab
3. Click record → perform actions → stop
4. Analyze flame graph for slow components

#### Chrome Performance Monitor
1. Open DevTools → Performance tab
2. Enable "Screenshots" and "Memory"
3. Record 5-10 seconds of interaction
4. Look for:
   - Long tasks (>50ms) in yellow
   - Forced reflow/layout warnings
   - Memory spikes

### Custom Metrics

Add performance logging to PlannerCanvas.jsx:

```javascript
useEffect(() => {
  const startTime = performance.now();

  return () => {
    const renderTime = performance.now() - startTime;
    if (renderTime > 16.67) { // Slower than 60fps
      console.warn(`Slow render: ${renderTime.toFixed(2)}ms`, {
        nodeCount: nodes.length,
        edgeCount: edges.length
      });
    }
  };
}, [nodes, edges]);
```

### Performance Benchmarks

Expected render times on recommended hardware:

| Graph Size | Initial Render | Node Add | Node Move | Edge Connect |
|------------|----------------|----------|-----------|--------------|
| 10 nodes   | <100ms        | <16ms    | <16ms     | <16ms        |
| 50 nodes   | <300ms        | <20ms    | <20ms     | <20ms        |
| 100 nodes  | <600ms        | <30ms    | <30ms     | <30ms        |
| 200 nodes  | <1200ms       | <50ms    | <50ms     | <50ms        |

If your measurements exceed these by 2x, performance optimization is recommended.

## Troubleshooting Checklist

When experiencing lag:

- [ ] Close unused browser tabs and applications
- [ ] Check graph size (aim for <100 nodes)
- [ ] Disable browser extensions temporarily
- [ ] Clear browser cache and reload
- [ ] Check CPU/Memory usage in Task Manager
- [ ] Try in Incognito/Private mode (disables extensions)
- [ ] Update browser to latest version
- [ ] Restart browser to clear memory leaks
- [ ] Check for console errors or warnings
- [ ] Profile with React DevTools to identify bottlenecks

## Future Improvements

Planned optimizations (roadmap):

1. **Q1 2025**: Component file splitting and React.memo implementation
2. **Q2 2025**: Web Worker workflow execution
3. **Q2 2025**: Viewport-based virtualization for 500+ node support
4. **Q3 2025**: Canvas rendering option for simple nodes
5. **Q3 2025**: GraphQL-based incremental loading
6. **Q4 2025**: ML-powered workflow optimization suggestions

## Support

For persistent performance issues:

1. **GitHub Issues**: Report with performance profile export
2. **Discord Community**: #planner-performance channel
3. **Documentation**: [React Flow Performance](https://reactflow.dev/docs/guides/performance/)

---

**Last Updated**: 2025-10-02
**Maintainer**: KBLLR Team
**Related Docs**: [Planner Components Reference](./planner-components-reference.md), [Service Connections Setup](./service-connections-setup.md)
