import React from 'react'
import clsx from 'clsx'
import './ColumnHeaderBar.css'

export default function ColumnHeaderBar({
  title,
  subtitle,
  status, // optional string badge like "draft" | "published"
  actions, // right-side React node (ActionBar or buttons)
  onClose, // optional close handler to show an X button
  className,
  children,
}) {
  return (
    <div className={clsx('ui-ColumnHeaderBar', className)}>
      <div className="ui-ColumnHeaderBar__left">
        <div className="ui-ColumnHeaderBar__titleRow">
          {title ? <h2 className="ui-ColumnHeaderBar__title">{title}</h2> : null}
          {status ? <span className={clsx('ui-ColumnHeaderBar__status', `is-${String(status).toLowerCase()}`)}>{status}</span> : null}
        </div>
        {subtitle ? <div className="ui-ColumnHeaderBar__subtitle">{subtitle}</div> : null}
        {children}
      </div>
      <div className="ui-ColumnHeaderBar__right">
        {actions}
        {onClose && (
          <button className="ui-ColumnHeaderBar__close" onClick={onClose} aria-label="Close">
            <span className="icon">close</span>
          </button>
        )}
      </div>
    </div>
  )
}
