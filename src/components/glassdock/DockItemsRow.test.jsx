import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@storybook/test';
import { composeStories } from '@storybook/test';

import * as Stories from './DockItemsRow.stories.jsx';

const { Default } = composeStories(Stories);

describe('DockItemsRow', () => {
  it('shows listening voice item and allows remove action', async () => {
    render(<Default />);
    const canvas = within(document.body);
    // Title set to status "Listening"
    expect(await canvas.findByTitle('Listening')).toBeInTheDocument();
    // Remove button is present
    const removeBtns = await canvas.findAllByRole('button', { name: /remove/i });
    expect(removeBtns.length).toBeGreaterThan(0);
  });
});

