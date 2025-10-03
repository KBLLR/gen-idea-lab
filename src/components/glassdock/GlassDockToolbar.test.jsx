import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, userEvent, within } from '@storybook/test';
import { composeStories } from '@storybook/test';

import * as Stories from './GlassDockToolbar.stories.jsx';

const { Default } = composeStories(Stories);

describe('GlassDockToolbar', () => {
  it('toggles aria-pressed on Live button', async () => {
    render(<Default />);
    const canvas = within(document.body);
    const liveBtn = await canvas.findByRole('button', { name: /open live voice panel/i });
    expect(liveBtn).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(liveBtn);
    // After clicking, the label changes and aria-pressed should be true
    const liveBtnAfter = await canvas.findByRole('button', { name: /close live voice panel/i });
    expect(liveBtnAfter).toHaveAttribute('aria-pressed', 'true');
  });
});

