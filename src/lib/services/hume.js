/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Client helpers for Hume routes (server proxies + token)

async function jsonOrThrow(res) {
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function fetchHumeAccessToken() {
  const res = await fetch('/api/services/hume/token', { credentials: 'include' });
  return jsonOrThrow(res);
}

export async function createHumeConfig(payload) {
  const res = await fetch('/api/hume/configs', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return jsonOrThrow(res);
}

export async function createHumePrompt(payload) {
  const res = await fetch('/api/hume/prompts', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return jsonOrThrow(res);
}

export async function createHumeTool(payload) {
  const res = await fetch('/api/hume/tools', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return jsonOrThrow(res);
}

export async function listHumeVoices(provider = 'HUME_AI', pageNumber = 0, pageSize = 100) {
  const res = await fetch(`/api/hume/voices?provider=${provider}&page_number=${pageNumber}&page_size=${pageSize}`, {
    credentials: 'include'
  });
  return jsonOrThrow(res);
}

export default {
  fetchHumeAccessToken,
  createHumeConfig,
  createHumePrompt,
  createHumeTool,
  listHumeVoices
};

