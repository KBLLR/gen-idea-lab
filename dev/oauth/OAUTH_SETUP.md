# OAuth Service Setup Guide

This guide explains how to configure OAuth services (GitHub, Notion, Figma, Google services) for GenBooth.

## Prerequisites

- Server running at `http://localhost:8081` (or your production URL)
- Access to each service's developer console

## General OAuth Flow

1. User clicks "Connect" in Settings
2. Server redirects to OAuth provider with `client_id`, `scope`, and `redirect_uri`
3. User authorizes the app
4. Provider redirects back to your callback URL with authorization code
5. Server exchanges code for access token
6. Server stores token securely
7. User is redirected to Dashboard with success message

## Service-Specific Configuration

### GitHub

**Scopes Required**: `repo user`

**Setup Steps**:
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: GenBooth (or your app name)
   - **Homepage URL**: `http://localhost:3000` (or your frontend URL)
   - **Authorization callback URL**: `http://localhost:8081/api/services/github/callback`
4. Click "Register application"
5. Copy **Client ID** and **Client Secret**
6. Add to `.env`:
   ```bash
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   ```

**Common Issues**:
- ❌ "Redirect URI mismatch" - Make sure callback URL exactly matches
- ❌ "Invalid scope" - GitHub requires space-separated scopes: `repo user`

---

### Notion

**Scopes Required**: None (empty string - Notion uses integration permissions)

**Setup Steps**:
1. Go to https://www.notion.so/my-integrations
2. Click "+ New integration"
3. Fill in:
   - **Name**: GenBooth
   - **Associated workspace**: Select your workspace
   - **Capabilities**: Select what you need (Read content, Update content, etc.)
4. Click "Submit"
5. Copy **OAuth client ID** and **OAuth client secret** (NOT the internal integration token)
6. Under "OAuth Domain & URIs":
   - **Redirect URIs**: Add `http://localhost:8081/api/services/notion/callback`
7. Add to `.env`:
   ```bash
   NOTION_CLIENT_ID=your_oauth_client_id_here
   NOTION_CLIENT_SECRET=your_oauth_client_secret_here
   ```

**Common Issues**:
- ❌ "invalid_client" - Using wrong credentials (internal token vs OAuth credentials)
- ❌ "Invalid redirect URI" - Must be added in integration settings
- ⚠️ Notion OAuth requires the secret to be Base64 encoded in Authorization header (already handled in code)

---

### Figma

**Scopes Required**: `file_read`

**Setup Steps**:
1. Go to https://www.figma.com/developers/apps
2. Click "Create new app"
3. Fill in:
   - **App name**: GenBooth
   - **App description**: Your description
   - **Website URL**: `http://localhost:3000`
   - **Callback URL**: `http://localhost:8081/api/services/figma/callback`
   - **Permissions**: Select "File read"
4. Click "Create app"
5. Copy **Client ID** and **Client Secret**
6. Add to `.env`:
   ```bash
   FIGMA_CLIENT_ID=your_client_id_here
   FIGMA_CLIENT_SECRET=your_client_secret_here
   ```

**Common Issues**:
- ❌ "Invalid scopes for app" - Make sure "File read" permission is enabled in app settings
- ❌ Wrong scope format - Use `file_read` (underscore), not `files:read` (colon)

---

### Google Services (Drive, Photos, Calendar, Gmail)

**Scopes Required**:
- **Google Drive**: `https://www.googleapis.com/auth/drive.readonly`
- **Google Photos**: `https://www.googleapis.com/auth/photoslibrary.readonly`
- **Google Calendar**: `https://www.googleapis.com/auth/calendar.readonly`
- **Gmail**: `https://www.googleapis.com/auth/gmail.readonly`

**Setup Steps**:
1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable APIs:
   - Go to "APIs & Services" > "Library"
   - Search and enable: "Google Drive API", "Google Photos Library API", "Google Calendar API", "Gmail API"
4. Create OAuth Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: GenBooth
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: Add ALL of these:
     ```
     http://localhost:8081/api/services/googleDrive/callback
     http://localhost:8081/api/services/googlePhotos/callback
     http://localhost:8081/api/services/googleCalendar/callback
     http://localhost:8081/api/services/gmail/callback
     ```
5. Click "Create"
6. Copy **Client ID** and **Client Secret**
7. Configure OAuth Consent Screen:
   - Go to "OAuth consent screen"
   - User Type: "External" (for testing) or "Internal" (for organization)
   - Add test users (your email) if using External
   - Add scopes: search for and add the scopes listed above
8. Add to `.env`:
   ```bash
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

**Common Issues**:
- ❌ "redirect_uri_mismatch" - Each service needs its specific callback URL added
- ❌ "access_denied" - User needs to be added as test user in OAuth consent screen
- ❌ "invalid_scope" - Scope not enabled in OAuth consent screen
- ⚠️ Google requires `access_type=offline` and `prompt=consent` for refresh tokens (already handled in code)

---

## Environment Variables Summary

Your `.env` file should contain:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Notion OAuth
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=

# Figma OAuth
FIGMA_CLIENT_ID=
FIGMA_CLIENT_SECRET=

# Google OAuth (shared for all Google services)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Testing Your Setup

1. **Start the server**: `npm run dev`
2. **Check service config**: The Settings modal will show which services are configured
3. **Connect a service**: Click "Connect" - if configured correctly, you'll be redirected to OAuth provider
4. **Check for errors**: Look for error toasts or check server logs for detailed errors

## Debugging OAuth Issues

### Check Server Logs
```bash
# Look for these log entries:
[info] OAuth start for {service}
[info] Successfully connected {service} for user {email}
[error] OAuth error for {service}
```

### Common Error Codes
- **oauth_error**: Provider denied the request (check app configuration)
- **missing_params**: Missing code or state in callback (check redirect URI)
- **invalid_state**: State parameter mismatch (security issue or session timeout)
- **token_exchange**: Failed to exchange authorization code for token (check client secret)
- **callback_error**: Server error during callback processing (check server logs)

### Verify Configuration Endpoint
Check which services are configured:
```bash
curl http://localhost:8081/api/services/config -H "Cookie: auth_token=your_token"
```

Response shows configuration status:
```json
{
  "github": {
    "configured": true,
    "redirectUri": "http://localhost:8081/api/services/github/callback"
  },
  "notion": {
    "configured": false,
    "missing": ["NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET"]
  }
}
```

## Production Deployment

When deploying to production:

1. Update redirect URIs in all OAuth apps to use your production domain
2. Set `FRONTEND_URL` environment variable to your production frontend URL
3. Ensure HTTPS is enabled (required by most OAuth providers)
4. Update OAuth consent screens to use production URLs
5. For Google: Change OAuth consent screen from "Testing" to "In production"

Example production `.env`:
```bash
FRONTEND_URL=https://yourdomain.com
# ... update all OAuth credentials for production apps
```

## Security Notes

- ✅ Never commit `.env` file to version control
- ✅ Rotate secrets regularly
- ✅ Use different OAuth apps for development and production
- ✅ Enable MongoDB (`MONGODB_URI`) for persistent token storage
- ✅ Use HTTPS in production
- ✅ Restrict OAuth apps to specific domains/IPs when possible
