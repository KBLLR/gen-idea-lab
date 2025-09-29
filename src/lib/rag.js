/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple RAG helper for client

export function chunkText(text, { maxChunkChars = 800, overlap = 120 } = {}) {
  if (!text || typeof text !== 'string') return [];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + maxChunkChars, text.length);
    const chunk = text.slice(i, end).trim();
    if (chunk) chunks.push(chunk);
    if (end === text.length) break;
    i = end - overlap; // overlap for semantic continuity
    if (i < 0) i = 0;
  }
  return chunks;
}

export async function upsertModuleChunks(moduleId, chunks, { embeddingModel } = {}) {
  if (!moduleId || !Array.isArray(chunks) || chunks.length === 0) return { success: false };
  const payload = {
    moduleId,
    chunks: chunks.map((t, idx) => ({ id: undefined, text: t, metadata: { source: 'chat', idx } })),
    embeddingModel
  };
  const resp = await fetch('/api/rag/upsert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json.error || 'RAG upsert failed');
  return json;
}

export async function queryModule(moduleId, query, { topK = 4, embeddingModel } = {}) {
  const resp = await fetch('/api/rag/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ moduleId, query, topK, embeddingModel })
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json.error || 'RAG query failed');
  return json.results || [];
}
