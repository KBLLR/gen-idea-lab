/**
 * @file riggingTasksSlice - 3D character rigging task management
 * @license SPDX-License-Identifier: Apache-2.0
 * MIGRATED: Now uses centralized API endpoints
 */

import { api } from '../lib/dataLayer/endpoints.js';

/**
 * Rigging task status values
 * @typedef {'PENDING'|'IN_PROGRESS'|'SUCCEEDED'|'FAILED'} RiggingTaskStatus
 */

/**
 * Rigging task object
 * @typedef {Object} RiggingTask
 * @property {string} id - Meshy task ID
 * @property {string} name - Original file name
 * @property {RiggingTaskStatus} status - Current task status
 * @property {number} progress - Progress percentage (0-100)
 * @property {Object} [result] - Meshy result with URLs (when succeeded)
 * @property {string} createdAt - ISO timestamp when task was created
 * @property {string} [completedAt] - ISO timestamp when task completed
 * @property {string} [error] - Error message (if failed)
 */

/**
 * Options for submitting rigging tasks
 * @typedef {Object} RiggingTaskOptions
 * @property {number} [characterHeight] - Character height for rigging
 */

/**
 * Rigging tasks slice state
 * @typedef {Object} RiggingTasksSliceState
 * @property {RiggingTask[]} riggingTasks - Array of all rigging tasks
 * @property {string|null} selectedTaskId - ID of currently selected task
 * @property {boolean} isPolling - Whether polling is active
 * @property {number|null} pollingIntervalId - Interval ID for active polling
 */

/**
 * Rigging tasks slice actions
 * @typedef {Object} RiggingTasksSliceActions
 * @property {(task: RiggingTask) => void} addRiggingTask - Add a new rigging task
 * @property {(taskId: string, updates: Partial<RiggingTask>) => void} updateRiggingTask - Update existing task
 * @property {(taskId: string) => void} removeRiggingTask - Remove a task
 * @property {(taskId: string|null) => void} setSelectedTaskId - Set selected task ID
 * @property {() => void} clearCompletedTasks - Remove all completed/failed tasks
 * @property {() => void} startPolling - Start polling for task updates
 * @property {() => void} stopPolling - Stop polling
 * @property {(id: number) => void} setPollingIntervalId - Set polling interval ID
 * @property {(taskId: string) => Promise<Object>} fetchTaskStatus - Fetch task status from backend
 * @property {() => Promise<void>} pollAllTasks - Poll all pending/in-progress tasks
 * @property {(file: File, options?: RiggingTaskOptions) => Promise<Object>} submitRiggingTask - Submit new rigging task
 * @property {(taskId: string) => string|null} getModelUrl - Get model download URL for task
 * @property {() => RiggingTask|null} getSelectedTask - Get currently selected task object
 */

/**
 * @typedef {RiggingTasksSliceState & RiggingTasksSliceActions} RiggingTasksSlice
 */

/**
 * Create rigging tasks slice for Zustand store
 * Manages state for 3D character rigging tasks in CharacterLab
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 * @returns {RiggingTasksSlice} Rigging tasks slice state and actions
 */
export const createRiggingTasksSlice = (set, get) => ({
  // State
  riggingTasks: [],
  selectedTaskId: null,
  isPolling: false,
  pollingIntervalId: null,

  // Actions
  addRiggingTask: (task) => set((state) => {
    state.riggingTasks.push({
      ...task,
      createdAt: task.createdAt || new Date().toISOString(),
    });
  }),

  updateRiggingTask: (taskId, updates) => set((state) => {
    const index = state.riggingTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      state.riggingTasks[index] = {
        ...state.riggingTasks[index],
        ...updates,
      };
    }
  }),

  removeRiggingTask: (taskId) => set((state) => {
    state.riggingTasks = state.riggingTasks.filter(t => t.id !== taskId);
    if (state.selectedTaskId === taskId) {
      state.selectedTaskId = null;
    }
  }),

  setSelectedTaskId: (taskId) => set((state) => {
    state.selectedTaskId = taskId;
  }),

  clearCompletedTasks: () => set((state) => {
    state.riggingTasks = state.riggingTasks.filter(
      t => t.status !== 'SUCCEEDED' && t.status !== 'FAILED'
    );
  }),

  // Polling actions
  startPolling: () => set((state) => {
    state.isPolling = true;
  }),

  stopPolling: () => set((state) => {
    state.isPolling = false;
    if (state.pollingIntervalId) {
      clearInterval(state.pollingIntervalId);
      state.pollingIntervalId = null;
    }
  }),

  setPollingIntervalId: (id) => set((state) => {
    state.pollingIntervalId = id;
  }),

  // Fetch task status from backend
  fetchTaskStatus: async (taskId) => {
    try {
      // Use centralized API endpoint
      const data = await api.rigging.status(taskId);

      // Update task in store
      get().updateRiggingTask(taskId, {
        status: data.status,
        progress: data.progress || 0,
        result: data.result,
        completedAt: data.status === 'SUCCEEDED' ? new Date().toISOString() : undefined,
      });

      return data;
    } catch (error) {
      console.error('Error fetching task status:', error);
      get().updateRiggingTask(taskId, {
        status: 'FAILED',
        error: error.message,
      });
      throw error;
    }
  },

  // Poll all pending/in-progress tasks
  pollAllTasks: async () => {
    const tasks = get().riggingTasks;
    const pendingTasks = tasks.filter(
      t => t.status === 'PENDING' || t.status === 'IN_PROGRESS'
    );

    if (pendingTasks.length === 0) {
      get().stopPolling();
      return;
    }

    // Fetch status for all pending tasks in parallel
    const promises = pendingTasks.map(task =>
      get().fetchTaskStatus(task.id).catch(err => {
        console.error(`Failed to poll task ${task.id}:`, err);
      })
    );

    await Promise.all(promises);
  },

  // Submit a new rigging task
  submitRiggingTask: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('model', file);

      if (options.characterHeight) {
        formData.append('characterHeight', options.characterHeight);
      }

      const response = await fetch('/api/rigging/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use text response
          try {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText;
          } catch (textError) {
            // Keep the HTTP status message
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Add task to store
      get().addRiggingTask({
        id: data.taskId,
        name: data.modelName || file.name,
        status: data.status || 'PENDING',
        progress: 0,
      });

      // Start polling if not already polling
      if (!get().isPolling) {
        const intervalId = setInterval(() => {
          get().pollAllTasks();
        }, 5000); // Poll every 5 seconds

        get().startPolling();
        get().setPollingIntervalId(intervalId);
      }

      return data;
    } catch (error) {
      console.error('Error submitting rigging task:', error);
      throw error;
    }
  },

  // Get model URL for viewing
  getModelUrl: (taskId) => {
    const task = get().riggingTasks.find(t => t.id === taskId);
    if (!task || task.status !== 'SUCCEEDED') {
      return null;
    }
    // Use centralized API endpoint
    return api.rigging.downloadUrl(taskId);
  },

  // Get selected task
  getSelectedTask: () => {
    const taskId = get().selectedTaskId;
    if (!taskId) return null;
    return get().riggingTasks.find(t => t.id === taskId);
  },
});
