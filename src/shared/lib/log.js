// Simple logging helpers guarded by __DEV__ for development-only noise.
export const debug = (...args) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.debug(...args);
  }
};

export const info = (...args) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.info(...args);
  }
};

export const warn = (...args) => {
  // Warnings are useful in dev; gate for production noise
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
};

export const error = (...args) => {
  // Do not gate errors by __DEV__; keep visible in production, too
  // eslint-disable-next-line no-console
  console.error(...args);
};