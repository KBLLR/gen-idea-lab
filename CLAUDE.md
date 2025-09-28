# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development environment with Vite dev server (port 3000) and Express server with nodemon (port 8081)
- `npm run dev:client` - Start only Vite development server on port 3000
- `npm run dev:server` - Start only Express server with nodemon on port 8081
- `npm run build` - Build production bundle with Vite
- `npm start` - Start production server (serves built files from dist/)
- `npm run preview` - Preview production build with Vite preview server
- `npm run generate-thumbnails` - Generate thumbnails for creative modes using Gemini API

## Architecture Overview

This is a full-stack React application with three main sub-applications:

### Frontend Architecture (React 19 + Vite 5)
- **State Management**: Zustand with Immer middleware and persistence
- **Component Structure**: Three-column layout that adapts based on active app
- **Apps**:
  - `ideaLab` - Module-based learning system with orchestrator chat
  - `imageBooth` - AI-powered image transformation tool
  - `archiva` - Documentation and entry management system

### State Store Structure (src/lib/store.js)
- **Authentication**: User state, JWT-based auth with Google OAuth
- **Service Integrations**: OAuth connections to GitHub, Notion, Figma, Google services, AI APIs
- **Module System**: Academic module data with personality assignments for AI agents
- **Three App States**:
  - Idea Lab: Module selection, orchestrator chat, assistant histories
  - Image Booth: Mode selection, image generation state
  - Archiva: Entry management and documentation

### Server Architecture (server.js)
- **Express Server**: Serves both API endpoints and static files
- **Proxy Pattern**: All AI requests go through `/api/proxy` to hide API keys
- **Authentication**: JWT tokens in HTTP-only cookies, Google OAuth integration
- **Service Integrations**: OAuth flows for external services (GitHub, Notion, Figma, Google APIs)
- **Observability**: Prometheus metrics at `/metrics`, health check at `/healthz`

### Key Files and Patterns
- **Components**: All in `src/components/`, use `useStore.use.stateName()` for Zustand selectors
- **Actions**: Centralized in `src/lib/actions.js` for cross-component operations
- **Modules**: Academic module data in `src/lib/modules.js` with semester groupings
- **AI Integration**: LLM calls in `src/lib/llm.js`, personalities in `src/lib/assistant/personalities.js`

## Environment Setup

Required environment variables:
- `API_KEY` or `GEMINI_API_KEY` - Google Gemini API key (required)
- `PORT` - Server port (defaults to 8081)

Optional OAuth environment variables for service integrations:
- GitHub: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Notion: `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`
- Figma: `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET`
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Deployment

The application includes:
- **Multi-stage Dockerfile** for production builds
- **Cloud Run deployment** with `gcloud run deploy`
- **Express static serving** of Vite build output
- **Health checks** and **metrics** endpoints for production monitoring

## Development Notes

- Vite proxy configuration routes `/api`, `/auth`, `/metrics`, `/healthz` to Express server (port 8081)
- Authentication state is persisted in Zustand but tokens are HTTP-only cookies
- Service connections are stored in-memory on server (use database in production)
- All AI requests are server-side proxied to prevent API key exposure
- Module system supports semester-based organization with individual AI agent personalities