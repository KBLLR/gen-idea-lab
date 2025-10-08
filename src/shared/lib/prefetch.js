// Lightweight prefetch to warm app bundles on intent (hover/focus)
export function prefetchApp(app) {
  switch (String(app).toLowerCase()) {
    case 'planner': import('@apps/planner/index.jsx'); break;
    case 'chat': import('@apps/chat/index.jsx'); break;
    case 'multimindmap': import('@apps/multimindmap/index.jsx'); break;
    case 'archiva': import('@apps/archiva/index.jsx'); break;
    case 'idealab': import('@apps/ideaLab/index.jsx'); break;
    case 'imagebooth': import('@apps/imageBooth/index.jsx'); break;
    case 'calendarai': import('@apps/calendarAI/index.jsx'); break;
    case 'empathylab': import('@apps/empathyLab/index.jsx'); break;
    case 'gesturelab': import('@apps/gestureLab/index.jsx'); break;
    case 'workflows': import('@apps/workflows/index.jsx'); break;
    case 'kanban': import('@apps/kanban/index.jsx'); break;
    default: break;
  }
}
