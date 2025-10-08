import React from 'react';
import { SidebarItemCard } from '@ui';

export default function TemplateSidebar() {
  const items = [
    { id: 'a', label: 'Item A' },
    { id: 'b', label: 'Item B' },
    { id: 'c', label: 'Item C' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((it) => (
        <SidebarItemCard key={it.id} label={it.label} />
      ))}
    </div>
  );
}