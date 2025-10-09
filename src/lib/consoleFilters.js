/**
 * Console filter helpers
 * Suppress known safe warnings in development
 */

// Suppress known safe COOP warnings from Vite HMR in development
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];

    // Filter out COOP postMessage warnings (safe in dev, comes from Vite HMR)
    if (
      typeof message === 'string' &&
      message.includes('Cross-Origin-Opener-Policy') &&
      message.includes('postMessage')
    ) {
      // Silently ignore - this is expected in dev mode
      return;
    }

    // Pass through all other warnings
    originalWarn.apply(console, args);
  };
}
