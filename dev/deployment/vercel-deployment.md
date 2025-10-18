# Vercel Deployment Guide

## Overview

This document covers deploying GenBooth Idea Lab to Vercel, including environment variable configuration and common issues.

## Prerequisites

- Vercel account connected to your GitHub repository
- Access to API keys for required services
- Understanding of environment variable security implications

## Environment Variables Setup

### Required Variables

Add these environment variables in Vercel Dashboard → Project Settings → Environment Variables:

#### Server-Side Variables (Secure)
```
GOOGLE_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key
AUTH_SECRET=your_random_jwt_secret
GOOGLE_CLIENT_SECRET=your_oauth_secret
GITHUB_CLIENT_SECRET=your_github_secret
NOTION_CLIENT_SECRET=your_notion_secret
FIGMA_CLIENT_SECRET=your_figma_secret
```

#### Client-Side Variables (VITE_ prefix)
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_NOTION_CLIENT_ID=your_notion_client_id
VITE_FIGMA_CLIENT_ID=your_figma_client_id
VITE_API_BASE_URL=https://your-domain.vercel.app
```

### ✅ Live Voice API Configuration (Secure Backend Proxy)

**Current Implementation:**

The Live Voice feature uses a **secure backend WebSocket proxy** that handles all Gemini API communication server-side. No API keys are exposed to the frontend.

**Architecture:**
- Client connects to backend WebSocket at `/ws/live-api`
- Authentication via JWT tokens (from cookies)
- Backend proxy forwards messages to Gemini Live API
- API key (`GEMINI_API_KEY`) remains secure on server

**Required Configuration:**

Server-side only (already listed above):
```
GEMINI_API_KEY=your_gemini_api_key
```

**No client-side API key needed!** The frontend uses the proxy automatically.

**Implementation Details:**
- WebSocket proxy: `src/lib/liveApiProxy.js`
- Proxy client: `src/lib/voice/genAIProxyClient.js`
- Origin verification in production for additional security
- See commit series for full implementation

**Vercel WebSocket Support:**
- Vercel supports WebSocket connections on serverless functions
- Connections automatically route through `/ws/live-api` path
- No additional configuration needed in `vercel.json`

## Deployment Configuration

### vercel.json

The project uses the following Vercel configuration:

```json
{
  "version": 2,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "unsafe-none" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "unsafe-none" }
      ]
    }
  ],
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "rewrites": [
    { "source": "/api/:path*", "destination": "/server.js" },
    { "source": "/auth/:path*", "destination": "/server.js" },
    { "source": "/healthz", "destination": "/server.js" },
    { "source": "/metrics", "destination": "/server.js" },
    { "source": "/ws/:path*", "destination": "/server.js" }
  ]
}
```

**Note:** WebSocket routes (like `/ws/live-api`) automatically work through the `/ws/:path*` rewrite. Vercel handles WebSocket upgrade requests on serverless functions.

### Build Command

Vercel automatically detects the build command from `package.json`:
```bash
npm run vercel-build
```

This runs:
1. `npm run tokens:build` - Generates design tokens
2. `vite build` - Builds the frontend

## Common Deployment Issues

### Issue 1: WebSocket Connection Issues (Live Voice)

**Symptom:** Live Voice feature not connecting, WebSocket errors in console

**Cause:** Backend proxy not initialized or authentication issues

**Troubleshooting:**

1. **Verify GEMINI_API_KEY is set:**
   - Check Vercel Dashboard → Environment Variables
   - Ensure `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) is configured
   - This is a server-side variable (no `VITE_` prefix)

2. **Check authentication:**
   - Live Voice requires user authentication (JWT token)
   - Ensure user is logged in before using voice features
   - Check browser cookies for `auth_token`

3. **Verify WebSocket support:**
   - Vercel supports WebSockets on serverless functions
   - Check Function Logs for proxy initialization messages
   - Look for: `[Live API Proxy] WebSocket server initialized`

4. **Test locally:**
   ```bash
   npm run dev
   # Check for: [Live API Proxy] WebSocket server initialized at /ws/live-api
   ```

**Note:** The frontend no longer requires `VITE_GEMINI_API_KEY`. If you see references to it, update to the latest code.

### Issue 2: OAuth Redirect Mismatches

