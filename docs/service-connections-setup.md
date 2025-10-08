# Service Connections Setup Guide

This guide walks through setting up OAuth integrations for all supported services in GenBooth Idea Lab.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Google OAuth (Login + Services)](#google-oauth-login--services)
- [GitHub OAuth](#github-oauth)
- [Notion OAuth](#notion-oauth)
- [Figma OAuth](#figma-oauth)
- [API Key Services](#api-key-services)
- [Local Services](#local-services)
- [Environment Variables Reference](#environment-variables-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

1. **MongoDB** (optional but recommended for persistent token storage):
   ```bash
   # macOS
   brew install mongodb-community
   brew services start mongodb-community

   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Environment file**: Copy `.env.example` to `.env` and `.env.development.local`

3. **Generate secrets**:
   ```bash
   # Generate AUTH_SECRET
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

   # Generate ENCRYPTION_KEY (32 bytes, base64)
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

---

## Google OAuth (Login + Services)

Google OAuth is used for:
- **User authentication** (restricted to @code.berlin emails)
- **Google Drive** integration
- **Google Photos** integration
- **Google Calendar** integration
- **Gmail** integration

### Setup Steps

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Google+ API (for login)
     - Google Drive API
     - Google Photos Library API
     - Google Calendar API
     - Gmail API

2. **Configure OAuth Consent Screen**:
   - Navigate to **APIs & Services > OAuth consent screen**
   - Choose **External** user type
   - Fill in:
     - App name: `GenBooth Idea Lab`
     - User support email: your @code.berlin email
     - Developer contact: your @code.berlin email
   - Add scopes:
     - `openid`
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/drive.readonly`
     - `https://www.googleapis.com/auth/photoslibrary.readonly`
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/gmail.readonly`
   - Add test users (your @code.berlin email)

3. **Create OAuth Credentials**:
   - Navigate to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth 2.0 Client ID**
   - Choose **Web application**
   - Add **Authorized redirect URIs**:
     ```
     http://localhost:8081/api/services/googleDrive/callback
     http://localhost:8081/api/services/googlePhotos/callback
     http://localhost:8081/api/services/googleCalendar/callback
     http://localhost:8081/api/services/gmail/callback
     ```
     (For production, replace `localhost:8081` with your domain)

4. **Copy credentials to `.env`**:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

---

## GitHub OAuth

### Setup Steps

1. **Create a GitHub OAuth App**:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click **New OAuth App**
   - Fill in:
     - Application name: `GenBooth Idea Lab`
     - Homepage URL: `http://localhost:3000` (or your production domain)
     - Authorization callback URL: `http://localhost:8081/api/services/github/callback`

2. **Copy credentials to `.env`**:
   ```bash
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   VITE_GITHUB_CLIENT_ID=your-github-client-id
   ```

---

## Notion OAuth

### Setup Steps

1. **Create a Notion Integration**:
   - Go to [Notion Integrations](https://www.notion.so/my-integrations)
   - Click **New integration**
   - Fill in:
     - Name: `GenBooth Idea Lab`
     - Associated workspace: Your workspace
     - Type: **Public integration**
   - Capabilities:
     - Read content
     - Read user information (without email)

2. **Configure OAuth**:
   - In integration settings, scroll to **OAuth Domain & URIs**
   - Redirect URIs: `http://localhost:8081/api/services/notion/callback`
   - For production, add your production callback URL

3. **Copy credentials to `.env`**:
   ```bash
   NOTION_CLIENT_ID=your-notion-client-id
   NOTION_CLIENT_SECRET=your-notion-client-secret
   VITE_NOTION_CLIENT_ID=your-notion-client-id
   ```

---

## Figma OAuth

### Setup Steps

1. **Create a Figma OAuth App**:
   - Go to [Figma Account Settings](https://www.figma.com/developers/apps)
   - Click **Create a new app**
   - Fill in:
     - App name: `GenBooth Idea Lab`
     - Callback URL: `http://localhost:8081/api/services/figma/callback`

2. **Copy credentials to `.env`**:
   ```bash
   FIGMA_CLIENT_ID=your-figma-client-id
   FIGMA_CLIENT_SECRET=your-figma-client-secret
   VITE_FIGMA_CLIENT_ID=your-figma-client-id
   ```

---

## API Key Services

These services require API keys (configured per-user via UI or globally via env vars):

### OpenAI

1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to `.env` (optional):
   ```bash
   OPENAI_API_KEY=sk-...
   ```

### Claude (Anthropic)

1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Add to `.env` (optional):
   ```bash
   CLAUDE_API_KEY=sk-ant-...
   ```

### Gemini

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env`:
   ```bash
   GEMINI_API_KEY=...
   # Or use the same as GOOGLE_API_KEY
   GOOGLE_API_KEY=...
   ```

---

## Local Services

### Ollama

**Local Instance**:
1. Install Ollama: https://ollama.ai/download
2. Start Ollama: `ollama serve`
3. Connect via UI with URL: `http://localhost:11434`

**Cloud (optional)**:
1. Get API key from Ollama Cloud
2. Connect via UI with API key

### DrawThings

1. Install DrawThings app (macOS)
2. Enable API server in settings
3. Connect via UI with endpoint URL (default: `http://localhost:7860`)
4. Choose transport: HTTP or gRPC

---

## Environment Variables Reference

### Required for Authentication

```bash
AUTH_SECRET=<64-byte-hex>           # JWT signing secret
ENCRYPTION_KEY=<32-byte-base64>     # Token encryption key
```

### Optional Database

```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=genbooth
```

### OAuth Providers

Each OAuth provider requires:
- `{PROVIDER}_CLIENT_ID` (server-side)
- `{PROVIDER}_CLIENT_SECRET` (server-side)
- `VITE_{PROVIDER}_CLIENT_ID` (client-side)

### Server Configuration

```bash
PORT=8081
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CLIENT_ORIGIN=http://localhost:3000
```

### Development Only

```bash
# .env.development.local
AUTH_BYPASS=1              # Skip @code.berlin restriction
VITE_AUTH_BYPASS=1         # Client-side bypass
```

---

## Troubleshooting

### OAuth Popup Blocked

**Problem**: OAuth popup window doesn't open.

**Solution**:
- Allow popups for `localhost:3000` in your browser
- Check browser console for errors
- Verify COOP headers are set correctly (dev: `unsafe-none`)

### "Service not configured" Error

**Problem**: GET `/api/services/config` shows `configured: false`.

**Solution**:
- Verify client ID and secret are set in `.env`
- Restart server after changing `.env`
- Check that redirect URIs match exactly

### Token Not Persisting

**Problem**: Services disconnect after server restart.

**Solution**:
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify `ENCRYPTION_KEY` is set (and doesn't change)
- Check server logs for MongoDB connection errors

### Redirect URI Mismatch

**Problem**: OAuth callback fails with "redirect_uri_mismatch".

**Solution**:
- Verify redirect URI in provider console matches exactly:
  ```
  http://localhost:8081/api/services/{service}/callback
  ```
- Check that `BACKEND_URL` or `DOMAIN` env vars are set correctly for production
- Ensure no trailing slashes

### @code.berlin Restriction

**Problem**: Can't log in with non-@code.berlin email.

**Solution**:
- For development, add to `.env.development.local`:
  ```bash
  AUTH_BYPASS=1
  VITE_AUTH_BYPASS=1
  ```
- For production, only @code.berlin emails are allowed (by design)

### CORS Errors

**Problem**: OAuth callback fails with CORS error.

**Solution**:
- Verify `CLIENT_ORIGIN` matches your frontend URL
- Check COOP/COEP headers in dev (should be `unsafe-none`)
- Ensure cookies have `credentials: 'include'`

---

## Testing Connection Status

1. **GET `/api/services/config`**:
   ```bash
   curl -X GET http://localhost:8081/api/services/config \
     -H "Cookie: auth_token=..." \
     -H "Content-Type: application/json"
   ```
   Returns configuration status for all providers.

2. **GET `/api/services`**:
   ```bash
   curl -X GET http://localhost:8081/api/services \
     -H "Cookie: auth_token=..." \
     -H "Content-Type: application/json"
   ```
   Returns connected services for current user.

3. **POST `/api/services/{service}/test`**:
   ```bash
   curl -X POST http://localhost:8081/api/services/github/test \
     -H "Cookie: auth_token=..." \
     -H "Content-Type: application/json"
   ```
   Tests if service connection is valid.

---

## Architecture Notes

- **Modular OAuth**: All OAuth logic is in `server/oauth/`
- **Provider files**: Each provider has its own file in `server/oauth/providers/`
- **Token storage**: Encrypted tokens stored in MongoDB (or in-memory fallback)
- **Client utility**: Use `@shared/lib/services/oauthClient.js` from frontend

For more details, see:
- `server/oauth/config.js` - Provider definitions
- `server/oauth/callbacks.js` - OAuth callback handling
- `src/shared/lib/secureTokens.js` - Token encryption & storage
