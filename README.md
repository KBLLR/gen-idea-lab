<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GenBooth Idea Lab

Vite + React frontend with an Express server that proxies Gemini requests server-side (no client API keys). Production is served from `dist/` by the Express server.

## Prerequisites
- Node.js 18+ (Node 20 recommended)
- A Gemini API key

## Setup (local)
1. Install dependencies
   ```
   npm install
   ```
2. Set environment variable (server-side only)
   - Create a `.env` file in the project root and add one of:
     ```
     API_KEY={{GEMINI_API_KEY}}
     ```
     or
     ```
     GEMINI_API_KEY={{GEMINI_API_KEY}}
     ```
3. Start dev (Vite + Express)
   ```
   npm run dev
   ```
   - Frontend: http://localhost:3000 (proxied to the server at /api, /metrics, /healthz)
   - Server: http://localhost:8080

## Production build (local)
```
npm run build
npm start
```
Then open http://localhost:8080.

## Deploy to Cloud Run (Docker)
You can use the provided multi-stage Dockerfile.

Build and test locally:
```
docker build -t genbooth:local .
docker run --rm -p 8080:8080 \
  -e API_KEY={{GEMINI_API_KEY}} \
  genbooth:local
```

Deploy to Cloud Run from source (recommended):
```
gcloud run deploy genbooth \
  --source . \
  --region {{REGION}} \
  --allow-unauthenticated \
  --set-env-vars API_KEY={{GEMINI_API_KEY}}
```

Notes
- Keep API keys on the server only. The client calls `/api/proxy`.
- Metrics are exposed at `/metrics`.
- Health check at `/healthz` does a lightweight call to Gemini.
