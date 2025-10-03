/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import clsx from 'clsx';

export default function Panel({
  variant, // 'input' | 'output' | undefined
  title,
  info,
  headerRight,
  children,
  footer,
  className,
  style
}) {
  const variantClass =
    variant === 'input' ? 'input-container' :
    variant === 'output' ? 'output-container' : '';

  return (
    <div className={clsx('image-container', variantClass, className)} style={style}>
      {(title || info || headerRight) && (
        <div className="image-header">
          <h3>{title}</h3>
          <span className="image-info">{info}</span>
          {headerRight}
        </div>
      )}
      <div className="image-content">
        {children}
      </div>
      {footer && (
        <div className="image-actions">
          {footer}
        </div>
      )}
    </div>
  );
}

