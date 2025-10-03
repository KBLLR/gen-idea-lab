

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from './store'
import { getAssistantResponse } from './assistant.js';
import { personalities } from './assistant/personalities.js';
import gen from './llm.js'
import modes from './modes.js'
import { workflowTemplates, getWorkflowsForModule, getWorkflowById } from './workflows.js'
import { templates } from './archiva/templates.js';
import { chunkText, upsertModuleChunks } from './rag.js';
import { DEFAULT_IMAGE_MODELS, getImageProviderLabel } from './imageProviders.js'

const get = useStore.getState
const set = useStore.setState

export const init = () => {
  if (get().didInit) {
    return
  }
  set(state => {
    state.didInit = true
  })
}

// --- App Theme Actions ---
export const toggleTheme = () => {
  set(state => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
  });
};


// --- App Switching Actions ---
const apps = ['ideaLab', 'imageBooth', 'archiva', 'workflows', 'planner', 'calendarAI', 'empathyLab'];

export const switchApp = (direction) => {
  set(state => {
    const currentIndex = apps.indexOf(state.activeApp);
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % apps.length;
    } else {
      nextIndex = (currentIndex - 1 + apps.length) % apps.length;
    }

    const newApp = apps[nextIndex];
    state.activeApp = newApp;
  });
};


// --- Idea Lab Actions (now primarily for selecting an agent) ---

export const selectModule = (moduleId) => {
  set(state => {
    // If the same module is clicked again, deselect it
    if (state.activeModuleId === moduleId) {
      state.activeModuleId = null;
    } else {
      state.activeModuleId = moduleId;
      // Initialize assistant history if it doesn't exist
      if (!state.assistantHistories[moduleId]) {
        const personality = personalities[moduleId];
        state.assistantHistories[moduleId] = [{ role: 'model', responseText: personality.initialMessage }];
      }
    }
  });
};

export const updateModuleResourceUrl = (moduleId, resourceType, url) => {
  set(state => {
    const module = state.modules[moduleId];
    if (module && module.resources) {
      const resource = module.resources.find(r => r.type === resourceType);
      if (resource) {
        resource.url = url;
      }
    }
  });
};


