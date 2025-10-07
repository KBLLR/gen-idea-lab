/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '@store';
import { getAssistantResponse } from '@apps/ideaLab/lib/assistant.js';
import { personalities } from '@shared/lib/assistant/personalities.js';
import { chunkText, upsertModuleChunks } from '@shared/lib/rag.js';

const get = useStore.getState;
const set = useStore.setState;

// --- Assistant Actions (Floating Chat) ---

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
  const mentionRegex = /@"([^\"]+)"|@([A-Z][a-zA-Z0-9_\s]+?)(?=[,.?!]|\s+@|$)/g;
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
const { personalities } = await import('@apps/ideaLab/lib/personalities.js');

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
const { personalities } = await import('@apps/ideaLab/lib/personalities.js');
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

  console.log(`[Assistant] Message: "${content.substring(0, 50)}"...`);
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

  const model = get().assistantModel || 'gemini-2.5-flash';
  const systemPromptOverride = get().assistantSystemPrompts?.[activeModuleId] || '';
  const response = await getAssistantResponse(currentHistory, activeModuleId, {
    enableTools: true,
    model,
    userId: user?.email || 'anonymous',
    conversationId,
    systemPromptOverride
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
