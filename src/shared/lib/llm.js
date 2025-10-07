/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import pLimit from 'p-limit'
import { GENBOOTH_PRIMER } from './primer'
import { DEFAULT_IMAGE_MODELS } from './imageProviders.js'

const limit = pLimit(2)
const wrapLimit = (fn) => (...args) => limit(() => fn(...args))

const timeoutMs = 123_333
const maxRetries = 3
const baseDelay = 1_000

const friendlyQuotaMessages = {
  gemini: 'Gemini image generation has reached its quota. Please try again soon or switch providers.',
  openai: 'OpenAI image generation is currently rate limited. Try again later or choose a different provider.',
  drawthings: 'The DrawThings endpoint is busy. Give it a moment and retry or try another provider.'
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default wrapLimit(async ({ provider = 'gemini', model, prompt, inputFile, signal }) => {
  const selectedModel = model || DEFAULT_IMAGE_MODELS[provider] || DEFAULT_IMAGE_MODELS.gemini
  const requestPayload = {
    provider,
    model: selectedModel,
    prompt: `${GENBOOTH_PRIMER}\n\n${prompt}`,
    image: inputFile
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController()
    const activeSignal = signal || controller.signal
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: activeSignal
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const isRateLimited =
          response.status === 429 ||
          data?.code === 'RATE_LIMIT' ||
          data?.code === 'RESOURCE_EXHAUSTED'

        if (isRateLimited) {
          const quotaMessage =
            data?.error || friendlyQuotaMessages[provider] || 'The selected provider is currently rate limited.'
          const error = new Error(quotaMessage)
          error.code = 'RATE_LIMIT'
          throw error
        }

        const error = new Error(data?.error || `Image generation failed with status ${response.status}`)
        error.code = data?.code
        throw error
      }

      if (!data?.image) {
        throw new Error('Image generation response was empty.')
      }

      return data.image
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError') {
        return
      }

      if (error.code === 'RATE_LIMIT' || attempt === maxRetries - 1) {
        throw error
      }

      const waitTime = baseDelay * 2 ** attempt
      console.warn(
        `Image generation attempt ${attempt + 1} failed (${error.message}). Retrying in ${waitTime}ms...`
      )
      await delay(waitTime)
    } finally {
      clearTimeout(timeoutId)
    }
  }
})
