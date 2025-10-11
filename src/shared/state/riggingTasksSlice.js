/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Rigging Tasks Slice
 * Manages state for 3D character rigging tasks in CharacterLab
 *
 * Task structure:
 * {
 *   id: string,           // Meshy task ID
 *   name: string,         // Original file name
 *   status: string,       // PENDING | IN_PROGRESS | SUCCEEDED | FAILED
 *   progress: number,     // 0-100
 *   result: object,       // Meshy result with URLs
 *   createdAt: string,    // ISO timestamp
 *   completedAt: string,  // ISO timestamp (optional)
 *   error: string,        // Error message (optional)
 * }
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
      const response = await fetch(`/api/rigging/status/${taskId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch task status: ${response.statusText}`);
      }

      const data = await response.json();

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
    return `/api/rigging/download-glb/${taskId}`;
  },

  // Get selected task
  getSelectedTask: () => {
    const taskId = get().selectedTaskId;
    if (!taskId) return null;
    return get().riggingTasks.find(t => t.id === taskId);
  },
});
