// server.js (thin bridge)
import app, { startServer } from './server/index.js';
export { default as app } from './server/index.js';
export { default as geminiBootstrap } from './server/lib/geminiBootstrap.js';
export default app;

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

