<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GenBooth Idea Lab

GenBooth Idea Lab is a Vite + React app with an Express server that proxies Google Gemini requests server‑side via `@google/genai`. The server also serves the production build from `dist/`. Client requests never expose API keys.

- Frontend: React 19 + Vite 5
- Server: Express 4 (ESM)
- AI: Google Gemini via `@google/genai`
- Observability: `prom-client` metrics at `/metrics`, health at `/healthz`
- Logging: `winston`
- State: `zustand`
- Container: Multi-stage Dockerfile (Cloud Run friendly)

## Contents
- Purpose
- Overview & Features
- Project Structure
- Prerequisites
- Environment Variables
- Quickstart (Local Dev)
- Production Build (Local)
- Docker (Local)
- Deploy to Cloud Run
- API Endpoints
- Scripts
- Troubleshooting
- License

---

## Overview & Features
- Image-to-image creative transformations driven by Gemini models
- Safe server-side proxy for AI calls (`/api/proxy`)
- Production bundle served via Express
- Health and metrics endpoints for ops tooling
- Robust client retries and timeouts for API calls
- Scripted thumbnail generation for all creative modes

## Project Structure
```
.
├─ server.js                # Express server, proxy + static serve + health/metrics
├─ src/
│  ├─ main.jsx             # Vite entry
│  ├─ components/          # UI components (App.jsx, BoothViewer.jsx, Assistant.jsx, ...)
│  └─ lib/                 # Client libs (llm.js, modes.js, workflows.js, logger.js, metrics.js, store.js, ...)
├─ assets/
│  └─ index.js             # Asset loader
├─ scripts/
│  ├─ generate-thumbnails.mjs
│  └─ README.md
├─ Dockerfile              # Multi-stage build and runtime
├─ package.json
└─ README.md
```

## Prerequisites
- Node.js 18+ (Node 20 recommended)
- A Gemini API key

## Environment Variables
Create a `.env` file at the project root with one of the following. The server prefers `API_KEY` but will fall back to `GEMINI_API_KEY`.
```
API_KEY={{GEMINI_API_KEY}}
```
Or:
```
GEMINI_API_KEY={{GEMINI_API_KEY}}
```
Notes
- Never expose your key to the browser. All requests go through the server proxy.
- The server listens on `PORT` if provided (defaults to `8080`).

## Quickstart (Local Dev)
Install dependencies and start the client + server together:
```
npm install
npm run dev
```
- Frontend: http://localhost:3000 (Vite)
- Server: http://localhost:8080
- Proxy: client calls the server at `/api/proxy` (also `/metrics`, `/healthz`)

## Production Build (Local)
```
npm run build
npm start
```
Then open http://localhost:8080.

## Docker (Local)
Use the provided multi-stage Dockerfile.
```
docker build -t genbooth:local .
docker run --rm -p 8080:8080 \
  -e API_KEY={{GEMINI_API_KEY}} \
  genbooth:local
```

## Deploy to Cloud Run (from Source)
```
gcloud run deploy genbooth \
  --source . \
  --region {{REGION}} \
  --allow-unauthenticated \
  --set-env-vars API_KEY={{GEMINI_API_KEY}}
```
Tips
- Ensure egress to the Gemini API is allowed from your service.
- Configure min instances if you want faster cold starts.

## API Endpoints (Server)
- POST `/api/proxy`
  - Body: `{ model, contents, config, safetySettings }`
  - For image generation, the client sends base64 image data (if present) and text prompt as `contents.parts`.
  - Returns the raw Gemini response JSON.
- GET `/healthz`
  - Performs a lightweight call to `gemini-2.5-flash` to verify upstream health.
  - 200 OK if healthy; 503 otherwise.
- GET `/metrics`
  - Prometheus metrics via `prom-client`.

## Scripts
- `npm run dev` — Run Vite (port 3000) and Express (nodemon) together.
- `npm run build` — Build the production bundle with Vite.
- `npm start` — Start the Express server to serve `dist/` and the proxy.
- `npm run preview` — Vite preview server for the built client bundle.
- `npm run generate-thumbnails` — Generate per-mode thumbnails using the Gemini API (see `scripts/README.md`).

## Troubleshooting
- Server exits on start: ensure `API_KEY` or `GEMINI_API_KEY` is set in `.env`.
- 500 from `/api/proxy`: check server logs; verify model name and payload shape.
- Rate limits: client has backoff/retry; still consider reducing concurrency or waiting.
- Dev ports in use: close other processes using 3000/8080 or change ports.
- Blank images: model may return text or be blocked; see client error messaging in the UI.

## License
SPDX-License-Identifier: Apache-2.0
Auto-deployment test
