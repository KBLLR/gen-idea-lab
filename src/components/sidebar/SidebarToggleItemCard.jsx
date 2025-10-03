import React from 'react';
import SidebarItemCard from './SidebarItemCard.jsx';

export default function SidebarToggleItemCard({ icon, label, checked, onChange, description, title }) {
  const handleClick = (e) => {
    e.preventDefault();
    onChange?.(!checked);
  };

  const rightSlot = (
    <span
      className={`toggle-switch ${checked ? 'active' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={`${label} ${checked ? 'on' : 'off'}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange?.(!checked);
        }
      }}
      tabIndex={0}
      style={{ marginLeft: 'auto' }}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <SidebarItemCard
        icon={icon}
        label={label}
        rightSlot={rightSlot}
        title={title}
      />
      {description && (
        <div className="toggle-description" style={{ paddingLeft: '34px' }}>{description}</div>
      )}
    </div>
  );
}

