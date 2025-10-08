import { forwardRef } from 'react';
import clsx from 'clsx';
import './SidebarItemCard.css';

export const SidebarItemCard = forwardRef(function SidebarItemCard(
  { as: Comp = 'button', icon, label, active = false, badge, rightSlot, className, href, ariaLabel, ...rest },
  ref
) {
  const domRest = Object.fromEntries(
    Object.entries(rest).filter(([k]) => k.startsWith('data-') || k.startsWith('aria-') || ['id','className','style','href','onClick','onMouseEnter','onMouseLeave','onFocus','onBlur','onKeyDown','onKeyUp','tabIndex','title'].includes(k))
  );
  const aria = domRest['aria-label'] || ariaLabel || undefined;
  const ariaCurrent = active ? 'page' : undefined;
  const common = {
    ref,
    className: clsx('ui-SidebarItemCard', active && 'is-active', className),
    'aria-current': ariaCurrent,
    ...(aria ? { 'aria-label': aria } : {}),
    ...domRest,
  };

  if (Comp === 'a')
    return (
      <a {...common} href={href}>
        {icon ? (
          typeof icon === 'string' && /^[a-z_]+$/i.test(icon)
            ? <span className="ui-SidebarItemCard__icon icon" aria-hidden>{icon}</span>
            : <span className="ui-SidebarItemCard__icon" aria-hidden>{icon}</span>
        ) : null}
        <span className="ui-SidebarItemCard__label">{label}</span>
        {badge ? <span className="ui-SidebarItemCard__badge">{badge}</span> : null}
        {rightSlot ? <span className="ui-SidebarItemCard__right">{rightSlot}</span> : null}
      </a>
    );

  return (
    <Comp {...common} type={Comp === 'button' ? 'button' : undefined}>
      {icon ? (
        typeof icon === 'string' && /^[a-z_]+$/i.test(icon)
          ? <span className="ui-SidebarItemCard__icon icon" aria-hidden>{icon}</span>
          : <span className="ui-SidebarItemCard__icon" aria-hidden>{icon}</span>
      ) : null}
      <span className="ui-SidebarItemCard__label">{label}</span>
      {badge ? <span className="ui-SidebarItemCard__badge">{badge}</span> : null}
      {rightSlot ? <span className="ui-SidebarItemCard__right">{rightSlot}</span> : null}
    </Comp>
  );
});

export default SidebarItemCard;
