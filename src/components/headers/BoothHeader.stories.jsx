import BoothHeader from './BoothHeader.jsx';

export default {
  title: 'Layout/BoothHeader',
  component: BoothHeader,
  tags: ['autodocs'],
  args: {
    icon: 'description',
    title: 'Code Notebook',
    typeText: 'Reflective Template',
    status: 'ready',
    description: 'Save useful code with context',
    align: 'top'
  }
};

export const Default = (args) => (
  <div style={{ width: '100%', maxWidth: 1200 }}>
    <BoothHeader {...args}>
      <div className="prompt-info">
        <h4>Template Applications</h4>
        <ul>
          <li>Structured documentation</li>
          <li>Searchable knowledge base</li>
        </ul>
      </div>
    </BoothHeader>
  </div>
);

export const WithActions = (args) => (
  <div style={{ width: '100%', maxWidth: 1200 }}>
    <BoothHeader
      {...args}
      actions={(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="secondary"><span className="icon">science</span> Sample Data</button>
          <button className="booth-generate-btn primary"><span className="icon">auto_awesome</span> Generate</button>
          <button className="secondary"><span className="icon">save</span> Save</button>
        </div>
      )}
    >
      <div className="prompt-info">
        <h4>Template Applications</h4>
        <ul>
          <li>Document reasoning and code</li>
          <li>Share learning artifacts</li>
        </ul>
      </div>
    </BoothHeader>
  </div>
);

