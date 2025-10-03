import React from 'react';

/**
 * Base sidebar card for lists across apps.
 * Inline icon + text, optional count/badge, and active styling.
 */
export default function SidebarItemCard({ icon, label, count, active, onClick, rightSlot, title }) {
  return (
    <button
      type="button"
      className={`sidebar-item-card ${active ? 'active' : ''}`}
      onClick={onClick}
      title={title || label}
    >
      {icon && <span className="icon" aria-hidden="true">{icon}</span>}
      <span className="label" aria-label={label}>{label}</span>
      {typeof count === 'number' && (
        <span className="badge" aria-label={`Count ${count}`}>{count}</span>
      )}
      {rightSlot}
    </button>
  );
}

