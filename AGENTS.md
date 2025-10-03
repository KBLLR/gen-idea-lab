# Repository Guidelines

## Project Structure & Module Organization
- App entry: `index.html`, client in `src/`, server in `server.js`.
- Frontend: React + Vite (`src/components`, `src/lib`, `src/styles`, `src/pages`).
- Tokens/design: `tokens/` (primitives, themes) with generated output in `tokens/build` and `src/styles/tokens`.
- Scripts & reports: `scripts/` (utilities) and `reports/` (audit output).
- Tests: `tests/*.test.js` (Jest + Supertest).
- Static assets: `assets/`, data seeds in `src/data/`.

## Build, Test, and Development Commands
- `npm run dev` — run Vite client (3000) and Node server with hot reload.
- `npm run build` — build design tokens then Vite production bundle.
- `npm start` — start Express server (`server.js`).
- `npm run preview` — preview built client.
- `npm test` — run Jest test suite.
- Token tools: `npm run tokens:build`, `tokens:watch`, `tokens:clean`, `tokens:validate`, `tokens:audit`.
- Utilities: `npm run generate-thumbnails`.

## Coding Style & Naming Conventions
- JavaScript/JSX (ESM). Indent 2 spaces; semicolons optional but be consistent.
- Components: `PascalCase` in `src/components` (e.g., `WorkflowEditor.jsx`).
- Hooks/utils: `camelCase` (e.g., `useAvailableModels.js`, `workflowEngine.js`).
- CSS modules by domain: place under `src/styles/components` or `src/styles/tokens`.
- Keep server code side-effect free on import; export pure functions where possible.

## Testing Guidelines
- Framework: Jest with Supertest for server routes.
- File names: mirror feature with `.test.js` (e.g., `tests/auth.routes.test.js`).
- Run all tests: `npm test`; run a file: `jest tests/image.routes.test.js`.
- Aim for coverage of core flows: auth, image processing, workflow engine.

## Commit & Pull Request Guidelines
- Commit messages: concise imperative present (e.g., "Add auth route guard").
- Group related changes; avoid mixed refactors + features.
- PRs: include purpose, scope, screenshots for UI, steps to test, and linked issues.
- Touching tokens: include before/after screenshots and run `tokens:validate`.

## Security & Configuration Tips
- Env: configure required secrets in `.env` for server (`PORT`, auth, API keys). Never commit secrets.
- Validate untrusted input; use `dompurify` when rendering user content.
- Prefer `src/lib/logger.js` and `prom-client` metrics for observability.

## Agent-Specific Instructions
- Treat this file as authoritative. Follow directory scopes when adding or modifying files under `src/`, `tokens/`, and `tests/`.

## Recent Changes & Rationale
- For a concise summary of the latest implementation updates (Markdown rendering, mock persistence, drawer UI, centered layouts, headers), see `docs/IMPLEMENTATION_NOTES.md`.
- UI primitives and usage are documented in `docs/ui/components.md`; tokens are described in `docs/ui/tokens.md`.

## Changelog Process (All Agents)
- Before committing and pushing changes:
  1) Add a one‑sentence entry to `CHANGELOG.md` with today’s date and a concise summary.
  2) If the change is non‑trivial, append details to `docs/IMPLEMENTATION_NOTES.md`.
  3) Stage, commit, and push.

Example:
```
echo "$(date +%F): Short description of the change." >> CHANGELOG.md
git add CHANGELOG.md docs/IMPLEMENTATION_NOTES.md
git add -A
git commit -m "chore(changelog): update for <feature/area>"
git push
```

## Deployment Environment Variables
- Core: `NODE_ENV` (`production` on deploy), `PORT` (defaults to 8081 locally).
- URLs: `FRONTEND_URL`, `BACKEND_URL`, `DOMAIN`. Used for CORS and OAuth redirects. Example: `https://app.example.com`.
- Auth/JWT: `AUTH_SECRET` (required). Rotate regularly.
- OAuth/Identity: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (if enabling Google flows), `GOOGLE_API_KEY` (GenAI).
- AI Providers (optional): `GEMINI_API_KEY`, `OPENAI_API_KEY`, `CLAUDE_API_KEY`.
- Vercel: `VERCEL_URL` is auto-set; leave unset locally.
- Local `.env` example:
  - `NODE_ENV=development`
  - `PORT=8081`
  - `FRONTEND_URL=http://localhost:3000`
  - `BACKEND_URL=http://localhost:8081`
  - `AUTH_SECRET=change-me`
  - `GOOGLE_API_KEY=...`
  - `GEMINI_API_KEY=...`

Notes
- CORS allows `FRONTEND_URL`, `BACKEND_URL`, `DOMAIN`, and `https://${VERCEL_URL}` automatically.
- For Vercel, build client with `vercel-build` and route API to `server.js` (see `vercel.json`). Ensure `AUTH_SECRET` and provider keys are set in Vercel project settings.
