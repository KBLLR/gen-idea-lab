# Export: Last 2 Agent Rounds & Outputs
_Date: 2025-09-29 (Europe/Berlin)_

---

## Agent Round 1 — Robust Routing + ArchivAI Plan


# 1) Server: robust Ollama routing + no-apikey crash + missing-model guard

### A. Centralize the “is this an Ollama model?” test
Add this helper near your other utils:

```js
// server.js (top-level utils)
function isOllamaModelId(model = '') {
  const m = (model || '').toLowerCase().trim();
  // names typically installed locally: gemma, llama, qwen, mistral/mixtral, phi, yi, starling, neural-chat, command-r, deepseek, gpt-oss, etc.
  const prefixes = ['gemma','llama','qwen','mistral','mixtral','phi','yi','deepseek','gpt-oss','neural','starling','command'];
  return m.includes(':') || prefixes.some(p => m.startsWith(p));
}
```

### B. Route by helper and **do not** touch `connections.ollama.apiKey` for local URL
Replace your branch around old line ~719:

```diff
-} else if (model.includes('gpt-oss') || model.includes('deepseek') || model.includes('llama') || model.includes('qwen') || model.includes('gemma')) {
+} else if (isOllamaModelId(model)) {
   service = 'ollama';
   const connection = connections[service];

-  if (!connection) {
-    return res.status(400).json({ error: 'Ollama is not connected. Please connect Ollama in Settings first.' });
-  }
+  // Accept either local URL or cloud key, but don't deref null
+  if (!connection) {
+    return res.status(400).json({ error: 'Ollama is not connected. Provide http://localhost:11434 in Settings.' });
+  }

+  // For local URL, no apiKey required
+  const isLocal = connection?.type === 'url' && /^https?:\/\//.test(connection.url || '');
+  const ollamaBase = isLocal ? connection.url : (process.env.OLLAMA_API_BASE || connection.url);
```

### C. Validate the requested model exists; fail with a helpful 400 (not a 500)
Right before you call Ollama’s `/api/chat` (or completion), check `/api/tags` once per request (cheap locally) and return a clear error if missing:

```js
// server.js within the Ollama branch
try {
  if (ollamaBase) {
    const tagsResp = await fetch(`${ollamaBase}/api/tags`);
    if (tagsResp.ok) {
      const { models: installed = [] } = await tagsResp.json();
      const names = new Set(installed.map(m => (m?.name || '').toLowerCase()));
      if (!names.has((model || '').toLowerCase())) {
        return res.status(400).json({
          error: `Model '${model}' is not installed on Ollama.`,
          available: [...names].sort(),
          hint: `Run: ollama pull ${model.split(':')[0]}`
        });
      }
    }
  }
} catch (e) {
  // don’t explode on tags failure—let the normal request still try
}
```

### D. Avoid “Cannot read properties of null (reading 'apiKey')”
Anywhere you read `connections.ollama.apiKey`, guard it:

```js
const apiKey = connections.ollama && connections.ollama.type === 'api_key'
  ? connections.ollama.apiKey
  : null;
```

---

# 2) Universal `/api/models` that **really** lists Ollama (text-only)

You already added `/api/models`. Tighten the Ollama filter so the dropdown won’t include vision/embed models:

```diff
- const ollamaModels = (data.models || []).map(m => ({
-   id: m.name,
-   name: m.name.split(':')[0] || m.name,
-   provider: 'Ollama',
-   category: 'text',
-   available: true,
-   size: m.size,
-   modified_at: m.modified_at
- }));
+ const TEXT_EXCLUDES = [
+   'embed','embedding','nomic','bge','e5','gte','gte-','all-minilm','text-embed',
+   'llava','moondream','whisper','audiodec','sd-','flux','llm-vision'
+ ];
+ const isTextish = (n) => !TEXT_EXCLUDES.some(x => n.includes(x));
+ const ollamaModels = (data.models || [])
+   .map(m => (m?.name || '').toLowerCase())
+   .filter(n => isTextish(n))
+   .map(n => ({
+     id: n, name: n.split(':')[0] || n, provider: 'Ollama',
+     category: 'text', available: true
+   }));
```

---

# 3) Client: dynamic model picker + safe “✨” button

```jsx
const { textModels } = useAvailableModels();
const modelOk = !!textModels.find(m => m.id === workflowAutoTitleModel);

<button
  disabled={!modelOk || isGeneratingTitle}
  title={!modelOk ? 'Selected model is not available. Open Settings → Workflow Preferences.' : 'Generate AI title'}
  onClick={generateAITitle}
  className={`sparkles-btn ${!modelOk ? 'btn-disabled' : ''}`}
>
  ✨
</button>
```

---

# 4) Ollama health script

```zsh
#!/usr/bin/env zsh
set -euo pipefail
URL="${1:-http://localhost:11434}"
echo "Pinging $URL ..."
curl -sS "$URL/api/version" | jq . || echo "No response"
echo "Installed models:"
curl -sS "$URL/api/tags" | jq '.models[].name'
```

---

# 5) ArchivAI — system plan (spec excerpt)
(omitted here for brevity; included in original round)

---

## Agent Round 2 — Connector Semantics + Config Dialog + Variables

### 1) Extend connector semantics in `PlannerCanvas.jsx`
(added `loop` and `trigger` support, propagate `variables` into `guidance`)

### 2) Generic configuration modal for every node
(double‑click a node to edit `label`, `vars`, and `config` fields)

### 3) Represent sources (GitHub, Google Drive, Notion, Figma)
(source nodes use the config modal to define queries/IDs and bind results to variables)

### 4) Add connector‑type tasks (`githubSearch`, `driveSearch`)
(tasks added to `commonTasks` with configurable queries + output bindings)

### 5) Basic CSS for the config modal
(overlay + modal styles for usability)

*Full code from this round is included in the conversation and should be applied to `PlannerCanvas.jsx`, `tasks.js`, and `planner.css`.*
