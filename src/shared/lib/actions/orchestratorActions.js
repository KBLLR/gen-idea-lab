/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '@store';
import { personalities } from '@shared/lib/assistant/personalities.js';
import { createArchivaEntry } from './archivaActions.js'; // Will be created later
import { upsertTasksFromAgent } from '@shared/lib/tasksIngest.js';

const get = useStore.getState;
const set = useStore.setState;

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
        set(state => state.orchestratorHistory.push({ role: 'system', parts: [{ text: '*Please select a module before using /invite.*' }] }));
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
      const entryId = createArchivaEntry(templateName); // Use imported action
      set(state => {
        state.activeApp = 'archiva';
        state.activeEntryId = entryId;
        state.orchestratorHistory.push({ role: 'system', parts: [{ text: `*Created a new **${templateName}** document in Archiva. Switched to Archiva app.*` }] });
      });
      return;
    }

    if (command === '/search') {
      const query = args.join(' ');
      if (!query) {
        set(state => {
          state.orchestratorHistory.push({ role: 'system', parts: [{ text: '*Please provide a search query. Usage: /search <your query>*' }] });
        });
        return;
      }

      // Add a searching message
      set(state => {
        state.orchestratorHistory.push({ role: 'system', parts: [{ text: `*Searching for "${query}"...*` }] });
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
            state.orchestratorHistory.push({ role: 'model', parts: [{ text: resultText }] });
          });
        })
        .catch(error => {
          console.error('Search failed:', error);
          set(state => {
            state.orchestratorHistory.push({ role: 'system', parts: [{ text: `*Search failed: ${error.message}*` }] });
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
    const systemPrompt = `You are the Orchestrator, a project coordinator AI assistant. Your role is to:\n1. Help users plan and manage their projects\n2. Invite relevant module agents when needed using /invite\n3. Use web search when needed using /search <query>\n4. Coordinate between different agents and tools\n5. Provide clear, actionable guidance\n\nAvailable commands:\n- /invite - Invite a module agent to help (user must select a module first)\n- /search <query> - Search the web for information\n\nBe helpful, concise, and action-oriented. Ask clarifying questions when needed.`;

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
      try { parsed = JSON.parse(raw); } catch { } 
      const msg = parsed?.error?.message || parsed?.error || raw || `HTTP error! status: ${status}`;
      const notFound = /NOT_FOUND|not found|is not found|not supported|Unsupported|unknown model/i.test(String(msg));
      if (notFound && modelToUse !== fallbackModel) {
        set(state => {
          state.orchestratorHistory.push({ role: 'system', parts: [{ text: `*Selected model unavailable (${modelToUse}). Falling back to ${fallbackModel}.*` }] });
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

// Ingest a structured plan object into the shared tasks store
export async function ingestPlanAsTasks(plan) {
  try {
    const items = Array.isArray(plan?.items) ? plan.items : [];
    const tasks = items.map((item) => ({
      title: item.title ?? item.name ?? 'Untitled',
      desc: item.detail ?? item.desc ?? '',
      priority: item.priority ?? 'med',
      bucket: item.bucket ?? plan?.bucket ?? 'Orchestrator',
      col: item.status === 'done' ? 'done' : item.status === 'doing' ? 'doing' : 'todo',
      assignee: item.owner ?? 'Unassigned',
      tags: item.tags ?? [],
    }));
    return upsertTasksFromAgent(tasks, { defaultBucket: plan?.bucket ?? 'Orchestrator' });
  } catch (e) {
    console.error('ingestPlanAsTasks failed:', e);
    return [];
  }
}

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
