/**
 * Notion API Client
 *
 * Wrapper around Notion API for creating pages, databases, and managing content.
 * Uses the official @notionhq/client library.
 */

import { Client } from '@notionhq/client';

/**
 * Convert markdown to Notion blocks (simplified)
 * In production, use a proper markdown-to-notion converter
 */
function markdownToNotionBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: line.slice(4) } }]
        }
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: line.slice(3) } }]
        }
      });
    } else if (line.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
    }
    // Code blocks
    else if (line.startsWith('```')) {
      const language = line.slice(3).trim() || 'plain text';
      const codeLines = [];
      i++;

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }

      blocks.push({
        object: 'block',
        type: 'code',
        code: {
          rich_text: [{ type: 'text', text: { content: codeLines.join('\n') } }],
          language: language
        }
      });
    }
    // Bullet lists
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(line)) {
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{ type: 'text', text: { content: line.replace(/^\d+\.\s/, '') } }]
        }
      });
    }
    // Regular paragraph
    else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line } }]
        }
      });
    }

    i++;
  }

  return blocks;
}

/**
 * Notion Client Class
 */
export class NotionClient {
  constructor(accessToken) {
    this.notion = new Client({ auth: accessToken });
    this.accessToken = accessToken;
  }

  /**
   * Create a new page in Notion workspace
   */
  async createPage({ title, content, moduleCode, tags = [], parentPageId }) {
    try {
      // Convert markdown content to Notion blocks
      const contentBlocks = markdownToNotionBlocks(content);

      // Prepare page properties
      const properties = {
        title: {
          title: [{ type: 'text', text: { content: title } }]
        }
      };

      // Add module code if database has the property
      if (moduleCode) {
        properties['Module'] = {
          rich_text: [{ type: 'text', text: { content: moduleCode } }]
        };
      }

      // Add tags if database has the property
      if (tags.length > 0) {
        properties['Tags'] = {
          multi_select: tags.map(tag => ({ name: tag }))
        };
      }

      // Determine parent (either specific page or default database)
      let parent;
      if (parentPageId) {
        parent = { page_id: parentPageId };
      } else {
        // Use default parent or create in root
        // In production, get user's default workspace ID
        parent = { page_id: process.env.NOTION_DEFAULT_PAGE_ID || 'workspace' };
      }

      // Create page
      const response = await this.notion.pages.create({
        parent,
        properties,
        children: contentBlocks
      });

      return {
        success: true,
        pageId: response.id,
        url: response.url,
        title,
        createdAt: response.created_time
      };
    } catch (error) {
      console.error('[NotionClient] Error creating page:', error);
      throw error;
    }
  }

  /**
   * Append content to existing page
   */
  async appendContent({ pageId, content, position = 'bottom' }) {
    try {
      const contentBlocks = markdownToNotionBlocks(content);

      if (position === 'top') {
        // Get existing blocks and prepend new content
        const blocks = await this.notion.blocks.children.list({ block_id: pageId });

        // Insert at top by deleting and recreating (Notion limitation)
        // In production, use proper block insertion
        await this.notion.blocks.children.append({
          block_id: pageId,
          children: contentBlocks
        });
      } else {
        // Append to bottom
        await this.notion.blocks.children.append({
          block_id: pageId,
          children: contentBlocks
        });
      }

      return {
        success: true,
        pageId,
        blocksAdded: contentBlocks.length
      };
    } catch (error) {
      console.error('[NotionClient] Error appending content:', error);
      throw error;
    }
  }

  /**
   * Search pages by query
   */
  async searchPages({ query, moduleCode, limit = 10 }) {
    try {
      const searchParams = {
        query,
        page_size: limit,
        filter: {
          property: 'object',
          value: 'page'
        }
      };

      // Add module filter if specified
      if (moduleCode) {
        searchParams.filter = {
          and: [
            { property: 'object', value: 'page' },
            {
              property: 'Module',
              rich_text: { contains: moduleCode }
            }
          ]
        };
      }

      const response = await this.notion.search(searchParams);

      const results = response.results.map(page => ({
        pageId: page.id,
        title: page.properties?.title?.title?.[0]?.plain_text || 'Untitled',
        url: page.url,
        module: page.properties?.Module?.rich_text?.[0]?.plain_text,
        tags: page.properties?.Tags?.multi_select?.map(t => t.name) || [],
        lastEdited: page.last_edited_time,
        createdAt: page.created_time
      }));

      return {
        success: true,
        results,
        count: results.length,
        query
      };
    } catch (error) {
      console.error('[NotionClient] Error searching pages:', error);
      throw error;
    }
  }

  /**
   * Create a database
   */
  async createDatabase({ name, moduleCode, schema, parentPageId }) {
    try {
      const parent = parentPageId
        ? { page_id: parentPageId }
        : { page_id: process.env.NOTION_DEFAULT_PAGE_ID || 'workspace' };

      const properties = {
        Name: { title: {} },
        Module: { rich_text: {} },
        Tags: { multi_select: {} },
        'Created At': { created_time: {} },
        ...schema.properties
      };

      const response = await this.notion.databases.create({
        parent,
        title: [{ type: 'text', text: { content: name } }],
        properties
      });

      return {
        success: true,
        databaseId: response.id,
        url: response.url,
        name
      };
    } catch (error) {
      console.error('[NotionClient] Error creating database:', error);
      throw error;
    }
  }

  /**
   * Get page by ID
   */
  async getPage({ pageId, includeContent = true }) {
    try {
      const page = await this.notion.pages.retrieve({ page_id: pageId });

      const result = {
        success: true,
        pageId: page.id,
        title: page.properties?.title?.title?.[0]?.plain_text || 'Untitled',
        url: page.url,
        lastEdited: page.last_edited_time,
        createdAt: page.created_time,
        properties: page.properties
      };

      if (includeContent) {
        const blocks = await this.notion.blocks.children.list({ block_id: pageId });
        result.content = blocks.results;
      }

      return result;
    } catch (error) {
      console.error('[NotionClient] Error getting page:', error);
      throw error;
    }
  }

  /**
   * Update page properties
   */
  async updatePage({ pageId, title, properties = {} }) {
    try {
      const updateData = { page_id: pageId, properties: {} };

      if (title) {
        updateData.properties.title = {
          title: [{ type: 'text', text: { content: title } }]
        };
      }

      // Add other properties
      Object.assign(updateData.properties, properties);

      const response = await this.notion.pages.update(updateData);

      return {
        success: true,
        pageId: response.id,
        url: response.url,
        lastEdited: response.last_edited_time
      };
    } catch (error) {
      console.error('[NotionClient] Error updating page:', error);
      throw error;
    }
  }
}

export default NotionClient;
