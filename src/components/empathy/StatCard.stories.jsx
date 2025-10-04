/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import StatCard from './StatCard.jsx';

export default {
  title: 'Empathy/StatCard',
  component: StatCard,
};

export const Solid = () => (
  <div style={{ maxWidth: 320 }}>
    <StatCard icon="speed" value={"30 FPS"} label="Performance" />
  </div>
);

export const Glass = () => (
  <div style={{ maxWidth: 320 }}>
    <StatCard icon="memory" value={123} label="Tensors" variant="glass" />
  </div>
);

export const Grid = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
    <StatCard icon="timer" value="02:05" label="Duration" variant="glass" />
    <StatCard icon="face" value={1} label="Faces" variant="glass" />
    <StatCard icon="gesture" value={2} label="Gestures" variant="glass" />
  </div>
);

