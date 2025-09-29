# ArchivAI Template Code Pack

_Date: 2025-09-29 (Europe/Berlin)_

This file contains a minimal renderer and three example templates you can drop into your codebase:

- `src/lib/archiva/renderer.ts` — tiny utilities for rendering Markdown/HTML deterministically
- `src/lib/archiva/templates/process_journal.ts`
- `src/lib/archiva/templates/experiment_report.ts`
- `src/lib/archiva/templates/prompt_card.ts`

---

## `src/lib/archiva/renderer.ts`

```ts
export type WorkflowResult = any;

export const helpers = {
  code(lang: string, body: string, f:'md'|'html'='md') {
    if (f==='html') return `<pre><code class="language-${lang}">${escapeHtml(body)}</code></pre>`;
    return `\\`\\`\\`${lang}\n${body}\n\\`\\`\\``;
  },
  img(src: string, alt = '', f:'md'|'html'='md') {
    return f==='html'
      ? `<figure><img src="${src}" alt="${escapeAttr(alt)}"/></figure>`
      : `![${alt}](${src})`;
  },
  tbl(rows: Array<Record<string, any>>, f:'md'|'html'='md') {
    if (!rows?.length) return '';
    const cols = Object.keys(rows[0]);
    if (f==='html') {
      const head = cols.map(c=>`<th>${escapeHtml(c)}</th>`).join('');
      const body = rows.map(r=>`<tr>${cols.map(c=>`<td>${escapeHtml(String(r[c] ?? ''))}</td>`).join('')}</tr>`).join('');
      return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    }
    const header = `| ${cols.join(' | ')} |`;
    const sep    = `| ${cols.map(()=> '---').join(' | ')} |`;
    const lines  = rows.map(r => `| ${cols.map(c => String(r[c] ?? '')).join(' | ')} |`);
    return [header, sep, ...lines].join('\n');
  },
  timeRange(a?: string, b?: string) {
    try {
      if (!a || !b) return '';
      const s = new Date(a); const e = new Date(b);
      const mins = Math.max(0, Math.round((e.getTime()-s.getTime())/60000));
      return `${s.toISOString()} → ${e.toISOString()} (${mins} min)`;
    } catch { return `${a ?? ''} → ${b ?? ''}`; }
  }
};

export function fm(obj: Record<string, any>) {
  const lines = Object.entries(obj).map(([k,v]) => `${k}: ${serializeYaml(v)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

function serializeYaml(v:any): string {
  if (v == null) return 'null';
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(serializeYaml).join(', ')}]`;
  if (typeof v === 'object') {
    const inner = Object.entries(v).map(([k,val]) => `${k}: ${serializeYaml(val)}`).join(', ');
    return `{ ${inner} }`;
  }
  return String(v);
}

function escapeHtml(s:string){return s.replace(/[&<>"]/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]!));}
function escapeAttr(s:string){return escapeHtml(s).replace(/"/g,'&quot;');}
```

---

## `src/lib/archiva/templates/process_journal.ts`

```ts
import { helpers, fm } from '../renderer';
export const id = 'process_journal';
export const name = 'Process Journal';

export function render(format:'md'|'html', data:any) {
  const h = helpers;
  const title = data?.title || 'Untitled Workflow';
  const span  = h.timeRange(data?.started_at, data?.ended_at);
  const findings = (data?.summary?.findings || []).map((s:string) => `- ${s}`).join('\n');
  const next = (data?.summary?.next_steps || []).map((s:string) => `- ${s}`).join('\n');
  const metrics = (data?.steps || []).map((s:any) => ({
    step: s.name,
    latency_ms: s.metrics?.latency_ms ?? '',
    tokens_in: s.metrics?.tokens_in ?? '',
    tokens_out: s.metrics?.tokens_out ?? ''
  }));
  const metricsTbl = metrics.length ? h.tbl(metrics, format) : '';

  if (format==='html') {
    const body = `
<article>
  <h1>${escape(title)}</h1>
  <p><strong>Time:</strong> ${span}</p>
  <h2>Context</h2><p>${escape(data?.context || '')}</p>
  <h2>Method</h2><p>${escape(data?.method || '')}</p>
  <h2>Results</h2>${metricsTbl}
  <h2>Findings</h2><pre>${escape(findings || '—')}</pre>
  <h2>Next Steps</h2><pre>${escape(next || '—')}</pre>
</article>`;
    return body.trim();
  }

  const front = fm({
    title,
    template: id,
    workflow_id: data?.workflow_id,
    run_id: data?.run_id,
    date: data?.ended_at || data?.started_at,
    tags: ['archivai','process','journal']
  });

  return `${front}
