import React from 'react';
import BoothHeader from '@components/ui/organisms/BoothHeader.jsx';
import { ActionBar } from '@ui';
import { useNavigate } from 'react-router-dom';
import { getAppPath } from '@routes';
import useStore from '@store';

const ChatHeader = ({ showGallery, onToggleGallery }) => {
  const navigate = useNavigate();
  const setActiveApp = useStore.use.actions().setActiveApp;
  const activeModuleId = useStore.use.activeModuleId();

  const goMindmap = () => {
    const state = useStore.getState();
    const modules = state.modules || {};
    const moduleTitle = activeModuleId ? (modules[activeModuleId]?.['Module Title'] || activeModuleId) : 'Multi-Agent Chat';
    const history = (state.assistantHistories && activeModuleId) ? (state.assistantHistories[activeModuleId] || []) : [];

    // Build a comprehensive multi-agent mindmap
    let md = `# ${moduleTitle}\n\n`;

    // Group messages by agent
    const agentMessages = {};
    for (const m of history) {
      if (!m?.content) continue;
      const agentName = m.fromAgentName || m.role || 'Orchestrator';
      if (!agentMessages[agentName]) agentMessages[agentName] = [];
      agentMessages[agentName].push(m.content);
    }

    // Create branching structure
    Object.entries(agentMessages).forEach(([agent, messages]) => {
      md += `## ${agent}\n\n`;
      messages.forEach((msg, i) => {
        const text = String(msg).replace(/\n+/g, ' ').trim().substring(0, 100);
        md += `- Message ${i + 1}: ${text}...\n`;
      });
      md += '\n';
    });

    setActiveApp('mindmap');
    navigate(getAppPath('mindmap'), { state: { markdown: md } });
  };

  const handleNewChat = () => {
    // TODO: Implement new chat logic (clear history, reset module)
    console.log('New chat clicked');
  };

  const handleExportChat = () => {
    // TODO: Export chat as JSON/Markdown
    console.log('Export chat clicked');
  };

  return (
    <BoothHeader
      icon="chat"
      title="Multi-Agent Chat"
      typeText="AI Collaboration Hub"
      status="ready"
      description="Collaborate with specialized AI assistants. Drag avatars to invite them into the conversation."
      align="top"
      actions={
        <ActionBar
          separators
          items={[
            { id: 'new', icon: 'add', label: 'New Chat', onClick: handleNewChat },
            { id: 'mindmap', icon: 'account_tree', label: 'Generate Mind Map', onClick: goMindmap },
            { id: 'export', icon: 'download', label: 'Export Chat', onClick: handleExportChat },
            { id: 'gallery', icon: 'collections', label: showGallery ? 'Hide Gallery' : 'Show Gallery', onClick: onToggleGallery },
          ]}
          aria-label="Chat actions"
        />
      }
    />
  );
};

export default ChatHeader;
