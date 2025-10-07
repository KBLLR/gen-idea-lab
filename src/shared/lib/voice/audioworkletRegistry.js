/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A registry to map attached worklets by their audio-context
 * Any module using `audioContext.audioWorklet.addModule()` should register the worklet here
 *
 * Map structure:
 * AudioContext -> {
 *   workletName: {
 *     node?: AudioWorkletNode,
 *     handlers: Array<Function>
 *   }
 * }
 */
export const registeredWorklets = new Map();

/**
 * Create a worklet blob URL from source code
 * @param {string} workletName - Name of the worklet processor
 * @param {string} workletSrc - Worklet processor source code
 * @returns {string} Blob URL for the worklet module
 */
export const createWorketFromSrc = (workletName, workletSrc) => {
  const script = new Blob(
    [`registerProcessor("${workletName}", ${workletSrc})`],
    {
      type: 'application/javascript',
    }
  );

  return URL.createObjectURL(script);
};