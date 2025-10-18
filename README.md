# GenBooth Idea Lab

> **Status**: Work in Progress — Active brainstorming phase with steady forward progress
> **Institution**: CODE University of Applied Sciences
> **Focus**: Multi-agent systems, agent orchestration, and AI-augmented learning workflows

---

## Abstract

GenBooth Idea Lab is an experimental platform investigating multi-agent system (MAS) architectures for educational contexts. The system employs an orchestrator-based agent coordination model with specialized domain assistants, exploring patterns in agent workflow composition, provider abstraction, and human-agent collaboration interfaces. Current research directions include agentflow design, cross-provider tool-calling parity, and persistent memory integration for learning contexts.

---

## System Overview

### Architecture

**Multi-Agent System (MAS) Components:**
- **Orchestrator Agent**: Central coordinator managing task delegation, context synthesis, and multi-agent conversations
- **Domain Agents**: Specialized assistants for Design, Software Engineering, and Science-Technology-Society modules
- **Provider Abstraction Layer**: Unified interface across Gemini, OpenAI, Claude, and Ollama with tool-calling normalization
- **Shared Memory**: RAG-based knowledge persistence and context grounding across agent interactions

**Micro-Application Suite:**
- **Idea Lab**: Academic module exploration with orchestrated multi-agent assistance
- **Image Booth**: AI-powered visual transformation workflows
- **Archiva**: Documentation and artifact management system
- **Planner**: Graph-based goal and dependency modeling
- **Workflows**: Reusable agent interaction patterns and guided procedures

### Technical Stack

```
Frontend:   React 19, Vite 5, Zustand (state management)
Backend:    Express 4 (ESM), JWT authentication
AI Layer:   Gemini, OpenAI, Claude, Ollama (local inference)
Integrations: Google OAuth, GitHub, Notion, Figma APIs
Deployment: Vercel, Docker, Google Cloud Run
Observability: Prometheus metrics, Winston logging
```

---

## Research Areas

### 1. Agent Orchestration & Coordination

Investigating orchestrator patterns for multi-agent collaboration:
- Task decomposition and delegation strategies
- Context handoff between specialized agents
- Agent personality modeling for domain expertise
- Conversation state management across agent switches

### 2. Agentflow Design Patterns

Exploring reusable workflow templates for agent interactions:
- Prompt chains with agent routing
- Interactive multi-step processes
- Structured guidance with completion artifacts
- Workflow-to-graph integration (linking Planner nodes to workflow steps)

### 3. Provider Abstraction & Tool Parity

Normalizing capabilities across heterogeneous AI providers:
- Unified chat interface with streaming support
- Tool-calling standardization (function schemas, execution patterns)
- Graceful degradation and fallback strategies
- Local vs. cloud model tradeoffs

### 4. Educational Context Integration

Applying MAS architecture to academic learning scenarios:
- Semester-structured module system (CODE University curriculum)
- Learning objective alignment with agent capabilities
- Project-based learning workflow support
- Cross-disciplinary knowledge synthesis

---

## Quick Start

### Prerequisites

- Node.js 18+
- Google Gemini API key
- Google OAuth 2.0 credentials

### Installation

```bash
# Clone and install
git clone <repository-url>
cd genbooth-idea-lab
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys and OAuth credentials

# Start development servers
npm run dev
```

