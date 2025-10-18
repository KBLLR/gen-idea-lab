/**
 * Notion MCP Server - Tool Definitions
 *
 * Tools for creating and managing Notion pages and databases
 * for module learning notes and knowledge bases.
 */

export const notionTools = [
  {
    name: 'notion_create_page',
    description: 'Create a new Notion page in student workspace with markdown content',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Page title'
        },
        content: {
          type: 'string',
          description: 'Page content in markdown format'
        },
        moduleCode: {
          type: 'string',
          description: 'Module code (e.g., OS_01) for organization'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization'
        },
        parentPageId: {
          type: 'string',
          description: 'Optional parent page ID to nest under'
        }
      },
      required: ['title', 'content', 'moduleCode']
    }
  },

  {
    name: 'notion_append_content',
    description: 'Add content to an existing Notion page',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'Notion page ID to append to'
        },
        content: {
          type: 'string',
          description: 'Content to append (markdown format)'
        },
        position: {
          type: 'string',
          enum: ['top', 'bottom'],
          description: 'Where to add content (default: bottom)'
        }
      },
      required: ['pageId', 'content']
    }
  },

  {
    name: 'notion_search_pages',
    description: 'Search student Notion pages by query',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        moduleCode: {
          type: 'string',
          description: 'Filter by module code (optional)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
          default: 10
        }
      },
      required: ['query']
    }
  },

  {
    name: 'notion_create_database',
    description: 'Create a structured database for organizing module content (e.g., concept glossary, resource library)',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Database name'
        },
        moduleCode: {
          type: 'string',
          description: 'Module code for organization'
        },
        schema: {
          type: 'object',
          description: 'Database properties schema',
          properties: {
            properties: {
              type: 'object',
              description: 'Column definitions'
            }
          }
        },
        parentPageId: {
          type: 'string',
          description: 'Optional parent page ID'
        }
      },
      required: ['name', 'moduleCode', 'schema']
    }
  },

  {
    name: 'notion_get_page',
    description: 'Retrieve a Notion page by ID',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'Notion page ID'
        },
        includeContent: {
          type: 'boolean',
          description: 'Include page content blocks (default: true)',
          default: true
        }
      },
      required: ['pageId']
    }
  },

  {
    name: 'notion_update_page',
    description: 'Update Notion page properties (title, tags, etc.)',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'Notion page ID'
        },
        title: {
          type: 'string',
          description: 'New page title (optional)'
        },
        properties: {
          type: 'object',
          description: 'Properties to update'
        }
      },
      required: ['pageId']
    }
  }
];

export default notionTools;
