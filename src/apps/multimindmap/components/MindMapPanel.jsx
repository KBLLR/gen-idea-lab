import React, { useMemo } from 'react';
import useStore from '@store';
import MarkmapViewer from './MarkmapViewer.jsx';
import { personalities } from '@apps/ideaLab/lib/assistant/personalities.js';
import { useLocation } from 'react-router-dom';

/**
 * MindMapPanel builds a Markdown representation of the active module's
 * conversation and passes it to the MarkmapViewer for rendering. The root
 * node uses the module's title or personality name, and each message is
 * transformed into a bullet containing the sender and their message. This
 * simple conversion yields a hierarchical outline that Markmap turns into
 * an interactive mind map.
 */
const MindMapPanel = () => {
  const location = useLocation();
  const activeModuleId = useStore.use.activeModuleId();
  const assistantHistories = useStore.use.assistantHistories();
  const modules = useStore.use.modules();

  // Determine the root title from the module title or personality.
  const rootTitle = useMemo(() => {
    if (!activeModuleId) return 'Mind Map';
    const moduleMeta = modules?.[activeModuleId];
    const personality = personalities?.[activeModuleId];
    return (
      moduleMeta?.['Module Title'] ||
      personality?.name ||
      activeModuleId
    );
  }, [activeModuleId, modules]);

  // Flatten the conversation history for the active module.
  const history = useMemo(() => {
    if (!activeModuleId) return [];
    return assistantHistories?.[activeModuleId] || [];
  }, [assistantHistories, activeModuleId]);

  // If seeded markdown is provided via route state, use it; otherwise compute from history.
  const content = useMemo(() => {
    const seeded = location?.state && typeof location.state.markdown === 'string' ? location.state.markdown : null;
    if (seeded && seeded.trim().length > 0) return seeded;
    let md = `# ${rootTitle}\n`;
    for (const message of history) {
      if (!message?.content) continue;
      const fromName = message.fromAgentName || message.role || 'Agent';
      const sanitized = String(message.content).replace(/\n+/g, ' ').trim();
      md += `- **${fromName}**: ${sanitized}\n`;
    }
    return md;
  }, [location?.state, rootTitle, history]);

  return <MarkmapViewer content={content} />;
};

export default MindMapPanel;
