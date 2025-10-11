import { forwardRef, useRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import './ActionBar.css';

export const ActionBar = forwardRef(function ActionBar(
  { as: Comp = 'div', items = [], size = 'md', variant = 'icon', separators = true, className, onAction, children, ariaLabel, ...rest },
  ref
) {
  // Strip known non-DOM props to avoid leakage
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { showDividers, ...domRest } = rest;
  const [index, setIndex] = useState(0);
  const btnRefs = useRef([]);
  const withSeparators = typeof showDividers === 'boolean' ? showDividers : separators;

  useEffect(() => { btnRefs.current[index]?.focus?.(); }, [index]);

  // keyboard roving: ArrowLeft/Right, Home/End
  function onKeyDown(e) {
    if (!items.length) return;
    if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) e.preventDefault();
    const max = items.length - 1;
    if (e.key === 'ArrowRight') setIndex(i => Math.min(max, i + 1));
    if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
    if (e.key === 'Home') setIndex(0);
    if (e.key === 'End') setIndex(max);
  }

  const label = domRest['aria-label'] || ariaLabel || 'Actions';

  return (
    <Comp
      ref={ref}
      role="toolbar"
      aria-label={label}
      className={clsx('ui-ActionBar', `ui-ActionBar--${size}`, `ui-ActionBar--${variant}`, { 'ui-ActionBar--separators': withSeparators }, className)}
      onKeyDown={onKeyDown}
      {...domRest}
    >
      {items.map((it, i) => (
        <button
          key={it.id ?? it.key ?? i}
          ref={(el) => (btnRefs.current[i] = el)}
          type="button"
          className={clsx('ui-ActionBar__btn', it.className)}
          title={it.tooltip || it.label}
          aria-label={it.label}
          aria-pressed={typeof it.ariaPressed === 'boolean' ? it.ariaPressed : undefined}
          disabled={it.disabled}
          onClick={(e) => {
            it.onClick?.(e);
            onAction?.(it.id ?? it.key ?? i, e);
          }}
        >
          {it.icon ? (
            typeof it.icon === 'string' && /^[a-z_]+$/i.test(it.icon)
              ? <span className="ui-ActionBar__icon icon" aria-hidden>{it.icon}</span>
              : <span className="ui-ActionBar__icon" aria-hidden>{it.icon}</span>
          ) : null}
          {variant !== 'icon' && it.label ? (
            <span className="ui-ActionBar__label">{it.label}</span>
          ) : null}
        </button>
      ))}
      {children /* escape hatch */}
    </Comp>
  );
});

export default ActionBar;
