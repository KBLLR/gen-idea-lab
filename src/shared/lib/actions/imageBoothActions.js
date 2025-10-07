/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '@store';
import modes from '@apps/imageBooth/lib/modes.js';
import { workflowTemplates } from '@apps/workflows/lib/workflows.js';
import gen from '@shared/lib/llm.js';
import { DEFAULT_IMAGE_MODELS, getImageProviderLabel } from '@shared/lib/imageProviders.js';

const get = useStore.getState;
const set = useStore.setState;

// --- Image Booth Actions ---
export const selectMode = (modeKey) => {
  set({ activeModeKey: modeKey });
};

export const setInputImage = (base64) => {
  set({ inputImage: base64, outputImage: null, generationError: null });
};

export const generateImage = async () => {
  const { inputImage, activeModeKey, imageProvider, imageModel, connectedServices } = get();
  if (!inputImage || !activeModeKey) return;

  set({ isGenerating: true, outputImage: null, generationError: null });

  try {
    let modeDetails;
    for (const category of Object.values(modes)) {
      for (const subCategory of Object.values(category)) {
        if (subCategory[activeModeKey]) {
          modeDetails = subCategory[activeModeKey];
          break;
        }
      }
      if (modeDetails) break;
    }

    if (!modeDetails) throw new Error('Selected mode not found.');

    const { workflow, prompt } = modeDetails;
    const provider = imageProvider || 'gemini';
    const providerModel = imageModel || DEFAULT_IMAGE_MODELS[provider] || DEFAULT_IMAGE_MODELS.gemini;
    const providerConnected = provider === 'gemini' || connectedServices?.[provider]?.connected;

    if (!providerConnected) {
      throw new Error(`Connect the ${getImageProviderLabel(provider)} service before generating images.`);
    }

    let result;

    if (workflow && workflowTemplates[workflow]) {
      result = await workflowTemplates[workflow]({
        gen,
        model: providerModel,
        provider,
        base64: inputImage,
        prompt
      });
    } else {
      result = await gen({
        provider,
        model: providerModel,
        prompt,
        inputFile: inputImage,
      });
    }

    if (result) {
      set({ outputImage: result });
    } else {
      throw new Error('Image generation failed or was cancelled.');
    }
  } catch (error) {
    console.error("Image generation failed:", error);
    set({ generationError: error.message || 'An unknown error occurred during generation.' });
  } finally {
    set({ isGenerating: false });
  }
};
