import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import logger from '../../src/shared/lib/logger.js';
import optimizeGlb from '../lib/optimizeGlb.js';
import tokenStore from '../../src/lib/secureTokens.js';
import { requireAuth } from '../../src/lib/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The specific Drive folder ID from your link (can be overridden via env var)
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_MODELS_FOLDER_ID || '16MZ6twRIR6-wFcHmy8ZdU8Fikk5X9D5J';

export default function createDriveImportRouter() {
  const router = express.Router();

  // GET /api/drive/models - List GLB files from the specific Drive folder
  router.get('/drive/models', requireAuth, async (req, res) => {
    try {
      // Get user's Google Drive token from tokenStore
      const driveToken = await tokenStore.getOAuthToken(req.user.email, 'googleDrive');

      if (!driveToken?.accessToken) {
        return res.status(401).json({
          error: 'Google Drive not connected',
          message: 'Please connect your Google Drive account first'
        });
      }

      // List files from the specific folder
      const query = `'${DRIVE_FOLDER_ID}' in parents and (mimeType='model/gltf-binary' or name contains '.glb') and trashed=false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,size,modifiedTime,webContentLink)`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${driveToken.accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Drive API error:', error);
        return res.status(response.status).json({
          error: 'Failed to list Drive files',
          details: error
        });
      }

      const data = await response.json();

      logger.info(`Found ${data.files?.length || 0} GLB files in Drive folder`);

      res.json({
        files: data.files || [],
        folderId: DRIVE_FOLDER_ID,
      });
    } catch (error) {
      logger.error('Error listing Drive files:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  // POST /api/drive/import/:fileId - Import and optimize a file from Drive
  router.post('/drive/import/:fileId', requireAuth, async (req, res) => {
    try {
      const { fileId } = req.params;

      // Get user's Google Drive token from tokenStore
      const driveToken = await tokenStore.getOAuthToken(req.user.email, 'googleDrive');

      if (!driveToken?.accessToken) {
        return res.status(401).json({ error: 'Google Drive not connected' });
      }

      // SSE setup for progress updates
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const sendProgress = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      sendProgress({ step: 'start', message: 'Starting import from Google Drive...' });

      // Get file metadata
      const metaUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size`;
      const metaResponse = await fetch(metaUrl, {
        headers: { 'Authorization': `Bearer ${driveToken.accessToken}` },
      });

      if (!metaResponse.ok) {
        sendProgress({ step: 'error', message: 'File not found in Drive' });
        res.end();
        return;
      }

      const metadata = await metaResponse.json();
      sendProgress({
        step: 'metadata',
        message: `Found: ${metadata.name}`,
        filename: metadata.name,
        size: metadata.size
      });

      // Download file from Drive
      sendProgress({ step: 'download', message: 'Downloading from Drive...' });
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const downloadResponse = await fetch(downloadUrl, {
        headers: { 'Authorization': `Bearer ${driveToken.accessToken}` },
      });

      if (!downloadResponse.ok) {
        sendProgress({ step: 'error', message: 'Failed to download file' });
        res.end();
        return;
      }

      // Save to temp directory
      const tempDir = path.join(process.cwd(), 'temp', 'drive-imports');
      await fs.mkdir(tempDir, { recursive: true });

      const inputPath = path.join(tempDir, `${fileId}_input.glb`);
      const outputPath = path.join(tempDir, `${fileId}_optimized.glb`);

      const buffer = Buffer.from(await downloadResponse.arrayBuffer());
      await fs.writeFile(inputPath, buffer);

      sendProgress({
        step: 'downloaded',
        message: 'Download complete',
        originalSize: buffer.length
      });

      // Optimize with progress callbacks
      sendProgress({ step: 'optimize_start', message: 'Starting optimization pipeline...' });

      const optimizationResult = await optimizeGlb(inputPath, outputPath, {
        onProgress: (progress) => {
          sendProgress({
            step: 'optimize_progress',
            message: progress.description,
            progress: Math.round((progress.step / progress.total) * 100),
            optimizationStep: progress.name
          });
        }
      });

      sendProgress({
        step: 'optimize_complete',
        message: 'Optimization complete',
        ...optimizationResult
      });

      // Move to permanent storage
      const storageDir = path.join(process.cwd(), 'server', 'storage', 'models');
      await fs.mkdir(storageDir, { recursive: true });

      const taskId = `drive_${fileId}_${Date.now()}`;
      const permanentPath = path.join(storageDir, `${taskId}.glb`);

      await fs.rename(outputPath, permanentPath);
      await fs.unlink(inputPath).catch(() => {});

      sendProgress({
        step: 'complete',
        message: 'Import complete!',
        taskId,
        modelName: metadata.name,
        originalSize: optimizationResult.originalSize,
        optimizedSize: optimizationResult.optimizedSize,
        savings: optimizationResult.savings,
        duration: optimizationResult.duration,
        steps: optimizationResult.steps
      });

      res.end();
    } catch (error) {
      logger.error('Error importing from Drive:', error);
      res.write(`data: ${JSON.stringify({
        step: 'error',
        message: error.message
      })}\n\n`);
      res.end();
    }
  });

  return router;
}
