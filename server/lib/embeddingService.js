/**
 * Embedding Service
 *
 * Handles vector embeddings for the module knowledge system using
 * Gemini's text-embedding-004 model (768 dimensions).
 *
 * Features:
 * - Generate embeddings for text chunks
 * - Store embeddings in MongoDB with metadata
 * - Semantic search using cosine similarity
 * - Auto-indexing of conversations
 * - Batch processing for efficiency
 */

import { GoogleGenAI } from '@google/genai';
import { MongoClient } from 'mongodb';

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSIONS = 768;
const BATCH_SIZE = 100; // Process embeddings in batches

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Chunk text into smaller pieces for embedding
 * Uses simple sentence-based chunking with overlap
 */
function chunkText(text, maxChunkSize = 500, overlap = 50) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      // Add overlap by keeping last part of previous chunk
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-overlap).join(' ') + ' ' + sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * EmbeddingService Class
 */
export class EmbeddingService {
  constructor(geminiClient, mongoClient, dbName = 'genbooth-modules') {
    if (!geminiClient && !mongoClient) {
      throw new Error('Either Gemini client or MongoDB client is required for EmbeddingService');
    }

    this.genAI = geminiClient;
    this.mongoClient = mongoClient;
    this.dbName = dbName;
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  async connect() {
    if (!this.db) {
      this.db = this.mongoClient.db(this.dbName);
    }
    return this.db;
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text) {
    try {
      if (!this.genAI) {
        throw new Error('Gemini client not initialized');
      }

      const model = this.genAI.models.get(EMBEDDING_MODEL);
      const result = await model.embedContent(text);
      const embedding = result.embedding?.values || result.values || result;

      // Handle different response formats
      const embeddingArray = Array.isArray(embedding) ? embedding : [embedding];

      if (embeddingArray.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(`Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embeddingArray.length}`);
      }

      return embeddingArray;
    } catch (error) {
      console.error('[EmbeddingService] Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateEmbeddings(texts) {
    const embeddings = [];

    // Process in batches
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      embeddings.push(...batchResults);
    }

    return embeddings;
  }

  /**
   * Add knowledge to a module's knowledge base
   *
   * @param {string} moduleCode - Module code (e.g., "OS_01")
   * @param {string} userId - User ID
   * @param {string} text - Text to add to knowledge base
   * @param {string} type - Type of knowledge (concept, example, question, answer, note)
   * @param {object} metadata - Additional metadata (topic, confidence, source, etc.)
   */
  async addKnowledge(moduleCode, userId, text, type = 'note', metadata = {}) {
    await this.connect();

    try {
      // Chunk long texts
      const chunks = chunkText(text);
      const embeddings = await this.generateEmbeddings(chunks);

      const knowledgeCollection = this.db.collection(`module_${moduleCode}_knowledge`);
      const documents = [];

      for (let i = 0; i < chunks.length; i++) {
        documents.push({
          userId,
          moduleCode,
          type,
          text: chunks[i],
          embedding: embeddings[i],
          metadata: {
            ...metadata,
            chunkIndex: chunks.length > 1 ? i : undefined,
            totalChunks: chunks.length > 1 ? chunks.length : undefined
          },
          timestamp: new Date()
        });
      }

      const result = await knowledgeCollection.insertMany(documents);

      console.log(`[EmbeddingService] Added ${documents.length} knowledge chunks to ${moduleCode} for user ${userId}`);

      return {
        success: true,
        insertedCount: result.insertedCount,
        chunkCount: chunks.length
      };
    } catch (error) {
      console.error('[EmbeddingService] Error adding knowledge:', error);
      throw error;
    }
  }

  /**
   * Search knowledge base using semantic similarity
   *
   * @param {string} moduleCode - Module code
   * @param {string} userId - User ID (optional - if provided, only search user's knowledge)
   * @param {string} query - Search query
   * @param {number} topK - Number of results to return
   * @param {number} threshold - Minimum similarity score (0-1)
   */
  async searchKnowledge(moduleCode, userId, query, topK = 5, threshold = 0.7) {
    await this.connect();

    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);

      // Get all knowledge documents for this module/user
      const knowledgeCollection = this.db.collection(`module_${moduleCode}_knowledge`);
      const filter = { moduleCode };
      if (userId) {
        filter.userId = userId;
      }

      const documents = await knowledgeCollection.find(filter).toArray();

      if (documents.length === 0) {
        return {
          success: true,
          results: [],
          message: 'No knowledge found for this module'
        };
      }

      // Calculate similarity scores
      const results = documents.map(doc => ({
        ...doc,
        similarity: cosineSimilarity(queryEmbedding, doc.embedding)
      }));

      // Filter by threshold and sort by similarity
      const filteredResults = results
        .filter(r => r.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      console.log(`[EmbeddingService] Found ${filteredResults.length} results for query in ${moduleCode}`);

      return {
        success: true,
        results: filteredResults.map(r => ({
          text: r.text,
          type: r.type,
          similarity: r.similarity,
          metadata: r.metadata,
          timestamp: r.timestamp
        })),
        totalDocuments: documents.length,
        query
      };
    } catch (error) {
      console.error('[EmbeddingService] Error searching knowledge:', error);
      throw error;
    }
  }

  /**
   * Auto-index a conversation
   * Extracts key concepts and saves them to knowledge base
   *
   * @param {string} moduleCode - Module code
   * @param {string} userId - User ID
   * @param {array} messages - Conversation messages
   * @param {string} conversationId - Conversation ID
   */
  async indexConversation(moduleCode, userId, messages, conversationId) {
    await this.connect();

    try {
      // Extract assistant responses (these contain teaching/learning content)
      const assistantMessages = messages.filter(m => m.role === 'assistant');

      if (assistantMessages.length === 0) {
        return { success: true, indexed: 0 };
      }

      // Combine messages into chunks
      const combinedText = assistantMessages.map(m => m.content).join('\n\n');

      // Add to knowledge base with conversation metadata
      const result = await this.addKnowledge(
        moduleCode,
        userId,
        combinedText,
        'conversation',
        {
          conversationId,
          messageCount: assistantMessages.length,
          source: 'auto-indexed'
        }
      );

      // Update conversation with indexed flag
      const conversationsCollection = this.db.collection(`module_${moduleCode}_conversations`);
      await conversationsCollection.updateOne(
        { conversationId },
        { $set: { indexed: true, indexedAt: new Date() } }
      );

      console.log(`[EmbeddingService] Auto-indexed conversation ${conversationId} for ${moduleCode}`);

      return result;
    } catch (error) {
      console.error('[EmbeddingService] Error indexing conversation:', error);
      throw error;
    }
  }

  /**
   * Get user's progress in a module based on knowledge base
   * Returns topic coverage and mastery estimates
   *
   * @param {string} moduleCode - Module code
   * @param {string} userId - User ID
   */
  async getModuleProgress(moduleCode, userId) {
    await this.connect();

    try {
      const knowledgeCollection = this.db.collection(`module_${moduleCode}_knowledge`);

      // Aggregate by topic
      const topicCoverage = await knowledgeCollection.aggregate([
        { $match: { userId, moduleCode } },
        {
          $group: {
            _id: '$metadata.topic',
            count: { $sum: 1 },
            avgConfidence: { $avg: '$metadata.confidence' },
            types: { $addToSet: '$type' },
            lastUpdated: { $max: '$timestamp' }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray();

      // Total knowledge items
      const totalItems = await knowledgeCollection.countDocuments({ userId, moduleCode });

      // Recent activity
      const recentItems = await knowledgeCollection
        .find({ userId, moduleCode })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();

      return {
        success: true,
        moduleCode,
        totalKnowledgeItems: totalItems,
        topicCoverage: topicCoverage.map(t => ({
          topic: t._id,
          itemCount: t.count,
          averageConfidence: t.avgConfidence || 0,
          types: t.types,
          lastUpdated: t.lastUpdated
        })),
        recentActivity: recentItems.map(item => ({
          text: item.text.substring(0, 100) + '...',
          type: item.type,
          topic: item.metadata?.topic,
          timestamp: item.timestamp
        }))
      };
    } catch (error) {
      console.error('[EmbeddingService] Error getting progress:', error);
      throw error;
    }
  }

  /**
   * Find connections between modules
   * Search across all modules for related concepts
   *
   * @param {string} query - Concept to find connections for
   * @param {string} excludeModuleCode - Exclude results from this module
   * @param {number} topK - Number of connections per module
   */
  async findCrossModuleConnections(query, excludeModuleCode = null, topK = 3) {
    await this.connect();

    try {
      // Get all module codes from modules collection
      const modulesCollection = this.db.collection('modules');
      const modules = await modulesCollection.find({ isActive: true }).toArray();

      const connections = [];

      for (const module of modules) {
        if (module.moduleCode === excludeModuleCode) continue;

        const results = await this.searchKnowledge(
          module.moduleCode,
          null, // Search all users' public knowledge
          query,
          topK,
          0.75 // Higher threshold for cross-module connections
        );

        if (results.results.length > 0) {
          connections.push({
            moduleCode: module.moduleCode,
            moduleTitle: module.moduleTitle,
            discipline: module.discipline,
            matches: results.results
          });
        }
      }

      return {
        success: true,
        query,
        connections: connections.sort((a, b) =>
          b.matches[0].similarity - a.matches[0].similarity
        )
      };
    } catch (error) {
      console.error('[EmbeddingService] Error finding connections:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    // MongoClient is managed externally, don't close here
    this.db = null;
  }
}

export default EmbeddingService;
