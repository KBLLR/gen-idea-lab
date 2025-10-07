/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { StatCard } from '@ui';

export default function StatsRow({ results, sessionDuration, dataPointsCount, fps, tensors, variant = 'solid', className = '' }) {
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const stats = [
    { icon: 'timer', value: formatDuration(sessionDuration), label: 'Duration' },
    { icon: 'speed', value: `${fps}`, label: 'FPS' },
    { icon: 'memory', value: tensors, label: 'Tensors' },
    { icon: 'face', value: results?.face?.length || 0, label: 'Faces' },
    { icon: 'accessibility', value: results?.body?.length || 0, label: 'Bodies' },
    { icon: 'back_hand', value: results?.hand?.length || 0, label: 'Hands' },
    { icon: 'gesture', value: results?.gesture?.length || 0, label: 'Gestures' },
    { icon: 'data_usage', value: dataPointsCount, label: 'Points' }
  ];

  return (
    <div className={`stats-row ${className}`}>
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          value={stat.value}
          label={stat.label}
          variant={variant}
        />
      ))}
    </div>
  );
}
