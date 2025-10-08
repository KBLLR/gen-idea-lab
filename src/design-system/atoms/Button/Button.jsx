import clsx from 'clsx'
import React, { forwardRef } from 'react'
import './Button.css'

const Button = forwardRef(function Button(
  { as: Comp = 'button', variant = 'primary', size = 'md', className, disabled, icon, children, ariaLabel, ...rest },
  ref
) {
  const domRest = Object.fromEntries(
    Object.entries(rest).filter(([k]) => k.startsWith('data-') || k.startsWith('aria-') || ['id','className','style','href','onClick','onMouseEnter','onMouseLeave','onFocus','onBlur','onKeyDown','onKeyUp','tabIndex','title'].includes(k))
  );
  const aria = domRest['aria-label'] || ariaLabel || undefined;
  const isButton = Comp === 'button'
  const classes = clsx('ui-Button', `ui-Button--${variant}`, `ui-Button--${size}`, className)
  return (
    <Comp
      ref={ref}
      className={classes}
      {...(isButton ? { type: 'button' } : {})}
      aria-disabled={disabled || undefined}
      {...(aria ? { 'aria-label': aria } : {})}
      {...domRest}
    >
      {icon ? <span className="ui-Button__icon" aria-hidden>{icon}</span> : null}
      <span className="ui-Button__label">{children}</span>
    </Comp>
  )
})
export default Button
