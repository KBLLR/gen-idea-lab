/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../lib/store';
import c from 'clsx';
import { setActiveEntryId, createNewArchivaEntry } from '../lib/actions';
import { templates } from '../lib/archiva/templates';

export default function ArchivaSidebar() {
    const entries = useStore(s => Object.values(s.archivaEntries));
    const activeEntryId = useStore.use.activeEntryId();

    const drafts = entries.filter(e => e.status === 'draft').sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const published = entries.filter(e => e.status === 'published').sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    return (
        <>
            <div className="semester-group">
                <h2>Templates</h2>
                <div className="module-list">
                    {Object.entries(templates).map(([key, template]) => (
                        <button
                            key={key}
                            onClick={() => createNewArchivaEntry(key)}
                            title={`Create a new ${template.name}`}
                        >
                            <div className="module-info">
                                <span className="icon">add_box</span>
                                <p>{template.name}</p>
                            </div>
                        </button>
                    ))}
                </div>
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