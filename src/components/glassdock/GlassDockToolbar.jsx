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
  onOpenSettings
}) {
  const items = [
    {
      key: 'live',
      icon: liveOpen ? 'close_fullscreen' : 'record_voice_over',
      title: liveOpen ? 'Close Live Voice panel' : 'Open Live Voice panel',
      onClick: onToggleLive,
      ariaPressed: !!liveOpen
    },
    {
      key: 'mic',
      icon: listening ? 'mic_off' : 'mic',
      title: listening ? 'Stop listening' : 'Start listening',
      onClick: onToggleListen,
      ariaPressed: !!listening
    },
    {
      key: 'awareness',
      icon: awarenessOn ? 'visibility_off' : 'visibility',
      title: awarenessOn ? 'Disable screen awareness' : 'Enable screen awareness',
      onClick: onToggleAwareness,
      ariaPressed: !!awarenessOn
    },
    {
      key: 'subtitles',
      icon: subtitlesOn ? 'closed_caption_off' : 'closed_caption',
      title: subtitlesOn ? 'Hide subtitles' : 'Show subtitles',
      onClick: onToggleSubtitles,
      ariaPressed: !!subtitlesOn
    },
    { key: 'help', icon: 'help', title: 'Show capabilities', onClick: onOpenHelp },
    { key: 'settings', icon: 'settings', title: 'Settings', onClick: onOpenSettings }
  ];

  return (
    <ActionBar size="lg" variant="icon" items={items.map(it => ({ id: String(it.key), label: it.title, icon: it.icon, tooltip: it.title, onClick: it.onClick, disabled: it.disabled }))} aria-label="Dock actions" />
  );
}
