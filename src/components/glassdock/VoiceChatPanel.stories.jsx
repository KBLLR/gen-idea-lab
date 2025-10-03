import React, { useRef } from 'react';
import VoiceChatPanel from './VoiceChatPanel.jsx';

export default {
  title: 'GlassDock/VoiceChatPanel',
  component: VoiceChatPanel,
  tags: ['component', 'a11y'],
  parameters: {
    viewport: { defaultViewport: 'responsive' }
  }
};

const baseMessages = [
  { id: 'm1', role: 'system', content: 'Connected to Live Voice.' },
  { id: 'm2', role: 'user', content: 'Hello there!' },
  { id: 'm3', role: 'assistant', content: 'Hi! How can I help?' }
];

export const Disconnected = () => {
  const endRef = useRef(null);
  return (
    <VoiceChatPanel
      connected={false}
      recording={false}
      screenAware={false}
      selectedVoice="Studio (warm)"
      messages={[]}
      width={360}
      height={420}
      endRef={endRef}
      onClose={() => {}}
      onResizeStart={() => {}}
    />
  );
};

export const ConnectedListening = () => {
  const endRef = useRef(null);
  return (
    <VoiceChatPanel
      connected
      recording
      screenAware
      selectedVoice="Studio (warm)"
      messages={baseMessages}
      inputTranscript="I want to generate a logo."
      outputTranscript="Sure, what style are you going for?"
      width={360}
      height={420}
      endRef={endRef}
      onClose={() => {}}
      onResizeStart={() => {}}
    />
  );
};

