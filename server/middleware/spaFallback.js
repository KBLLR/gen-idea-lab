import path from 'node:path';
export function spaFallback({ distPath }) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api')) return next();
    if (/\.[a-z0-9]+$/i.test(req.path)) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  };
}