# ${title}

**Time:** ${span}

## Context
${data?.context || ''}

## Method
${data?.method || ''}

## Results
${metricsTbl}

## Findings
${findings || '_(none)_'} 

## Next Steps
${next || '_(none)_'}
`.trim();

  function escape(s:string){return String(s ?? '').replace(/[<>]/g, m => ({'<':'&lt;','>':'&gt;'}[m]!));}
}
```

---

## `src/lib/archiva/templates/experiment_report.ts`

```ts
import { helpers, fm } from '../renderer';
export const id = 'experiment_report';
export const name = 'Experiment Report';

export function render(format:'md'|'html', data:any) {
  const h = helpers;
  const title = data?.title || 'Experiment';
  const hyp   = data?.hypothesis || '—';
  const setup = {
    params: data?.inputs || {},
    env: data?.meta?.env || {}
  };
  const steps = (data?.steps || []).map((s:any, i:number) => ({
    '#': i+1,
    name: s.name,
    model: s.model || s.provider,
    latency_ms: s.metrics?.latency_ms ?? ''
  }));
  const resultTbl = steps.length ? h.tbl(steps, format) : '';

  const front = fm({
    title,
    template: id,
    workflow_id: data?.workflow_id,
    run_id: data?.run_id,
    date: data?.ended_at || data?.started_at,
    tags: ['archivai','experiment']
  });

  if (format==='html') {
    return `
${front}
<h1>${escape(title)}</h1>
<h2>Hypothesis</h2><p>${escape(hyp)}</p>
<h2>Setup</h2><pre>${escape(JSON.stringify(setup, null, 2))}</pre>
<h2>Procedure</h2>${resultTbl}
<h2>Discussion</h2><p>${escape(data?.discussion || '')}</p>
<h2>Limitations</h2><p>${escape(data?.limitations || '')}</p>
`.trim();
  }

  return `${front}
# ${title}

## Hypothesis
${hyp}

## Setup
\`\`\`json
${JSON.stringify(setup, null, 2)}
\`\`\`

## Procedure
${resultTbl}

## Discussion
${data?.discussion || ''}

## Limitations
${data?.limitations || ''}
`.trim();

  function escape(s:string){return String(s ?? '').replace(/[<>]/g, m => ({'<':'&lt;','>':'&gt;'}[m]!));}
}
```

---

## `src/lib/archiva/templates/prompt_card.ts`

```ts
import { helpers, fm } from '../renderer';
export const id = 'prompt_card';
export const name = 'Prompt Card';

export function render(format:'md'|'html', data:any) {
  const h = helpers;
  const last = (data?.steps || []).slice().reverse().find((s:any)=>s.request?.prompt || s.request?.messages || s.response);
  const model = last?.model || 'unknown';
  const latency = last?.metrics?.latency_ms ?? '—';
  const cost = last?.metrics?.cost ?? '—';

  const prompt = last?.request?.prompt
    ?? (Array.isArray(last?.request?.messages) ? JSON.stringify(last.request.messages, null, 2) : '');

  const output = typeof last?.response === 'string'
    ? last.response
    : (last?.response?.text ?? JSON.stringify(last?.response, null, 2));

  const front = fm({
    title: data?.title || 'Prompt Card',
    template: id,
    model, latency, cost,
    date: data?.ended_at || data?.started_at,
    tags: ['archivai','prompt','card']
  });

  if (format==='html') {
    return `
${front}
<section>
  <h1>Prompt Card</h1>
  <p><strong>Model:</strong> ${model} · <strong>Latency:</strong> ${latency}ms · <strong>Cost:</strong> ${cost}</p>
  <h2>Prompt</h2>
  ${helpers.code('json', String(prompt || '').trim(), 'html')}
  <h2>Output (excerpt)</h2>
  ${helpers.code('text', String(output || '').slice(0, 1200), 'html')}
</section>
`.trim();
  }

  return `${front}
# Prompt Card

**Model:** ${model} · **Latency:** ${latency}ms · **Cost:** ${cost}

## Prompt
\`\`\`json
${String(prompt || '').trim()}
\`\`\`

## Output (excerpt)
\`\`\`
${String(output || '').slice(0, 1200)}
\`\`\`
`.trim();
}
```

---

## Usage (example)

```ts
import { render as renderPJ } from './templates/process_journal';
import { render as renderXR } from './templates/experiment_report';
import { render as renderPC } from './templates/prompt_card';

// render markdown
const md = renderPJ('md', workflowResult);

// render html
const html = renderXR('html', workflowResult);
```

> All templates are deterministic and require no external libraries.