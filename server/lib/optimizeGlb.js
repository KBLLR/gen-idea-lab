import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  flatten,
  instance,
  join,
  palette,
  prune,
  resample,
  simplify,
  sparse,
  textureCompress,
  weld
} from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import logger from '../../src/shared/lib/logger.js';

/**
 * Optimize a GLB file for web delivery with advanced pipeline
 * Reduces file size by 70-90% through:
 * - Deduplication, instancing, palette textures
 * - Mesh simplification (meshoptimizer)
 * - Vertex welding and sparse accessors
 * - Texture compression (WebP)
 * - Scene graph flattening and joining
 *
 * @param {string} inputPath - Path to input GLB file
 * @param {string} outputPath - Path to save optimized GLB
 * @param {object} options - Optimization options
 * @returns {Promise<{originalSize: number, optimizedSize: number, savings: number, duration: number, steps: array}>}
 */
export async function optimizeGlb(inputPath, outputPath, options = {}) {
  try {
    const startTime = Date.now();
    const steps = [];

    // Initialize I/O with all standard extensions
    const io = new NodeIO()
      .registerExtensions(ALL_EXTENSIONS);

    logger.info(`Loading GLB: ${inputPath}`);
    const document = await io.read(inputPath);

    const originalSize = await getFileSize(inputPath);

    // Progress callback
    const logStep = (name, desc) => {
      const step = { name, description: desc, timestamp: Date.now() - startTime };
      steps.push(step);
      logger.info(`[${step.timestamp}ms] ${name}: ${desc}`);
      if (options.onProgress) {
        options.onProgress({ step: steps.length, total: 11, ...step });
      }
    };

    // Apply advanced optimization pipeline
    logStep('dedup', 'Removing duplicate meshes, materials, textures');
    await document.transform(dedup());

    logStep('instance', 'Creating GPU instancing batches for repeated meshes');
    await document.transform(instance({ min: 5 }));

    logStep('palette', 'Creating palette textures for compatible materials');
    await document.transform(palette({ min: 5 }));

    logStep('flatten', 'Reducing scene graph nesting');
    await document.transform(flatten());

    logStep('join', 'Joining compatible meshes');
    await document.transform(join());

    logStep('weld', 'Welding duplicate vertices');
    await document.transform(weld());

    logStep('simplify', 'Simplifying mesh geometry with meshoptimizer');
    try {
      await document.transform(
        simplify({
          simplifier: MeshoptSimplifier,
          error: 0.0001,
          ratio: 0.0,
          lockBorder: true,
        })
      );
    } catch (err) {
      logger.warn('Mesh simplification skipped:', err.message);
    }

    logStep('resample', 'Resampling animation frames');
    await document.transform(resample());

    logStep('prune', 'Removing unused nodes, textures, materials');
    await document.transform(
      prune({
        keepAttributes: true,
        keepIndices: true,
        keepLeaves: false,
      })
    );

    logStep('sparse', 'Creating sparse accessors for zero-heavy data');
    await document.transform(sparse({ ratio: 0.2 }));

    logStep('textureCompress', 'Compressing textures to WebP (1024x1024)');
    try {
      await document.transform(
        textureCompress({
          targetFormat: 'webp',
          resize: [1024, 1024],
          quality: 90,
        })
      );
    } catch (err) {
      logger.warn('Texture compression skipped (install sharp for WebP):', err.message);
    }

    logger.info(`Writing optimized GLB: ${outputPath}`);
    await io.write(outputPath, document);

    const optimizedSize = await getFileSize(outputPath);
    const savings = ((originalSize - optimizedSize) / originalSize) * 100;
    const duration = Date.now() - startTime;

    logger.info(`Optimization complete in ${duration}ms:`, {
      originalSize: formatBytes(originalSize),
      optimizedSize: formatBytes(optimizedSize),
      savings: `${savings.toFixed(1)}%`,
      steps: steps.length,
    });

    return {
      originalSize,
      optimizedSize,
      savings: Math.round(savings),
      duration,
      steps,
    };
  } catch (error) {
    logger.error('GLB optimization failed:', error);
    throw error;
  }
}

/**
 * Get file size in bytes
 */
async function getFileSize(filepath) {
  const fs = await import('fs/promises');
  const stats = await fs.stat(filepath);
  return stats.size;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default optimizeGlb;
