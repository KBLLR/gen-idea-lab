import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, userEvent, within } from '@storybook/test';
import { composeStories } from '@storybook/test';

import * as BoothHeaderStories from './BoothHeader.stories.jsx';

const { WithActions } = composeStories(BoothHeaderStories);

describe('BoothHeader', () => {
  it('renders and allows clicking Generate', async () => {
    render(<WithActions />);
    const canvas = within(document.body);
    const btn = await canvas.findByRole('button', { name: /generate/i });
    await userEvent.click(btn);
    expect(btn).toBeInTheDocument();
  });
});

