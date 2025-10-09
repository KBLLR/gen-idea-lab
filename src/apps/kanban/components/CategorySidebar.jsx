import React, { useMemo } from 'react';
import useStore from '@store';
import { Panel, SidebarItemCard } from '@ui'
import styles from './CategorySidebar.module.css'

export default function CategorySidebar() {
  const tasksById = useStore(s => s.tasks.byId);
  const allIds = useStore(s => s.tasks.allIds);

  const tasks = useMemo(() => allIds.map(id => tasksById[id]).filter(Boolean), [allIds, tasksById]);

  const categories = useMemo(() => {
    const by = new Map();
    for (const t of tasks) {
      const bucket = t.bucket || 'General';
      if (!by.has(bucket)) by.set(bucket, []);
      by.get(bucket).push(t);
    }
    return Array.from(by.entries()).map(([name, items]) => ({ name, items }));
  }, [tasks]);

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
