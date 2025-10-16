import React, { useEffect, useMemo, useState } from 'react'
import { ColumnHeaderBar, ActionBar, Panel } from '@ui'
import useStore from '@store'

function useEventCountdowns() {
  // Get events from Zustand store (reactive)
  const events = useStore.use.calendarAI()?.events || []
  // Force re-render every second for countdown updates
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])
  return events
}

function Countdown({ when }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])
  if (!when) return <span>—</span>
  const target = new Date(when).getTime()
  const diff = Math.max(0, target - Date.now())
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return <span>{days}d {pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
}

export default function CalendarRightPane() {
  const events = useEventCountdowns()
  const upcoming = useMemo(() => {
    return [...events]
      .filter(e => e?.when)
      .sort((a, b) => new Date(a.when) - new Date(b.when))
      .slice(0, 10)
  }, [events])

  const actions = (
    <ActionBar
      separators
      items={[
        { id: 'refresh', icon: 'refresh', label: 'Refresh', onClick: () => window.dispatchEvent(new Event('focus')) },
        { id: 'settings', icon: 'settings', label: 'Settings', onClick: () => document.dispatchEvent(new CustomEvent('calendar:open-settings')) },
      ]}
      aria-label="Countdown actions"
    />
  )

  return (
    <div>
      <ColumnHeaderBar title="Event Countdowns" subtitle="Upcoming events" actions={actions} />
      <Panel>
        {upcoming.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>No upcoming events.</div>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0, margin: 0 }}>
            {upcoming.map(evt => (
              <li key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-secondary)', paddingBottom: 6 }}>
                <span className="icon" aria-hidden>event</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {evt.name || evt.title || 'Event'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    <Countdown when={evt.when?.dateTime || evt.when?.date || evt.when} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
