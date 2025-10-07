import React from 'react';
import Panel from './ui/Panel.jsx';

export default {
  title: 'Layout/BoothPanels',
  tags: ['docs'],
  parameters: {
    viewport: { defaultViewport: 'responsive' }
  }
};

export const ArchivaMarkdownAndHtml = () => (
  <div style={{ display: 'flex', gap: 40, maxWidth: 1200 }}>
    <Panel variant="input" title={<><span className="icon">code</span> Markdown</>} info="Source Format">
      <div className="template-canvas">
        <div className="preview-content markdown-preview">
          <pre className="markdown-raw">{`# Hello\n\nThis is **markdown**.`}</pre>
        </div>
      </div>
    </Panel>
    <Panel variant="output" title={<><span className="icon">web</span> HTML Preview</>} info="Rendered Output">
      <div className="template-canvas">
        <div className="preview-content html-preview" dangerouslySetInnerHTML={{ __html: '<h1>Hello</h1><p>This is <strong>markdown</strong>.</p>' }} />
      </div>
    </Panel>
  </div>
);

export const VizGenInputAndOutput = () => (
  <div style={{ display: 'flex', gap: 40, maxWidth: 1200 }}>
    <Panel variant="input" title="Input Image" info="Source">
      <div className="image-content">
        <img alt="input" src="https://via.placeholder.com/480x320.png?text=Input" />
      </div>
    </Panel>
    <Panel variant="output" title="Generated Result" info="Complete">
      <div className="image-content">
        <img alt="output" src="https://via.placeholder.com/480x320.png?text=Output" />
      </div>
    </Panel>
  </div>
);

