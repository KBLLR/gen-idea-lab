// Environment and URL helpers used across server routes

export function normalizeUrl(u) {
  if (!u) return null;
  const s = String(u).trim();
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  return withScheme.replace(/\/$/, '');
}

export function getBaseUrl(req) {
  const envUrl = process.env.BACKEND_URL || process.env.DOMAIN || process.env.FRONTEND_URL;
  if (envUrl) return normalizeUrl(envUrl);
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').toString().split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

export function getFrontendBaseUrl(req) {
  if (process.env.FRONTEND_URL) return normalizeUrl(process.env.FRONTEND_URL);
  if (process.env.NODE_ENV === 'production' && process.env.DOMAIN) return normalizeUrl(process.env.DOMAIN);
  return 'http://localhost:3000';
}

export function sanitizeEndpointUrl(endpoint) {
  if (!endpoint) return null;
  const trimmed = String(endpoint).trim();
  if (!trimmed) return null;
  const withScheme = /^(https?|grpc|grpcs):\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withScheme.replace(/\/$/, '');
}

export function normalizeDrawThingsUrl(endpoint, transport = 'http') {
  const sanitized = sanitizeEndpointUrl(endpoint);
  if (!sanitized) return null;
  if (transport === 'grpc') {
    return sanitized
      .replace(/^grpcs:\/\//i, 'https://')
      .replace(/^grpc:\/\//i, 'http://');
  }
  return sanitized;
}

export function parseBase64ImagePayload(image) {
  if (!image || typeof image !== 'string') return null;
  const match = image.match(/^data:([^;]+);base64,(.+)$/);
  if (match) return { mimeType: match[1], base64: match[2] };
  return { mimeType: 'image/png', base64: image };
}

