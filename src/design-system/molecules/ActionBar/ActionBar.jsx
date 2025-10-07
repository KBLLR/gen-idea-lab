import { forwardRef, useRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import './ActionBar.css';

export const ActionBar = forwardRef(function ActionBar(
  { as: Comp = 'div', items = [], size = 'md', variant = 'default', className, onAction, children, ...rest },
  ref
) {
  const [index, setIndex] = useState(0);
  const btnRefs = useRef([]);

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

  return (
    <Comp
      ref={ref}
      role="toolbar"
      aria-label="Actions"
      className={clsx('ui-ActionBar', `ui-ActionBar--${size}`, `ui-ActionBar--${variant}`, className)}
      onKeyDown={onKeyDown}
      {...rest}
    >
      {items.map((it, i) => (
        <button
          key={it.id}
          ref={el => (btnRefs.current[i] = el)}
          type="button"
          className="ui-ActionBar__btn"
          title={it.tooltip || it.label}
          aria-label={it.label}
          disabled={it.disabled}
          onClick={(e) => {
            it.onClick?.(e);
            onAction?.(it.id, e);
          }}
        >
          {it.icon ? <span className="ui-ActionBar__icon" aria-hidden>{it.icon}</span> : null}
          <span className="ui-ActionBar__label">{it.label}</span>
        </button>
      ))}
      {children /* escape hatch */}
    </Comp>
  );
});

export default ActionBar;
