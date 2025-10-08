import React, { useEffect } from 'react';
import useStore from '@store';
import ModuleSelector from '@apps/ideaLab/components/ModuleSelector.jsx';
import ModuleAgentsChat from '@apps/chat/components/ModuleAgentsChat.jsx';
import MindMapPanel from './components/MindMapPanel.jsx';
import { useLeftPane, useRightPane } from '@shared/lib/layoutSlots';
import TabbedRightPane from '@shared/lib/TabbedRightPane.jsx';

/**
 * MindMap micro‑app
 *
 * This micro‑app allows users to explore module conversations as an
 * interactive mind map. It plugs into the existing module selector and
 * multi‑agent chat components provided by the genIdea‑lab project. The left
 * pane remains the familiar module selector; the right pane offers two tabs:
 * one for the live chat, and another that renders the current conversation
 * into a Markmap mind map. The root of the mind map reflects the active
 * module, while each message becomes a branch annotated with the sending
 * agent.
 */
export default function MindMapApp() {
  const setActiveApp = useStore.use.actions().setActiveApp;
  const { setLeftPane, clearLeftPane } = useLeftPane();
  const { setRightPane, clearRightPane } = useRightPane();

  useEffect(() => {
    // Register this app as the active one when mounted.
    setActiveApp('mindmap');

    // Provide the module selector in the left pane.
    setLeftPane(<ModuleSelector />);

    // Provide both chat and mindmap views in the right pane. The initial
    // tab is the mindmap to encourage users to explore the visualisation
    // immediately, but they can switch back to chat at any time.
    setRightPane(
      <TabbedRightPane
        initial="mindmap"
        tabs={[
          {
            id: 'mindmap',
            label: 'Mind Map',
            icon: '',
            title: 'Mind Map',
            render: () => <MindMapPanel />, // visualise conversation as a mind map
          },
          {
            id: 'chat',
            label: 'Chat',
            icon: '',
            title: 'Chat',
            render: () => <ModuleAgentsChat />, // reuse existing multi‑agent chat
          },
        ]}
      />,
    );

    // Clean up panes when the component unmounts.
    return () => {
      clearRightPane();
      clearLeftPane();
    };
  }, [setActiveApp, setLeftPane, clearLeftPane, setRightPane, clearRightPane]);

  // The main view renders nothing because all content is supplied via panes.
  return null;
}
