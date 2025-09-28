/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import logger from './src/lib/logger.js';
import { register, httpRequestDurationMicroseconds, httpRequestsTotal } from './src/lib/metrics.js';

// In ES modules, __dirname is not available. path.resolve() provides the project root.
const __dirname = path.resolve();

const app = express();
const port = process.env.PORT || 8080;

// Allow GEMINI_API_KEY fallback for local/dev environments
if (!process.env.API_KEY && process.env.GEMINI_API_KEY) {
  process.env.API_KEY = process.env.GEMINI_API_KEY;
}

// The API key must be set as an environment variable on the server.
// The app will fail to start if it's missing.
if (!process.env.API_KEY) {
  logger.error("API_KEY environment variable not set. Application will exit.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Increase payload limit for base64 image data
app.use(express.json({ limit: '10mb' })); 
// Serve all static files from the project root directory
app.use(express.static(path.join(__dirname, 'dist')));

// Expose the /metrics endpoint for Prometheus scraping
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    logger.error('Error serving metrics:', { error: ex.message });
    res.status(500).end(ex);
  }
});

// Add a /healthz endpoint for load balancers and orchestration tools.
// It performs a live check against the Gemini API.
app.get('/healthz', async (req, res) => {
  try {
    // Make a lightweight, non-streaming call to the Gemini API to check its health.
    // A simple prompt is sufficient and cost-effective.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'hello',
    });
    
    // A successful response with text content indicates the API is healthy.
    if (response && response.text) {
        res.status(200).json({ status: 'ok', message: 'Gemini API is healthy.' });
    } else {
        // This case handles unexpected but non-error responses from the API.
        throw new Error('Received an invalid or empty response from Gemini API.');
    }

  } catch (error) {
    logger.error('Health check failed: Could not connect to Gemini API.', { errorMessage: error.message });
    res.status(503).json({ status: 'error', message: 'Service Unavailable: Cannot connect to Gemini API.' });
  }
});


// A single, generic proxy endpoint for all Gemini API calls from the frontend
app.post('/api/proxy', async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  try {
    const { model, contents, config, safetySettings } = req.body;

    if (!model || !contents) {
      logger.warn('Bad request to /api/proxy', { body: req.body });
      return res.status(400).json({ error: 'Missing "model" or "contents" in request body' });
    }
    
    const response = await ai.models.generateContent({
        model,
        contents,
        config,
        safetySettings
    });

    res.json(response);

  } catch (error) {
    logger.error('Error proxying request to Gemini API:', { errorMessage: error.message, stack: error.stack });
    // Ensure status is set before 'finally' block if not already sent
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  } finally {
    // Record metrics in the 'finally' block to ensure it runs even if there's an error.
    end({ route: '/api/proxy', code: res.statusCode, method: 'POST' });
    httpRequestsTotal.inc({ route: '/api/proxy', code: res.statusCode, method: 'POST' });
  }
});

// A catch-all route to serve the main index.html for any non-API GET requests.
// This is crucial for single-page applications with client-side routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  logger.info(`Server listening at http://localhost:${port}`);
});
