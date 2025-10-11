/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Panel } from '@ui';
import SidebarItemCard from '@components/ui/molecules/SidebarItemCard.jsx';
import SidebarToggleItemCard from '@components/ui/molecules/SidebarToggleItemCard.jsx';
import SidebarTooltip from '@components/ui/atoms/SidebarTooltip.jsx';
import { useState } from 'react';
import useStore from '@store';

export default function GestureLabSidebar() {
    const examples = [
        { title: 'Whiteboard', desc: 'Draw and sketch freely', icon: 'draw' },
        { title: '3D Navigation', desc: 'Control 3D scenes', icon: 'open_with' },
        { title: 'UI Control', desc: 'Gesture-based interactions', icon: 'touch_app' }
    ];

    const gestureExamples = useStore.use.gestureLab().examples;
    const actions = useStore.use.actions();
    const setGestureLabExample = actions.setGestureLabExample;
    const setGestureLabMode = actions.setGestureLabMode;

    // Tooltip state for example descriptions
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
    const showTip = (e, content) => {
        setTooltip({ visible: true, x: e.clientX + 12, y: e.clientY, content });
    };
    const moveTip = (e) => {
        if (!tooltip.visible) return;
        setTooltip(t => ({ ...t, x: e.clientX + 12, y: e.clientY }));
    };
    const hideTip = () => setTooltip(t => ({ ...t, visible: false }));

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            height: '100%',
            overflow: 'auto'
        }}>
            {/* About */}
            <Panel title="About GestureLab">
                <div style={{ padding: '1rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    <p style={{ margin: 0, opacity: 0.9 }}>
                        Experiment with hand tracking and gesture-based UI interactions using MediaPipe.
                    </p>
                    <div style={{ marginTop: '0.75rem' }}>
                        <strong style={{ fontSize: '0.85rem' }}>Examples</strong>
                        <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
                            {examples.map(ex => (
                                <li key={ex.title} style={{ marginBottom: 6 }}>
                                    <span style={{ fontWeight: 600 }}>{ex.title}:</span> {ex.desc}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Panel>

            {/* (Removed) Supported Gestures panel — gestures now controlled from the header */}

            {/* Examples (toggle rows in EmpathyLab style) */}
            <Panel title="Examples">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '0.75rem'
                }}>
                    {examples.map(example => (
                        <div
                          key={example.title}
                          onMouseEnter={(e) => showTip(e, example.desc)}
                          onMouseMove={moveTip}
                          onMouseLeave={hideTip}
                          style={{ width: '100%' }}
                        >
                          <SidebarToggleItemCard
                              icon={example.icon}
                              label={example.title}
                              description={null}
                              checked={!!gestureExamples[example.title]}
                              onChange={(next) => {
                                // Single-select semantics: enabling one disables others and switches mode.
                                const title = example.title;
                                const toMode = title === 'Whiteboard' ? 'whiteboard' : title === '3D Navigation' ? '3d' : 'ui';
                                if (next) {
                                  // Enable selected example and disable the rest
                                  setGestureLabExample('Whiteboard', title === 'Whiteboard');
                                  setGestureLabExample('3D Navigation', title === '3D Navigation');
                                  setGestureLabExample('UI Control', title === 'UI Control');
                                  setGestureLabMode(toMode);
                                } else {
                                  // If disabling current, fall back to Whiteboard
                                  setGestureLabExample('Whiteboard', true);
                                  setGestureLabExample('3D Navigation', false);
                                  setGestureLabExample('UI Control', false);
                                  setGestureLabMode('whiteboard');
                                }
                              }}
                              title={example.desc}
                          />
                        </div>
                    ))}
                    <SidebarTooltip visible={tooltip.visible} x={tooltip.x} y={tooltip.y} placement="right" content={tooltip.content} />
                </div>
            </Panel>
        </div>
    );
}
