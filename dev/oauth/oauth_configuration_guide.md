# OAuth Service Configuration Guide

Complete guide for configuring all OAuth integrations in GenBooth Idea Lab.

## Architecture Overview

GenBooth uses two different OAuth flows:
- **Google Login**: JavaScript SDK (browser-based, no redirect URIs)
- **All Other Services**: Server-side OAuth flow (requires redirect URIs)

## Configuration Summary

### 1. Google OAuth (Login Authentication)
**Platform**: Google Cloud Console
**URL**: https://console.cloud.google.com/apis/credentials

**Configuration**:
- **Client ID**: `277330682555-tbgiea2l61f0826u0o7s1ff8god83dlk.apps.googleusercontent.com`
- **Authorized JavaScript Origins**:
  - `http://localhost:3000` (Vite dev server)
  - `http://localhost:8081` (Express server)
  - `https://gen-idea-eg3e0urhg-kbllr-projects.vercel.app`
  - `https://www.kbllr.com`
  - `https://kbllr.com`
- **Authorized Redirect URIs**: ❌ **LEAVE EMPTY** (JavaScript SDK doesn't use redirect URIs)

**Required APIs to Enable**:
- Google Drive API
- Google Photos Library API
- Google Calendar API
- Gmail API

### 2. GitHub OAuth
**Platform**: GitHub Developer Settings
**URL**: https://github.com/settings/developers

**Configuration**:
- **Authorization Callback URLs**:
  - `https://kbllr.com/api/services/github/callback`
  - `http://localhost:8081/api/services/github/callback`
- **Scopes**: `repo user`

### 3. Notion OAuth
**Platform**: Notion Integrations
**URL**: https://www.notion.so/my-integrations

**Configuration**:
- **Redirect URIs**:
  - `https://kbllr.com/api/services/notion/callback`
  - `http://localhost:8081/api/services/notion/callback`
- **Integration Type**: OAuth integration
- **Scopes**: Default (read access to shared pages)

### 4. Figma OAuth
**Platform**: Figma Developer Apps
**URL**: https://www.figma.com/developers/apps

**Configuration**:
- **Callback URLs**:
  - `https://kbllr.com/api/services/figma/callback`
  - `http://localhost:8081/api/services/figma/callback`
- **Scopes**:
  - `files:read` (access user's Figma files and basic profile information)

### 5. Google Services OAuth (Drive, Photos, Calendar, Gmail)
**Platform**: Google Cloud Console (same as login)
**URL**: https://console.cloud.google.com/apis/credentials

**Additional Redirect URIs to Add**:
- `https://kbllr.com/api/services/googleDrive/callback`
- `https://kbllr.com/api/services/googlePhotos/callback`
- `https://kbllr.com/api/services/googleCalendar/callback`
- `https://kbllr.com/api/services/gmail/callback`
- `http://localhost:8081/api/services/googleDrive/callback`
- `http://localhost:8081/api/services/googlePhotos/callback`
- `http://localhost:8081/api/services/googleCalendar/callback`
- `http://localhost:8081/api/services/gmail/callback`

## Environment Variables

Create/update your `.env` file with these variables:

```bash
# Gemini AI API Key
API_KEY=your-gemini-api-key-here

# Authentication
AUTH_SECRET=your-jwt-secret-here

# Google OAuth (for both login and API access)
GOOGLE_CLIENT_ID=277330682555-tbgiea2l61f0826u0o7s1ff8god83dlk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
VITE_GOOGLE_CLIENT_ID=277330682555-tbgiea2l61f0826u0o7s1ff8god83dlk.apps.googleusercontent.com

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Notion OAuth
NOTION_CLIENT_ID=your-notion-client-id
NOTION_CLIENT_SECRET=your-notion-client-secret

# Figma OAuth
FIGMA_CLIENT_ID=your-figma-client-id
FIGMA_CLIENT_SECRET=your-figma-client-secret

# Server Configuration
PORT=8081
NODE_ENV=development
```

## Vercel Deployment

Add all environment variables in Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all the variables listed above (except NODE_ENV - set to "production")
3. Make sure to add them for all environments (Production, Preview, Development)

## Callback URL Pattern

All OAuth services (except Google login) follow this pattern:
```
{domain}/api/services/{service}/callback
```

Examples:
- GitHub: `https://kbllr.com/api/services/github/callback`
- Notion: `https://kbllr.com/api/services/notion/callback`
- Figma: `https://kbllr.com/api/services/figma/callback`
- Google Drive: `https://kbllr.com/api/services/googleDrive/callback`

## Troubleshooting

### Common Issues

1. **"redirect_uri is not associated with this application"**
   - Check that the callback URL is exactly configured in the OAuth app
   - Ensure no typos in the domain or path

2. **Google login not working**
   - Make sure Authorized Redirect URIs is EMPTY for Google login
   - Only use Authorized JavaScript Origins for Google login

3. **Service connections failing**
   - Verify environment variables are set correctly
   - Check that OAuth apps are published/approved where required
   - Ensure all required APIs are enabled in Google Cloud Console

4. **Development vs Production**
   - Make sure to add both localhost and production callback URLs
   - Verify environment variables are set in both local .env and Vercel

### Required OAuth App States

- **GitHub**: App can be in development mode
- **Notion**: Integration must be public for external users
- **Figma**: App must be published for production use
- **Google**: OAuth consent screen must be configured for external users

## Testing Checklist

- [ ] Google login works (main authentication)
- [ ] GitHub service connects and shows repositories
- [ ] Notion service connects and shows workspaces
- [ ] Figma service connects and shows files
- [ ] Google Drive service connects and shows files
- [ ] All services can be disconnected and reconnected
- [ ] Environment variables are set in Vercel
- [ ] Production URLs work in deployed app

## API Key Services

These services don't use OAuth - users enter API keys directly:
- OpenAI (API key)
- Claude/Anthropic (API key)
- Additional Gemini keys (API key)
- Ollama (URL endpoint)

Users can configure these through the Settings UI without requiring OAuth setup.

---

*Last updated: September 28, 2025*
*Project: GenBooth Idea Lab*