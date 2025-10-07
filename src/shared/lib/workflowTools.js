/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Workflow Tools System
 * Provides tool execution with multi-provider function calling support
 */

/**
 * Tool Definitions - Universal schema for all providers
 */
export const WORKFLOW_TOOLS = {
  web_search: {
    name: 'web_search',
    description: 'Search the web for information using available search providers (Google, Brave, DuckDuckGo)',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
          default: 5
        }
      },
      required: ['query']
    }
  },

  rag_query: {
    name: 'rag_query',
    description: 'Query the module knowledge base (RAG) for relevant information',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The query to search in the knowledge base'
        },
        module_id: {
          type: 'string',
          description: 'Optional module ID to scope the search'
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

  rag_upsert: {
    name: 'rag_upsert',
    description: 'Add or update notes in the module knowledge base',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text content to add to the knowledge base'
        },
        module_id: {
          type: 'string',
          description: 'Module ID to associate the note with'
        },
        metadata: {
          type: 'object',
          description: 'Optional metadata for the note'
        }
      },
      required: ['text', 'module_id']
    }
  },

  create_document: {
    name: 'create_document',
    description: 'Create a new document in ArchivAI',
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
        template_id: {
          type: 'string',
          description: 'Optional ArchivAI template ID'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tags for the document'
        }
      },
      required: ['title', 'content']
    }
  },

  image_generation: {
    name: 'image_generation',
    description: 'Generate an image using the Image Booth',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The image generation prompt'
        },
        provider: {
          type: 'string',
          enum: ['gemini', 'openai', 'drawthings'],
          description: 'Image generation provider (default: gemini)',
          default: 'gemini'
        },
        model: {
          type: 'string',
          description: 'Optional specific model to use'
        }
      },
      required: ['prompt']
    }
  },

  invite_agent: {
    name: 'invite_agent',
    description: 'Invite a module assistant to join the conversation',
    parameters: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          description: 'The assistant/module ID to invite'
        },
        context: {
          type: 'string',
          description: 'Optional context to provide to the agent'
        }
      },
      required: ['agent_id']
    }
  },

  app_state_snapshot: {
    name: 'app_state_snapshot',
    description: 'Capture current application state for workflow context',
    parameters: {
      type: 'object',
      properties: {
        include_modules: {
          type: 'boolean',
          description: 'Include module state (default: true)',
          default: true
        },
        include_archiva: {
          type: 'boolean',
          description: 'Include ArchivAI state (default: true)',
          default: true
        },
        include_planner: {
          type: 'boolean',
          description: 'Include planner state (default: false)',
          default: false
        }
      },
      required: []
    }
  },

  fetch_research_papers: {
    name: 'fetch_research_papers',
    description: 'Fetch academic papers and research resources from ArXiv, HuggingFace Papers, Semantic Scholar, and GitHub Awesome lists. Optionally save to knowledge base.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The research topic or subject to search for'
        },
        sources: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['arxiv', 'huggingface', 'semantic_scholar', 'github_awesome']
          },
          description: 'Sources to search (default: all)',
          default: ['arxiv', 'huggingface', 'semantic_scholar']
        },
        max_results: {
          type: 'number',
          description: 'Maximum results per source (default: 5)',
          default: 5
        },
        save_to_knowledge: {
          type: 'boolean',
          description: 'Automatically save results to knowledge base (default: true)',
          default: true
        },
        module_id: {
          type: 'string',
          description: 'Module ID to save results to (required if save_to_knowledge is true)'
        }
      },
      required: ['topic']
    }
  }
};

/**
 * Convert tool definitions to provider-specific format
 */
export const ToolAdapters = {
  /**
   * Gemini function calling format
   */
  gemini: {
    convertTools(tools) {
      return tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }));
    },

    formatToolCall(toolCall) {
      return {
        name: toolCall.name,
        args: toolCall.args
      };
    },

    buildRequestWithTools(prompt, systemPrompt, tools, settings) {
      return {
        model: settings.model || 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: settings.temperature || 0.7,
          maxOutputTokens: settings.maxTokens || 2000,
        },
        tools: this.convertTools(tools)
      };
    }
  },

  /**
   * OpenAI function calling format
   */
  openai: {
    convertTools(tools) {
      return tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      }));
    },

    formatToolCall(toolCall) {
      return {
        name: toolCall.function.name,
        args: JSON.parse(toolCall.function.arguments)
      };
    },

    buildRequestWithTools(prompt, systemPrompt, tools, settings) {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];

      return {
        model: settings.model || 'gpt-4o-mini',
        messages,
        temperature: settings.temperature || 0.7,
        max_tokens: settings.maxTokens || 2000,
        tools: this.convertTools(tools),
        tool_choice: 'auto'
      };
    }
  },

  /**
   * Claude (Anthropic) function calling format
   */
  claude: {
    convertTools(tools) {
      return tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters
      }));
    },

    formatToolCall(toolCall) {
      return {
        name: toolCall.name,
        args: toolCall.input
      };
    },

    buildRequestWithTools(prompt, systemPrompt, tools, settings) {
      return {
        model: settings.model || 'claude-3-5-haiku-20241022',
        messages: [
          { role: 'user', content: prompt }
        ],
        system: systemPrompt,
        max_tokens: settings.maxTokens || 2000,
        temperature: settings.temperature || 0.7,
        tools: this.convertTools(tools)
      };
    }
  },

  /**
   * Ollama function calling format (newer models support tools)
   */
  ollama: {
    convertTools(tools) {
      // Ollama uses OpenAI-compatible format
      return tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      }));
    },

    formatToolCall(toolCall) {
      return {
        name: toolCall.function.name,
        args: JSON.parse(toolCall.function.arguments)
      };
    },

    buildRequestWithTools(prompt, systemPrompt, tools, settings) {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];

      return {
        model: settings.model || 'gpt-oss:20b',
        messages,
        temperature: settings.temperature || 0.7,
        tools: this.convertTools(tools),
        stream: false
      };
    }
  }
};

