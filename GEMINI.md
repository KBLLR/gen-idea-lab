# GEMINI.md

This playbook gives Gemini agents context for contributing to this repository.

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

## Quick Start
- Install deps: `npm install`
- Dev servers: `npm run dev` (Vite + Express)
- Tests: `npm test`
- Build: `npm run build`

## UI Spacing Migration
- Prefer the new 8px spacing tokens when editing styles. Replace hard‑coded `--spacing-*` with `--space-*` or semantic tokens (`--panel-padding-*`, `--gutter-*`, `--stack-gap-*`) as you update files.

## Changelog Update (Before Commit & Push)
Always update the changelog for traceability.

Example:
```
echo "$(date +%F): Short description of the change." >> CHANGELOG.md
git add CHANGELOG.md docs/IMPLEMENTATION_NOTES.md
git add -A && git commit -m "chore(changelog): update for <feature/area>" && git push
```

For larger changes, add a short note to `docs/IMPLEMENTATION_NOTES.md`.

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