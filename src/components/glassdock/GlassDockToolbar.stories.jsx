import React, { useState } from 'react';
import GlassDockToolbar from './GlassDockToolbar.jsx';

export default {
  title: 'GlassDock/Toolbar',
  component: GlassDockToolbar,
  tags: ['component', 'a11y'],
  parameters: {
    viewport: { defaultViewport: 'responsive' }
  }
};

const Template = (args) => {
  const [liveOpen, setLiveOpen] = useState(args.liveOpen ?? false);
  const [listening, setListening] = useState(args.listening ?? false);
  const [awarenessOn, setAwarenessOn] = useState(args.awarenessOn ?? false);
  const [subtitlesOn, setSubtitlesOn] = useState(args.subtitlesOn ?? false);
  return (
    <div style={{ padding: 16 }}>
      <GlassDockToolbar
        liveOpen={liveOpen}
        listening={listening}
        awarenessOn={awarenessOn}
        subtitlesOn={subtitlesOn}
        onToggleLive={() => setLiveOpen(v => !v)}
        onToggleListen={() => setListening(v => !v)}
        onToggleAwareness={() => setAwarenessOn(v => !v)}
        onToggleSubtitles={() => setSubtitlesOn(v => !v)}
        onOpenHelp={() => {}}
        onOpenSettings={() => {}}
      />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = { liveOpen: false, listening: false, awarenessOn: false, subtitlesOn: false };

export const AllOn = Template.bind({});
AllOn.args = { liveOpen: true, listening: true, awarenessOn: true, subtitlesOn: true };

