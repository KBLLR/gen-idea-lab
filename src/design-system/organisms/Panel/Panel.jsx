import clsx from 'clsx'
import React, { forwardRef } from 'react'
import './Panel.css'

const Panel = forwardRef(function Panel(
  { as: Comp = 'section', variant, title, info, headerRight, children, footer, className, style, ariaLabel, ...rest },
  ref
) {
  const domRest = Object.fromEntries(
    Object.entries(rest).filter(([k]) => k.startsWith('data-') || k.startsWith('aria-') || ['id','className','style','onClick','onMouseEnter','onMouseLeave','onFocus','onBlur','onKeyDown','onKeyUp','tabIndex','title'].includes(k))
  );
  const aria = domRest['aria-label'] || ariaLabel || undefined;
  const classes = clsx('ui-Panel', variant && `ui-Panel--${variant}`, className)
  return (
    <Comp ref={ref} className={classes} style={style} {...(aria ? { 'aria-label': aria } : {})} {...domRest}>
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
