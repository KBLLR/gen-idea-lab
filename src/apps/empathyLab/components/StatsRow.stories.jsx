/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import StatsRow from './StatsRow.jsx';

export default {
  title: 'Empathy/StatsRow',
  component: StatsRow,
};

export const Example = () => (
  <div style={{ padding: 16 }}>
    <StatsRow
      results={{
        face: Array(1),
        body: Array(0),
        hand: Array(2),
        gesture: Array(1),
      }}
      sessionDuration={125000}
      dataPointsCount={342}
      fps={28}
      tensors={123}
    />
  </div>
);

export const GlassyCards = () => (
  <div style={{ padding: 16 }}>
    <StatsRow
      variant="glass"
      results={{
        face: Array(2),
        body: Array(1),
        hand: Array(1),
        gesture: Array(2),
      }}
      sessionDuration={305000}
      dataPointsCount={912}
      fps={32}
      tensors={187}
    />
  </div>
);
