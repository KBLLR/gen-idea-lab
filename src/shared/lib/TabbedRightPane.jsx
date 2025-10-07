import React, { useMemo, useState, useEffect } from 'react'
import { Panel, Button } from '@ui'

export default function TabbedRightPane({ tabs = [], initial, persistKey = 'rightPaneTab' }) {
  const [active, setActive] = useState(() => {
    const stored = typeof window !== 'undefined' ? window.sessionStorage.getItem(persistKey) : null
    return stored || initial || (tabs[0]?.id || null)
  })
  const current = useMemo(() => tabs.find(t => t.id === active) || tabs[0], [tabs, active])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (active) window.sessionStorage.setItem(persistKey, active)
  }, [active, persistKey])

  if (!current) return null

  return (
    <Panel title={current.title || 'Details'}>
      <div className="ui-TabBar" style={{ display: 'flex', gap: 'var(--space-2, 0.5rem)', marginBottom: 'var(--space-3, 0.75rem)' }}>
        {tabs.map(t => (
          <Button key={t.id} size="sm" variant={t.id === active ? 'primary' : 'ghost'} onClick={() => setActive(t.id)}>
            {t.icon ? <span aria-hidden style={{ marginRight: '0.5em' }}>{t.icon}</span> : null}
            {t.label}
          </Button>
        ))}
      </div>
      <div>{current?.render?.() ?? null}</div>
    </Panel>
  )
}
