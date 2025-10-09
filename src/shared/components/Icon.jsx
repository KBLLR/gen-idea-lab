/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

/**
 * Unified Material Icons Round component
 *
 * @param {object} props
 * @param {string} props.name - Icon name (e.g., 'home', 'search', 'settings')
 * @param {number} props.size - Icon size in pixels (default: 24)
 * @param {string} props.className - Additional CSS classes
 * @param {object} props.style - Inline styles
 * @param {string} props.color - Icon color
 * @returns {JSX.Element}
 *
 * @example
 * <Icon name="home" />
 * <Icon name="search" size={20} color="#4a9eff" />
 * <Icon name="settings" className="my-custom-class" />
 */
export default function Icon({
  name,
  size = 24,
  className = '',
  style = {},
  color,
  ...props
}) {
  const iconStyle = {
    fontSize: size,
    ...(color && { color }),
    ...style,
  };

  return (
    <span
      className={`material-icons-round ${className}`}
      style={iconStyle}
      {...props}
    >
      {name}
    </span>
  );
}
