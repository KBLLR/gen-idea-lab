# Gemini CLI Configuration Guide

## Prerequisites
- **Node.js 18+** (Node 20 recommended) for running the local server and CLI integration.
- **Google Gemini access** available through Application Default Credentials (ADC) or an API key fallback.
- **Google OAuth 2.0 credentials** for end-user authentication via the `/auth/google` route.
- **Optional third-party service credentials** (GitHub, Notion, Figma, Google Drive/Photos/Calendar, Gmail, OpenAI, Claude, Ollama, DrawThings) when exposing integrations through the CLI.

## Environment Variables

### Required
Provide either ADC credentials or an API key so the Gemini client can initialize, then declare the core OAuth and runtime values:

```bash
# Core Gemini access (choose one path)
# 1. Preferred: rely on ADC after running `gcloud auth application-default login`
# 2. Fallback: supply an API key via one of the supported variables
API_KEY=your-gemini-api-key                # Legacy name still documented in README
GOOGLE_API_KEY=your-gemini-api-key         # Checked during fallback
GEMINI_API_KEY=your-alternate-gemini-key   # Secondary alias also checked

# OAuth session management
AUTH_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id

# Server runtime
PORT=8081
NODE_ENV=development
```

### Optional Integrations
Expose additional provider features only when the corresponding client credentials are present:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Notion OAuth
NOTION_CLIENT_ID=your-notion-client-id
NOTION_CLIENT_SECRET=your-notion-client-secret

# Figma OAuth
FIGMA_CLIENT_ID=your-figma-client-id
FIGMA_CLIENT_SECRET=your-figma-client-secret
```

Additional provider slots supported by the server include Google Drive, Google Photos, Google Calendar, Gmail, OpenAI, Claude, Ollama, and DrawThings; surface these as optional or experimental integrations within the CLI when relevant.

## Authentication Modes

### Preferred: Application Default Credentials (ADC)
The server first attempts to initialize the Gemini SDK with ADC. Ensure the local machine or deployment target has Google Cloud credentials configured by running:

```bash
gcloud auth application-default login
```

This command provisions the ADC token used by the Express bootstrap when calling `GoogleAuth` with the required `cloud-platform` and `generative-language.retriever` scopes.

### Fallback: API Key
If ADC resolution fails, the server falls back to `GOOGLE_API_KEY`, `GEMINI_API_KEY`, or the legacy `API_KEY`. Provide at least one of these variables so the CLI can surface a usable API key path when ADC is unavailable. Missing all options will cause the server to exit with an error; warn the user accordingly.

## OAuth Cookie Flow (`/auth/google`)
1. The CLI exchanges a Google ID token by POSTing `{ idToken }` to `/auth/google`.
2. On success, the server issues a JWT and stores it in an `auth_token` HTTP-only cookie with `SameSite=Lax`, a 7-day lifetime, and the `Secure` flag in production.
3. The response also returns the authenticated user's profile payload.
4. For subsequent protected requests, the CLI must preserve the `auth_token` cookie (e.g., via a cookie jar or persisted cookie store) and resend it automatically so Express middleware can authorize the session.
5. Use `/auth/logout` to clear the cookie and `/auth/me` to validate the current identity when needed.

## Example `.env`

```bash
# --- core auth ---
AUTH_SECRET=super-secret-value
GOOGLE_CLIENT_ID=123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=shhh
VITE_GOOGLE_CLIENT_ID=123.apps.googleusercontent.com

# --- gemini access ---
# Prefer ADC via gcloud; fallback key only if necessary
API_KEY=ai-xxxxxxxxxxxxxxxxxxxx

# --- runtime ---
PORT=8081
NODE_ENV=development
```

## Runtime Notes for CLI Integrations
- **Ports**: Frontend defaults to `http://localhost:3000`; backend API lives at `http://localhost:8081`. Ensure the CLI aligns with these defaults or allows overrides.
- **Cookies**: Maintain a secure cookie store for the `auth_token` to access routes guarded by authentication middleware.
- **Optional Services**: Only surface GitHub, Notion, Figma, and other provider-specific actions when their credentials are present; otherwise mark them as unavailable.
- **Logging**: Initialization failures for ADC fall back to API key mode. Surface the warnings so users know when they are running in deprecated API key mode.
- **Environment validation**: Prompt users to configure ADC (`gcloud auth application-default login`) before relying on API keys, mirroring the server's preferred flow.
