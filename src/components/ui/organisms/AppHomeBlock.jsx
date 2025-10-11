/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react'

export default function AppHomeBlock({
  icon = 'info',
  title,
  description,
  subtitle,
  tips = [],
  children,
}) {
  return (
    <div className="app-home-block">
      <div className="app-home-block__inner">
        {icon ? <span className="icon app-home-block__icon" aria-hidden>{icon}</span> : null}
        {subtitle ? <p className="app-home-block__subtitle">{subtitle}</p> : null}
        {title ? <h2 className="app-home-block__title">{title}</h2> : null}
        {description ? <p className="app-home-block__desc">{description}</p> : null}
        {tips?.length ? (
          <ul className="app-home-block__tips" aria-label="Quick tips">
            {tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        ) : null}
        {children}
      </div>
    </div>
  )
}

