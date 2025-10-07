export const helpers = {
  // Code blocks with syntax highlighting hints
  code(lang, body, format='md') {
    if (format === 'html') {
      return `<pre><code class="language-${lang}">${escapeHtml(body)}</code></pre>`;
    }
    return `\`\`\`${lang}\n${body}\n\`\`\``;
  },

  // Images with proper figure wrapping
  img(src, alt = '', format='md') {
    if (format === 'html') {
      return `<figure><img src="${src}" alt="${escapeAttr(alt)}"/></figure>`;
    }
    return `![${alt}](${src})`;
  },

  // Tables with responsive design
  tbl(rows, format='md') {
    if (!rows?.length) return '';
    const cols = Object.keys(rows[0]);

    if (format === 'html') {
      const head = cols.map(c => `<th>${escapeHtml(c)}</th>`).join('');
      const body = rows.map(r =>
        `<tr>${cols.map(c => `<td>${escapeHtml(String(r[c] ?? ''))}</td>`).join('')}</tr>`
      ).join('');
      return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    }

    const header = `| ${cols.join(' | ')} |`;
    const sep = `| ${cols.map(() => '---').join(' | ')} |`;
    const lines = rows.map(r => `| ${cols.map(c => String(r[c] ?? '')).join(' | ')} |`);
    return [header, sep, ...lines].join('\n');
  },

  // Time range calculations
  timeRange(start, end) {
    try {
      if (!start || !end) return '';
      const s = new Date(start);
      const e = new Date(end);
      const duration = Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000));
      return `${s.toISOString()} → ${e.toISOString()} (${duration} min)`;
    } catch {
      return `${start ?? ''} → ${end ?? ''}`;
    }
  }
};

// Frontmatter generation
export function fm(obj) {
  const lines = Object.entries(obj).map(([k, v]) => `${k}: ${serializeYaml(v)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

function serializeYaml(v) {
  if (v == null) return 'null';
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(serializeYaml).join(', ')}]`;
  if (typeof v === 'object') {
    const inner = Object.entries(v).map(([k, val]) => `${k}: ${serializeYaml(val)}`).join(', ');
    return `{ ${inner} }`;
  }
  return String(v);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  }[m]));
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}