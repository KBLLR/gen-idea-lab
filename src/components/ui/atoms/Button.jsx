/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import clsx from 'clsx';

export default function Button({
  variant = 'secondary', // 'primary' | 'secondary' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon,
  className,
  children,
  ...rest
}) {
  const base = [];
  let variantClasses = '';

  switch (variant) {
    case 'primary':
      // Reuse existing primary pill style
      variantClasses = 'booth-generate-btn primary';
      break;
    case 'ghost':
      // Lightweight button style already used for inline actions
      variantClasses = 'image-action-btn';
      break;
    case 'secondary':
    default:
      variantClasses = 'secondary';
      break;
  }

  // Size tweaks (conservative to avoid extra CSS): rely mostly on existing styles
  const sizeStyle =
    size === 'sm' ? { fontSize: 12, padding: '6px 12px' } :
    size === 'lg' ? { fontSize: 16, padding: '12px 20px' } :
    undefined;

  return (
    <button className={clsx(variantClasses, className)} style={sizeStyle} {...rest}>
      {icon ? <span className="icon">{icon}</span> : null}
      {children}
    </button>
  );
}

