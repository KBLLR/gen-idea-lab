# OVERVIEW.md

Below is a comprehensive, end-to-end overview of **Archiva**—an AI-powered, template-driven documentation app.

## 1. Core Concepts

- **Templates → Schemas**  
  Each of the 24 Markdown templates you created (Study Archive, Process Journal, … Unpolished) becomes a **template schema** in the app, describing the fields, types, and structure for that category.

- **Entries**  
  A filled-out template becomes an **Entry** in the database, with each field stored as its own value. Entries have `status`:  
  - **draft** (AI-generated or in-progress)  
  - **published** (final, visible in archive)

- **Artifacts**  
  Raw materials (screenshots, code diffs, browser clips, voice memos) are ingested into a **Daily Folder** for AI processing.

## 2. Data Model

**Relational Schema (Postgres / SQLite)**

```sql
-- Categories (template definitions)
CREATE TABLE categories (
  id    SERIAL PRIMARY KEY,
  name  TEXT UNIQUE NOT NULL,   -- e.g. "Study Archive"
  slug  TEXT UNIQUE NOT NULL    -- e.g. "study_archive"
);

-- Fields (driven by each template)
CREATE TABLE template_fields (
  id           SERIAL PRIMARY KEY,
  category_id  INT  REFERENCES categories(id),
  field_key    TEXT NOT NULL,   -- e.g. "date", "outcomes"
  label        TEXT NOT NULL,   -- e.g. "Date", "Learning Outcomes"
  field_type   TEXT NOT NULL,   -- "string" | "date" | "markdown" | "multiline"
  required     BOOLEAN DEFAULT FALSE
);

-- Entries (user-created or AI drafts)
CREATE TABLE entries (
  id           SERIAL PRIMARY KEY,
  category_id  INT  REFERENCES categories(id),
  status       TEXT  NOT NULL DEFAULT 'draft',  -- 'draft' | 'published'
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Entry Values (each template field → one row)
CREATE TABLE entry_values (
  entry_id   INT    REFERENCES entries(id),
  field_key  TEXT   NOT NULL,
  value      TEXT,              -- raw Markdown or string
  PRIMARY KEY(entry_id, field_key)
);
```

## 3. Dynamic Form Generation

1. **Fetch Schema**  
   Frontend calls  
   ```
   GET /api/templates/:slug
   ```
   → `{ category, fields: [{ key, label, type, required }, …] }`