// --- Orchestrator Actions ---
export const sendMessageToOrchestrator = async (message, options = {}) => {
    const { enableThinking = false, thinkingBudget = 'medium' } = options;
    if (!message.trim()) return;

    set(state => {
        state.orchestratorHistory.push({ role: 'user', parts: [{ text: message }] });
        // Mark that user has started a conversation
        state.orchestratorHasConversation = true;
    });

    // --- Slash Command Handling ---
    if (message.startsWith('/')) {
        const [command, ...args] = message.trim().split(' ');
        
        if (command === '/invite') {
            const { activeModuleId } = get();
            if (!activeModuleId) {
                set(state => state.orchestratorHistory.push({ role: 'system', parts: [{ text: '*Please select a module before using /invite.*'}]}));
                return;
            }
            const agent = personalities[activeModuleId];
            set(state => {
                state.orchestratorHistory.push({
                    role: 'agent-task',
                    agentName: agent.name,
                    agentIcon: agent.icon,
                    task: 'Researching initial concepts...',
                    result: `**${agent.name}** found the following resources:\n- [Link to relevant research paper]\n- [Figma Community File]\n- [GitHub Repository with similar tech]`
                });
            });
            return; // End processing here for slash command
        }

        if (command === '/document') {
          const templateName = args[0] || 'Code_Notebook'; // Default to Code_Notebook
          const entryId = createArchivaEntry(templateName);
          set(state => {
            state.activeApp = 'archiva';
            state.activeEntryId = entryId;
            state.orchestratorHistory.push({ role: 'system', parts: [{ text: `*Created a new **${templateName}** document in Archiva. Switched to Archiva app.*` }]});
          });
          return;
        }

        if (command === '/search') {
          const query = args.join(' ');
          if (!query) {
            set(state => {
              state.orchestratorHistory.push({ role: 'system', parts: [{ text: '*Please provide a search query. Usage: /search <your query>*' }]});
            });
            return;
          }

          // Add a searching message
          set(state => {
            state.orchestratorHistory.push({ role: 'system', parts: [{ text: `*Searching for "${query}"...*` }]});
          });

          // Perform the search
          fetch('/api/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ query, maxResults: 3 })
          })
          .then(response => response.json())
          .then(data => {
            let resultText = `**Search Results for "${query}":**\n\n`;

            if (data.instant_answer) {
              resultText += `**Quick Answer:** ${data.instant_answer}\n\n`;
            }

            if (data.definition) {
              resultText += `**Definition:** ${data.definition}\n\n`;
            }

            if (data.related_topics && data.related_topics.length > 0) {
              resultText += `**Related Results:**\n`;
              data.related_topics.forEach((topic, index) => {
                if (topic.title && topic.url) {
                  resultText += `${index + 1}. [${topic.title}](${topic.url})\n`;
                }
              });
            }

            if (!data.instant_answer && !data.definition && (!data.related_topics || data.related_topics.length === 0)) {
              resultText += `No specific results found for "${query}". Try refining your search terms.`;
            }

            set(state => {
              state.orchestratorHistory.push({ role: 'model', parts: [{ text: resultText }]});
            });
          })
          .catch(error => {
            console.error('Search failed:', error);
            set(state => {
              state.orchestratorHistory.push({ role: 'system', parts: [{ text: `*Search failed: ${error.message}*` }]});
            });
          });

          return;
        }

        set(state => {
            state.orchestratorHistory.push({ role: 'system', parts: [{ text: `*Unknown command: ${command}*` }] });
        });
        return;
    }


    // --- Regular Message to Orchestrator ---
    set({ isOrchestratorLoading: true });

    try {
        const { orchestratorModel, orchestratorHistory } = get();

        // Create orchestrator system prompt
        const systemPrompt = `You are the Orchestrator, a project coordinator AI assistant. Your role is to:
1. Help users plan and manage their projects
2. Invite relevant module agents when needed using /invite
3. Use web search when needed using /search <query>
4. Coordinate between different agents and tools
5. Provide clear, actionable guidance

Available commands:
- /invite - Invite a module agent to help (user must select a module first)
- /search <query> - Search the web for information

Be helpful, concise, and action-oriented. Ask clarifying questions when needed.`;

        // Build conversation history for context
        const conversationHistory = orchestratorHistory.map(msg => {
            if (msg.role === 'user') {
                return { role: 'user', content: msg.parts[0].text };
            } else if (msg.role === 'model') {
                return { role: 'assistant', content: msg.parts[0].text };
            }
            return null;
        }).filter(Boolean);

        // Add current message
        conversationHistory.push({ role: 'user', content: message });

        // Make API call using the selected orchestrator model via universal chat endpoint
        const fallbackModel = 'gemini-2.0-flash-exp';
        let modelToUse = orchestratorModel;

        async function callChat(model) {
            const resp = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    model,
                    messages: conversationHistory,
                    systemPrompt: systemPrompt,
                    enableThinking,
                    thinkingBudget
                })
            });
            const raw = await resp.text();
            return { ok: resp.ok, status: resp.status, raw };
        }

        let { ok, status, raw } = await callChat(modelToUse);

        if (!ok) {
            let parsed;
            try { parsed = JSON.parse(raw); } catch {}
            const msg = parsed?.error?.message || parsed?.error || raw || `HTTP error! status: ${status}`;
            const notFound = /NOT_FOUND|not found|is not found|not supported|Unsupported|unknown model/i.test(String(msg));
            if (notFound && modelToUse !== fallbackModel) {
                set(state => {
                    state.orchestratorHistory.push({ role: 'system', parts: [{ text: `*Selected model unavailable (${modelToUse}). Falling back to ${fallbackModel}.*` }]});
                    state.orchestratorModel = fallbackModel;
                });
                modelToUse = fallbackModel;
                ({ ok, status, raw } = await callChat(modelToUse));
            }

            if (!ok) {
                throw new Error(typeof msg === 'string' ? msg : JSON.stringify(parsed || { status }));
            }
        }

        let data;
        try { data = JSON.parse(raw); } catch {
            throw new Error(raw || 'Invalid response from chat API');
        }
        const aiResponse = data.response;

        set(state => {
            state.isOrchestratorLoading = false;
            state.orchestratorHistory.push({
                role: 'model',
                parts: [{ text: aiResponse }]
            });
        });

    } catch (error) {
        console.error('Orchestrator API call failed:', error);
        set(state => {
            state.isOrchestratorLoading = false;
            state.orchestratorHistory.push({
                role: 'system',
                parts: [{ text: `*Error: Failed to get response from orchestrator. ${error.message}*` }]
            });
        });
    }
};

