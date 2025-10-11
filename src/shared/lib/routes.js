// Micro-app route helpers (canonical lowercase slugs)
export const APP_ID_TO_SLUG = {
  idealab: 'idealab',
  imagebooth: 'imagebooth',
  calendarai: 'calendarai',
  empathylab: 'empathylab',
  gesturelab: 'gesturelab',
  planner: 'planner',
  archiva: 'archiva',
  workflows: 'workflows',
  chat: 'chat',
  kanban: 'kanban',
  characterlab: 'characterlab',
};

// Back-compat map (camel-case appIds used in parts of the app) → path
export const APP_ROUTE_MAP = {
  ideaLab: '/idealab',
  imageBooth: '/imagebooth',
  calendarAI: '/calendarai',
  empathyLab: '/empathylab',
  gestureLab: '/gesturelab',
  planner: '/planner',
  archiva: '/archiva',
  workflows: '/workflows',
  chat: '/chat',
  kanban: '/kanban',
  characterLab: '/characterlab',
};

export function getAppPath(appId, subpath = '') {
  if (!appId) return '/idealab';
  const lower = String(appId).toLowerCase();
  const slug = APP_ID_TO_SLUG[lower]
    || (APP_ROUTE_MAP[appId] ? APP_ROUTE_MAP[appId].slice(1) : null);
  const base = slug ? `/${slug}` : '/idealab';
  if (!subpath) return base;
  return subpath.startsWith('/') ? `${base}${subpath}` : `${base}/${subpath}`;
}

export function getAppIdFromPath(pathname) {
  const firstSeg = `/${String(pathname || '/').split('?')[0].split('#')[0].split('/')[1] || ''}`;
  const entry = Object.entries(APP_ROUTE_MAP).find(([, p]) => firstSeg.startsWith(p));
  if (!entry) return 'idealab';
  const path = entry[1]; // '/slug'
  const slug = path.slice(1);
  // Return canonical lowercase app id
  const id = Object.keys(APP_ID_TO_SLUG).find((k) => APP_ID_TO_SLUG[k] === slug) || 'idealab';
  return id;
}
