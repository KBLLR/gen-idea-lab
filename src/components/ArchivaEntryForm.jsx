/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../lib/store';
import { templates } from '../lib/archiva/templates';
import { updateArchivaEntry, updateArchivaEntryStatus, clearActiveEntryId } from '../lib/actions';

const Field = ({ field, value, onChange }) => {
    const { field_key, label, field_type } = field;

    const renderInput = () => {
        switch (field_type) {
            case 'date':
                return <input type="date" value={value} onChange={onChange} />;
            case 'string':
                return <input type="text" value={value} onChange={onChange} />;
            case 'markdown':
            case 'multiline':
                return <textarea value={value} onChange={onChange} />;
            case 'code':
                return <textarea className="code" value={value} onChange={onChange} />;
            default:
                return <input type="text" value={value} onChange={onChange} />;
        }
    };

    return (
        <div className="form-field">
            <label htmlFor={field_key}>{label}</label>
            {renderInput()}
        </div>
    );
};

export default function ArchivaEntryForm() {
    const activeEntryId = useStore.use.activeEntryId();
    const entry = useStore(s => s.archivaEntries[activeEntryId]);

    if (!entry) {
        return <div>Error: Entry not found.</div>;
    }

    const template = templates[entry.templateKey];

    const handleFieldChange = (fieldKey, value) => {
        updateArchivaEntry(activeEntryId, fieldKey, value);
    };

    return (
        <div className="archiva-entry-form">
            <div className="archiva-form-header">
                <div className="archiva-form-header-title">
                    <h2>{entry.values.title || template.name}</h2>
                    <p>Status: <span className={`status-${entry.status}`}>{entry.status}</span></p>
                </div>
                 <div className="archiva-form-actions">
                    <button className="back-btn" onClick={clearActiveEntryId}>
                        <span className="icon">close</span> Close
                    </button>
                    <button className="secondary" onClick={() => updateArchivaEntryStatus(activeEntryId, 'draft')}>
                        Save as Draft
                    </button>
                    <button className="primary" onClick={() => updateArchivaEntryStatus(activeEntryId, 'published')}>
                        Publish
                    </button>
                </div>
            </div>
            <div className="archiva-form-content">
                {template.fields.map(field => (
                    <Field
                        key={field.field_key}
                        field={field}
                        value={entry.values[field.field_key]}
                        onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                    />
                ))}
            </div>
        </div>
    );
}