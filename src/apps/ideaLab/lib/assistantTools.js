/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MIGRATED: Now uses centralized API endpoints
 */

import { api } from '@shared/lib/dataLayer/endpoints.js';

/**
 * Assistant-specific tools
 * These tools are available to module assistants during chat
 */

export const ASSISTANT_TOOLS = {
  query_knowledge_base: {
    name: 'query_knowledge_base',
    description: 'Search the module knowledge base for relevant information. Use this when you need to recall specific facts, notes, or context about the current module.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant information'
        },
        top_k: {
          type: 'number',
          description: 'Number of results to return (default: 4)',
          default: 4
        }
      },
      required: ['query']
    }
  },

  add_to_knowledge_base: {
    name: 'add_to_knowledge_base',
    description: 'Save important information to the module knowledge base for future reference. Use this to remember key facts, decisions, or context from the conversation.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text content to save to the knowledge base'
        },
        metadata: {
          type: 'object',
          description: 'Optional metadata (tags, source, etc.)'
        }
      },
      required: ['text']
    }
  },

  search_web: {
    name: 'search_web',
    description: 'Search the web for current information. Use this when you need up-to-date information or facts that are not in the knowledge base.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results (default: 3)',
          default: 3
        }
      },
      required: ['query']
    }
  },

  create_archiva_document: {
    name: 'create_archiva_document',
    description: 'Create a new document in ArchivAI. Use this to save important findings, summaries, or reports.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Document title'
        },
        content: {
          type: 'string',
          description: 'Document content in markdown format'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for the document'
        }
      },
      required: ['title', 'content']
    }
  },

  get_conversation_context: {
    name: 'get_conversation_context',
    description: 'Retrieve previous conversation context and history. Use this to recall what was discussed earlier.',
    parameters: {
      type: 'object',
      properties: {
        messages_back: {
          type: 'number',
          description: 'Number of messages to retrieve (default: 10)',
          default: 10
        }
      },
      required: []
    }
  },

  save_conversation_memory: {
    name: 'save_conversation_memory',
    description: 'Save important information from this conversation to long-term memory. Use this for key insights, decisions, or facts that should be remembered.',
    parameters: {
      type: 'object',
      properties: {
        memory_text: {
          type: 'string',
          description: 'The text to save to long-term memory'
        },
        memory_type: {
          type: 'string',
          enum: ['fact', 'preference', 'decision', 'insight', 'other'],
          description: 'Type of memory being saved'
        }
      },
      required: ['memory_text']
    }
  }
};

/**
 * Execute assistant tool
 */
export async function executeAssistantTool(toolName, args, context = {}) {
  const { moduleId, userId, conversationId } = context;

  console.log(`[Assistant Tool] ${toolName}`, args, context);

  switch (toolName) {
    case 'query_knowledge_base':
      return await executeQueryKnowledgeBase(args, { moduleId });

    case 'add_to_knowledge_base':
      return await executeAddToKnowledgeBase(args, { moduleId });

    case 'search_web':
      return await executeSearchWeb(args);

    case 'create_archiva_document':
      return await executeCreateArchivaDocument(args);

    case 'get_conversation_context':
      return await executeGetConversationContext(args, { conversationId });

    case 'save_conversation_memory':
      return await executeSaveConversationMemory(args, { moduleId, userId, conversationId });

    default:
      throw new Error(`Unknown assistant tool: ${toolName}`);
  }
}

/**
 * Query knowledge base
 */
async function executeQueryKnowledgeBase({ query, top_k = 4 }, { moduleId }) {
  try {
    const data = await api.rag.query({
      query,
      moduleId,
      topK: top_k
    });

    return {
      success: true,
      results: data.results || [],
      summary: data.results?.length > 0
        ? `Found ${data.results.length} relevant items in the knowledge base`
        : 'No relevant information found in the knowledge base'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

/**
 * Add to knowledge base
 */
async function executeAddToKnowledgeBase({ text, metadata = {} }, { moduleId }) {
  try {
    const data = await api.rag.upsert({
      text,
      moduleId,
      metadata
    });

    return {
      success: true,
      id: data.id,
      summary: 'Successfully saved to knowledge base'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Search web
 */
async function executeSearchWeb({ query, max_results = 3 }) {
  try {
    const data = await api.search.web({
      query,
      maxResults: max_results
    });

    return {
      success: true,
      results: data.results || [],
      source: data.source,
      summary: data.results?.length > 0
        ? `Found ${data.results.length} web results`
        : 'No web results found'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

/**
 * Create Archiva document
 */
async function executeCreateArchivaDocument({ title, content, tags = [] }) {
  try {
    const data = await api.archiva.createEntry({
      title,
      content,
      tags
    });

    return {
      success: true,
      document_id: data.id,
      summary: `Created document: "${title}"`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get conversation context
 */
async function executeGetConversationContext({ messages_back = 10 }, { conversationId }) {
  try {
    // For now, return a message indicating this needs conversation history storage
    // In a full implementation, this would query a conversation history database

    return {
      success: true,
      messages: [],
      summary: 'Conversation context retrieval (pending full implementation)',
      note: 'This tool will retrieve previous conversation context when conversation storage is implemented'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Save conversation memory
 */
async function executeSaveConversationMemory({ memory_text, memory_type = 'other' }, { moduleId, userId, conversationId }) {
  try {
    // Save to knowledge base as a memory
    const data = await api.rag.upsert({
      text: memory_text,
      moduleId,
      metadata: {
        type: 'conversation_memory',
        memory_type,
        conversation_id: conversationId,
        user_id: userId,
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: true,
      memory_id: data.id,
      summary: `Saved ${memory_type} to long-term memory`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
