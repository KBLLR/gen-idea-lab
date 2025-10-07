/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState } from 'react';
import c from 'clsx';
import useStore from '@store';
import { selectMode } from '@shared/lib/actions/imageBoothActions.js';
import modes from '../lib/modes';
// thumbnails currently not available; show placeholder icons

export default function ModeSelector() {
    const activeModeKey = useStore.use.activeModeKey();
    const [openCategories, setOpenCategories] = useState(() => {
        const initialState = {};
        Object.keys(modes).forEach(key => {
            initialState[key] = true; // Default all categories to open
        });
        return initialState;
    });

    const toggleCategory = (categoryName) => {
        setOpenCategories(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
    };

    return (
        <div className="mode-selector">
            {Object.entries(modes).map(([categoryName, subCategories]) => {
                const isOpen = openCategories[categoryName];
                return (
                    <div key={categoryName} className="mode-category">
                        <h2 onClick={() => toggleCategory(categoryName)}>
                            {categoryName}
                            <span className="icon">{isOpen ? 'expand_less' : 'expand_more'}</span>
                        </h2>
                        {isOpen && Object.entries(subCategories).map(([subCategoryName, modesInCategory]) => (
                            <div key={subCategoryName} className="mode-subcategory">
                                <h3>{subCategoryName}</h3>
                                <div className="mode-grid">
                                    {Object.entries(modesInCategory).map(([modeKey, modeDetails]) => (
                                        <button
                                            key={modeKey}
                                            className={c('mode-item', { active: activeModeKey === modeKey })}
                                            onClick={() => selectMode(modeKey)}
                                            title={modeDetails.name}
                                        >
<div className="placeholder icon">photo_spark</div>
                                            <span>{modeDetails.emoji} {modeDetails.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}
