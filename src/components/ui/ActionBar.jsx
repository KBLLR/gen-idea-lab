/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import clsx from 'clsx';

export default function ActionBar({
  items = [],
  showDividers = true,
  className,
  ariaLabel = 'Actions',
  size, // 'lg' | undefined
  rovingFocus = false
}) {
  const containerClass = clsx('user-actions', className, size === 'lg' && 'user-actions--lg');

  const onKeyDown = (e) => {
    if (!rovingFocus) return;
    const isHorizontalNav = e.key === 'ArrowRight' || e.key === 'ArrowLeft';
    if (!isHorizontalNav) return;
    e.preventDefault();
    const container = e.currentTarget;
    const buttons = Array.from(container.querySelectorAll('button.action-btn'));
    const activeIndex = buttons.findIndex((el) => el === document.activeElement);
    if (activeIndex === -1) {
      buttons[0]?.focus();
      return;
    }
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (activeIndex + dir + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  };

  return (
    <div className={containerClass} role="toolbar" aria-label={ariaLabel} onKeyDown={onKeyDown}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const btnClass = clsx('action-btn', item.variant === 'danger' && 'logout-btn');
        return (
          <React.Fragment key={item.key || item.title || idx}>
            <button
              className={btnClass}
              title={item.title}
              aria-label={item.title}
              aria-pressed={typeof item.ariaPressed === 'boolean' ? item.ariaPressed : undefined}
              onClick={item.onClick}
              type="button"
            >
              {item.content ? item.content : <span className="icon">{item.icon}</span>}
            </button>
            {showDividers && !isLast ? <div className="action-divider" /> : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
