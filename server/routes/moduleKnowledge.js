/**
 * Module Knowledge System API Routes
 *
 * Endpoints for CODE University's module-first architecture:
 * - Module metadata and configurations
 * - Knowledge base operations (add, search)
 * - Conversation management
 * - Progress tracking
 * - Cross-module connections
 */

import express from 'express';
import { requireAuth } from '../../src/shared/lib/auth.js';
import { EmbeddingService } from '../lib/embeddingService.js';
import { MongoClient } from 'mongodb';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// MongoDB connection (singleton)
let mongoClient = null;
let embeddingService = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'genbooth-modules';

/**
 * Initialize MongoDB client and EmbeddingService
 */
async function getServices() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('[Module Knowledge] Connected to MongoDB');
  }

  if (!embeddingService) {
    const geminiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required for embedding service');
    }
    const geminiClient = new GoogleGenAI({ apiKey: geminiKey });
    embeddingService = new EmbeddingService(geminiClient, mongoClient, DB_NAME);
    await embeddingService.connect();
    console.log('[Module Knowledge] Initialized EmbeddingService');
  }

  return { mongoClient, embeddingService };
}

/**
 * GET /api/knowledge/modules
 * Get all active modules with optional filtering
 */
router.get('/modules', async (req, res) => {
  try {
    const { mongoClient } = await getServices();
    const db = mongoClient.db(DB_NAME);
    const modulesCollection = db.collection('modules');

    const { discipline, semester, search } = req.query;
    const filter = { isActive: true };

    if (discipline) {
      filter.discipline = discipline;
    }

    if (semester) {
      filter.semester = semester;
    }

    let modules = await modulesCollection.find(filter).toArray();

    // Text search if query provided
    if (search) {
      const searchLower = search.toLowerCase();
      modules = modules.filter(m =>
        m.moduleCode.toLowerCase().includes(searchLower) ||
        m.moduleTitle.toLowerCase().includes(searchLower) ||
        m.keyTopics?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by module code
    modules.sort((a, b) => a.moduleCode.localeCompare(b.moduleCode));

    res.json({
      success: true,
      modules: modules.map(m => ({
        moduleCode: m.moduleCode,
        moduleTitle: m.moduleTitle,
        moduleCoordinator: m.moduleCoordinator,
        discipline: m.discipline,
        semester: m.semester,
        ects: m.ects,
        assistant: m.assistant,
        targetGroup: m.targetGroup
      })),
      count: modules.length
    });
  } catch (error) {
    console.error('[Module Knowledge] Error fetching modules:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/knowledge/modules/:moduleCode
 * Get detailed information about a specific module
 */
router.get('/modules/:moduleCode', async (req, res) => {
  try {
    const { moduleCode } = req.params;
    const { mongoClient } = await getServices();
    const db = mongoClient.db(DB_NAME);
    const modulesCollection = db.collection('modules');

    const module = await modulesCollection.findOne({ moduleCode, isActive: true });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json({
      success: true,
      module
    });
  } catch (error) {
    console.error('[Module Knowledge] Error fetching module:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/knowledge/:moduleCode/add
 * Add knowledge to a module's knowledge base
 * Requires authentication
 */
router.post('/:moduleCode/add', requireAuth, async (req, res) => {
  try {
    const { moduleCode } = req.params;
    const { text, type = 'note', metadata = {} } = req.body;
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const { embeddingService } = await getServices();

    const result = await embeddingService.addKnowledge(
      moduleCode,
      userId,
      text,
      type,
      metadata
    );

    res.json(result);
  } catch (error) {
    console.error('[Module Knowledge] Error adding knowledge:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/knowledge/:moduleCode/search
 * Search a module's knowledge base using semantic similarity
 * Requires authentication
 */
router.get('/:moduleCode/search', requireAuth, async (req, res) => {
  try {
    const { moduleCode } = req.params;
    const { q: query, topK = 5, threshold = 0.7, allUsers = false } = req.query;
    const userId = allUsers === 'true' ? null : req.user.id;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const { embeddingService } = await getServices();

    const result = await embeddingService.searchKnowledge(
      moduleCode,
      userId,
      query,
      parseInt(topK),
      parseFloat(threshold)
    );

    res.json(result);
  } catch (error) {
    console.error('[Module Knowledge] Error searching knowledge:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/knowledge/:moduleCode/conversations
 * Save a conversation for a module
 * Requires authentication
 */
router.post('/:moduleCode/conversations', requireAuth, async (req, res) => {
  try {
    const { moduleCode } = req.params;
    const { conversationId, messages, summary, keyTopics, autoIndex = true } = req.body;
    const userId = req.user.id;

    if (!conversationId || !messages) {
      return res.status(400).json({ error: 'conversationId and messages are required' });
    }

    const { mongoClient, embeddingService } = await getServices();
    const db = mongoClient.db(DB_NAME);
    const conversationsCollection = db.collection(`module_${moduleCode}_conversations`);

    // Save conversation
    const conversation = {
      conversationId,
      userId,
      moduleCode,
      messages,
      summary,
      keyTopics,
      startedAt: new Date(messages[0]?.timestamp || Date.now()),
      lastMessageAt: new Date(messages[messages.length - 1]?.timestamp || Date.now()),
      messageCount: messages.length,
      indexed: false
    };

    await conversationsCollection.replaceOne(
      { conversationId },
      conversation,
      { upsert: true }
    );

    // Auto-index if requested
    let indexResult = null;
    if (autoIndex && messages.length >= 2) {
      indexResult = await embeddingService.indexConversation(
        moduleCode,
        userId,
        messages,
        conversationId
      );
    }

    res.json({
      success: true,
      conversationId,
      messageCount: messages.length,
      indexed: indexResult?.success || false,
      indexedChunks: indexResult?.chunkCount || 0
    });
  } catch (error) {
    console.error('[Module Knowledge] Error saving conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/knowledge/:moduleCode/conversations
 * Get conversation history for a module
 * Requires authentication
 */
router.get('/:moduleCode/conversations', requireAuth, async (req, res) => {
  try {
    const { moduleCode } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    const userId = req.user.id;

    const { mongoClient } = await getServices();
    const db = mongoClient.db(DB_NAME);
    const conversationsCollection = db.collection(`module_${moduleCode}_conversations`);

    const conversations = await conversationsCollection
      .find({ userId, moduleCode })
      .sort({ lastMessageAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .toArray();

    const total = await conversationsCollection.countDocuments({ userId, moduleCode });

    res.json({
      success: true,
      conversations: conversations.map(c => ({
        conversationId: c.conversationId,
        summary: c.summary,
        keyTopics: c.keyTopics,
        messageCount: c.messageCount,
        startedAt: c.startedAt,
        lastMessageAt: c.lastMessageAt,
        indexed: c.indexed
      })),
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('[Module Knowledge] Error fetching conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/knowledge/:moduleCode/conversations/:conversationId
 * Get a specific conversation with all messages
 * Requires authentication
 */
router.get('/:moduleCode/conversations/:conversationId', requireAuth, async (req, res) => {
  try {
    const { moduleCode, conversationId } = req.params;
    const userId = req.user.id;

    const { mongoClient } = await getServices();
    const db = mongoClient.db(DB_NAME);
    const conversationsCollection = db.collection(`module_${moduleCode}_conversations`);

    const conversation = await conversationsCollection.findOne({
      conversationId,
      userId,
      moduleCode
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('[Module Knowledge] Error fetching conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/knowledge/:moduleCode/progress
 * Get user's progress in a module
 * Requires authentication
 */
router.get('/:moduleCode/progress', requireAuth, async (req, res) => {
  try {
    const { moduleCode } = req.params;
    const userId = req.user.id;

    const { embeddingService } = await getServices();

    const progress = await embeddingService.getModuleProgress(moduleCode, userId);

    res.json(progress);
  } catch (error) {
    console.error('[Module Knowledge] Error fetching progress:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/knowledge/:moduleCode/progress
 * Update user's mastery for specific topics
 * Requires authentication
 */
router.put('/:moduleCode/progress', requireAuth, async (req, res) => {
  try {
    const { moduleCode } = req.params;
    const { topicMastery } = req.body; // { "topic_name": 0.85, ... }
    const userId = req.user.id;

    if (!topicMastery || typeof topicMastery !== 'object') {
      return res.status(400).json({ error: 'topicMastery object is required' });
    }

    const { mongoClient } = await getServices();
    const db = mongoClient.db(DB_NAME);
    const progressCollection = db.collection(`module_${moduleCode}_progress`);

    // Update or create progress document
    const result = await progressCollection.updateOne(
      { userId, moduleCode },
      {
        $set: {
          topicMastery,
          lastUpdated: new Date()
        },
        $setOnInsert: {
          userId,
          moduleCode,
          startedAt: new Date()
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      updated: result.modifiedCount > 0 || result.upsertedCount > 0,
      topicMastery
    });
  } catch (error) {
    console.error('[Module Knowledge] Error updating progress:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/knowledge/connections/search
 * Find cross-module connections for a concept
 * Requires authentication
 */
router.get('/connections/search', requireAuth, async (req, res) => {
  try {
    const { q: query, exclude, topK = 3 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const { embeddingService } = await getServices();

    const connections = await embeddingService.findCrossModuleConnections(
      query,
      exclude || null,
      parseInt(topK)
    );

    res.json(connections);
  } catch (error) {
    console.error('[Module Knowledge] Error finding connections:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/knowledge/disciplines
 * Get module breakdown by discipline
 */
router.get('/disciplines', async (req, res) => {
  try {
    const { mongoClient } = await getServices();
    const db = mongoClient.db(DB_NAME);
    const modulesCollection = db.collection('modules');

    const disciplines = await modulesCollection.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$discipline',
          count: { $sum: 1 },
          modules: { $push: { code: '$moduleCode', title: '$moduleTitle' } }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    res.json({
      success: true,
      disciplines: disciplines.map(d => ({
        name: d._id,
        count: d.count,
        modules: d.modules
      }))
    });
  } catch (error) {
    console.error('[Module Knowledge] Error fetching disciplines:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cleanup on shutdown
 */
process.on('SIGINT', async () => {
  if (mongoClient) {
    await mongoClient.close();
    console.log('[Module Knowledge] MongoDB connection closed');
  }
  process.exit(0);
});

export default router;
