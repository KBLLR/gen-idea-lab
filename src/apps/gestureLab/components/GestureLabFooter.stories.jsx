/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import Panel from '../ui/organisms/Panel.jsx';
import { ActionBar } from '@ui';

export default {
  title: 'GestureLab/FooterControls',
};

export const PaletteAndActions = () => {
  const [brushColor, setBrushColor] = useState('#00FFFF');
  const [brushSize, setBrushSize] = useState(4);
  const [eraserSize, setEraserSize] = useState(12);
  const [mode, setMode] = useState('brush'); // 'brush' | 'eraser'

  return (
    <div style={{ maxWidth: 960 }}>
      <Panel
        title="Drawing Canvas"
        className="panel--fill"
        footer={(
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Colors</span>
            {['#FFFFFF','#000000','#00FFFF','#1e88e5','#66bb6a','#ffd54f','#ff5252','#9c27b0'].map(c => (
              <button
                key={c}
                onClick={() => { setMode('brush'); setBrushColor(c); }}
                title={c}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: c,
                  border: brushColor === c && mode === 'brush' ? '2px solid var(--text-accent)' : '1px solid var(--border-secondary)'
                }}
              />
            ))}
            <div style={{ width: 16 }} />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Brush</span>
            {[2,4,6,10,16,24].map(s => (
              <button
                key={s}
                onClick={() => { setMode('brush'); setBrushSize(s); }}
                title={`Size ${s}`}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  border: brushSize === s && mode === 'brush' ? '2px solid var(--text-accent)' : '1px solid var(--border-secondary)'
                }}
              >
                <span style={{ display: 'block', width: Math.max(4, Math.min(20, s)), height: Math.max(4, Math.min(20, s)), borderRadius: '50%', background: 'var(--text-primary)' }} />
              </button>
            ))}
            <div style={{ width: 16 }} />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Eraser</span>
            {[8,12,20].map(s => (
              <button
                key={`eraser-${s}`}
                onClick={() => { setMode('eraser'); setEraserSize(s); }}
                title={`Eraser ${s}`}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  border: eraserSize === s && mode === 'eraser' ? '2px solid var(--text-accent)' : '1px solid var(--border-secondary)'
                }}
              >
                <span className="icon" style={{ fontSize: 16, color: 'var(--text-primary)' }}>ink_eraser</span>
              </button>
            ))}

            <div style={{ marginLeft: 'auto' }}>
<ActionBar
                size="md"
                variant="icon"
                items={[
                  { key: 'save', title: 'Save', icon: 'save', onClick: () => alert('Save (demo)') },
                  { key: 'upload', title: 'Upload Background', icon: 'upload', onClick: () => alert('Upload (demo)') },
                  { key: 'gallery', title: 'Gallery', icon: 'photo_library', onClick: () => alert('Gallery (demo)') },
                ]}
              />
            </div>
          </div>
        )}
      >
        <div style={{ height: 320, background: 'var(--bg-panel)', borderRadius: 8 }} />
      </Panel>
    </div>
  );
};