export const newOrchestratorChat = () => {
    const { orchestratorHistory, orchestratorHasConversation, orchestratorModel } = get();
    const messages = orchestratorHistory || [];
    const hasConversation = orchestratorHasConversation || messages.some(m => m.role === 'user' || m.role === 'agent-task');

    // Save current session only if there was a real conversation beyond the initial greeting
    if (hasConversation && messages.length > 1) {
        const firstUser = messages.find(m => m.role === 'user');
        const title = (firstUser?.parts?.[0]?.text || 'Session').split('\n')[0].slice(0, 80);
        const session = {
            id: `session_${Date.now()}`,
            title,
            createdAt: new Date().toISOString(),
            model: orchestratorModel,
            history: messages,
        };
        set(state => {
            if (!state.orchestratorSavedSessions) state.orchestratorSavedSessions = [];
            state.orchestratorSavedSessions.unshift(session);
        });
    }

    // Reset chat to initial state
    set(state => {
        state.orchestratorHistory = [
            {
                role: 'model',
                parts: [{ text: "I am the Orchestrator. How can we start building your next project? You can select a module on the left and I can invite its agent to help us." }]
            }
        ];
        state.orchestratorHasConversation = false;
    });
};

export const restoreOrchestratorSession = (sessionId) => {
    const { orchestratorSavedSessions } = get();
    const session = (orchestratorSavedSessions || []).find(s => s.id === sessionId);
    if (!session) return;
    set(state => {
        state.orchestratorHistory = session.history || [];
        state.orchestratorHasConversation = true;
    });
};

export const deleteOrchestratorSession = (sessionId) => {
    set(state => {
        state.orchestratorSavedSessions = (state.orchestratorSavedSessions || []).filter(s => s.id !== sessionId);
    });
};

export const clearOrchestratorSessions = () => {
    set(state => {
        state.orchestratorSavedSessions = [];
    });
};

// --- Assistant Actions (Floating Chat) ---

export const toggleAssistant = () => {
    set(state => {
        state.isAssistantOpen = !state.isAssistantOpen;
    });
};

export const toggleModuleChat = () => {
    set(state => {
        state.showModuleChat = !state.showModuleChat;
    });
};

/**
 * Parse @ mentions from message content
 * Supports: @DS_17, @"the futurist", @The Learner (multi-word until punctuation)
 */
function parseMentions(content) {
    const mentions = [];
    // Match @"quoted exact name" OR @ followed by capital letter + words/underscores until punctuation/comma/period/@ or end
    const mentionRegex = /@"([^"]+)"|@([A-Z][a-zA-Z0-9_\s]+?)(?=[,.\?!]|\s+@|$)/g;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        const mention = match[1] || match[2];
        mentions.push(mention.trim());
    }

    return mentions;
}

/**
 * Find module ID by personality name or module code
 */
async function findModuleByMention(mention) {
    const { personalities } = await import('./assistant/personalities.js');

    // Try direct module code match first
    if (personalities[mention]) {
        return mention;
    }

    // Try personality name match (case-insensitive)
    const lowerMention = mention.toLowerCase();
    for (const [moduleId, personality] of Object.entries(personalities)) {
        const personalityName = personality.name.toLowerCase();
        if (personalityName === lowerMention || personalityName.includes(lowerMention)) {
            return moduleId;
        }
    }

    return null;
}

