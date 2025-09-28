#!/usr/bin/env node
/**
 * Generate thumbnails for all Image Booth modes using a single source image.
 *
 * Usage:
 *   GEMINI_API_KEY=... npm run generate-thumbnails -- --input assets/your-photo.jpg --concurrency 2
 *
 * Options:
 *   --input <path>         Path to the source image to transform (jpg/png/webp). If omitted, the script
 *                          will try scripts/thumbnail-source.jpg, then search the assets/ folder for the
 *                          first image file.
 *   --concurrency <n>      Number of concurrent API calls (default: 2). Be mindful of rate limits/costs.
 *   --subset <regex>       Only generate for mode keys whose id matches this regex (handy for testing).
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pLimit from 'p-limit'
import { GoogleGenAI, Modality } from '@google/genai'
import modes from '../src/lib/modes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

// -------- CLI args
const args = process.argv.slice(2)
const getArg = (name, fallback = undefined) => {
  const i = args.findIndex(a => a === `--${name}`)
  if (i !== -1 && args[i + 1]) return args[i + 1]
  return fallback
}
const hasFlag = (name) => args.includes(`--${name}`)

const inputPathArg = getArg('input')
const concurrency = parseInt(getArg('concurrency', '2'), 10)
const subsetRegex = getArg('subset') ? new RegExp(getArg('subset')) : null

// -------- Helpers
async function pathExists(p) {
  try { await fs.access(p); return true } catch { return false }
}

async function resolveInputPath() {
  if (inputPathArg) {
    const p = path.isAbsolute(inputPathArg) ? inputPathArg : path.join(projectRoot, inputPathArg)
    if (!(await pathExists(p))) throw new Error(`Input image not found: ${p}`)
    return p
  }
  const candidates = [
    path.join(projectRoot, 'scripts/thumbnail-source.jpg'),
    path.join(projectRoot, 'assets/thumbnail-source.jpg'),
    path.join(projectRoot, 'assets/thumbnail.jpg'),
    path.join(projectRoot, 'assets/thumbnail.png'),
    path.join(projectRoot, 'assets/thumbnail.webp'),
  ]
  for (const c of candidates) if (await pathExists(c)) return c
  // Fallback: first image in assets/
  const assetsDir = path.join(projectRoot, 'assets')
  if (await pathExists(assetsDir)) {
    const files = await fs.readdir(assetsDir)
    const img = files.find(f => /\.(png|jpe?g|webp)$/i.test(f))
    if (img) return path.join(assetsDir, img)
  }
  throw new Error('No input image found. Provide --input <path> or add scripts/thumbnail-source.jpg')
}

function mimeTypeForFile(p) {
  const ext = path.extname(p).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  return 'application/octet-stream'
}

function flattenModes(m) {
  const items = []
  for (const [, subcats] of Object.entries(m)) {
    for (const [, modesInCat] of Object.entries(subcats)) {
      for (const [modeKey, details] of Object.entries(modesInCat)) {
        items.push({ key: modeKey, prompt: details.prompt })
      }
    }
  }
  return items
}

function now() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '')
}

async function main() {
  const inputPath = await resolveInputPath()
  const mimeType = mimeTypeForFile(inputPath)
  const fileBuf = await fs.readFile(inputPath)
  const base64 = fileBuf.toString('base64')

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('ERROR: Set API_KEY or GEMINI_API_KEY in your environment before running this script.')
    process.exit(1)
  }

  const ai = new GoogleGenAI({ apiKey })
  const safetySettings = [
    'HARM_CATEGORY_HATE_SPEECH',
    'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    'HARM_CATEGORY_DANGEROUS_CONTENT',
    'HARM_CATEGORY_HARASSMENT'
  ].map(category => ({ category, threshold: 'BLOCK_NONE' }))

  const all = flattenModes(modes)
  const targets = subsetRegex ? all.filter(({ key }) => subsetRegex.test(key)) : all
  console.log(`[${now()}] Generating ${targets.length} thumbnails (concurrency=${concurrency}) from: ${path.relative(projectRoot, inputPath)}`)

  const out = {}
  let done = 0

  for (const { key, prompt } of targets) {
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        config: { responseModalities: [Modality.IMAGE] },
        safetySettings,
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType } },
            { text: prompt }
          ]
        }
      })

      const cand = res?.candidates?.[0]
      const part = cand?.content?.parts?.find(p => p.inlineData)
      if (!part?.inlineData?.data) throw new Error('No image returned')
      const outMime = part.inlineData.mimeType || 'image/png'
      out[key] = `data:${outMime};base64,` + part.inlineData.data
      done++
      console.log(`[${now()}] Progress: ${done}/${targets.length}`)

      // Wait for 5 seconds before the next request
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (err) {
      console.warn(`[${now()}] Failed for ${key}: ${err.message}`)
      out[key] = '' // keep placeholder; UI can handle missing thumbnail
    }
  }

  // Write to src/lib/thumbnails.js
  const banner = `/**\n * @license\n * SPDX-License-Identifier: Apache-2.0\n*/\n// This file was generated by the \`npm run generate-thumbnails\` script.\n// It contains unique, AI-generated thumbnails for each creative mode.\n`
  const json = JSON.stringify(out, null, 2)
  const dst = path.join(projectRoot, 'src/lib/thumbnails.js')
  const content = `${banner}\nexport default ${json}\n`
  await fs.writeFile(dst, content, 'utf8')
  console.log(`[${now()}] Wrote ${Object.keys(out).length} thumbnails to ${path.relative(projectRoot, dst)}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})