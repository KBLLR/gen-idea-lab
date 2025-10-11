/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react'

export default function AppWelcomePane({ icon = 'info', title, subtitle, description, tips = [], children }) {
  return (
    <div className="app-welcome-pane">
      <div className="app-welcome-inner">
        {icon ? <span className="icon app-welcome-icon" aria-hidden>{icon}</span> : null}
        {title ? <h2 className="app-welcome-title">{title}</h2> : null}
        {subtitle ? <p className="app-welcome-subtitle">{subtitle}</p> : null}
        {description ? <p className="app-welcome-desc">{description}</p> : null}
        {tips?.length ? (
          <ul className="app-welcome-tips" aria-label="quick tips">
            {tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        ) : null}
        {children}
      </div>
    </div>
  )
}