/**
 * Handle multi-agent conversation with @ mentions
 */
async function handleMultiAgentConversation(content, mentions, activeModuleId) {
    const { personalities } = await import('./assistant/personalities.js');
    const user = get().user;
    const conversationId = `multi_${activeModuleId}_${Date.now()}`;

    // Find all mentioned module IDs
    const mentionedModules = [];
    for (const mention of mentions) {
        const moduleId = await findModuleByMention(mention);
        if (moduleId && !mentionedModules.includes(moduleId)) {
            mentionedModules.push(moduleId);
        }
    }

    // Always include the active module if not mentioned
    if (!mentionedModules.includes(activeModuleId)) {
        mentionedModules.unshift(activeModuleId);
    }

    console.log(`[Multi-Agent] Mentions detected:`, mentions);
    console.log(`[Multi-Agent] Resolved modules:`, mentionedModules);

    // Get each agent to respond in turn
    for (let i = 0; i < mentionedModules.length; i++) {
        const moduleId = mentionedModules[i];
        const personality = personalities[moduleId];

        if (!personality) continue;

        // Build context-aware prompt
        let promptContent = content;

        if (i > 0) {
            // For agents responding after the first, add context about previous responses
            const history = get().assistantHistories[activeModuleId] || [];
            const previousResponses = history
                .filter(msg => msg.role === 'model')
                .slice(-mentionedModules.length + i)
                .map(msg => msg.responseText || msg.content)
                .join('\n\n');

            promptContent = `You were mentioned in a multi-agent conversation. Here's the original message:\n\n"${content}"\n\nPrevious responses from other experts:\n${previousResponses}\n\nNow please add your expertise on this topic.`;
        }

        // Get response from this agent
        const currentHistory = get().assistantHistories[activeModuleId] || [];
        if (!Array.isArray(currentHistory)) {
            console.error('[Multi-Agent] History is not an array for module:', activeModuleId);
            continue;
        }

        const response = await getAssistantResponse(
            currentHistory,
            moduleId,
            {
                enableTools: true,
                model: 'gemini-2.5-flash',
                userId: user?.email || 'anonymous',
                conversationId: `${conversationId}_${moduleId}`
            }
        );

        // Add response to history with agent info
        set(state => {
            state.assistantHistories[activeModuleId].push({
                role: 'model',
                ...response,
                agentId: moduleId,
                agentName: personality.name,
                agentIcon: personality.icon,
                toolsUsed: response.toolsUsed
            });
        });

        console.log(`[Multi-Agent] ${personality.name} responded`);
    }

    set(state => {
        state.isAssistantLoading = false;
    });
}

export const sendAssistantMessage = async (content) => {
    const { activeModuleId } = get();
    if (!content.trim() || !activeModuleId) return;

    // Parse @ mentions
    const mentions = parseMentions(content);
    const hasMentions = mentions.length > 0;

    console.log(`[Assistant] Message: "${content.substring(0, 50)}..."`);
    if (hasMentions) {
        console.log(`[Assistant] Detected ${mentions.length} @ mentions:`, mentions);
    }

    set(state => {
        state.assistantHistories[activeModuleId].push({ role: 'user', content });
        state.isAssistantLoading = true;
    });

    // Best-effort: upsert user content into per-module RAG using Ollama embeddings
    try {
      const chunks = chunkText(content);
      if (chunks.length) {
        await upsertModuleChunks(activeModuleId, chunks, {});
      }
    } catch (e) {
      console.warn('RAG upsert failed (non-blocking):', e.message);
    }

    // If there are @ mentions, use multi-agent conversation
    if (hasMentions) {
        await handleMultiAgentConversation(content, mentions, activeModuleId);
        return;
    }

    // Standard single-agent response
    const currentHistory = get().assistantHistories[activeModuleId];
    const user = get().user;
    const conversationId = `${activeModuleId}_${Date.now()}`;

    const response = await getAssistantResponse(currentHistory, activeModuleId, {
        enableTools: true,
        model: 'gemini-2.5-flash',
        userId: user?.email || 'anonymous',
        conversationId
    });

    set(state => {
        state.assistantHistories[activeModuleId].push({
            role: 'model',
            ...response,
            toolsUsed: response.toolsUsed
        });
        state.isAssistantLoading = false;
    });
};


