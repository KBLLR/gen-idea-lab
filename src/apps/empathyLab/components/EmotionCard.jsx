/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react'

export default function EmotionCard({ name, score, color, icon }) {
  const pct = Math.round((score || 0) * 100)
  return (
    <div className="emotion-card" role="status" aria-label={`${name} ${pct} percent`}>
      <div className="emotion-card__top">
        <span className="icon emotion-card__icon" aria-hidden style={{ color: color || 'var(--color-accent)' }}>{icon || 'mood'}</span>
        <div className="emotion-card__meta">
          <div className="emotion-card__name" style={{ color: color || 'var(--color-accent)' }}>{name}</div>
          <div className="emotion-card__score">{pct}%</div>
        </div>
      </div>
      <div className="emotion-card__bar">
        <div className="emotion-card__fill" style={{ width: `${pct}%`, background: color || 'var(--color-accent)' }} />
      </div>
    </div>
  )
}
