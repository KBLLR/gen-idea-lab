/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Normalizes any agent/human input into a safe Task
export function normalizeTask(input = {}) {
  const priority = ['low','med','high','crit'].includes(input.priority) ? input.priority : 'med';
  const col = ['todo','doing','done'].includes(input.col) ? input.col : 'todo';
  return {
    id: input.id ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`),
    title: String(input.title ?? 'Untitled').trim(),
    desc: String(input.desc ?? '').trim(),
    priority,
    assignee: String(input.assignee ?? 'Unassigned'),
    col,
    bucket: String(input.bucket ?? 'General'),
    tags: Array.isArray(input.tags) ? input.tags : [],
    createdAt: Number.isFinite(input.createdAt) ? input.createdAt : Date.now(),
  };
}