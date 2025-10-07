import React from 'react';

export default function SidebarTooltip({ text, content, x, y, visible = false, placement = 'right' }) {
  if (!visible) return null;
  const style = { left: x, top: y };
  return (
    <div className={`sidebar-tooltip sidebar-tooltip--${placement} ${visible ? 'is-visible' : ''}`} style={style} role="tooltip">
      <div className="sidebar-tooltip__content">{content ?? text}</div>
    </div>
  );
}