// --- Image Booth Actions ---
export const selectMode = (modeKey) => {
  set({ activeModeKey: modeKey });
};

export const setInputImage = (base64) => {
  set({ inputImage: base64, outputImage: null, generationError: null });
};

export const generateImage = async () => {
  const { inputImage, activeModeKey, imageProvider, imageModel, connectedServices } = get();
  if (!inputImage || !activeModeKey) return;

  set({ isGenerating: true, outputImage: null, generationError: null });

  try {
    let modeDetails;
    for (const category of Object.values(modes)) {
      for (const subCategory of Object.values(category)) {
        if (subCategory[activeModeKey]) {
          modeDetails = subCategory[activeModeKey];
          break;
        }
      }
      if (modeDetails) break;
    }
    
    if (!modeDetails) throw new Error('Selected mode not found.');

    const { workflow, prompt } = modeDetails;
    const provider = imageProvider || 'gemini';
    const providerModel = imageModel || DEFAULT_IMAGE_MODELS[provider] || DEFAULT_IMAGE_MODELS.gemini;
    const providerConnected = provider === 'gemini' || connectedServices?.[provider]?.connected;

    if (!providerConnected) {
      throw new Error(`Connect the ${getImageProviderLabel(provider)} service before generating images.`);
    }

    let result;

    if (workflow && workflowTemplates[workflow]) {
      result = await workflowTemplates[workflow]({
        gen,
        model: providerModel,
        provider,
        base64: inputImage,
        prompt
      });
    } else {
      result = await gen({
        provider,
        model: providerModel,
        prompt,
        inputFile: inputImage,
      });
    }

    if (result) {
      set({ outputImage: result });
    } else {
      throw new Error('Image generation failed or was cancelled.');
    }
  } catch (error) {
    console.error("Image generation failed:", error);
    set({ generationError: error.message || 'An unknown error occurred during generation.' });
  } finally {
    set({ isGenerating: false });
  }
};


// --- Archiva Actions ---
export const setActiveEntryId = (entryId) => {
  set({ activeEntryId: entryId });
};

export const clearActiveEntryId = () => {
  set({ activeEntryId: null });
};

export const createArchivaEntry = (templateKey) => {
  const template = templates[templateKey];
  if (!template) {
    console.error(`Template ${templateKey} not found!`);
    return null;
  }

  const newEntryId = `entry_${Date.now()}`;
  const newEntry = {
    id: newEntryId,
    templateKey: templateKey,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    values: {},
  };

  // Initialize with empty values and a default title if a title field exists
  template.fields.forEach(field => {
    newEntry.values[field.field_key] = '';
  });
  if (template.fields.some(f => f.field_key === 'title')) {
      newEntry.values.title = `New ${template.name}`;
  }


  set(state => {
    state.archivaEntries[newEntryId] = newEntry;
  });

  return newEntryId;
};

export const createNewArchivaEntry = (templateKey) => {
  const newEntryId = createArchivaEntry(templateKey);
  if (newEntryId) {
    setActiveEntryId(newEntryId);
  }
};

export const updateArchivaEntry = (entryId, fieldKey, value) => {
  set(state => {
    if (state.archivaEntries[entryId]) {
      state.archivaEntries[entryId].values[fieldKey] = value;
      state.archivaEntries[entryId].updatedAt = new Date().toISOString();
    }
  });
};

export const updateArchivaEntryStatus = (entryId, status) => {
  set(state => {
    if (state.archivaEntries[entryId]) {
      state.archivaEntries[entryId].status = status;
      state.archivaEntries[entryId].updatedAt = new Date().toISOString();
    }
  });
};

