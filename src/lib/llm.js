/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Modality} from '@google/genai'
import pLimit from 'p-limit'
import { GENBOOTH_PRIMER } from './primer'

const limit = pLimit(2)
const wrapLimit = (fn) => (...args) => limit(() => fn(...args))

const timeoutMs = 123_333
const maxRetries = 5
const baseDelay = 1_233
// The GoogleGenAI object is no longer initialized on the client.

export default wrapLimit(
  async ({model, prompt, inputFile, signal}) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Use AbortController for fetch timeouts
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);

        const genConfig = {}
        if (model === 'gemini-2.5-flash-image-preview') {
          genConfig.responseModalities = [Modality.IMAGE, Modality.TEXT]
        }

        const fullPrompt = `${GENBOOTH_PRIMER}\n\n${prompt}`
        
        const requestBody = {
          model,
          config: genConfig,
          contents: {
            parts: [
              ...(inputFile
                ? [
                    {
                      inlineData: {
                        data: inputFile.split(',')[1],
                        mimeType: 'image/jpeg'
                      }
                    }
                  ]
                : []),
              {text: fullPrompt}
            ]
          },
          safetySettings
        };

        const fetchPromise = fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: signal || controller.signal,
        });

        const fetchResponse = await fetchPromise;
        clearTimeout(timeoutId); // Clear timeout if fetch completes

        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json();
          const error = new Error(errorData.error || `HTTP error! status: ${fetchResponse.status}`);
          if (fetchResponse.status === 429) { // Emulate API error for retry logic
              error.status = 'RESOURCE_EXHAUSTED';
          }
          throw error;
        }

        const response = await fetchResponse.json();

        // The API can return a response without `candidates` if the prompt is blocked.
        if (!response.candidates || response.candidates.length === 0) {
          if (response.promptFeedback?.blockReason) {
            throw new Error(
              `Request blocked by API. Reason: ${response.promptFeedback.blockReason}`
            )
          }
          throw new Error('API returned no candidates.')
        }

        const candidate = response.candidates[0]

        // Check if the candidate has content before trying to access it.
        // This can happen if the model's response is empty for other reasons (e.g. safety).
        if (!candidate.content) {
          if (candidate.finishReason) {
            throw new Error(
              `Image generation failed. Reason: ${candidate.finishReason}`
            )
          }
          throw new Error('API returned a candidate with no content.')
        }

        // Check if the generation finished but was flagged for safety.
        if (
          candidate.finishReason &&
          ['SAFETY', 'RECITATION'].includes(candidate.finishReason)
        ) {
          throw new Error(
            `Image generation failed due to safety policy: ${candidate.finishReason}`
          )
        }

        const inlineDataPart = candidate.content.parts.find(
          p => p.inlineData
        )

        // If no image is found, check for a text explanation from the model.
        if (!inlineDataPart) {
          const textPart = candidate.content.parts.find(p => p.text)
          if (textPart) {
            throw new Error(
              `Model returned a text response instead of an image: "${textPart.text}"`
            )
          }
          throw new Error('No inline data found in response') // Keep as a final fallback.
        }

        return 'data:image/png;base64,' + inlineDataPart.inlineData.data
      } catch (error) {
        if (signal?.aborted || error.name === 'AbortError') {
          return
        }

        if (attempt === maxRetries - 1) {
          throw error
        }

        // Use a more aggressive backoff for rate limit errors
        let delay = baseDelay * 2 ** attempt
        if (error.status === 'RESOURCE_EXHAUSTED') {
          console.warn(
            `Rate limit error detected. Increasing retry delay.`
          )
          delay += 10000 // Add a 10-second penalty
        }

        await new Promise(res => setTimeout(res, delay))
        console.warn(
          `Attempt ${attempt + 1} failed, retrying after ${delay}ms...`
        )
      }
    }
  }
)

const safetySettings = [
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
  'HARM_CATEGORY_HARASSMENT'
].map(category => ({category, threshold: 'BLOCK_NONE'}))