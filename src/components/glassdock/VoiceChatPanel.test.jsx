import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@storybook/test';
import { composeStories } from '@storybook/test';

import * as Stories from './VoiceChatPanel.stories.jsx';

const { ConnectedListening } = composeStories(Stories);

describe('VoiceChatPanel', () => {
  it('renders transcripts and listening state', async () => {
    render(<ConnectedListening />);
    const canvas = within(document.body);
    expect(await canvas.findByText(/Listening\.{3}|Listening/i)).toBeInTheDocument();
    expect(await canvas.findByText('I want to generate a logo.')).toBeInTheDocument();
    expect(await canvas.findByText('Sure, what style are you going for?')).toBeInTheDocument();
  });
});

