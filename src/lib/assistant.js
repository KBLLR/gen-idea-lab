/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Type } from '@google/genai';
import { personalities } from './assistant/personalities.js';

// The GoogleGenAI object is no longer initialized on the client.

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        responseText: {
            type: Type.STRING,
            description: "Your friendly, conversational response to the user, in character. This should contain helpful information and project ideas relevant to the user's query and your persona."
        }
    },
    required: ["responseText"]
};


export const getAssistantResponse = async (history, activePersonalityId) => {
    const activePersonality = personalities[activePersonalityId];
    if (!activePersonality) {
        return { responseText: "I'm sorry, I can't find my instructions for this module." };
    }

    const contents = [];

    // Add previous history to the conversation
    history.forEach(msg => {
        // Skip the initial greeting message in the history sent to the API
        if (msg.responseText === activePersonality.initialMessage) return;

        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content || msg.responseText }]
        });
    });

    const body = {
        model: 'gemini-2.5-flash',
        contents,
        config: {
            systemInstruction: activePersonality.systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.7,
        }
    };

    try {
        const fetchResponse = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!fetchResponse.ok) {
            const error = await fetchResponse.json();
            throw new Error(error.error || `Server returned status: ${fetchResponse.status}`);
        }
        
        const response = await fetchResponse.json();
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        // Sanitize the response HTML to prevent self-injection issues
        if (parsed.responseText) {
            parsed.responseText = parsed.responseText
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
                .replace(/\n/g, '<br />'); // Newlines
        }
        return parsed;

    } catch (e) {
        console.error("Failed to fetch or parse assistant response:", e);
        return {
            responseText: "I'm sorry, I had a little trouble formatting my response. Could you try asking in a different way?",
        };
    }
};