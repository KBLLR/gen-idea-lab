/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import GestureLabSidebar from './GestureLabSidebar.jsx';

export default {
  title: 'GestureLab/Sidebar',
  component: GestureLabSidebar,
};

export const Default = () => (
  <div style={{ width: 320, padding: 12, background: 'var(--bg-panel)' }}>
    <GestureLabSidebar />
  </div>
);

