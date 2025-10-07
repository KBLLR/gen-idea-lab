/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '@store';
import { templates } from '@apps/archiva/lib/templates.js';

const set = useStore.setState;

// --- Archiva Actions ---
export const setActiveEntryId = (entryId) => {
  set({ activeEntryId: entryId });
};

export const clearActiveEntryId = () => {
  set({ activeEntryId: null });
};

export const createArchivaEntry = (templateKey) => {
  const template = templates[templateKey];
  if (!template) {
    console.error(`Template ${templateKey} not found!`);
    return null;
  }

  const newEntryId = `entry_${Date.now()}`;
  const newEntry = {
    id: newEntryId,
    templateKey: templateKey,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    values: {},
  };

  // Initialize with empty values and a default title if a title field exists
  template.fields.forEach(field => {
    newEntry.values[field.field_key] = '';
  });
  if (template.fields.some(f => f.field_key === 'title')) {
    newEntry.values.title = `New ${template.name}`;
  }


  set(state => {
    state.archivaEntries[newEntryId] = newEntry;
  });

  return newEntryId;
};

export const createNewArchivaEntry = (templateKey) => {
  const newEntryId = createArchivaEntry(templateKey);
  if (newEntryId) {
    setActiveEntryId(newEntryId);
  }
};

export const updateArchivaEntry = (entryId, fieldKey, value) => {
  set(state => {
    if (state.archivaEntries[entryId]) {
      state.archivaEntries[entryId].values[fieldKey] = value;
      state.archivaEntries[entryId].updatedAt = new Date().toISOString();
    }
  });
};

export const updateArchivaEntryStatus = (entryId, status) => {
  set(state => {
    if (state.archivaEntries[entryId]) {
      state.archivaEntries[entryId].status = status;
      state.archivaEntries[entryId].updatedAt = new Date().toISOString();
    }
  });
};
