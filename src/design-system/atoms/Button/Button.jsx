import clsx from 'clsx'
import React, { forwardRef } from 'react'
import './Button.css'

const Button = forwardRef(function Button(
  { as: Comp = 'button', variant = 'primary', size = 'md', className, disabled, icon, children, ...rest },
  ref
) {
  const isButton = Comp === 'button'
  const classes = clsx('ui-Button', `ui-Button--${variant}`, `ui-Button--${size}`, className)
  return (
    <Comp
      ref={ref}
      className={classes}
      {...(isButton ? { type: 'button' } : {})}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      {icon ? <span className="ui-Button__icon" aria-hidden>{icon}</span> : null}
      <span className="ui-Button__label">{children}</span>
    </Comp>
  )
})
export default Button
