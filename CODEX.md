# CODEX.md

This playbook gives Codex agents (Codex CLI) guidance for contributing here.

## Quick Start
- Install deps: `npm install`
- Dev: `npm run dev` (Vite 3000 + Express 8081)
- Tests: `npm test`
- Build: `npm run build`

## Changelog Update (Before Commit & Push)
Add a one-sentence entry to the changelog for every meaningful change.

Example:
```
echo "$(date +%F): Short description of the change." >> CHANGELOG.md
git add CHANGELOG.md docs/IMPLEMENTATION_NOTES.md
git add -A && git commit -m "chore(changelog): update for <feature/area>" && git push
```

If the change is substantial, add a brief rationale to `docs/IMPLEMENTATION_NOTES.md`.
