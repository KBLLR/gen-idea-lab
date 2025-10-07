import clsx from 'clsx'
import React, { forwardRef } from 'react'
import './Panel.css'

const Panel = forwardRef(function Panel(
  { as: Comp = 'section', variant, title, info, headerRight, children, footer, className, style, ...rest },
  ref
) {
  const classes = clsx('ui-Panel', variant && `ui-Panel--${variant}`, className)
  return (
    <Comp ref={ref} className={classes} style={style} {...rest}>
      {(title || info || headerRight) && (
        <header className="ui-Panel__header">
          {title && <h3 className="ui-Panel__title">{title}</h3>}
          {info && <span className="ui-Panel__info">{info}</span>}
          {headerRight}
        </header>
      )}
      <div className="ui-Panel__body">
        {children}
      </div>
      {footer && (
        <footer className="ui-Panel__footer">
          {footer}
        </footer>
      )}
    </Comp>
  )
})
export default Panel
