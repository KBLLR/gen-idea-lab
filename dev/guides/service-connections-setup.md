# Service Connections Setup Guide

## Overview

This guide covers the complete setup process for connecting external services to the GenBooth Idea Lab platform. Each service integration provides unique capabilities for AI-powered workflows and data analysis.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Services Setup](#google-services-setup)
3. [GitHub Integration](#github-integration)
4. [Notion Integration](#notion-integration)
5. [Figma Integration](#figma-integration)
6. [AI Model Providers](#ai-model-providers)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Development Environment
- Node.js 18+ installed
- Git for version control
- Text editor or IDE
- Web browser for OAuth flows

### Environment Variables Setup
Create a `.env` file in your project root:

```env
# Authentication
AUTH_SECRET=your_secure_random_string

# Google Services
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_API_KEY=your_google_api_key

# GitHub Integration
GITHUB_CLIENT_ID=your_github_oauth_app_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_secret

# Notion Integration
NOTION_CLIENT_ID=your_notion_integration_id
NOTION_CLIENT_SECRET=your_notion_integration_secret

# Figma Integration
FIGMA_CLIENT_ID=your_figma_app_id
FIGMA_CLIENT_SECRET=your_figma_app_secret

# AI Model Providers
OPENAI_API_KEY=your_openai_api_key
CLAUDE_API_KEY=your_anthropic_api_key
HUGGINGFACE_API_KEY=your_huggingface_token
# ... additional provider keys
```

## Google Services Setup

### 1. Google Cloud Console Configuration

#### Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select existing project
3. Note your Project ID for reference

#### Enable Required APIs
Navigate to "APIs & Services" → "Library" and enable:
- **Calendar API**: For calendar integration
- **Drive API**: For file access
- **Photos Library API**: For photo management
- **Gmail API**: For email access
- **People API**: For user profile information

#### Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Set Application Type to "Web Application"
4. Configure authorized domains:
   - **Development**: `http://localhost:3000`
   - **Production**: Your domain (e.g., `https://yourdomain.com`)
5. Set authorized redirect URIs:
   ```
   http://localhost:3000/api/services/googlecalendar/callback
   http://localhost:3000/api/services/googledrive/callback
   http://localhost:3000/api/services/googlephotos/callback
   http://localhost:3000/api/services/gmail/callback
   ```

#### API Key Configuration
1. Click "Create Credentials" → "API Key"
2. Restrict the key to specific APIs (recommended)
3. Add HTTP referrer restrictions for security

### 2. Scopes and Permissions

Each Google service requires specific OAuth scopes:

```javascript
const GOOGLE_SCOPES = {
  calendar: 'https://www.googleapis.com/auth/calendar.readonly',
  drive: 'https://www.googleapis.com/auth/drive.readonly',
  photos: 'https://www.googleapis.com/auth/photoslibrary.readonly',
  gmail: 'https://www.googleapis.com/auth/gmail.readonly'
};
```

### 3. Testing Connection

After setup, test the connection:
1. Start your development server: `npm run dev`
2. Navigate to Settings → Service Connections
3. Click "Connect" for each Google service
4. Complete OAuth flow in popup window
5. Verify green connection indicator

## GitHub Integration

### 1. GitHub OAuth App Setup

#### Create OAuth App
1. Go to GitHub Settings → Developer Settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in application details:
   - **Application Name**: "GenBooth Idea Lab"
   - **Homepage URL**: `http://localhost:3000` (development)
   - **Authorization Callback URL**: `http://localhost:3000/api/services/github/callback`

#### Configure Environment Variables
```env
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_client_secret
```

### 2. Required Permissions

GitHub OAuth scopes needed:
- `repo`: Access to repositories
- `user:email`: User email address
- `read:org`: Organization membership (if needed)

### 3. Integration Features

Once connected, GitHub integration provides:
- Repository browsing
- Issue and PR management
- Code analysis capabilities
- Commit history access

## Notion Integration

### 1. Notion Integration Setup

#### Create Notion Integration
1. Go to [Notion Developers](https://developers.notion.com/)
2. Click "Create new integration"
3. Fill in basic information:
   - **Name**: "GenBooth Idea Lab"
   - **Logo**: Optional
   - **Associated workspace**: Select your workspace

#### Configure Capabilities
Enable the following capabilities:
- ✅ Read content
- ✅ Update content (if needed)
- ✅ Insert content (if needed)

#### Get Integration Credentials
1. Copy the "Internal Integration Token"
2. Note the Integration ID from URL

### 2. Environment Configuration

```env
NOTION_CLIENT_ID=your_notion_integration_id
NOTION_CLIENT_SECRET=your_notion_integration_token
```

### 3. Workspace Permissions

#### Share Pages with Integration
1. Open the Notion page/database you want to access
2. Click "Share" → "Invite"
3. Search for your integration name
4. Select appropriate permissions

#### Database Access
For database integration:
1. Share the parent page containing databases
2. Integration will inherit access to child databases
3. Verify permissions in integration settings

## Figma Integration

### 1. Figma App Setup

#### Create Figma App
1. Go to [Figma Developers](https://www.figma.com/developers/apps)
2. Click "Create new app"
3. Fill in app details:
   - **App Name**: "GenBooth Idea Lab"
   - **Description**: Brief description of your app

#### Configure OAuth Settings
1. Set **Redirect URI**: `http://localhost:3000/api/services/figma/callback`
2. Choose appropriate scopes:
   - `files:read`: Access to read files
   - `file_comments:read`: Read comments (if needed)

### 2. Environment Setup

```env
FIGMA_CLIENT_ID=your_figma_app_client_id
FIGMA_CLIENT_SECRET=your_figma_app_client_secret
```

### 3. Integration Capabilities

Figma integration enables:
- Design file access
- Asset export and download
- Component library browsing
- Design system analysis

## AI Model Providers

### OpenAI Configuration

#### API Key Setup
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Set usage limits and monitoring

```env
OPENAI_API_KEY=sk-your_openai_api_key
```

#### Available Models
- GPT-4 Turbo
- GPT-3.5 Turbo
- DALL-E 3
- Whisper

### Claude (Anthropic) Configuration

#### API Access
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Generate API key
3. Configure usage settings

```env
CLAUDE_API_KEY=sk-ant-your_claude_api_key
```

### Hugging Face Configuration

#### Token Setup
1. Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Create new token with appropriate permissions
3. Select models you want to access

```env
HUGGINGFACE_API_KEY=hf_your_huggingface_token
```

### Local Model Providers

#### Ollama Setup
1. Install Ollama locally
2. Pull desired models: `ollama pull llama2`
3. Start Ollama service: `ollama serve`

#### vLLM Setup
1. Install vLLM: `pip install vllm`
2. Start server with desired model
3. Configure endpoint in application

## Connection Status Management

### Monitoring Connections

The application provides real-time connection status:

```javascript
// Check connection status
const connectedServices = useStore.use.connectedServices();

// Examples
const isGoogleCalendarConnected = connectedServices?.googlecalendar?.connected;
const isGitHubConnected = connectedServices?.github?.connected;
const isNotionConnected = connectedServices?.notion?.connected;
```

### Visual Indicators

Each service shows connection status through:
- **Color-coded icons**: Green (connected), Gray (disconnected)
- **Status badges**: Connection state indicators
- **Interactive feedback**: Hover states and tooltips

### Reconnection Handling

Automatic reconnection for:
- **Token expiration**: Refresh tokens automatically
- **Network issues**: Retry with exponential backoff
- **Service unavailability**: Graceful degradation

## Security Best Practices

### Token Management
- Store tokens securely server-side
- Use HTTPS in production
- Implement token rotation
- Monitor for unusual activity

### Permission Scoping
- Request minimal required permissions
- Use read-only scopes when possible
- Regular permission audits
- User consent management

### Data Protection
- Encrypt sensitive data at rest
- Secure API communications
- Regular security updates
- Compliance with privacy regulations

## Troubleshooting

### Common Issues

#### OAuth Redirect Mismatch
**Error**: `redirect_uri_mismatch`
**Solution**: Verify redirect URIs match exactly in OAuth app settings

#### Token Expired
**Error**: `invalid_token` or `token_expired`
**Solution**: Check token refresh logic, verify expiration handling

#### API Quota Exceeded
**Error**: `quota_exceeded` or `rate_limit_exceeded`
**Solution**: Implement rate limiting, consider upgrading API plan

#### CORS Issues
**Error**: Cross-origin request blocked
**Solution**: Configure CORS headers properly, verify domain settings

### Debug Mode

Enable debug logging:
```env
DEBUG_SERVICES=true
DEBUG_OAUTH=true
```

This will log:
- OAuth flow steps
- API request/response details
- Token management events
- Connection status changes

### Health Checks

Monitor service health:
```bash
# Check application health
curl http://localhost:3000/healthz

# Check specific service status
curl http://localhost:3000/api/services
```

### Log Analysis

Common log patterns to watch:
- Failed authentication attempts
- API rate limit warnings
- Token refresh cycles
- Connection drops

## Production Deployment

### Environment Setup
1. Update OAuth redirect URIs for production domain
2. Use secure environment variable management
3. Enable HTTPS/SSL certificates
4. Configure proper CORS policies

### Monitoring
1. Set up service health monitoring
2. Track API usage and quotas
3. Monitor connection success rates
4. Alert on service failures

### Scaling Considerations
1. Implement connection pooling
2. Cache frequently accessed data
3. Use CDN for static assets
4. Consider rate limiting strategies

---

## Support and Resources

### Documentation Links
- [Google APIs Documentation](https://developers.google.com/apis-explorer)
- [GitHub REST API](https://docs.github.com/en/rest)
- [Notion API](https://developers.notion.com/)
- [Figma API](https://www.figma.com/developers/api)

### Community Support
- GitHub Issues for platform-specific problems
- Stack Overflow for general integration questions
- Service-specific developer communities

### Professional Support
For enterprise deployments or complex integrations, consider:
- Professional services consultation
- Custom integration development
- Security audit and compliance review