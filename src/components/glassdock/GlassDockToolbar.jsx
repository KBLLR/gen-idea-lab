/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { ActionBar } from '@ui';

export default function GlassDockToolbar({
  liveOpen,
  listening,
  awarenessOn,
  subtitlesOn,
  onToggleLive,
  onToggleListen,
  onToggleAwareness,
  onToggleSubtitles,
  onOpenHelp,
  onOpenSettings,
  onMinimize
}) {
  const items = [
    {
      key: 'live',
      icon: 'psychology',
      title: 'Open Live Voice Chat',
      onClick: onToggleLive,
      ariaPressed: false
    },
    {
      key: 'mic',
      icon: 'mic',
      title: listening ? 'Stop voice commands' : 'Start voice commands',
      onClick: onToggleListen,
      ariaPressed: !!listening,
      className: listening ? 'dock-btn-active dock-btn-listening' : ''
    },
    {
      key: 'awareness',
      icon: 'visibility',
      title: awarenessOn ? 'Disable screen awareness' : 'Enable screen awareness',
      onClick: onToggleAwareness,
      ariaPressed: !!awarenessOn,
      className: awarenessOn ? 'dock-btn-active dock-btn-aware' : ''
    },
    {
      key: 'subtitles',
      icon: subtitlesOn ? 'closed_caption_disabled' : 'closed_caption',
      title: subtitlesOn ? 'Hide subtitles' : 'Show subtitles',
      onClick: onToggleSubtitles,
      ariaPressed: !!subtitlesOn
    },
    { key: 'help', icon: 'help', title: 'Show capabilities', onClick: onOpenHelp },
    { key: 'settings', icon: 'settings', title: 'Settings', onClick: onOpenSettings },
    { key: 'minimize', icon: 'remove', title: 'Minimize dock', onClick: onMinimize }
  ];

return (
    <ActionBar size="lg" variant="icon" separators items={items.map(it => ({ id: String(it.key), label: it.title, icon: it.icon, tooltip: it.title, onClick: it.onClick, disabled: it.disabled, className: it.className }))} aria-label="Dock actions" />
  );
}
