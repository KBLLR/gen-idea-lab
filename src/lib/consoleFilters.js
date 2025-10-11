/**
 * Console filter helpers
 * Suppress known safe warnings in development
 *
 * NOTE: Browser-generated COOP warnings (from client:334) cannot be suppressed
 * via JavaScript. These warnings are harmless and come from Vite's HMR system.
 * They indicate the browser would block postMessage calls IF COOP headers were
 * set, but our server doesn't set them (verified). Safe to ignore in dev.
 *
 * To hide them: Chrome DevTools > Console Settings > Filter > Hide network
 */

// Filter JavaScript console warnings (this won't catch browser-generated warnings)
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