**Symptom:** OAuth flows fail with `redirect_uri_mismatch`

**Cause:** OAuth app redirect URIs don't match production domain

**Fix:**
1. Update OAuth app settings for each service (Google, GitHub, Notion, Figma)
2. Add production redirect URIs:
   ```
   https://your-domain.vercel.app/api/services/google/callback
   https://your-domain.vercel.app/api/services/github/callback
   https://your-domain.vercel.app/api/services/notion/callback
   https://your-domain.vercel.app/api/services/figma/callback
   ```

See `docs/service-connections-setup.md` for detailed OAuth configuration.

### Issue 3: API Routes Not Working

**Symptom:** 404 errors for `/api/*` routes

**Cause:** Incorrect `rewrites` configuration in `vercel.json`

**Fix:** Ensure `vercel.json` uses `rewrites` (not `routes`) syntax:
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/server.js" }
  ]
}
```

**Related:** Commit a0a9b2b fixed this issue

### Issue 4: Environment Variables Not Updating

**Symptom:** Changes to environment variables not reflected in deployed app

**Fix:**
1. Verify variables are set in Vercel Dashboard
2. **Trigger a new deployment** - Environment variables are only loaded at build time
3. For `VITE_` prefixed variables, you must rebuild the frontend to include them

## Deployment Checklist

Before deploying to production:

- [ ] All required environment variables set in Vercel
- [ ] OAuth redirect URIs updated for production domain
- [ ] API rate limits configured in service providers
- [ ] `VITE_API_BASE_URL` points to production domain
- [ ] Test OAuth flows with production URLs
- [ ] Monitor initial deployment for errors
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure custom domain (if applicable)

## Monitoring

### Health Checks

- **Health Endpoint:** `https://your-domain.vercel.app/healthz`
- **Metrics:** `https://your-domain.vercel.app/metrics` (Prometheus format)

### Log Access

View deployment logs in Vercel Dashboard:
1. Go to Project → Deployments
2. Click on the deployment
3. View "Build Logs" and "Function Logs"

### Performance Monitoring

Monitor with Vercel Analytics:
1. Enable in Vercel Dashboard → Project → Analytics
2. Track Core Web Vitals, API response times
3. Set up alerts for performance degradation

## Security Best Practices

1. **API Keys:**
   - Never commit `.env` files to repository
   - Use Vercel's encrypted environment variables
   - Rotate keys periodically
   - Set up usage quotas and alerts

2. **Authentication:**
   - Use secure `AUTH_SECRET` (minimum 32 characters)
   - Enable HTTPS only (Vercel provides this by default)
   - Implement rate limiting for auth endpoints

3. **CORS Configuration:**
   - Review COOP/COEP headers in `vercel.json`
   - Restrict allowed origins in production
   - Current config uses `unsafe-none` for OAuth compatibility

4. **OAuth Secrets:**
   - Keep `_CLIENT_SECRET` variables server-side only
   - Never use `VITE_` prefix for secrets
   - Verify redirect URI whitelist is minimal

## Rollback Procedure

If a deployment causes issues:

1. **Instant Rollback:**
   - Go to Vercel Dashboard → Deployments
   - Find the last working deployment
   - Click "..." → "Promote to Production"

2. **Git Rollback:**
   ```bash
   git revert <commit-hash>
   git push
   ```
   Vercel will automatically deploy the reverted code

3. **Environment Variable Rollback:**
   - Changes to env vars require redeployment
   - Revert variable changes in Vercel Dashboard
   - Redeploy previous commit to apply old variables

## Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Project Docs:** `docs/service-connections-setup.md`
- **OAuth Setup:** `docs/google-services-integration.md`
- **Performance:** `docs/planner-performance-troubleshooting.md`

## Troubleshooting Commands

```bash
# Test production build locally
npm run build
npm run preview

# Check environment variable availability
# (Frontend - only VITE_ vars available)
console.log(import.meta.env)

# Check build output
ls -la dist/

# Verify server.js is included
ls -la .vercel/output/
```

---

**Last Updated:** 2025-10-02
**Maintainer:** KBLLR Team
**Related:** Backend WebSocket proxy implementation completed - see server.js, src/lib/liveApiProxy.js, and src/lib/voice/genAIProxyClient.js
