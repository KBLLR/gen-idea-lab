/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useMemo } from 'react';
import useStore from '../lib/store';
import c from 'clsx';
import { setActiveEntryId, createNewArchivaEntry } from '../lib/actions';
import { templates } from '../lib/archiva/templates';

export default function ArchivaSidebar() {
    const archivaEntries = useStore.use.archivaEntries();
    const entries = useMemo(() => Object.values(archivaEntries), [archivaEntries]);
    const activeEntryId = useStore.use.activeEntryId();

    const drafts = useMemo(
        () => entries.filter(e => e.status === 'draft').sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
        [entries]
    );
    const published = useMemo(
        () => entries.filter(e => e.status === 'published').sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
        [entries]
    );
    
    return (
        <>
            <div className="semester-group">
                <h2>Templates</h2>
                {(() => {
                    const grouped = Object.entries(templates).reduce((acc, [key, tpl]) => {
                        const type = tpl.type || 'Other';
                        if (!acc[type]) acc[type] = [];
                        acc[type].push({ key, name: tpl.name });
                        return acc;
                    }, {});
                    const order = ['Reflective', 'Technical', 'Creative', 'Other'];
                    return order
                        .filter(group => grouped[group]?.length)
                        .map(group => (
                            <div className="module-list" key={group} style={{ marginBottom: 10 }}>
                                <h3 style={{ fontSize: 12, color: 'var(--text-tertiary)', paddingLeft: 10 }}>{group}</h3>
                                {grouped[group]
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(({ key, name }) => (
                                        <button
                                            key={key}
                                            onClick={() => createNewArchivaEntry(key)}
                                            title={`Create a new ${name}`}
                                        >
                                            <div className="module-info">
                                                <span className="icon">note_add</span>
                                                <p>{name}</p>
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        ));
                })()}
            </div>
            <div className="semester-group">
                <h2>Drafts ({drafts.length})</h2>
                <div className="module-list">
                    {drafts.map(entry => (
                        <button
                            key={entry.id}
                            className={c({ active: entry.id === activeEntryId })}
                            onClick={() => setActiveEntryId(entry.id)}
                        >
                            <div className="module-info">
                                <span className="icon">edit_document</span>
                                <p>{entry.values.title || 'Untitled Entry'}</p>
                            </div>
                        </button>
                    ))}
                    {drafts.length === 0 && <p className="empty-list-message">No drafts yet.</p>}
                </div>
            </div>
            <div className="semester-group">
                <h2>Published ({published.length})</h2>
                <div className="module-list">
                    {published.map(entry => (
                        <button
                            key={entry.id}
                            className={c({ active: entry.id === activeEntryId })}
                            onClick={() => setActiveEntryId(entry.id)}
                        >
                            <div className="module-info">
                                <span className="icon">article</span>
                                <p>{entry.values.title || 'Untitled Entry'}</p>
                            </div>
                        </button>
                    ))}
                    {published.length === 0 && <p className="empty-list-message">No published entries.</p>}
                </div>
            </div>
        </>
    );
}
