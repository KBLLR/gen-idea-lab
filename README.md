<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ProjectGen Booth Idea Lab

GenBooth Idea Lab is a comprehensive educational platform designed for CODE University of Applied Sciences students, integrating AI-powered learning assistance with project management and creative tools.

**Application Suite:**
- **Idea Lab** — AI-assisted academic module exploration with specialized agents and Orchestrator Chat
- **Image Booth** — Creative AI image transformation powered by Google Gemini
- **Archiva** — Documentation and project archive system with templates
- **Workflows** — Guided, multi-step processes for design, engineering, and orchestration
- **Planner** — Graph-based planning board to map goals, milestones, and dependencies

**Tech Stack:**
- Frontend: React 19 + Vite 5
- Backend: Express 4 (ESM) with unified chat endpoint
- Provider Abstraction: Gemini, OpenAI, Anthropic (Claude), Ollama (local)
- Authentication: Google OAuth with JWT tokens
- State: Zustand with persistence
- Services: GitHub, Notion, Figma, Google APIs integration
- Observability: Prometheus metrics, Winston logging
- Deployment: Vercel, Docker, Cloud Run

## Contents
- [Vision](#vision)
- [Purpose & Features](#purpose--features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Deployment](#deployment)
- [Service Integrations](#service-integrations)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Vision

GenBooth Idea Lab empowers CODE University students with an Orchestrator-led multi-agent system that coordinates specialized module assistants (Design, Software Engineering, STS) and unifies multiple AI model providers behind a single interface. The vision is to:

- Orchestrate multi-agent collaboration for planning, research, design, and engineering tasks
- Unify providers (Gemini, OpenAI, Claude, Ollama) via a normalized chat interface with tool-calling parity
- Ground conversations with shared memory (RAG) and workflows for repeatable, auditable execution
- Provide a seamless experience across Idea Lab (learning), Image Booth (making), Archiva (documenting), Workflows (guidance), and Planner (strategy)

See also: reports/multi-agent-systems.md for an in-depth architecture and provider strategy.

## Purpose & Features

### 🎓 Idea Lab (Academic Focus)
- **Module System**: Organized by CODE University semester structure (Orientation, Core 2–5, Synthesis)
- **AI Agents**: Each academic module (Design, SE, STS) has specialized AI personalities
- **Orchestrator Chat**: Central AI coordinator that invites module-specific agents to conversations
- **Orchestrator Enhancements**: New Chat sessions, Sessions dropdown (save/restore/clear), Goals quick-start (academic goals reminder), model selector with graceful fallback
- **Three-Column Layout**: Module selector → Module viewer → AI-powered chat
- **Academic Integration**: Real university module data with learning objectives and resources

### 🎨 Image Booth (Creative Tools)
- **AI Transformations**: Google Gemini-powered image-to-image generation
- **Creative Modes**: Multiple artistic transformation styles with auto-generated thumbnails
- **Safe Processing**: Server-side AI calls protect API keys from client exposure
- **Batch Operations**: Thumbnail generation scripts for all creative modes

### 📚 Archiva (Documentation)
- **Entry Management**: Create and organize academic project documentation
- **Template System**: Pre-built templates for different types of coursework
- **Category Organization**: Structured workflows for academic documentation
- **Version Control**: Track document iterations and changes

### 🧭 Workflows (Guided Processes)
- **Templates**: Orchestrator and module workflows (e.g., project kickoff, design thinking, algorithm design)
- **Step Types**: Prompt chains, interactive prompts, structured guidance, and completion artifacts
- **Outcome**: Repeatable, auditable paths for learning and project delivery

### 🗺️ Planner (Graph)
- **Graph Model**: Nodes/edges representing goals, milestones, tasks, dependencies
- **Workflow Integration**: Link workflow steps and Archiva artifacts to planner nodes
- **Use Cases**: Semester planning, project roadmaps, cross-module coordination

## Architecture

### Application Structure
```
Three-App Layout (Adaptive):
┌─────────────┬─────────────┬─────────────┐
│ Left Column │Middle Column│Right Column │
│             │(Conditional)│             │
├─────────────┼─────────────┼─────────────┤
│App Switcher │             │             │
│             │             │             │
│Module/Mode  │Module       │Orchestrator │
│Selector     │Viewer       │Chat         │
│             │(Idea Lab    │(Main        │
│             │only)        │Content)     │
│             │             │             │
│User Bar     │             │             │
└─────────────┴─────────────┴─────────────┘
```

### Project Structure
```
.
├─ server.js                # Express server: API, OAuth, static serving
├─ src/
│  ├─ main.jsx             # Vite entry point
│  ├─ components/          # React components
│  │  ├─ App.jsx           # Main app with adaptive layout
│  │  ├─ LoginForm.jsx     # Google OAuth authentication
│  │  ├─ AppSwitcher.jsx   # Three-app navigation
│  │  ├─ ModeSelector.jsx  # Image Booth mode selection
│  │  ├─ ModuleViewer.jsx  # Academic module display
│  │  ├─ OrchestratorChat.jsx # AI chat interface
│  │  ├─ ArchivaDashboard.jsx # Documentation management
│  │  └─ Settings.jsx      # Service connections UI
│  └─ lib/                 # Core libraries
│     ├─ store.js          # Zustand state management
│     ├─ actions.js        # Cross-component operations
│     ├─ modules.js        # Academic module data
│     ├─ auth.js           # JWT authentication
│     ├─ llm.js            # AI integration
│     └─ services.js       # OAuth service management
├─ templates/              # Documentation templates and guides
├─ scripts/                # Utility scripts (thumbnail generation)
├─ Dockerfile              # Multi-stage containerization
└─ vite.config.js          # Vite configuration with proxy
```

## Prerequisites
- Node.js 18+ (Node 20 recommended)
- Google Gemini API key
- Google OAuth 2.0 credentials
- Optional: Service API keys (GitHub, Notion, Figma, etc.)

## Environment Setup

### Required Variables
Create a `.env` file with:

```bash
# Core API
API_KEY=your-gemini-api-key-here

# Authentication (Google OAuth)
AUTH_SECRET=your-jwt-secret-here
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id

# Server Configuration
PORT=8081
NODE_ENV=development
```

### Optional Service Integrations
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

**OAuth Configuration Guide**: See `/templates/oauth_configuration_guide.md` for complete setup instructions.

## Development

### Local Development
```bash
# Install dependencies
npm install

# Start development servers (Vite + Express)
npm run dev
```

**Development URLs:**
- Frontend: http://localhost:3000 (Vite dev server)
- Backend: http://localhost:8081 (Express server)
- Proxy: All `/api/*` requests routed to Express

### Available Scripts
- `npm run dev` — Concurrent Vite + Express development
- `npm run dev:client` — Vite development server only
- `npm run dev:server` — Express server with nodemon
- `npm run build` — Production build
- `npm run vercel-build` — Vercel deployment build
- `npm run preview` — Preview production build
- `npm run generate-thumbnails` — Generate AI-powered thumbnails

## Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
# Uses npm run vercel-build automatically
```

### Docker
```bash
# Build container
docker build -t genbooth:latest .

# Run locally
docker run --rm -p 8081:8081 \
  -e API_KEY=your-gemini-key \
  -e GOOGLE_CLIENT_ID=your-client-id \
  genbooth:latest
```

### Google Cloud Run
```bash
gcloud run deploy genbooth-idea-lab \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars API_KEY=your-gemini-key
```

## Service Integrations

GenBooth supports OAuth integration with multiple services:

### Supported Services
- **Google Services**: Drive, Photos, Calendar, Gmail
- **Development Tools**: GitHub repositories, Notion workspaces, Figma files
- **AI Services**: OpenAI, Claude API keys (user-configurable)
- **Local AI**: Ollama endpoints

### OAuth Flow
1. **Google Login**: Primary authentication (JavaScript SDK)
2. **Service Connections**: Optional OAuth integrations via Settings
3. **API Management**: Server-side token storage and refresh
4. **Security**: HTTP-only cookies, no client-side API keys

## API Reference

### Authentication Endpoints
- `POST /auth/google` - Google OAuth login
- `POST /auth/logout` - Clear authentication
- `GET /auth/me` - Get current user

### AI Proxy
- `POST /api/proxy` - Secure Gemini API proxy
  ```json
  {
    "model": "gemini-2.5-flash",
    "contents": [{"parts": [{"text": "prompt"}]}],
    "config": {},
    "safetySettings": []
  }
  ```

### Service Management
- `GET /api/services` - List connected services
- `POST /api/services/:service/connect` - Initiate OAuth flow
- `DELETE /api/services/:service` - Disconnect service
- `POST /api/services/:service/test` - Test connection

### Health & Monitoring
- `GET /healthz` - Health check (tests Gemini API)
- `GET /metrics` - Prometheus metrics
- Legal pages: `/privacy`, `/terms`

## Troubleshooting

### Common Issues

**Authentication Problems:**
- Google login fails: Check JavaScript origins in Google Cloud Console (no redirect URIs needed)
- Service connections fail: Verify OAuth callback URLs match exactly
- Token expired: Services auto-refresh or reconnect as needed

**Development Issues:**
- Server won't start: Ensure `API_KEY` is set in `.env`
- Port conflicts: Change ports in vite.config.js or use different terminals
- Proxy errors: Verify Vite proxy configuration points to correct Express port (8081)

**Deployment Issues:**
- Vercel build fails: Check `vercel-build` script and environment variables
- Service integrations break: Ensure production OAuth URLs are configured
- Health checks fail: Verify Gemini API key works in production environment

### Debug Commands
```bash
# Check environment variables
grep VITE_ .env

# Test server independently
npm run dev:server

# Check service connections
curl http://localhost:8081/api/services
```

### Performance Notes
- AI requests are proxied to prevent API key exposure
- Zustand state persists across sessions (except authentication)
- Service connections cached in-memory (use database in production)
- Thumbnails generated server-side to optimize client performance

## Educational Context

**Target Audience**: CODE University of Applied Sciences students
**Academic Integration**:
- Real university module structure and learning objectives
- Interdisciplinary approach (Design + Software + Business)
- Project-based learning methodology support
- AI agents tailored to specific academic domains

**Learning Workflow**:
1. Select academic module from semester-organized structure
2. Interact with specialized AI agent for that domain
3. Document learning and projects in Archiva
4. Create visual assets with Image Booth
5. Integrate with external tools (GitHub, Notion, Figma)

---

## License
SPDX-License-Identifier: Apache-2.0

**GenBooth Idea Lab** - Empowering CODE University students with AI-enhanced learning tools.