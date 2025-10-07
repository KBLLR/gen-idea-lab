/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

const taskBox = /^\s*[-*]\s+\[( |x|X)\]\s+(.+)$/;   // - [ ] / - [x]
const bullet  = /^\s*[-*]\s+(.+)$/;
const heading = /^\s*#{1,3}\s+(.*)$/;

export function extractTasksFromMarkdown(md, { defaultBucket='Docs' } = {}) {
  const tasks = []; let bucket = defaultBucket;
  for (const line of String(md || '').split(/\r?\n/)) {
    const h = line.match(heading); if (h) { bucket = h[1].trim(); continue; }
    const b = line.match(taskBox); if (b) { tasks.push({ title: b[2].trim(), col: /x/i.test(b[1]) ? 'done':'todo', bucket }); continue; }
    const u = line.match(bullet);  if (u) { tasks.push({ title: u[1].trim(), col: 'todo', bucket }); }
  }
  return tasks;
}