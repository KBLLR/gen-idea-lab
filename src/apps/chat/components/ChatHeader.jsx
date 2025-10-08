import React from 'react';
import BoothHeader from '@components/ui/organisms/BoothHeader.jsx';
import { Button } from '@ui';
import { useNavigate } from 'react-router-dom';
import { getAppPath } from '@routes';
import useStore from '@store';

const ChatHeader = () => {
  const navigate = useNavigate();
  const setActiveApp = useStore.use.actions().setActiveApp;

  const goMindmap = () => {
    const state = useStore.getState();
    const activeModuleId = state.activeModuleId;
    const modules = state.modules || {};
    const moduleTitle = activeModuleId ? (modules[activeModuleId]?.['Module Title'] || activeModuleId) : 'Mind Map';
    const history = (state.assistantHistories && activeModuleId) ? (state.assistantHistories[activeModuleId] || []) : [];

    // Build a lightweight outline of the current chat
    let md = `# ${moduleTitle}\n`;
    for (const m of history) {
      if (!m?.content) continue;
      const fromName = m.fromAgentName || m.role || 'Agent';
      const text = String(m.content).replace(/\n+/g, ' ').trim();
      md += `- **${fromName}**: ${text}\n`;
    }

    setActiveApp('mindmap');
    navigate(getAppPath('mindmap'), { state: { markdown: md } });
  };

  return (
    <BoothHeader
      icon="chat"
      title="Chat"
      typeText="Multi-agent chat"
      status="ready"
      description="Chat with module assistants, orchestrator, and other agents."
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={goMindmap} aria-label="Generate mind map">Mind Map</Button>
          <Button>New Chat</Button>
        </div>
      }
    />
  );
};

export default ChatHeader;
