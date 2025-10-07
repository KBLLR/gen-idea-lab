import Panel from './Panel.jsx';

export default {
  title: 'UI/Panel',
  component: Panel
};

export const InputPanel = () => (
  <div style={{ width: 500 }}>
    <Panel variant="input" title="Input Image" info="Source">
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
        Drop an image here
      </div>
    </Panel>
  </div>
);

export const OutputPanel = () => (
  <div style={{ width: 500 }}>
    <Panel variant="output" title="Generated Result" info="Complete" footer={<button className="image-action-btn">Download</button>}>
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
        Rendered preview
      </div>
    </Panel>
  </div>
);

