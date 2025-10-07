/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const IMAGE_PROVIDERS = [
  {
    id: 'gemini',
    label: 'Gemini (Google)',
    defaultModel: 'gemini-2.5-flash-image-preview',
    alwaysAvailable: true
  },
  {
    id: 'openai',
    label: 'OpenAI (gpt-image-1)',
    defaultModel: 'gpt-image-1',
    alwaysAvailable: false
  },
  {
    id: 'drawthings',
    label: 'DrawThings (Local)',
    defaultModel: null,
    alwaysAvailable: false
  }
];

export const DEFAULT_IMAGE_MODELS = IMAGE_PROVIDERS.reduce((acc, provider) => {
  acc[provider.id] = provider.defaultModel ?? null;
  return acc;
}, {});

export const ALWAYS_AVAILABLE_IMAGE_PROVIDERS = new Set(
  IMAGE_PROVIDERS.filter((provider) => provider.alwaysAvailable).map((provider) => provider.id)
);

export function getImageProviderLabel(providerId) {
  const provider = IMAGE_PROVIDERS.find((p) => p.id === providerId);
  return provider ? provider.label : providerId;
}

export function getDefaultImageModel(providerId) {
  return DEFAULT_IMAGE_MODELS[providerId] ?? null;
}
