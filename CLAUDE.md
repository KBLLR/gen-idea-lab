# CLAUDE.md

This playbook gives Claude Code (claude.ai/code) the context it needs when joining this repository. Follow the quick start steps to get productive, then tackle the prioritized backlog.

## Quick Start Checklist
1. **Install dependencies**: `npm install`
2. **Set up env vars**: copy `.env.example` if present or create `.env` with the keys listed in [README](README.md#environment-setup).
3. **Run the full dev stack**: `npm run dev` launches Vite on port 3000 and the Express API on 8081.
4. **Frontend-only iteration**: `npm run dev:client` if you do not need the API.
5. **Server-only debugging**: `npm run dev:server` with automatic reload via `nodemon`.
6. **Execute the Jest suite**: `npm test` (or `npm run test:auth` for targeted auth route coverage).
7. **Ship a production build**: `npm run build`, then preview with `npm run preview` or serve via `npm start`.

## Repository Conventions
- The app is a full-stack React + Express project. Frontend lives in `src/`, backend entry is `server.js`.
- Zustand selectors use the `useStore.use.sliceName()` helper—mirror that pattern in new components.
- All AI provider calls flow through the Express proxy at `/api/proxy`; never call third-party APIs directly from the client.
- When adding new tokens/styles, update the Style Dictionary config under `tokens/` and rebuild with `npm run tokens:build`.
- Tests rely on the Jest ESM flag (`NODE_OPTIONS=--experimental-vm-modules`). Keep imports ESM-compatible.
- **ArchivAI Templates**: Workflow data requires `steps` array for template validation. AI mock data generation loads example templates from `/templates/archivai/` and uses Gemini to generate realistic content matching field schemas.
- **Screen Awareness**: `GlassDock.jsx:extractDOMContext()` uses content-based app detection to auto-sync store state with actual page content.
- **Web Search**: Assistant `search_web` tool uses Ollama API with `OLLAMA_API_KEY` environment variable fallback if user hasn't connected their own key.
- **UI Spacing Migration**: When touching app-specific styles, migrate hard‑coded `--spacing-*` to the new 8px tokens (`--space-*`) or semantic tokens (`--panel-padding-*`, `--gutter-*`, `--stack-gap-*`) to gradually converge.

## Observability & Ops
- Health endpoint: `GET /healthz`
- Metrics endpoint: `GET /metrics` (Prometheus format)
- Server logging: Winston (`logger` in `server.js`)
- Client error surfaces: check `src/lib/actions.js` handlers for toast/reporting patterns

## Next Priorities

1. **Stabilize onboarding flow analytics** – Investigate inconsistent event tracking for the Idea Lab onboarding screens and ensure amplitude events fire reliably across rerenders.
2. **Ship Archiva search improvements** – Finish wiring the semantic search endpoint to the client, add loading states, and update documentation for the new filters.
3. **Stabilize Orchestrator chat regressions**
   - Audit `src/components/OrchestratorChat.jsx` message handling to ensure assistant/personality switching stays in sync with `src/lib/store.js` state slices.
   - Add regression tests covering the orchestrator flow in `tests/` (simulate a multi-agent chat turn via supertest).
4. **Document service integration flows**
   - Expand `docs/` with setup guides for GitHub, Notion, and Figma OAuth. Capture env variables, redirect URIs, and expected scopes.
   - Ensure `server.js` OAuth routes reference the new documentation.
   - Profile `src/components/planner/` React Flow usage for large graphs; memoize expensive selectors and derive data in `src/lib/store.js`.
   - Create a troubleshooting section in `README.md` focused on planner lag and how to mitigate it (hardware hints, toggles, etc.).

## Communication Expectations
- Summarize significant architectural findings in `reports/` (markdown, short + actionable).
- When shipping changes, update both human-facing docs (`README.md`, `docs/`) and the orchestrator prompts (`src/lib/assistant/`).
- Keep PRs small and cohesive—link back to the priority item you are addressing.

## Changelog Update (Before Commit & Push)
- Append a one-sentence entry to `CHANGELOG.md` with today’s date and a concise summary of what changed. If the change is substantial, also update `docs/IMPLEMENTATION_NOTES.md`.

Example:
```
echo "$(date +%F): Short description of the change." >> CHANGELOG.md
git add CHANGELOG.md docs/IMPLEMENTATION_NOTES.md
git add -A && git commit -m "chore(changelog): update for <feature/area>" && git push
```

## App Analysis Framework

When analyzing an app, consider the following angles:

1.  **Orchestrator Context Awareness:** How the app interacts with the orchestrator and how the orchestrator is aware of the app's context.
2.  **Components and Storybook Stories:** The React components that make up the app and their corresponding Storybook stories.
3.  **Database and Interconnectivity:** How the app interacts with the database and other services.
