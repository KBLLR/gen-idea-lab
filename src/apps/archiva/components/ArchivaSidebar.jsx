/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useMemo, useState } from 'react';
import useStore from '@store';
import c from 'clsx';
import { setActiveEntryId, createNewArchivaEntry } from '@shared/lib/actions/archivaActions.js';
import { templates } from '@apps/archiva/lib/templates.js';

export default function ArchivaSidebar() {
    const archivaEntries = useStore.use.archivaEntries();
    const entries = useMemo(() => Object.values(archivaEntries), [archivaEntries]);
    const activeEntryId = useStore.use.activeEntryId();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    const drafts = useMemo(
        () => entries.filter(e => e.status === 'draft').sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
        [entries]
    );
    const published = useMemo(
        () => entries.filter(e => e.status === 'published').sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
        [entries]
    );

    // Semantic search function
    const performSemanticSearch = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // For now, use local search as the backend resource store is empty
            // TODO: Implement proper semantic search once there's data in moduleResources
            const localResults = entries.filter(entry =>
                entry.values?.title?.toLowerCase().includes(query.toLowerCase()) ||
                entry.values?.content?.toLowerCase().includes(query.toLowerCase()) ||
                entry.values?.description?.toLowerCase().includes(query.toLowerCase())
            );

            if (localResults.length > 0) {
                setSearchResults(localResults.slice(0, 10));
            } else {
                // Try backend search as fallback if local search finds nothing
                const response = await fetch(`/api/modules/general/resources/documentation/search?q=${encodeURIComponent(query)}`, {
                    credentials: 'include'
                });

                if (response.ok) {
                    const backendResults = await response.json();
                    setSearchResults(backendResults.slice(0, 10));
                } else {
                    console.warn('Both local and backend search returned no results');
                    setSearchResults([]);
                }
            }
        } catch (error) {
            console.error('Search failed:', error);
            // Fallback to local search
            const localResults = entries.filter(entry =>
                entry.values?.title?.toLowerCase().includes(query.toLowerCase()) ||
                entry.values?.content?.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(localResults.slice(0, 10));
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced search
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        // Simple debounce
        clearTimeout(window.archivaSearchTimeout);
        window.archivaSearchTimeout = setTimeout(() => {
            performSemanticSearch(query);
        }, 300);
    };
    
    return (
        <>
            {/* Search Section */}
            <div className="semester-group">
                <h2>Search Archive</h2>
                <div className="search-container">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Search documentation, workflows, and notes..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                        {isSearching && (
                            <div className="search-spinner">
                                <span className="icon rotating">refresh</span>
                            </div>
                        )}
                        {searchQuery && (
                            <button
                                className="search-clear"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                title="Clear search"
                            >
                                <span className="icon">close</span>
                            </button>
                        )}
                    </div>

                    {/* Search Results */}
                    {searchQuery && searchResults.length > 0 && (
                        <div className="search-results">
                            <h3 style={{ fontSize: 12, color: 'var(--text-tertiary)', paddingLeft: 10 }}>
                                Results ({searchResults.length})
                            </h3>
                            <div className="module-list">
                                {searchResults.map((result, index) => (
                                    <div
                                        key={result.id || `result-${index}`}
                                        role="button"
                                        tabIndex={0}
                                        className={c('search-result-item', { active: result.id === activeEntryId })}
                                        onClick={() => setActiveEntryId(result.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setActiveEntryId(result.id);
                                            }
                                        }}
                                        title={result.description || result.title}
                                    >
                                        <div className="module-info">
                                            <span className="icon">search</span>
                                            <p>{result.title || result.values?.title || 'Untitled'}</p>
                                        </div>
                                        {result.preview && (
                                            <div className="search-preview">
                                                {result.preview.substring(0, 60)}...
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchQuery && searchResults.length === 0 && !isSearching && (
                        <div className="search-no-results">
                            <p className="empty-list-message">No results found for "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            </div>

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
                            <div className="module-list" key={group}>
                                <h3>{group}</h3>
                                {grouped[group]
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(({ key, name }) => {
                                        const isActive = useStore.getState().selectedTemplateForPreview === key;
                                        const handlePreview = () => {
                                            useStore.setState({ selectedTemplateForPreview: key, activeEntryId: null });
                                        };
                                        const handleKeyDown = (event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                handlePreview();
                                            }
                                        };

                                        const template = templates[key];
                                        return (
                                            <div
                                                key={key}
                                                role="button"
                                                tabIndex={0}
                                                onClick={handlePreview}
                                                onKeyDown={handleKeyDown}
                                                className={c('template-item', { active: isActive })}
                                                title={`${name} - ${template?.purpose || 'Preview template'}`}
                                            >
                                                <div className="module-info">
                                                    <span className="icon">description</span>
                                                    <div className="template-text">
                                                        <p className="template-name">{name}</p>
                                                        {template?.purpose && (
                                                            <span className="template-purpose">{template.purpose}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="create-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        createNewArchivaEntry(key);
                                                    }}
                                                    title={`Create new ${name}`}
                                                >
                                                    <span className="icon">add</span>
                                                </button>
                                            </div>
                                        );
                                    })}
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
