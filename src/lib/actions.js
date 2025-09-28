

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from './store'
import { getAssistantResponse } from './assistant.js';
import { personalities } from './assistant/personalities.js';
import gen from './llm.js'
import modes from './modes.js'
import { workflows } from './workflows.js'
import { templates } from './archiva/templates.js';

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
const apps = ['ideaLab', 'imageBooth', 'archiva'];

export const switchApp = (direction) => {
  set(state => {
    const currentIndex = apps.indexOf(state.activeApp);
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % apps.length;
    } else {
      nextIndex = (currentIndex - 1 + apps.length) % apps.length;
    }
    state.activeApp = apps[nextIndex];
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


// --- Orchestrator Actions ---
export const sendMessageToOrchestrator = async (message) => {
    if (!message.trim()) return;

    set(state => {
        state.orchestratorHistory.push({ role: 'user', parts: [{ text: message }] });
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

        set(state => {
            state.orchestratorHistory.push({ role: 'system', parts: [{ text: `*Unknown command: ${command}*` }] });
        });
        return;
    }


    // --- Regular Message to Orchestrator ---
    set({ isOrchestratorLoading: true });

    await new Promise(res => setTimeout(res, 1500)); // Simulate API call

    set(state => {
        state.isOrchestratorLoading = false;
        state.orchestratorHistory.push({ role: 'model', parts: [{ text: `This is a simulated response from the Orchestrator about "${message}". In the future, I will be able to reason, invite agents, and use tools to help you.` }] });
    });
};

// --- Assistant Actions (Floating Chat) ---

export const toggleAssistant = () => {
    set(state => {
        state.isAssistantOpen = !state.isAssistantOpen;
    });
};

export const sendAssistantMessage = async (content) => {
    const { activeModuleId } = get();
    if (!content.trim() || !activeModuleId) return;

    set(state => {
        state.assistantHistories[activeModuleId].push({ role: 'user', content });
        state.isAssistantLoading = true;
    });

    const currentHistory = get().assistantHistories[activeModuleId];
    const response = await getAssistantResponse(currentHistory, activeModuleId);

    set(state => {
        state.assistantHistories[activeModuleId].push({ role: 'model', ...response });
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
  const { inputImage, activeModeKey } = get();
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
    const model = 'gemini-2.5-flash-image-preview';
    let result;

    if (workflow && workflows[workflow]) {
      result = await workflows[workflow]({
        gen,
        model,
        base64: inputImage,
        prompt
      });
    } else {
      result = await gen({
        model,
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


init()