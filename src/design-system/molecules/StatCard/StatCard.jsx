import { forwardRef } from 'react';
import clsx from 'clsx';
import './StatCard.css';

export const StatCard = forwardRef(function StatCard(
  { icon, tone = 'neutral', value, label, hint, className, as: Comp = 'div', ...rest },
  ref
) {
  return (
    <Comp ref={ref} className={clsx('ui-StatCard', `ui-StatCard--${tone}`, className)} {...rest}>
      {icon ? (
        typeof icon === 'string' && /^[a-z_]+$/i.test(icon)
          ? <div className="ui-StatCard__icon icon" aria-hidden>{icon}</div>
          : <div className="ui-StatCard__icon" aria-hidden>{icon}</div>
      ) : null}
      <div className="ui-StatCard__main">
        <div className="ui-StatCard__value" aria-live="polite">{value}</div>
        <div className="ui-StatCard__label">{label}</div>
        {hint ? <div className="ui-StatCard__hint">{hint}</div> : null}
      </div>
    </Comp>
  );
});

export default StatCard;
