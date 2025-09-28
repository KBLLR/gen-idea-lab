/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const parseMultiStepPrompt = (prompt) => {
  if (typeof prompt !== 'string') return null;

  const subjectMatch = prompt.match(/Subject:(.*?)(?=Background:|$)/s);
  const backgroundMatch = prompt.match(/Background:(.*?)(?=Blend:|$)/s);
  const blendMatch = prompt.match(/Blend:(.*)/s);

  if (subjectMatch && backgroundMatch && blendMatch) {
      return {
          subject: subjectMatch[1].trim(),
          background: backgroundMatch[1].trim(),
          blend: blendMatch[1].trim(),
      };
  }
  return null;
};
