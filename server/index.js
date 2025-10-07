// Main server entrypoint (flipped)
// Configure global middleware and static hosting here, then boot the legacy routes/app.
import path from 'node:path';
import http from 'http';
import net from 'net';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { spaFallback } from './middleware/spaFallback.js';
import logger from '../src/shared/lib/logger.js';
import { setupLiveApiProxy } from '../src/shared/lib/liveApiProxy.js';
import createApiRouter from './apiRouter.js';
import { getUserConnections } from './lib/userConnections.js';
import geminiBootstrap from './lib/geminiBootstrap.js';
import { getDb } from '../src/shared/lib/db.js';

// Load environment variables from .env and .env.local
dotenv.config();
dotenv.config({ path: '.env.local' });

const app = express();

// Trust proxy headers (Vercel/Cloud)
app.set('trust proxy', 1);

// Global middleware
app.use(cookieParser());

// CORS: lock to client origin and allow credentials
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// COOP/COEP: only set in production to avoid dev warnings
function setCoopCoepHeaders(req, res, next) {
  // Allow OAuth popups to open
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // Do not require cross-origin isolation for embeds
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
}
if (process.env.NODE_ENV === 'production') {
  app.use(setCoopCoepHeaders);
}

// JSON body limit (large for base64 images)
app.use(express.json({ limit: '10mb' }));

// Legacy top-level auth routes compatibility (tests expect /auth/*)
import auth from './routes/auth.js';
app.use('/auth', auth);

// Mount API router (full DI) at /api BEFORE SPA fallback
const apiRouter = createApiRouter({ getUserConnections, geminiBootstrap, getDb });
app.use('/api', apiRouter);

// Static assets + SPA fallback (after API)
const dist = path.resolve('dist');
app.use(express.static(dist));
app.use(spaFallback({ distPath: dist }));

// Start HTTP server (includes WS proxy setup)
const CUSTOM_PORT = Number(process.env.PORT);
const hasCustomPort = Number.isInteger(CUSTOM_PORT) && CUSTOM_PORT > 0;
const DEFAULT_PORT = 8081;
let serverPort = hasCustomPort ? CUSTOM_PORT : DEFAULT_PORT;

function isPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer();
    tester.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        reject(err);
      }
    });
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen({ port });
  });
}

async function findAvailablePort(startPort, maxAttempts = 10) {
  let attempt = 0;
  let candidate = startPort;
  while (attempt < maxAttempts) {
    const available = await isPortAvailable(candidate);
    if (available) return candidate;
    candidate += 1;
    attempt += 1;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  try {
    await geminiBootstrap.initializeGeminiAPI();

    if (hasCustomPort) {
      const available = await isPortAvailable(CUSTOM_PORT);
      if (!available) {
        throw new Error(`Configured port ${CUSTOM_PORT} is already in use. Stop the process using it or set PORT to a different value.`);
      }
      serverPort = CUSTOM_PORT;
    } else {
      const resolvedPort = await findAvailablePort(DEFAULT_PORT);
      if (resolvedPort !== DEFAULT_PORT) {
        logger.warn(`Port ${DEFAULT_PORT} is in use. Falling back to ${resolvedPort}.`);
      }
      serverPort = resolvedPort;
    }

    const httpServer = http.createServer(app);

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    setupLiveApiProxy(httpServer, geminiApiKey);

    httpServer.listen(serverPort, () => {
      logger.info(`Server listening at http://localhost:${serverPort}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('Full error details:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { startServer };
export default app;
