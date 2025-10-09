import { nanoid } from 'nanoid'

const tasksSlice = (set, get) => ({
  tasks: { byId: {}, allIds: [] },
  lanes: { todo: [], doing: [], done: [] },
  limits: { todo: Infinity, doing: 3, done: Infinity },
  selectedTaskId: null,

  createTask: (t) => {
    const id = t?.id ?? nanoid(8)
    const task = {
      id,
      title: '',
      priority: 'med',
      assignee: 'Unassigned',
      col: 'todo',
      createdAt: Date.now(),
      ...t,
    }
    set((s) => {
      s.tasks.byId[id] = task
      if (!s.tasks.allIds.includes(id)) s.tasks.allIds.push(id)
      if (!s.lanes[task.col]) s.lanes[task.col] = []
      if (!s.lanes[task.col].includes(id)) s.lanes[task.col].push(id)
    })
    return id
  },

  moveTask: (id, col) => set((s) => {
    const cur = s.tasks.byId[id]
    if (!cur || !s.lanes[cur.col] || !s.lanes[col]) return
    s.lanes[cur.col] = s.lanes[cur.col].filter((x) => x !== id)
    cur.col = col
    s.lanes[col].push(id)
  }),

  assignTask: (id, assignee) => set((s) => { if (s.tasks.byId[id]) s.tasks.byId[id].assignee = assignee }),

  setWipLimit: (col, n) => set((s) => { s.limits[col] = Number.isFinite(n) ? n : Infinity }),

  bulkUpsertTasks: (arr) => set((s) => {
    (arr || []).forEach((t) => {
      const id = t?.id ?? nanoid(8)
      const task = {
        createdAt: Date.now(),
        priority: 'med',
        col: 'todo',
        ...t,
        id,
      }
      s.tasks.byId[id] = task
      if (!s.tasks.allIds.includes(id)) s.tasks.allIds.push(id)
      if (!s.lanes[task.col]) s.lanes[task.col] = []
      if (!s.lanes[task.col].includes(id)) s.lanes[task.col].push(id)
    })
  }),

  setSelectedTask: (id) => set((s) => { s.selectedTaskId = id }),
})

export default tasksSlice
