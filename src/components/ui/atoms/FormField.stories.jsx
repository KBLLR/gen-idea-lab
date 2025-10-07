import FormField from './FormField.jsx';

export default {
  title: 'UI/FormField',
  component: FormField
};

export const TextInput = () => (
  <div style={{ width: 320 }}>
    <FormField label="Model (optional)" htmlFor="m">
      <input id="m" type="text" placeholder="gemini-2.5-flash-image-preview" className="provider-model-input" />
    </FormField>
  </div>
);

export const SelectInput = () => (
  <div style={{ width: 320 }}>
    <FormField label="Image Provider" htmlFor="p">
      <select id="p" className="provider-select">
        <option>Gemini (Google)</option>
        <option>OpenAI</option>
      </select>
    </FormField>
  </div>
);

