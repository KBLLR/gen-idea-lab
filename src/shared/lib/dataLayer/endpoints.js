/**
 * @file endpoints - Centralized API endpoint definitions
 * @license SPDX-License-Identifier: Apache-2.0
 */

/**
 * Helper to parse JSON response or throw
 * @param {Response} response - Fetch response
 * @returns {Promise<any>} Parsed JSON data
 */
async function parseResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // If JSON parsing fails, try text
      try {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      } catch (textError) {
        // Keep HTTP status message
      }
    }

    throw new Error(errorMessage);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}

/**
 * Centralized API endpoints
 * All backend API calls should be defined here for consistency
 */
export const api = {
  /**
   * Authentication endpoints
   */
  auth: {
    /**
     * Check current auth status
     * @returns {Promise<{user: Object, isAuthenticated: boolean}>}
     */
    me: async () => {
      const response = await fetch('/auth/me', {
        credentials: 'include',
      });
      return parseResponse(response);
    },

    /**
     * Login with Google ID token
     * @param {string} idToken - Google OAuth ID token
     * @returns {Promise<{user: Object}>}
     */
    loginGoogle: async (idToken) => {
      const response = await fetch('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });
      return parseResponse(response);
    },

    /**
     * Logout current user
     * @returns {Promise<void>}
     */
    logout: async () => {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      return parseResponse(response);
    },
  },

  /**
   * Service connection endpoints
   */
  services: {
    /**
     * List all connected services
     * @returns {Promise<Record<string, Object>>}
     */
    list: async () => {
      const response = await fetch('/api/services', {
        credentials: 'include',
      });
      return parseResponse(response);
    },

    /**
     * Get service configuration (server-side env vars)
     * @returns {Promise<Record<string, Object>>}
     */
    config: async () => {
      const response = await fetch('/api/services/config', {
        credentials: 'include',
      });
      return parseResponse(response);
    },

    /**
     * Connect to a service
     * @param {string} serviceId - Service identifier
     * @param {Object} credentials - Service credentials (API key, URL, etc.)
     * @returns {Promise<{success: boolean, authUrl?: string}>}
     */
    connect: async (serviceId, credentials) => {
      const response = await fetch(`/api/services/${serviceId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      return parseResponse(response);
    },

    /**
     * Disconnect from a service
     * @param {string} serviceId - Service identifier
     * @returns {Promise<{success: boolean}>}
     */
    disconnect: async (serviceId) => {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      return parseResponse(response);
    },

    /**
     * Test service connection
     * @param {string} serviceId - Service identifier
     * @returns {Promise<{success: boolean, info?: Object}>}
     */
    test: async (serviceId) => {
      const response = await fetch(`/api/services/${serviceId}/test`, {
        method: 'POST',
        credentials: 'include',
      });
      return parseResponse(response);
    },
  },

  /**
   * AI model endpoints
   */
  models: {
    /**
     * List available AI models
     * @returns {Promise<Array<{id: string, name: string, provider: string}>>}
     */
    list: async () => {
      const response = await fetch('/api/models', {
        credentials: 'include',
      });
      return parseResponse(response);
    },
  },

  /**
   * Google Drive endpoints
   */
  googleDrive: {
    /**
     * List files in Google Drive folder
     * @param {Object} [options] - Query options
     * @param {string} [options.folderId='root'] - Folder ID to list
     * @param {string} [options.q] - Search query
     * @returns {Promise<Array<Object>>}
     */
    files: async (options = {}) => {
      const { folderId = 'root', q } = options;
      const params = new URLSearchParams();
      if (folderId) params.append('folderId', folderId);
      if (q) params.append('q', q);

      const response = await fetch(
        `/api/services/googleDrive/files?${params.toString()}`,
        { credentials: 'include' }
      );
      return parseResponse(response);
    },
  },

  /**
   * Google Photos endpoints
   */
  googlePhotos: {
    /**
     * List albums
     * @returns {Promise<Array<Object>>}
     */
    albums: async () => {
      const response = await fetch('/api/services/googlePhotos/albums', {
        credentials: 'include',
      });
      return parseResponse(response);
    },

    /**
     * List media items in album
     * @param {string} albumId - Album ID
     * @returns {Promise<Array<Object>>}
     */
    mediaItems: async (albumId) => {
      const params = new URLSearchParams({ albumId });
      const response = await fetch(
        `/api/services/googlePhotos/mediaItems?${params.toString()}`,
        { credentials: 'include' }
      );
      return parseResponse(response);
    },
  },

  /**
   * Gmail endpoints
   */
  gmail: {
    /**
     * List messages
     * @param {Object} [options] - Query options
     * @param {number} [options.maxResults=10] - Max results to return
     * @param {string} [options.labelIds] - Label IDs filter (e.g., 'INBOX')
     * @param {string} [options.q] - Query string
     * @returns {Promise<Array<Object>>}
     */
    messages: async (options = {}) => {
      const { maxResults = 10, labelIds, q } = options;
      const params = new URLSearchParams({ maxResults: String(maxResults) });
      if (labelIds) params.append('labelIds', labelIds);
      if (q) params.append('q', q);

      const response = await fetch(
        `/api/services/gmail/messages?${params.toString()}`,
        { credentials: 'include' }
      );
      return parseResponse(response);
    },
  },

  /**
   * GitHub endpoints
   */
  github: {
    /**
     * List repositories
     * @returns {Promise<Array<Object>>}
     */
    repos: async () => {
      const response = await fetch('/api/services/github/repos', {
        credentials: 'include',
      });
      return parseResponse(response);
    },
  },

  /**
   * Google Calendar endpoints
   */
  googleCalendar: {
    /**
     * List calendar events
     * @param {Object} [options] - Query options
     * @param {number} [options.maxResults=50] - Maximum results to return
     * @returns {Promise<{events: Array<Object>}>}
     */
    events: async (options = {}) => {
      const { maxResults = 50 } = options;
      const params = new URLSearchParams({ maxResults: String(maxResults) });
      const response = await fetch(
        `/api/services/googleCalendar/events?${params.toString()}`,
        { credentials: 'include' }
      );
      return parseResponse(response);
    },
  },

  /**
   * Rigging endpoints
   */
  rigging: {
    /**
     * Submit rigging task
     * @param {FormData} formData - Form data with model file
     * @returns {Promise<{taskId: string, status: string}>}
     */
    submit: async (formData) => {
      const response = await fetch('/api/rigging/submit', {
        method: 'POST',
        body: formData,
      });
      return parseResponse(response);
    },

    /**
     * Get rigging task status
     * @param {string} taskId - Task ID
     * @returns {Promise<{status: string, progress: number, result?: Object}>}
     */
    status: async (taskId) => {
      const response = await fetch(`/api/rigging/status/${taskId}`);
      return parseResponse(response);
    },

    /**
     * Get download URL for rigged model
     * @param {string} taskId - Task ID
     * @returns {string} Download URL
     */
    downloadUrl: (taskId) => `/api/rigging/download-glb/${taskId}`,

    /**
     * Get gallery models
     * @returns {Promise<{models: Array<Object>}>}
     */
    gallery: async () => {
      const response = await fetch('/api/rigging/gallery');
      return parseResponse(response);
    },

    /**
     * Delete model from gallery
     * @param {string} modelId - Model ID to delete
     * @returns {Promise<{success: boolean}>}
     */
    deleteFromGallery: async (modelId) => {
      const response = await fetch(`/api/rigging/gallery/${modelId}`, {
        method: 'DELETE',
      });
      return parseResponse(response);
    },

    /**
     * Download rigged model (FBX format)
     * @param {string} taskId - Task ID
     * @returns {Promise<Blob>} Model file blob
     */
    download: async (taskId) => {
      const response = await fetch(`/api/rigging/download/${taskId}`);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      return response.blob();
    },
  },

  /**
   * Google Drive endpoints
   */
  drive: {
    /**
     * List model files from Google Drive
     * @returns {Promise<{files: Array<Object>}>}
     */
    models: async () => {
      const response = await fetch('/api/drive/models');
      return parseResponse(response);
    },
  },

  /**
   * Proxy endpoints (for AI providers)
   */
  proxy: {
    /**
     * Call AI provider via proxy
     * @param {Object} payload - Request payload
     * @param {string} payload.provider - Provider identifier
     * @param {string} payload.model - Model identifier
     * @param {Array} payload.messages - Chat messages
     * @returns {Promise<Object>} AI response
     */
    call: async (payload) => {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      return parseResponse(response);
    },

    /**
     * Stream AI response via proxy
     * @param {Object} payload - Request payload
     * @returns {ReadableStream} SSE stream
     */
    stream: async (payload) => {
      const response = await fetch('/api/proxy/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Stream failed: ${response.statusText}`);
      }

      return response.body;
    },
  },

  /**
   * University API endpoints
   */
  university: {
    /**
     * GraphQL query
     * @param {string} query - GraphQL query string
     * @param {Object} [variables] - Query variables
     * @returns {Promise<Object>}
     */
    graphql: async (query, variables = {}) => {
      const response = await fetch('/api/university/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query, variables }),
      });
      return parseResponse(response);
    },

    /**
     * Get student data
     * @returns {Promise<Object>}
     */
    studentData: async () => {
      const query = `query studentData {
        me {
          id firstName lastName email matriculationNumber
          studyPrograms { id name }
          enrollments { id course { id name } }
        }
      }`;
      const response = await fetch('/api/university/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query }),
      });
      return parseResponse(response);
    },

    /**
     * Get student courses
     * @returns {Promise<Object>}
     */
    studentCourses: async () => {
      const query = `query studentCourses {
        me {
          id
          enrollments {
            id course { id name code description }
          }
        }
      }`;
      const response = await fetch('/api/university/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query }),
      });
      return parseResponse(response);
    },
  },

  /**
   * Chat/completion endpoints
   */
  chat: {
    /**
     * Send chat completion request
     * @param {Object} payload - Chat payload
     * @param {string} payload.model - Model ID
     * @param {Array} payload.messages - Chat messages
     * @param {number} [payload.temperature] - Temperature
     * @param {number} [payload.maxTokens] - Max tokens
     * @returns {Promise<Object>}
     */
    complete: async (payload) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      return parseResponse(response);
    },

    /**
     * Send chat completion request with tool calling support
     * @param {Object} payload - Chat payload
     * @param {string} payload.model - Model ID
     * @param {Array} payload.messages - Chat messages
     * @param {string} [payload.systemPrompt] - System prompt
     * @param {Array} payload.tools - Available tools
     * @param {string} payload.provider - Provider identifier (gemini, openai, claude, ollama)
     * @returns {Promise<{response?: string, text?: string, toolCalls?: Array}>}
     */
    tools: async (payload) => {
      const response = await fetch('/api/chat/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      return parseResponse(response);
    },
  },

  /**
   * Search endpoints
   */
  search: {
    /**
     * Perform web search
     * @param {Object} payload - Search payload
     * @param {string} payload.query - Search query
     * @param {number} [payload.maxResults=3] - Maximum results to return
     * @returns {Promise<{instant_answer?: string, definition?: string, related_topics?: Array}>}
     */
    web: async (payload) => {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      return parseResponse(response);
    },
  },

  /**
   * Image generation endpoints
   */
  images: {
    /**
     * Generate image
     * @param {Object} payload - Generation payload
     * @param {string} payload.prompt - Text prompt
     * @param {string} payload.provider - Provider identifier
     * @param {string} payload.model - Model identifier
     * @param {string} [payload.inputImage] - Base64 input image for img2img
     * @returns {Promise<{imageUrl: string}>}
     */
    generate: async (payload) => {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      return parseResponse(response);
    },
  },

  /**
   * EmpathyLab endpoints
   */
  empathylab: {
    /**
     * Save emotion analysis session
     * @param {Object} payload - Session data
     * @param {Object} payload.sessionData - Session analysis data
     * @param {Object} payload.consent - User consent information
     * @param {string} payload.humeConfigId - Hume configuration ID
     * @returns {Promise<{success: boolean, sessionId: string}>}
     */
    saveSession: async (payload) => {
      const response = await fetch('/api/empathylab/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      return parseResponse(response);
    },
  },

  /**
   * Hume AI endpoints
   */
  hume: {
    /**
     * Get Hume EVI access token
     * @returns {Promise<{accessToken: string}>}
     */
    token: async () => {
      const response = await fetch('/api/services/hume/token', {
        credentials: 'include',
      });
      return parseResponse(response);
    },
  },

  /**
   * Archiva endpoints
   */
  archiva: {
    /**
     * Save mock data entry
     * @param {Object} payload - Mock data payload
     * @returns {Promise<{id: string}>}
     */
    saveMock: async (payload) => {
      const response = await fetch('/api/archivai/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      return parseResponse(response);
    },

    /**
     * Search documentation resources
     * @param {string} query - Search query
     * @returns {Promise<Array<Object>>}
     */
    searchDocs: async (query) => {
      const response = await fetch(
        `/api/modules/general/resources/documentation/search?q=${encodeURIComponent(query)}`,
        { credentials: 'include' }
      );
      return parseResponse(response);
    },

    /**
     * Load template example file
     * @param {string} templateFileName - Template file name (without .md extension)
     * @returns {Promise<string>} Template content
     */
    loadTemplateExample: async (templateFileName) => {
      const response = await fetch(`/templates/archivai/${templateFileName}.md`);
      if (!response.ok) {
        throw new Error('Template not found');
      }
      return response.text();
    },

    /**
     * Create new Archiva entry/document
     * @param {Object} payload - Entry payload
     * @param {string} payload.title - Document title
     * @param {string} payload.content - Document content
     * @param {Array<string>} [payload.tags] - Document tags
     * @returns {Promise<{success: boolean, id: string}>}
     */
    createEntry: async (payload) => {
      const response = await fetch('/api/archiva/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      return parseResponse(response);
    },
  },

  /**
   * RAG (Retrieval Augmented Generation) endpoints
   */
  rag: {
    /**
     * Query knowledge base
     * @param {Object} payload - Query payload
     * @param {string} payload.query - Search query
     * @param {string} payload.moduleId - Module identifier
     * @param {number} [payload.topK=4] - Number of results to return
     * @returns {Promise<{results: Array<Object>}>}
     */
    query: async (payload) => {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      return parseResponse(response);
    },

    /**
     * Add/update knowledge base entry
     * @param {Object} payload - Upsert payload
     * @param {string} payload.text - Text content to store
     * @param {string} payload.moduleId - Module identifier
     * @param {Object} [payload.metadata] - Additional metadata
     * @returns {Promise<{success: boolean, id: string}>}
     */
    upsert: async (payload) => {
      const response = await fetch('/api/rag/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      return parseResponse(response);
    },
  },

  /**
   * Workflow endpoints
   */
  workflow: {
    /**
     * Generate workflow documentation
     * @param {Object} payload - Documentation payload
     * @param {Object} payload.workflowResult - Workflow execution result
     * @param {string} payload.templateId - Template identifier
     * @param {boolean} [payload.enhanceWithAI=false] - Enable AI enhancement
     * @param {string} [payload.model='gemini-2.5-flash'] - Model to use for AI enhancement
     * @returns {Promise<{renderedContent: {markdown: string, html: string}}>}
     */
    generateDocs: async (payload) => {
      const response = await fetch('/api/workflow/generate-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      return parseResponse(response);
    },
  },
};

/**
 * Query keys for caching
 * Centralize query keys to avoid typos and enable refactoring
 */
export const queryKeys = {
  // Auth
  auth: 'auth',

  // Services
  services: 'services',
  serviceConfig: 'service-config',

  // Models
  models: 'models',

  // Google Drive
  driveFiles: (folderId = 'root', searchTerm = '') =>
    searchTerm ? `drive-files-search-${searchTerm}` : `drive-files-${folderId}`,

  // Google Photos
  photoAlbums: 'photo-albums',
  photoMediaItems: (albumId) => `photo-media-${albumId}`,

  // Gmail
  gmailMessages: (options = {}) => {
    const { maxResults = 10, labelIds = '', q = '' } = options;
    return `gmail-messages-${maxResults}-${labelIds}-${q}`;
  },

  // University
  universityStudent: 'university-student',
  universityCourses: 'university-courses',

  // GitHub
  githubRepos: 'github-repos',

  // Rigging
  riggingTask: (taskId) => `rigging-task-${taskId}`,
};
