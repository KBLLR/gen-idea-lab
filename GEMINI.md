# GEMINI.md

This playbook gives Gemini agents context for contributing to this repository.

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
