/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { parseMultiStepPrompt } from './utils.js';

export const workflows = {
  'subject-bg-blend': async ({ gen, model, base64, prompt }) => {
    const parts = parseMultiStepPrompt(prompt);
    if (!parts) {
      throw new Error('Invalid prompt for subject-bg-blend workflow. Missing Subject, Background, or Blend section.');
    }
    
    const subjectCut = await gen({ 
        model, 
        prompt: 'SEGMENT the person. Output a PNG with transparent background (alpha). Preserve fine hair detail with anti-aliased edges. No background, no text.', 
        inputFile: base64 
    });

    const styledSubject = await gen({ 
        model, 
        prompt: `STYLE the subject (keep alpha; do not add a background): ${parts.subject}. Keep identity, pose, silhouette. Avoid skin plasticity and heavy smoothing.`, 
        inputFile: subjectCut 
    });
    
    return await gen({ 
        model, 
        prompt: `COMPOSITE the input subject (with alpha) onto a new background: BACKGROUND: "${parts.background}". BLEND RULES: "${parts.blend}". Match perspective and light; add believable ground contact shadows and subtle rim light; return final PNG (no text).`, 
        inputFile: styledSubject 
    });
  },

  'grade-only': async ({ gen, model, base64, prompt }) => {
    return await gen({ 
        model, 
        prompt: `Color grade only, no geometry changes. ${prompt}`, 
        inputFile: base64 
    });
  },

  'overlay': async ({ gen, model, base64, prompt }) => {
    return await gen({ 
        model, 
        prompt: `Overlay only (non-destructive). ${prompt}`, 
        inputFile: base64 
    });
  }
};