// Authentication actions
export const checkAuthStatus = async () => {
  try {
    const response = await fetch('/auth/me', {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      set({
        user: data.user,
        isAuthenticated: true,
        isCheckingAuth: false,
      });
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isCheckingAuth: false,
      });
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    set({
      user: null,
      isAuthenticated: false,
      isCheckingAuth: false,
    });
  }
};

export const loginWithGoogle = async (idToken) => {
  try {
    const response = await fetch('/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
    });

    if (response.ok) {
      const data = await response.json();
      set({
        user: data.user,
        isAuthenticated: true,
      });
      return { success: true };
    } else {
      // Robust error parsing: try JSON first, then fallback to text
      const raw = await response.text();
      try {
        const errorData = JSON.parse(raw);
        return { success: false, error: errorData.error || raw };
      } catch (e) {
        return { success: false, error: raw || `Login failed with status ${response.status}` };
      }
    }
  } catch (error) {
    console.error('Login failed:', error);
    return { success: false, error: 'Network error during login' };
  }
};

export const logout = async () => {
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    set({
      user: null,
      isAuthenticated: false,
    });
  } catch (error) {
    console.error('Logout failed:', error);
    // Still clear local state even if server request fails
    set({
      user: null,
      isAuthenticated: false,
    });
  }
};

// Settings actions
export const toggleSettings = () => {
  set(state => {
    state.isSettingsOpen = !state.isSettingsOpen;
  });
};

// Service connection actions
export const connectService = async (serviceId, credentials = null) => {
  try {
    // Handle API key based connections
    if (credentials?.apiKey) {
      const response = await fetch('/auth/connect/apikey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          serviceId, 
          apiKey: credentials.apiKey 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        set(state => {
          state.connectedServices[serviceId] = {
            connected: true,
            type: 'apikey',
            connectedAt: new Date().toISOString(),
            ...result
          };
        });
        return { success: true };
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect service');
      }
    }

    // Handle URL based connections (like Ollama)
    if (credentials?.url) {
      const response = await fetch('/auth/connect/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          serviceId, 
          url: credentials.url 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        set(state => {
          state.connectedServices[serviceId] = {
            connected: true,
            type: 'url',
            connectedAt: new Date().toISOString(),
            ...result
          };
        });
        return { success: true };
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect service');
      }
    }

    // Handle OAuth based connections
    const popup = window.open(
      `/auth/connect/${serviceId}`,
      'connect-service',
      'width=600,height=600,scrollbars=yes,resizable=yes'
    );

    // Wait for OAuth completion
    const result = await new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('OAuth popup was closed'));
        }
      }, 1000);

      window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'OAUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup.close();
          resolve(event.data.payload);
        } else if (event.data.type === 'OAUTH_ERROR') {
          clearInterval(checkClosed);
          popup.close();
          reject(new Error(event.data.error));
        }
      });
    });

    // Update state with successful connection
    set(state => {
      state.connectedServices[serviceId] = {
        connected: true,
        type: 'oauth',
        ...result
      };
    });

    return { success: true };
  } catch (error) {
    console.error(`Failed to connect ${serviceId}:`, error);
    return { success: false, error: error.message };
  }
};

export const disconnectService = async (serviceId) => {
  try {
    const response = await fetch(`/auth/disconnect/${serviceId}`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      set(state => {
        delete state.connectedServices[serviceId];
      });
      return { success: true };
    } else {
      throw new Error('Failed to disconnect service');
    }
  } catch (error) {
    console.error(`Failed to disconnect ${serviceId}:`, error);
    return { success: false, error: error.message };
  }
};

export const loadConnectedServices = async () => {
  try {
    const response = await fetch('/auth/services', {
      credentials: 'include',
    });

    if (response.ok) {
      const services = await response.json();
      set(state => {
        state.connectedServices = services;
      });
    }
  } catch (error) {
    console.error('Failed to load connected services:', error);
  }
};


init()