/**
 * Execute a tool and return results
 */
export async function executeTool(toolName, args) {
  console.log(`[Tool Execution] ${toolName}`, args);

  switch (toolName) {
    case 'web_search':
      return await executeWebSearch(args);

    case 'rag_query':
      return await executeRAGQuery(args);

    case 'rag_upsert':
      return await executeRAGUpsert(args);

    case 'create_document':
      return await executeCreateDocument(args);

    case 'image_generation':
      return await executeImageGeneration(args);

    case 'invite_agent':
      return await executeInviteAgent(args);

    case 'app_state_snapshot':
      return await executeAppStateSnapshot(args);

    case 'fetch_research_papers':
      return await executeFetchResearchPapers(args);

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Tool Implementation: Web Search
 */
async function executeWebSearch({ query, max_results = 5 }) {
  try {
    // Use Ollama web search if available, otherwise use Google Custom Search
    const response = await fetch('/api/tools/web-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, max_results })
    });

    if (!response.ok) {
      throw new Error(`Web search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      results: data.results || [],
      summary: `Found ${data.results?.length || 0} results for "${query}"`
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
 * Tool Implementation: RAG Query
 */
async function executeRAGQuery({ query, module_id, top_k = 4 }) {
  try {
    const response = await fetch('/api/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, moduleId: module_id, topK: top_k })
    });

    if (!response.ok) {
      throw new Error(`RAG query failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      results: data.results || [],
      summary: `Found ${data.results?.length || 0} relevant chunks`
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
 * Tool Implementation: RAG Upsert
 */
async function executeRAGUpsert({ text, module_id, metadata = {} }) {
  try {
    const response = await fetch('/api/rag/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        moduleId: module_id,
        metadata
      })
    });

    if (!response.ok) {
      throw new Error(`RAG upsert failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      id: data.id,
      summary: `Added note to ${module_id} knowledge base`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tool Implementation: Create Document
 */
async function executeCreateDocument({ title, content, template_id, tags = [] }) {
  try {
    const response = await fetch('/api/archiva/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        templateId: template_id,
        tags
      })
    });

    if (!response.ok) {
      throw new Error(`Document creation failed: ${response.statusText}`);
    }

    const data = await response.json();
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
 * Tool Implementation: Image Generation
 */
async function executeImageGeneration({ prompt, provider = 'gemini', model }) {
  try {
    const response = await fetch('/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        model,
        prompt
      })
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      image: data.image,
      summary: `Generated image with ${provider}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tool Implementation: Invite Agent
 */
async function executeInviteAgent({ agent_id, context }) {
  // This would typically update UI state or trigger agent communication
  return {
    success: true,
    agent_id,
    summary: `Invited agent: ${agent_id}${context ? ` with context` : ''}`,
    note: 'Agent invitation recorded (UI integration pending)'
  };
}

/**
 * Tool Implementation: App State Snapshot
 */
async function executeAppStateSnapshot({ include_modules = true, include_archiva = true, include_planner = false }) {
  try {
    const snapshot = {};

    if (include_modules) {
      // Get module state from store or API
      snapshot.modules = {
        active: 'Would fetch active modules',
        // This would pull from useStore in actual implementation
      };
    }

    if (include_archiva) {
      snapshot.archiva = {
        entries: 'Would fetch recent entries',
        // This would pull from Archiva API
      };
    }

    if (include_planner) {
      snapshot.planner = {
        workflows: 'Would fetch workflows',
        // This would pull from planner state
      };
    }

    return {
      success: true,
      snapshot,
      summary: `Captured app state snapshot`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tool Implementation: Fetch Research Papers
 */
async function executeFetchResearchPapers({
  topic,
  sources = ['arxiv', 'huggingface', 'semantic_scholar'],
  max_results = 5,
  save_to_knowledge = true,
  module_id
}) {
  try {
    console.log(`[Research Tool] Fetching papers on "${topic}" from:`, sources);

    const response = await fetch('/api/tools/research-papers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        sources,
        max_results,
        save_to_knowledge,
        module_id
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Research papers fetch failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      papers: data.papers || [],
      resources: data.resources || [],
      sources_searched: data.sources_searched || sources,
      total_found: data.total_found || 0,
      saved_to_knowledge: data.saved_to_knowledge || false,
      summary: `Found ${data.total_found || 0} research papers/resources on "${topic}"${save_to_knowledge ? ' and saved to knowledge base' : ''}`
    };
  } catch (error) {
    console.error('[Research Tool] Error:', error);
    return {
      success: false,
      error: error.message,
      papers: [],
      resources: []
    };
  }
}
