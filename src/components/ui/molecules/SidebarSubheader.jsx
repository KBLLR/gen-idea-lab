import React from 'react';
import { ActionBar } from '@ui';

export default function SidebarSubheader({ icon, title, subtitle, rightSlot, actions }) {
  return (
    <div className="sidebar-subheader" role="heading" aria-level={3}>
      <div className="left">
        {icon && <span className="icon" aria-hidden="true">{icon}</span>}
        <div className="text">
          <div className="title">{title}</div>
          {subtitle && <div className="subtitle">{subtitle}</div>}
        </div>
      </div>
      {actions ? (
<ActionBar items={actions.map(a => ({ id: a.key || a.title, label: a.title, icon: a.icon, tooltip: a.title, onClick: a.onClick }))} aria-label={`${title} actions`} variant="icon" separators />
      ) : rightSlot}
    </div>
  );
}