Development URLs:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8081`

### Environment Variables

**Required:**
```bash
API_KEY=<gemini-api-key>
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-client-secret>
AUTH_SECRET=<jwt-secret>
```

**Optional (Extended Integrations):**
```bash
OPENAI_API_KEY=<openai-key>
ANTHROPIC_API_KEY=<claude-key>
GITHUB_CLIENT_ID=<github-oauth>
NOTION_CLIENT_ID=<notion-oauth>
FIGMA_CLIENT_ID=<figma-oauth>
```

See `templates/oauth_configuration_guide.md` for detailed OAuth setup instructions.

---

## Project Structure

```
.
├── server.js                    # Express server (API, OAuth, proxy)
├── src/
│   ├── apps/                    # Micro-applications
│   │   ├── ideaLab/            # Academic module system + MAS chat
│   │   ├── imageBooth/         # AI image transformation
│   │   ├── archiva/            # Documentation management
│   │   ├── planner/            # Graph-based planning
│   │   └── workflows/          # Agentflow templates
│   ├── shared/
│   │   ├── lib/                # Core libraries
│   │   │   ├── store.js        # Zustand state (w/ persistence)
│   │   │   ├── actions/        # Cross-component operations
│   │   │   ├── modules.js      # Academic module data
│   │   │   └── voice/          # Voice interaction system
│   │   ├── components/         # Reusable React components
│   │   └── hooks/              # Custom React hooks
│   ├── components/             # App-level components
│   │   ├── glassdock/          # Voice-enabled dock interface
│   │   ├── modals/             # Settings, command palette
│   │   └── ui/                 # Design system components
│   └── main.jsx                # Application entry point
├── docs/                        # Architecture and integration docs
├── templates/                   # Workflow and documentation templates
└── scripts/                     # Build and utility scripts
```

---

## Development

### Available Commands

```bash
npm run dev              # Concurrent Vite + Express development
npm run dev:client       # Frontend only (Vite)
npm run dev:server       # Backend only (Express + nodemon)
npm run build            # Production build
npm run preview          # Preview production build
npm test                 # Run test suite
npm run storybook        # UI component development (port 6006)
npm run test:ui          # UI component tests (Vitest + Storybook)
```

### Key Development Tools

- **Storybook**: Component-driven development with accessibility testing
- **Vitest**: Unit and integration testing with jsdom
- **Style Dictionary**: Design token generation and documentation
- **ESLint**: Code quality and consistency

---

## API Endpoints

### Authentication
```
POST /auth/google       # Google OAuth login
POST /auth/logout       # Clear authentication
GET  /auth/me          # Get current user
```

### AI Proxy
```
POST /api/proxy        # Secure multi-provider AI proxy
```

### Service Management
```
GET    /api/services                    # List connected services
POST   /api/services/:service/connect   # OAuth flow initiation
DELETE /api/services/:service           # Disconnect service
POST   /api/services/:service/test      # Test connection
```

### Health & Monitoring
```
GET /healthz           # Health check (includes Gemini API test)
GET /metrics           # Prometheus metrics
```

---

## Research Documentation

### Architecture & Design Decisions
- `reports/multi-agent-systems.md` — MAS architecture and provider strategy
- `docs/micro-apps/IMPLEMENTATION_NOTES.md` — Implementation details and changelog
- `docs/ui/components.md` — UI component library documentation
- `docs/integrations/` — Service integration guides

### Workflow Templates
- `templates/workflows/` — Agentflow definitions (JSON)
- `templates/archivai/` — Documentation templates

---

## Deployment

### Vercel (Recommended)
```bash
vercel                  # Deploy to production
vercel env pull         # Sync environment variables
```

### Docker
```bash
docker build -t genbooth:latest .
docker run -p 8081:8081 --env-file .env genbooth:latest
```

### Google Cloud Run
```bash
gcloud run deploy genbooth-idea-lab \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Current Research Status

### In Progress
- 🔬 Orchestrator conversation persistence and session management
- 🔬 Agentflow graph-to-execution compiler
- 🔬 RAG memory integration for learning context persistence
- 🔬 Voice-enabled agent interaction (Hume EVI integration)
- 🔬 Cross-provider tool-calling normalization layer

### Experimental Features
- Multi-agent debate protocols
- Agent personality modeling via system prompts
- Workflow-to-code generation
- Graph-based curriculum mapping

### Known Limitations
- Provider tool-calling schemas require manual alignment
- Agent context limits require chunking strategies
- Voice interaction latency varies by provider
- Local Ollama inference requires dedicated GPU resources

---

## Contributing

This is an active research project. Contributions are welcome in the following areas:
- Agent coordination patterns and algorithms
- Workflow template design
- Provider abstraction improvements
- Educational use case validation
- Documentation and code quality

---

## License

SPDX-License-Identifier: Apache-2.0

---

## Contact & Collaboration

**Institution**: CODE University of Applied Sciences, Berlin
**Project Type**: Academic research prototype
**Status**: Active development with regular iterations

For questions, collaboration inquiries, or to report issues, please use the project's issue tracker.

---

*GenBooth Idea Lab — Exploring multi-agent architectures for educational contexts*
