import React from 'react';
import { Panel, SidebarItemCard } from '@ui'
import styles from './CategorySidebar.module.css'

export default function CategorySidebar({ categories }) {
  return (
    <aside className={styles.root}>
      {categories.map(({ name, items }) => (
        <Panel key={name} title={<span className={styles.headerTitle}>{name} <span className={styles.badge}>{items.length}</span></span>}>
          <div className={styles.list}>
            {items.map(t => (
              <SidebarItemCard key={t.id} label={t.title} title={t.title} />
            ))}
          </div>
        </Panel>
      ))}
    </aside>
  )
}
