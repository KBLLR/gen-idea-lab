/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { normalizeTask } from './tasksModel.js';
import { storeApi } from '@store';

// Agent-friendly bulk upsert facade
export function upsertTasksFromAgent(tasks, { defaultBucket = 'Orchestrator' } = {}) {
  const arr = Array.isArray(tasks) ? tasks : [tasks];
  const data = arr.map(t => normalizeTask({ bucket: defaultBucket, ...t }));
  storeApi.getState().bulkUpsertTasks(data);
  return data.map(t => t.id);
}