2. **Render Form**  
   - **Date** → `<input type="date" />`  
   - **String** → `<input type="text" />`  
   - **Markdown** → `<textarea>` with live-preview  
   - **Multiline** → `<textarea>`  

   Use a JSON-schema form library (e.g. [React JSONSchema Form](https://rjsf-team.github.io/react-jsonschema-form/)) or a lightweight custom renderer.

3. **Submit Entry**  
   ```
   POST /api/entries
   {
     category_slug: "study_archive",
     values: { date: "...", title: "...", outcomes: "..." }
   }
   ```
   Backend creates an `entries` row + one `entry_values` row per field.

## 4. AI-Powered Drafting & Classification

### a) Artifact Ingestion

- **Daily Folder**:  
  Organized by date (`/DailyArtifacts/2025-06-17/`), containing subfolders:  
  - `code_diffs/` (git patches)  
  - `screenshots/` (PNGs)  
  - `notes.md` (quick jots)  
  - `browser_clips/` (text snippets)

- A scheduled script (or CLI command) watches each folder, then triggers draft generation.

### b) Draft Generation Script

```bash
node scripts/generateDrafts.js --date=2025-06-17
```

**Inside**:

1. **Load artifacts** for the date.  
2. **Chunk & classify** each artifact using OpenAI embeddings + nearest-neighbor category matching.  
3. **Summarize** each chunk into its template’s fields via an OpenAI function call:
   ```json
   {
     model: "gpt-4o-mini",
     function_call: { name: "fill_template_fields", arguments: { slug: "study_archive", artifacts: […data…] } }
   }
   ```
4. **Insert** an `entries(status='draft')` row and its `entry_values`.

### c) Continuous Refinement via Chat

Expose a chat interface powered by OpenAI’s Chat API with function-calling:

- **“Show me today’s Study Archive draft”**  
  → Bot returns field previews, “Edit” links.

- **“Expand my Reflection to cover accessibility concerns”**  
  → Bot calls `update_entry_field(entry_id, 'reflection', generatedText)`.

- **“Publish all drafts”**  
  → Bot updates all drafts to `status = 'published'`.

## 5. Daily Workflow

1. **Work Day**  
   - Edit code, design mockups, take screenshots, jot notes.  
   - Artifacts auto-saved to `/DailyArtifacts/YYYY-MM-DD/`.

2. **Trigger Drafting**  
   - Manually: `npm run generate:drafts -- --date=YYYY-MM-DD`  
   - Scheduled: nightly CRON job.

3. **Review in Dashboard**  
   - Visit `http://localhost:3000/dashboard`.  
   - **Drafts Widget**: shows counts per category (e.g. “3 drafts for Study Archive”).  
   - Click a category → dynamic form pre-filled with AI content.

4. **Edit & Tweak**  
   - Use form or chat to refine fields.  
   - Save as draft or click **Publish**.

5. **Archive & Search**  
   - Published entries appear in a searchable timeline.  
   - Filter by category, date, or tag.

## 6. Technology Stack & Integrations

- **Backend**  
  - Node.js + Express or Fastify  
  - Database: PostgreSQL (production) / SQLite (local)  
  - ORM: Prisma or Sequelize

- **Frontend**  
  - React or Vue  
  - JSON-schema form renderer  
  - Chat UI component for AI interactions

- **AI & Automation**  
  - OpenAI API (chat.completions + function calls + embeddings)  
  - Local FS watcher (Chokidar) for artifact ingestion  
  - Scheduled jobs (node-cron or OS cron)

- **DevOps & Hosting**  
  - Docker for containerization  
  - CI/CD via GitHub Actions (lint MD, generate drafts, build & deploy)  
  - Secrets in GitHub (`OPENAI_SERVICE_KEY`, `NOTION_TOKEN`, etc.)

- **Optional Integrations**  
  - **Notion API**: sync templates or entries into a Notion database  
  - **Figma API**: pull style-tile components or snapshots  
  - **GitHub CLI / API**: auto-create repos, post entries as issues or wiki pages  

---



# README.md

# Archiva Templates Directory

This directory holds Markdown templates organized into three broader buckets. Each template is **optional**—pick what suits your project’s phase and needs.

---

## 1. Reflective / Learning Templates
Use these when you’re capturing insights, lessons, and structured experiments.

| Category                | Filename               |
|-------------------------|------------------------|
| Study Archive           | `study_archive.md`     |
| Process Journal         | `process_journal.md`   |
| Learning Lab            | `learning_lab.md`      |
| Design Sketchbook       | `design_sketchbook.md` |
| Code Notebook           | `code_notebook.md`     |
| Practice Log            | `practice_log.md`      |
| Field Notes             | `field_notes.md`       |
| Explorations            | `explorations.md`      |
| Research & Prototypes   | `research_prototypes.md`|

---

## 2. Technical / Development Templates
Use these for coding experiments, prototypes, and dev progress.

| Category                | Filename                   |
|-------------------------|----------------------------|
| Experiments             | `experiments.md`           |
| Sandbox                 | `sandbox.md`               |
| Dev Diaries             | `dev_diaries.md`           |
| Prototypes              | `prototypes.md`            |
| Code Studies            | `code_studies.md`          |
| Playground              | `playground.md`            |
| Snippets & Sketches     | `snippets_and_sketches.md` |
| Iterations              | `iterations.md`            |

---

## 3. Creative / Rough & Raw Templates
Use these for freeform, early-stage, or unstructured creative work.

| Category                | Filename                |
|-------------------------|-------------------------|
| Studio Scraps           | `studio_scraps.md`      |
| WIP (Work In Progress)  | `wip.md`                |
| Things I Tried          | `things_i_tried.md`     |
| The Backroom            | `the_backroom.md`       |
| Visual Experiments      | `visual_experiments.md` |
| Digital Messbook        | `digital_messbook.md`   |
| Unpolished              | `unpolished.md`         |

---

## Usage Guidelines

- **Choose Freely**: Apply only the templates relevant to your project's current focus—learning, coding, or creative exploration.
- **Duplication & Naming**: Duplicate the template file and rename it to include a date or context, e.g., `2025-06-17_Study_Archive.md`.
- **Companion Assets**: Keep code files (`.js`, `.py`, `.ipynb`), design files (`.fig`, `.sketch`), media (`.png`, `.mp3`), and diagrams (`.drawio`, `.svg`) alongside your Markdown entries.
- **Automation**: Sync templates to Notion via API, export design tokens from Figma, or regenerate content with the OpenAI API as needed.

> _Update this README if you add, remove, or rename any template files._


# Template: Code Notebook

---
category: Code Notebook
type: Reflective
purpose: Save useful code with context
---

# Code Notebook Entry

**Date:** YYYY-MM-DD  
**Title:** _Descriptive name for this snippet_

---

## Problem / Context
_Explain why you wrote or collected this code. What problem does it solve?_

---

## Code Snippet
```js
// Paste your snippet here
function example(input) {
  // …
  return output;
}
```

---

## Explanation
- **What it does:** Brief summary of logic  
- **Key lines:**  
  - Line 3: handles edge cases  
  - Line 7: optimization tweak  

---

## Usage
- **How to integrate:**  
  ```bash
  npm install example-package
  ```
- **Example call:**
  ```js
  const result = example(data);
  console.log(result);
  ```

---

## References
- [Source / Documentation](https://…) – why it’s useful  
- Related snippet: `anotherSnippet.js`

---

## Tags / Keywords
`javascript` `utility` `snippet` `regex`


# Template: Things I Tried

---
category: Things I Tried
type: Creative
purpose: Showcase one-shot or trial experiments
---

# Things I Tried Entry

**Date:** YYYY-MM-DD  
**Tool / Medium:** _e.g., Blender, p5.js, DALL·E_  
**Experiment Name:** _Brief descriptive title_

---

## Objective
_What were you testing or exploring in this one-off experiment?_

---

## Steps Taken
1. _First action or setup_  
2. _Second action or variation_  
3. _Additional notes or tweaks_

---

## Outcome
- _Results or outputs (images, code, models)_  
- _Any interesting or unexpected findings_

---

## Reflection
- _What worked, what failed?_  
- _Ideas for improvements or further tests_

---

## Artifacts & Links
- **Files:** `experiment-script.js`, `output.png`  
- **Links:**  
  - Live demo: https://…  
  - Repo or Gist: https://…

---

## Next Experiments
- [ ] Variation A: _description_  
- [ ] Variation B: _description_

---

## Tags / Keywords
`one-shot` `trial` `prototype` `experiment`


# Template: The Backroom

---
category: The Backroom
type: Creative
purpose: Reveal personal or raw explorations
---

# The Backroom Entry

**Date:** YYYY-MM-DD  
**Context / Prompt:** _What prompted this raw exploration?_

---

## Notes & Brainstorm
- _Freeform thoughts, voice memo transcripts, quick sketches_

---

## Attachments
- **Voice recordings:** `idea-recording.mp3`  
- **Raw sketches:** `sketch1.png`, `sketch2.jpg`  
- **Text files:** `raw-notes.txt`

---

## Reflections
- _Early impressions before filtering or refining_

---

## Potential Gems
- _Any nuggets you might refine later_

---

## Tags / Keywords
`raw` `brainstorm` `voice-memo` `sketch`  


# Template: Visual Experiments

---
category: Visual Experiments
type: Creative
purpose: Explore aesthetics and visuals
---

# Visual Experiments Entry

**Date:** YYYY-MM-DD  
**Technique / Tool:** _e.g., ShaderToy, Processing, p5.js_

---

## Concept
_Describe the visual idea or algorithm you’re experimenting with._

---

## Implementation
```js
// Example snippet for your visual experiment
function draw() {
  // ...
}
```

---

## Outputs
- **Screenshots / GIFs:**  
  ![Frame 1](path/to/frame1.png)  
  ![Frame 2](path/to/frame2.png)

---

## Observations
- _Color palettes, motion patterns, rendering quirks_

---

## Refinements
- _Ideas for improving aesthetics or performance_

---

## Next Variations
- [ ] Modify parameters A  
- [ ] Integrate with audio input  
- [ ] Export as video sequence

---

## Files & Links
- **Source files:** `visualExperiment.js`, `index.html`  
- **Live demo:** https://…

---

## Tags / Keywords
`visual` `shader` `generative-art` `animation`


# Template: Digital Messbook

---
category: Digital Messbook
type: Creative
purpose: Keep your chaotic but rich collection organized
---

# Digital Messbook Entry

**Date:** YYYY-MM-DD  
**Context:** _Overview of the current 'mess' session_

---

## Fragments & Notes
- Sticky notes, quick jots, random insights:
  - Note 1: _Fragment of idea_
  - Note 2: _Observation_
  - Note 3: _Random thought_

---

## Links & References
- **Documents / Pages:**  
  - [Link A](https://…)  
  - [Link B](https://…)
- **Images / Screenshots:**  
  ![Mess Screenshot](path/to/image.png)

---

## Themes & Tags
- `theme1`, `theme2`, `inspiration`, `chaos`

---

## Actions
- [ ] Organize fragments into formal entries  
- [ ] Tag and categorize key insights  
- [ ] Discard irrelevant notes

---

## Tools & Formats
- Markdown, Trello cards, Sticky note apps, whiteboard snaps  
- Notion database pages or Airtable grid

---

## Tags / Keywords
`messbook` `chaos` `fragments` `brain dump`


# Template: Unpolished

---
category: Unpolished
type: Creative
purpose: Show work before it's "ready"
---

# Unpolished Entry

**Date:** YYYY-MM-DD  
**Project / Piece:** _Name or context of unpolished work_

---

## Original Version
- **Description:** _What this initial draft includes_  
- **Files / Assets:**  
  - `draft1.png`  
  - `roughSketch.svg`

---

## Feedback & Issues
- _Areas that need refinement or reworking_  
- _Notes from user testing or peer review_

---

## Lessons Learned
- _Takeaways from the flawed or incomplete version_

---

## Next Steps
- [ ] Polish visual details  
- [ ] Improve performance  
- [ ] Add missing content or features

---

## Tags / Keywords
`unpolished` `draft` `early-stage` `iteration`
