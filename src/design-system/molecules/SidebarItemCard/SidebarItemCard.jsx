import { forwardRef } from 'react';
import clsx from 'clsx';
import './SidebarItemCard.css';

export const SidebarItemCard = forwardRef(function SidebarItemCard(
  { as: Comp = 'button', icon, label, active = false, badge, rightSlot, className, href, ...rest },
  ref
) {
  const ariaCurrent = active ? 'page' : undefined;
  const common = {
    ref,
    className: clsx('ui-SidebarItemCard', active && 'is-active', className),
    'aria-current': ariaCurrent,
    ...rest,
  };

  if (Comp === 'a')
    return (
      <a {...common} href={href}>
        {icon ? (
          <span className="ui-SidebarItemCard__icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        <span className="ui-SidebarItemCard__label">{label}</span>
        {badge ? <span className="ui-SidebarItemCard__badge">{badge}</span> : null}
        {rightSlot ? <span className="ui-SidebarItemCard__right">{rightSlot}</span> : null}
      </a>
    );

  return (
    <Comp {...common} type={Comp === 'button' ? 'button' : undefined}>
      {icon ? (
        <span className="ui-SidebarItemCard__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="ui-SidebarItemCard__label">{label}</span>
      {badge ? <span className="ui-SidebarItemCard__badge">{badge}</span> : null}
      {rightSlot ? <span className="ui-SidebarItemCard__right">{rightSlot}</span> : null}
    </Comp>
  );
});

export default SidebarItemCard;
