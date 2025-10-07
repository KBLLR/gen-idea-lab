import React, { useEffect, useMemo } from 'react'
import useStore from '@store'
import seedTasks from './data/seed-tasks.json'
import './styles/kanban.css'
import CategorySidebar from './components/CategorySidebar.jsx'
import Lane from './components/Lane.jsx'

const useTasks = () => {
  const tasksById = useStore(s => s.tasks.byId)
  const allIds = useStore(s => s.tasks.allIds)
  const lanesState = useStore(s => s.lanes)
  const bulkUpsertTasks = useStore(s => s.bulkUpsertTasks)

  // Seed once if empty
  useEffect(() => {
    if (!allIds || allIds.length === 0) {
      const mapped = (seedTasks || []).map(t => ({ id: t.id, title: t.title, priority: t.priority || 'med', assignee: t.assignee || 'Unassigned', col: (t.status || 'todo') }))
      bulkUpsertTasks(mapped)
    }
  }, [allIds?.length, bulkUpsertTasks])

  const tasks = useMemo(() => allIds.map(id => tasksById[id]).filter(Boolean), [allIds, tasksById])

  const categories = useMemo(() => {
    const by = new Map()
    for (const t of tasks) {
      const bucket = t.bucket || 'General'
      if (!by.has(bucket)) by.set(bucket, [])
      by.get(bucket).push(t)
    }
    return Array.from(by.entries()).map(([name, items]) => ({ name, items }))
  }, [tasks])

  const lanes = useMemo(() => ({
    todo: (lanesState.todo || []).map(id => tasksById[id]).filter(Boolean),
    doing: (lanesState.doing || []).map(id => tasksById[id]).filter(Boolean),
    done: (lanesState.done || []).map(id => tasksById[id]).filter(Boolean),
  }), [lanesState, tasksById])

  return { categories, lanes }
}

import { useRightPane, useLeftPane } from '@shared/lib/layoutSlots'
import TabbedRightPane from '@shared/lib/TabbedRightPane.jsx'
import { Panel } from '@ui'

export default function KanbanContent() {
  const { categories, lanes } = useTasks()
  const setActiveApp = useStore(s => s.actions.setActiveApp)
  const { setRightPane, clearRightPane } = useRightPane()
  const { setLeftPane, clearLeftPane } = useLeftPane()

  React.useEffect(() => {
    setActiveApp('kanban')
    setLeftPane(<CategorySidebar categories={categories} />)
    setRightPane(
      <TabbedRightPane
        initial="kanban"
        tabs={[
          { id: 'kanban', label: 'Kanban', icon: '🧭', title: 'Status', render: () => (
            <div className="lanes">
              <Lane title="🧭 To Do"  items={lanes.todo}  />
              <Lane title="⚙️ Doing" items={lanes.doing} />
              <Lane title="✅ Done"   items={lanes.done}  />
            </div>
          ) },
        ]}
      />
    )
    return () => { clearRightPane(); clearLeftPane(); }
  }, [setActiveApp, setRightPane, clearRightPane, setLeftPane, clearLeftPane, lanes.todo, lanes.doing, lanes.done, categories])

  return (
    <Panel title="Standup / Task Detail">
      Select or create a task…
    </Panel>
  )
}
