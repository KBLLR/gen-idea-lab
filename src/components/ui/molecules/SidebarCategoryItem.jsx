import React from 'react';

export default function SidebarCategoryItem({ icon, label, count, active, onClick }) {
  return (
    <button
      className={`category-item ${active ? 'active' : ''}`}
      onClick={onClick}
      type="button"
    >
      <span className="icon">{icon}</span>
      <span className="category-name">{label}</span>
      <span className="category-count">{count}</span>
    </button>
  );
}

