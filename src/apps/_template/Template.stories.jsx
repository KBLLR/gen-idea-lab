import React from 'react';
import TemplateCenter from './components/_Template.jsx';
import TemplateSidebar from './components/_TemplateSidebar.jsx';

export default { title: 'Apps/_Template', parameters: { layout: 'fullscreen' } };

export const Preview = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: '70vh' }}>
    <div style={{ padding: 12, borderRight: '1px solid #333' }}>
      <TemplateSidebar />
    </div>
    <div>
      <TemplateCenter />
    </div>
  </div>
);