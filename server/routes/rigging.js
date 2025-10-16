import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import logger from '../../src/shared/lib/logger.js';
import optimizeGlb from '../lib/optimizeGlb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.glb')) {
      cb(null, true);
    } else {
      cb(new Error('Only .glb files are allowed'));
    }
  },
});

// In-memory task storage (replace with database in production)
const tasks = new Map();

export default function createRiggingRouter() {
  const router = express.Router();

  // POST /api/rigging/submit - Submit a model for rigging
  router.post('/rigging/submit', upload.single('model'), async (req, res) => {
    try {
      logger.info('Rigging submission received');
      const meshyApiKey = process.env.MESHY_API_KEY;

      if (!meshyApiKey) {
        logger.error('MESHY_API_KEY not configured');
        return res.status(500).json({ error: 'Server configuration error: MESHY_API_KEY not set' });
      }

      if (!req.file) {
        logger.warn('No file uploaded in rigging request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      logger.info(`Processing file: ${req.file.originalname}, size: ${req.file.size} bytes`);

      // Get optional parameters
      const characterHeight = parseFloat(req.body.characterHeight) || 1.7;

      // Choose submission method based on file size
      // Data URIs increase size by ~33%, so use public URL for files > 30MB
      const MAX_DATAURI_SIZE = 30 * 1024 * 1024; // 30MB
      let modelUrl;

      if (req.file.size > MAX_DATAURI_SIZE) {
        // Store file temporarily and provide public URL
        const tempDir = path.join(process.cwd(), 'temp', 'rigging-uploads');
        await fs.mkdir(tempDir, { recursive: true });

        const tempId = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        const tempPath = path.join(tempDir, `${tempId}.glb`);
        await fs.writeFile(tempPath, req.file.buffer);

        // Get public URL (use environment variable or default to localhost)
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:8081';
        modelUrl = `${baseUrl}/api/rigging/temp/${tempId}.glb`;

        logger.info(`File too large for Data URI (${req.file.size} bytes), using public URL: ${modelUrl}`);
      } else {
        // Convert file buffer to base64 Data URI
        const base64Model = req.file.buffer.toString('base64');
        modelUrl = `data:model/gltf-binary;base64,${base64Model}`;
        logger.info(`Using Data URI for file (${req.file.size} bytes)`);
      }

      // Call Meshy API (OpenAPI v1)
      const meshyResponse = await fetch('https://api.meshy.ai/openapi/v1/rigging', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${meshyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_url: modelUrl,
          height_meters: characterHeight,
        }),
      });

      if (!meshyResponse.ok) {
        const error = await meshyResponse.text();
        logger.error(`Meshy API error (${meshyResponse.status}):`, error);
        return res.status(meshyResponse.status).json({
          error: `Meshy API error: ${error.substring(0, 200)}`
        });
      }

      const taskData = await meshyResponse.json();

      // Meshy returns { result: "task_id" }
      const taskId = taskData.result;

      // Store task info
      tasks.set(taskId, {
        id: taskId,
        status: 'PENDING',
        progress: 0,
        modelName: req.file.originalname,
        createdAt: new Date().toISOString(),
      });

      logger.info(`Rigging task submitted: ${taskId} for ${req.file.originalname}`);

      res.json({
        taskId: taskId,
        status: 'PENDING',
        modelName: req.file.originalname,
      });
    } catch (error) {
      logger.error('Error submitting rigging task:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // GET /api/rigging/status/:taskId - Get task status
  router.get('/rigging/status/:taskId', async (req, res) => {
    try {
      const { taskId } = req.params;
      const meshyApiKey = process.env.MESHY_API_KEY;

      if (!meshyApiKey) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      // Query Meshy API for task status (OpenAPI v1)
      const meshyResponse = await fetch(`https://api.meshy.ai/openapi/v1/rigging/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${meshyApiKey}`,
        },
      });

      if (!meshyResponse.ok) {
        if (meshyResponse.status === 404) {
          return res.status(404).json({ error: 'Task not found' });
        }
        const error = await meshyResponse.text();
        logger.error('Meshy API error:', error);
        return res.status(meshyResponse.status).json({ error: 'Failed to fetch task status' });
      }

      const taskData = await meshyResponse.json();

      // Update local cache
      if (tasks.has(taskId)) {
        const localTask = tasks.get(taskId);
        tasks.set(taskId, {
          ...localTask,
          status: taskData.status,
          progress: taskData.progress || 0,
          result: taskData.result,
        });
      }

      res.json({
        id: taskData.id,
        status: taskData.status,
        progress: taskData.progress || 0,
        result: taskData.result,
      });
    } catch (error) {
      logger.error('Error fetching task status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/rigging/tasks - Get all tasks for current user
  router.get('/rigging/tasks', async (req, res) => {
    try {
      // In production, filter by user ID
      const allTasks = Array.from(tasks.values());
      res.json({ tasks: allTasks });
    } catch (error) {
      logger.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/rigging/webhook - Meshy webhook endpoint
  router.post('/rigging/webhook', express.json(), async (req, res) => {
    try {
      logger.info('Received Meshy webhook:', req.body);

      const { task_id, status, result } = req.body;

      // Update task in cache
      if (tasks.has(task_id)) {
        const task = tasks.get(task_id);
        tasks.set(task_id, {
          ...task,
          status,
          result,
          completedAt: status === 'SUCCEEDED' ? new Date().toISOString() : undefined,
        });

        logger.info(`Task ${task_id} updated to status: ${status}`);
      }

      // In production, you might want to:
      // - Notify user via WebSocket
      // - Send email notification
      // - Trigger downstream workflows

      res.json({ received: true });
    } catch (error) {
      logger.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/rigging/download/:taskId - Download rigged model
  router.get('/rigging/download/:taskId', async (req, res) => {
    try {
      const { taskId } = req.params;
      const task = tasks.get(taskId);

      if (!task || task.status !== 'SUCCEEDED' || !task.result) {
        return res.status(404).json({ error: 'Rigged model not available' });
      }

      const fbxUrl = task.result.rigged_character_fbx_url;

      if (!fbxUrl) {
        return res.status(404).json({ error: 'FBX URL not found' });
      }

      // Proxy the download
      const downloadResponse = await fetch(fbxUrl);

      if (!downloadResponse.ok) {
        return res.status(502).json({ error: 'Failed to download from Meshy' });
      }

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${task.modelName.replace('.glb', '_rigged.fbx')}"`);

      downloadResponse.body.pipe(res);
    } catch (error) {
      logger.error('Error downloading rigged model:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/rigging/download-glb/:taskId - Download optimized GLB for Model Viewer
  router.get('/rigging/download-glb/:taskId', async (req, res) => {
    try {
      const { taskId } = req.params;
      const task = tasks.get(taskId);

      if (!task || task.status !== 'SUCCEEDED' || !task.result) {
        return res.status(404).json({ error: 'Rigged model not available' });
      }

      // Check if we already have an optimized GLB cached
      if (task.optimized_glb_path) {
        logger.info(`Serving cached optimized GLB for task ${taskId}`);
        const glbBuffer = await fs.readFile(task.optimized_glb_path);
        res.setHeader('Content-Type', 'model/gltf-binary');
        res.setHeader('Content-Disposition', `inline; filename="${task.modelName.replace('.glb', '_rigged.glb')}"`);
        return res.send(glbBuffer);
      }

      // Check if Meshy provided GLB in basic_animations
      let glbUrl = null;
      if (task.result.basic_animations) {
        // Try to find a GLB file in animations
        for (const [animName, animUrl] of Object.entries(task.result.basic_animations)) {
          if (animUrl.endsWith('.glb')) {
            glbUrl = animUrl;
            logger.info(`Found GLB animation: ${animName} at ${glbUrl}`);
            break;
          }
        }
      }

      if (!glbUrl) {
        // No GLB available, need FBX conversion
        return res.status(400).json({
          error: 'FBX to GLB conversion required',
          message: 'Meshy returned FBX format. Install Blender for conversion or use Three.js FBXLoader.',
          fbx_url: task.result.rigged_character_fbx_url,
          instructions: 'See docs/google-model-viewer-analysis.md for conversion options'
        });
      }

      // Download GLB from Meshy
      logger.info(`Downloading GLB from ${glbUrl}`);
      const glbResponse = await fetch(glbUrl);

      if (!glbResponse.ok) {
        return res.status(502).json({ error: 'Failed to download GLB from Meshy' });
      }

      const glbBuffer = Buffer.from(await glbResponse.arrayBuffer());

      // Create temp directory
      const tempDir = path.join(process.cwd(), 'temp', 'rigging');
      await fs.mkdir(tempDir, { recursive: true });

      const inputPath = path.join(tempDir, `${taskId}_input.glb`);
      const outputPath = path.join(tempDir, `${taskId}_optimized.glb`);

      // Save input GLB
      await fs.writeFile(inputPath, glbBuffer);

      try {
        // Optimize with gltf-transform
        const optimizationResult = await optimizeGlb(inputPath, outputPath);

        logger.info(`GLB optimized for task ${taskId}:`, optimizationResult);

        // Move to permanent storage first
        const storageDir = path.join(process.cwd(), 'server', 'storage', 'models');
        await fs.mkdir(storageDir, { recursive: true });
        const permanentPath = path.join(storageDir, `${taskId}.glb`);
        await fs.rename(outputPath, permanentPath);

        // Read optimized GLB from permanent location
        const optimizedBuffer = await fs.readFile(permanentPath);

        // Cache the optimized path for future requests
        task.optimized_glb_path = permanentPath;
        task.optimized_size = optimizationResult.optimizedSize;
        task.original_size = optimizationResult.originalSize;
        task.savings_percent = optimizationResult.savings;
        tasks.set(taskId, task);

        // Clean up input file
        await fs.unlink(inputPath).catch(() => {});

        // Send optimized GLB
        res.setHeader('Content-Type', 'model/gltf-binary');
        res.setHeader('Content-Disposition', `inline; filename="${task.modelName.replace('.glb', '_rigged.glb')}"`);
        res.setHeader('X-Original-Size', optimizationResult.originalSize);
        res.setHeader('X-Optimized-Size', optimizationResult.optimizedSize);
        res.setHeader('X-Savings-Percent', optimizationResult.savings);
        res.send(optimizedBuffer);

      } catch (optimizeError) {
        // If optimization fails, serve original GLB
        logger.warn(`Optimization failed, serving original: ${optimizeError.message}`);
        await fs.unlink(inputPath).catch(() => {});
        await fs.unlink(outputPath).catch(() => {});

        res.setHeader('Content-Type', 'model/gltf-binary');
        res.setHeader('Content-Disposition', `inline; filename="${task.modelName.replace('.glb', '_rigged.glb')}"`);
        res.send(glbBuffer);
      }

    } catch (error) {
      logger.error('Error downloading/optimizing GLB:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/rigging/gallery - Get all stored models for gallery view
  router.get('/rigging/gallery', async (req, res) => {
    try {
      // Get all succeeded tasks with stored models
      const galleryModels = Array.from(tasks.values())
        .filter(task => task.status === 'SUCCEEDED' && task.optimized_glb_path)
        .map(task => ({
          id: task.id,
          name: task.modelName,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
          originalSize: task.original_size,
          optimizedSize: task.optimized_size,
          savingsPercent: task.savings_percent,
          modelUrl: `/api/rigging/models/${task.id}.glb`,
          thumbnailUrl: `/api/rigging/thumbnails/${task.id}.jpg`,
        }))
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

      res.json({ models: galleryModels });
    } catch (error) {
      logger.error('Error fetching gallery:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/rigging/models/:filename - Serve stored model files
  router.get('/rigging/models/:filename', async (req, res) => {
    try {
      const { filename } = req.params;

      // Security: only allow alphanumeric, dash, underscore, and .glb extension
      if (!/^[a-zA-Z0-9_-]+\.glb$/.test(filename)) {
        return res.status(400).json({ error: 'Invalid filename' });
      }

      const filePath = path.join(process.cwd(), 'server', 'storage', 'models', filename);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ error: 'Model not found' });
      }

      // Serve the file
      res.setHeader('Content-Type', 'model/gltf-binary');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.sendFile(filePath);
    } catch (error) {
      logger.error('Error serving model file:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /api/rigging/gallery/:taskId - Delete a model from gallery
  router.delete('/rigging/gallery/:taskId', async (req, res) => {
    try {
      const { taskId } = req.params;
      const task = tasks.get(taskId);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Delete the stored file if it exists
      if (task.optimized_glb_path) {
        await fs.unlink(task.optimized_glb_path).catch(err => {
          logger.warn(`Failed to delete model file: ${err.message}`);
        });
      }

      // Remove from tasks map
      tasks.delete(taskId);

      logger.info(`Deleted model from gallery: ${taskId}`);
      res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting model:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/rigging/temp/:filename - Serve temporary upload files for Meshy
  router.get('/rigging/temp/:filename', async (req, res) => {
    try {
      const { filename } = req.params;

      // Security: only allow alphanumeric, dash, underscore, and .glb extension
      if (!/^[a-zA-Z0-9_-]+\\.glb$/.test(filename)) {
        return res.status(400).json({ error: 'Invalid filename' });
      }

      const filePath = path.join(process.cwd(), 'temp', 'rigging-uploads', filename);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ error: 'File not found' });
      }

      // Serve the file
      res.setHeader('Content-Type', 'model/gltf-binary');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.sendFile(filePath);

      // Clean up after 1 hour (Meshy should have downloaded it by then)
      setTimeout(async () => {
        try {
          await fs.unlink(filePath);
          logger.info(`Cleaned up temporary file: ${filename}`);
        } catch (err) {
          logger.warn(`Failed to clean up temporary file ${filename}: ${err.message}`);
        }
      }, 3600000); // 1 hour
    } catch (error) {
      logger.error('Error serving temporary file:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
