# Implementation Notes — ArchivAI & VizGen Booth (2025‑10‑02)

## Overview
This document summarizes recent changes to ArchivAI and VizGen (Image Booth), the rationale behind them, and key file locations to review.

## Goals
- Render Markdown correctly and safely in HTML views.
- Enable realistic testing by saving mock outputs to disk and into Archiva entries.
- Improve layout: centered canvases, consistent headers, and a tidy bottom drawer panel.

## Changes & Rationale
- Markdown rendering (generic templates)
  - Converted Markdown fields to sanitized HTML using `marked` + `dompurify`.
  - Why: Prevent raw Markdown in previews and mitigate XSS.
  - Files: `src/lib/archiva/templates/generic_renderer.js`

- Markdown rendering (specialized templates)
  - Process Journal: Context, Method → Markdown→HTML
  - Experiment Report: Hypothesis, Discussion, Limitations → Markdown→HTML
  - Prompt Card: Prompt, Response, Notes → Markdown→HTML
  - Why: Keep formatting parity and improve readability across all template types.
  - Files: `src/lib/archiva/templates/process_journal.js`, `src/lib/archiva/templates/experiment_report.js`, `src/lib/archiva/templates/prompt_card.js`

- Assets guidance for Markdown
  - Use Vite `public/` for images referenced in Markdown: `![Alt](/archivai/example.png)`.
  - Why: Works seamlessly in dev/prod without bundler imports.

- Mock persistence for ArchivAI
  - New endpoints: save and list mock outputs on disk under `data/archivai-mock/<timestamp>_<slug>/` (content.md, content.html, meta.json).
  - UI: “Save Mock → Archiva” button saves and opens a new Archiva entry populated with values.
  - Why: Enable iterative testing and editing of generated content.
  - Files: `server.js` (POST/GET `/api/archivai/mock`), `src/components/ArchivaDashboard.jsx`

- Collapsible bottom drawer (both apps)
  - Replaced fixed footers with a bottom handle and sliding drawer.
  - Why: Reduce visual clutter while keeping quick access to history/gallery.
  - Files: `src/components/ArchivaDashboard.jsx`, `src/components/BoothViewer.jsx`, `src/index.css`

- Centered canvas + header consistency
  - Centered the three‑column canvas, added max‑width, and standardized headers.
  - Why: Improve readability and visual hierarchy across apps.
  - Files: `src/index.css`, headers in `ArchivaDashboard.jsx` and `BoothViewer.jsx`

- GlassDock refactor & ActionBar
  - Introduced a reusable ActionBar matching userbar styling, with a large variant for GlassDock; added a toolbar with Live toggle, mic, awareness, subtitles, help, settings.
  - Extracted presentational components: `GlassDockToolbar`, `VoiceChatPanel`, `DockItemsRow`, `MinimizedDock` for clarity and reuse.
  - Why: Unify icon action patterns and make the dock easier to reason about and test.
  - Files: `src/components/ui/ActionBar.jsx`, `src/components/glassdock/{GlassDockToolbar,VoiceChatPanel,DockItemsRow,MinimizedDock}.jsx`, `src/index.css`

- Accessibility and Storybook coverage
  - ActionBar adds `aria-pressed` support and optional roving focus (arrow keys). Toolbar buttons get proper labels.
  - New stories for GlassDock components and Panel usages; Vitest tests via `@storybook/test` validate interactions and rendering.
  - Files: `src/components/glassdock/*.stories.jsx`, `src/components/BoothPanels.stories.jsx`, tests under `src/components/glassdock/*.test.jsx`.

- Panel adoption in Archiva/VizGen
  - Replaced ad-hoc frames with `Panel` to reduce duplication and standardize layout.
  - Files: `src/components/ArchivaDashboard.jsx`, `src/components/BoothViewer.jsx`.

- UI docs and tokens
  - Added `docs/ui/components.md` (usage) and `docs/ui/tokens.md` (design tokens). Linked from README and AGENTS.md.

## Next Steps
- Optional code highlighting for HTML previews.
- Persist drawer open/close state.
- “Mocks” browser in ArchivAI (list and import).
- For production persistence on Vercel: store mocks in Mongo/Blob storage instead of filesystem.

## 2025-10-06 — Micro‑Apps Bootstrap (non‑breaking)
- Added `src/apps/*/index.jsx` wrappers for: `archiva`, `calendarAI`, `chat`, `empathyLab`, `gestureLab`, `ideaLab`, `imageBooth`, `planner`, and `workflows`.
- Each wrapper sets `activeApp` in the Zustand store on mount, then renders the existing `App` to preserve current behavior.
- Introduced `src/AppProviders.jsx` (placeholder) to centralize future global providers as part of routing migration.
- This scaffolding enables a gradual shift to route‑mounted micro‑apps without impacting current flows. Router wiring pending `react-router-dom` installation.

## 2025-10-06 — Router Integration + SPA Fallbacks
- Installed `react-router-dom` and converted `src/main.jsx` to a router host with lazy micro‑app routes.
- Default route `/` points to IdeaLab; added aliases (`/idea-lab`, `/calendar-ai`).
- Updated `AppSwitcher` and `CommandPalette` to navigate via URL while keeping store `activeApp` in sync.
- Added `src/shared/lib/routes.js` with `getAppPath` helpers for consistent navigation.
- Updated `server.js` to serve SPA fallback (`dist/index.html`) for micro‑app routes to support deep links in production.
 - Started server modularization: extracted auth endpoints to `server/routes/auth.js` and mounted under `/auth`.

### Follow-on Navigation Updates
- Voice command flows now route: `src/components/VoiceCommand.jsx` dispatches navigation on app switches and planner actions.
- GlassDock routes on voice command “switch-app”: `src/components/GlassDock.jsx`.
- ModuleViewer “Chat” action navigates to `/chat`.
- Calendar sidebar tooltip (“Create event”/“See events”) navigates to `/calendarai`.
- PlannerCanvas “Save workflow” navigates to `/workflows`.

## 2025-10-16 — Supplementary Font Palette
- Added manual `@font-face` registrations for experimental display families (Pilowlava, Henke, Flowa, Pirulen, Roboto weights) in `src/styles/tokens/tokens.css`.
- Introduced new typography tokens (`--typography-font-family-display`, `headline`, `atmosphere`, `tech`) so feature teams can reference the fonts via design tokens while the pipeline is updated to ingest font assets.
- Fonts are currently served from `/public/fonts`; once the tokens build supports asset bundling these declarations should move into the generated output.
- Throttled Ollama discovery logging in `server/routes/models.js` so `/models` polling no longer floods logs with duplicate “Discovered X Ollama models” messages (logs only when counts change or once per minute) and adjusted `SettingsModal` to fetch service metadata once per open to avoid hammering the endpoint.
