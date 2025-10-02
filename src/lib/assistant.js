/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { personalities } from './assistant/personalities.js';
import { queryModule } from './rag.js';
import { ASSISTANT_TOOLS, executeAssistantTool } from './assistantTools.js';

/**
 * Get assistant response with tool support
 * @param {Array} history - Conversation history
 * @param {string} activePersonalityId - Active personality/module ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Response object with responseText
 */
export const getAssistantResponse = async (history, activePersonalityId, options = {}) => {
    const { enableTools = true, model = 'gemini-2.5-flash', userId, conversationId } = options;

    const activePersonality = personalities[activePersonalityId];
    if (!activePersonality) {
        return { responseText: "I'm sorry, I can't find my instructions for this module." };
    }

    // Ensure history is an array
    if (!Array.isArray(history)) {
        console.warn('[Assistant] History is not an array, using empty history:', history);
        history = [];
    }

    try {
        // Build retrieval context from per-module RAG (short-term query = last user message)
        let retrievalContext = '';
        try {
            const lastUser = [...history].reverse().find(m => m.role === 'user');
            if (lastUser && lastUser.content) {
                const top = await queryModule(activePersonalityId, lastUser.content, { topK: 4 });
                if (top && top.length) {
                    const merged = top.map((t, i) => `#${i+1} ${t.text}`).join('\n\n');
                    retrievalContext = `\n\nRelevant context from your knowledge base (top ${Math.min(4, top.length)}):\n${merged}`;
                }
            }
        } catch (e) {
            // RAG is best-effort; continue without it
        }

        // Build conversation messages
        const messages = history
            .filter(msg => msg.responseText !== activePersonality.initialMessage) // Skip greeting
            .map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content || msg.responseText
            }));

        // Build system instruction
        const systemInstruction = `${activePersonality.systemInstruction}${retrievalContext}

You must respond in a friendly, conversational way, in character with your persona. Your response should contain helpful information and project ideas relevant to the user's query.`;

        if (enableTools) {
            // Use tools for enhanced capabilities
            return await getAssistantResponseWithTools({
                messages,
                systemInstruction,
                model,
                moduleId: activePersonalityId,
                userId,
                conversationId
            });
        } else {
            // Simple chat without tools
            return await getAssistantResponseSimple({
                messages,
                systemInstruction,
                model
            });
        }

    } catch (e) {
        console.error("Failed to fetch or parse assistant response:", e);
        return {
            responseText: "I'm sorry, I had a little trouble processing your request. Could you try asking in a different way?",
        };
    }
};

/**
 * Get assistant response with tool calling support
 */
async function getAssistantResponseWithTools({ messages, systemInstruction, model, moduleId, userId, conversationId }) {
    const tools = Object.values(ASSISTANT_TOOLS);
    const provider = model.startsWith('gpt-') ? 'openai' : model.startsWith('claude-') ? 'claude' : 'gemini';

    // First request
    const requestBody = {
        model,
        messages,
        systemPrompt: systemInstruction,
        tools,
        provider
    };

    const response = await fetch('/api/chat/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Check if assistant wants to use tools
    if (data.toolCalls && data.toolCalls.length > 0) {
        console.log('[Assistant Tools] Executing:', data.toolCalls.map(tc => tc.name));

        // Execute tool calls
        const toolResults = [];
        for (const toolCall of data.toolCalls) {
            try {
                const result = await executeAssistantTool(toolCall.name, toolCall.args, {
                    moduleId,
                    userId,
                    conversationId
                });
                toolResults.push({
                    toolCallId: toolCall.id,
                    name: toolCall.name,
                    result
                });
            } catch (error) {
                toolResults.push({
                    toolCallId: toolCall.id,
                    name: toolCall.name,
                    result: {
                        success: false,
                        error: error.message
                    }
                });
            }
        }

        // Follow-up request with tool results
        const followupBody = {
            model,
            messages: [
                ...messages,
                {
                    role: 'assistant',
                    toolCalls: data.toolCalls
                },
                {
                    role: 'tool',
                    toolResults
                }
            ],
            systemPrompt: systemInstruction,
            provider
        };

        const followupResponse = await fetch('/api/chat/tools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(followupBody),
        });

        if (!followupResponse.ok) {
            const error = await followupResponse.json();
            throw new Error(error.error || `Follow-up failed: ${followupResponse.status}`);
        }

        const followupData = await followupResponse.json();
        const responseText = followupData.response || followupData.text || '';

        return {
            responseText: sanitizeResponse(responseText),
            toolsUsed: data.toolCalls.map(tc => tc.name)
        };
    }

    // No tools used
    const responseText = data.response || data.text || '';
    return {
        responseText: sanitizeResponse(responseText)
    };
}

/**
 * Get assistant response without tools (simple chat)
 */
async function getAssistantResponseSimple({ messages, systemInstruction, model }) {
    const requestBody = {
        model,
        messages,
        systemPrompt: systemInstruction
    };

    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.response || data.text || '';

    return {
        responseText: sanitizeResponse(responseText)
    };
}

/**
 * Sanitize response HTML
 */
function sanitizeResponse(text) {
    return text
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
        .replace(/\n/g, '<br />'); // Newlines
}