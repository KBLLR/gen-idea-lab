/**
 * @file archivaActions - Document archive creation and management
 * @license SPDX-License-Identifier: Apache-2.0
 */
import useStore from '@store';
import { handleAsyncError } from '@shared/lib/errorHandler.js';
import { templates } from '@apps/archiva/lib/templates.js';

const set = useStore.setState;

/**
 * Entry status
 * @typedef {'draft'|'published'|'archived'} EntryStatus
 */

/**
 * Set the currently active entry ID
 * @param {string|null} entryId - Entry ID to activate
 * @returns {void}
 */
export const setActiveEntryId = (entryId) => {
  set({ activeEntryId: entryId });
};

/**
 * Clear the active entry selection
 * @returns {void}
 */
export const clearActiveEntryId = () => {
  set({ activeEntryId: null });
};

/**
 * Create a new Archiva entry from a template
 * @param {string} templateKey - Template identifier
 * @returns {string|null} Created entry ID, or null if template not found
 */
export const createArchivaEntry = (templateKey) => {
  const template = templates[templateKey];
  if (!template) {
    handleAsyncError(new Error(`Template ${templateKey} not found`), {
      context: 'Creating Archiva entry',
      showToast: true,
      fallbackMessage: `Template "${templateKey}" not found. Please select a valid template.`
    });
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

/**
 * Create and immediately activate a new Archiva entry
 * @param {string} templateKey - Template identifier
 * @returns {void}
 */
export const createNewArchivaEntry = (templateKey) => {
  const newEntryId = createArchivaEntry(templateKey);
  if (newEntryId) {
    setActiveEntryId(newEntryId);
  }
};

/**
 * Update a field value in an Archiva entry
 * @param {string} entryId - Entry ID to update
 * @param {string} fieldKey - Field key to update
 * @param {any} value - New value for the field
 * @returns {void}
 */
export const updateArchivaEntry = (entryId, fieldKey, value) => {
  set(state => {
    if (state.archivaEntries[entryId]) {
      state.archivaEntries[entryId].values[fieldKey] = value;
      state.archivaEntries[entryId].updatedAt = new Date().toISOString();
    }
  });
};

/**
 * Update the status of an Archiva entry
 * @param {string} entryId - Entry ID to update
 * @param {EntryStatus} status - New status value
 * @returns {void}
 */
export const updateArchivaEntryStatus = (entryId, status) => {
  set(state => {
    if (state.archivaEntries[entryId]) {
      state.archivaEntries[entryId].status = status;
      state.archivaEntries[entryId].updatedAt = new Date().toISOString();
    }
  });
};
