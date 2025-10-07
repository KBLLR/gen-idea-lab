import express from 'express';
import logger from '../../src/shared/lib/logger.js';
import { requireAuth } from '../../src/shared/lib/auth.js';
import { httpRequestDurationMicroseconds, httpRequestsTotal } from '../../src/shared/lib/metrics.js';

function isOllamaModelId(model = '') {
  const m = (model || '').toLowerCase().trim();
  const prefixes = ['gemma','llama','qwen','mistral','mixtral','phi','yi','deepseek','gpt-oss','neural','starling','command'];
  return m.includes(':') || prefixes.some(p => m.startsWith(p));
}

export default function createChatRouter({ getUserConnections, getGeminiClient }) {
  const router = express.Router();

  // Universal chat endpoint
  router.post('/chat', requireAuth, async (req, res) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    try {
      const { model, messages, systemPrompt, enableThinking = false, thinkingBudget = 'medium' } = req.body;
      if (!model || !messages) {
        logger.warn('Bad request to /api/chat', { body: req.body });
        return res.status(400).json({ error: 'Missing "model" or "messages" in request body' });
      }

      const connections = getUserConnections(req.user.email);

      let service, response;
      if ((model.startsWith('gpt-') && !model.includes('gpt-oss')) || model.includes('openai')) {
        // OpenAI
        service = 'openai';
        const connection = connections[service];
        if (!connection?.apiKey) {
          return res.status(400).json({ error: 'OpenAI not connected' });
        }
        const openaiMessages = messages.map(msg => ({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.content || (msg.parts && msg.parts[0]?.text) || ''
        }));
        if (systemPrompt) openaiMessages.unshift({ role: 'system', content: systemPrompt });
        const requestBody = {
          model,
          messages: openaiMessages,
          max_tokens: 2000,
          temperature: 0.7,
        };
        if (enableThinking && (model.includes('gpt-oss') || model.includes('reasoning'))) {
          requestBody.reasoning_effort = thinkingBudget === 'low' ? 'low' : thinkingBudget === 'high' ? 'high' : 'medium';
        }
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${connection.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        const openaiData = await openaiResponse.json();
        if (!openaiResponse.ok) throw new Error(openaiData.error?.message || 'OpenAI API error');
        response = openaiData.choices[0].message.content;
        if (enableThinking && openaiData.choices[0].message.reasoning) {
          response = `**Reasoning Process:**\n${openaiData.choices[0].message.reasoning}\n\n**Final Answer:**\n${response}`;
        }
      } else if (model.startsWith('claude-') || model.includes('anthropic')) {
        // Claude
        service = 'claude';
        const connection = connections[service];
        if (!connection?.apiKey) return res.status(400).json({ error: 'Claude not connected' });
        const claudeMessages = messages.map(msg => ({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.content || (msg.parts && msg.parts[0]?.text) || ''
        }));
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': connection.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: claudeMessages, max_tokens: 2000, system: systemPrompt })
        });
        const claudeData = await claudeResponse.json();
        if (!claudeResponse.ok) throw new Error(claudeData.error?.message || 'Claude API error');
        response = claudeData.content[0].text;
      } else if (isOllamaModelId(model)) {
        // Ollama
        service = 'ollama';
        const connection = connections[service];
        if (!connection) return res.status(400).json({ error: 'Ollama is not connected. Provide http://localhost:11434 in Settings.' });
        const ollamaMessages = messages.map(msg => ({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.content || (msg.parts && msg.parts[0]?.text) || ''
        }));
        const useCloud = connection.type === 'api_key' || !!connection.apiKey;
        const headers = useCloud ? { 'Authorization': `Bearer ${connection.apiKey}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
        const ollamaUrl = useCloud ? 'https://ollama.com/api/chat' : `${connection.url}/api/chat`;
        const requestBody = { model, messages: ollamaMessages, stream: false };
        if (enableThinking && (model.includes('deepseek-r1') || model.includes('thinking') || model.includes('reasoning'))) requestBody.think = true;
        const ollamaResponse = await fetch(ollamaUrl, { method: 'POST', headers, body: JSON.stringify(requestBody) });
        const ollamaData = await ollamaResponse.json();
        if (!ollamaResponse.ok) throw new Error(ollamaData.error || 'Ollama API error');
        response = ollamaData.message?.content || ollamaData?.choices?.[0]?.message?.content || '';
        if (enableThinking && ollamaData.message?.thinking) {
          response = `**Thinking Process:**\n${ollamaData.message.thinking}\n\n**Final Answer:**\n${response}`;
        }
      } else {
        // Gemini
        service = 'gemini';
        const ai = getGeminiClient();
        if (!ai?.models?.generateContent) return res.status(503).json({ error: 'Gemini client not configured.' });
        const geminiContents = messages.map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content || (msg.parts && msg.parts[0]?.text) || '' }]
        }));
        if (systemPrompt) geminiContents.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
        const requestConfig = { model, contents: geminiContents };
        if (enableThinking && (model.includes('2.5') || model.includes('thinking'))) {
          requestConfig.generationConfig = { thinkingConfig: { thinkingBudget, includeThoughts: true } };
        }
        const geminiResponse = await ai.models.generateContent(requestConfig);
        response = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (enableThinking && geminiResponse.candidates?.[0]?.content?.thoughtSummary) {
          response = `**Thought Summary:**\n${geminiResponse.candidates[0].content.thoughtSummary}\n\n**Final Answer:**\n${response}`;
        }
      }

      res.json({ response, service });
    } catch (error) {
      logger.error('Error in universal chat endpoint:', { errorMessage: error.message, stack: error.stack });
      if (!res.headersSent) res.status(500).json({ error: error.message });
    } finally {
      end({ route: '/api/chat', code: res.statusCode, method: 'POST' });
      httpRequestsTotal.inc({ route: '/api/chat', code: res.statusCode, method: 'POST' });
    }
  });

  // Chat with tool calling
  router.post('/chat/tools', requireAuth, async (req, res) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    try {
      const { model, messages, systemPrompt, tools, provider } = req.body;
      if (!model || !messages) return res.status(400).json({ error: 'Missing model or messages' });
      const connections = getUserConnections(req.user.email);

      let response, toolCalls;
      if (provider === 'gemini' || model.startsWith('gemini-')) {
        const ai = getGeminiClient();
        if (!ai?.models?.generateContent) return res.status(503).json({ error: 'Gemini client not configured.' });
        const geminiContents = messages.map(msg => {
          if (msg.role === 'tool') {
            return { role: 'function', parts: msg.toolResults.map(tr => ({ functionResponse: { name: tr.name, response: tr.result } })) };
          }
          return { role: msg.role === 'assistant' ? 'model' : 'user', parts: msg.toolCalls ? msg.toolCalls.map(tc => ({ functionCall: { name: tc.name, args: tc.args } })) : [{ text: msg.content }] };
        });
        if (systemPrompt) geminiContents.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
        const requestConfig = { model, contents: geminiContents };
        if (tools?.length) requestConfig.tools = [{ functionDeclarations: tools.map(t => ({ name: t.name, description: t.description, parameters: t.parameters })) }];
        const geminiResponse = await ai.models.generateContent(requestConfig);
        const candidate = geminiResponse.candidates?.[0];
        const functionCalls = (candidate?.content?.parts || []).filter(p => p.functionCall);
        if (functionCalls.length) {
          toolCalls = functionCalls.map((fc, idx) => ({ id: `call_${Date.now()}_${idx}` , name: fc.functionCall.name, args: fc.functionCall.args }));
          response = '';
        } else {
          response = candidate?.content?.parts?.[0]?.text || '';
        }
      } else if (provider === 'openai' || model.startsWith('gpt-')) {
        const connection = connections.openai;
        if (!connection?.apiKey) return res.status(400).json({ error: 'OpenAI not connected' });
        const openaiMessages = messages.map(msg => {
          if (msg.role === 'tool') {
            return msg.toolResults.map(tr => ({ role: 'tool', tool_call_id: tr.toolCallId, content: JSON.stringify(tr.result) }));
          }
          if (msg.toolCalls) {
            return { role: 'assistant', tool_calls: msg.toolCalls.map(tc => ({ id: tc.id, type: 'function', function: { name: tc.name, arguments: JSON.stringify(tc.args) } })) };
          }
          return { role: msg.role, content: msg.content };
        }).flat();
        if (systemPrompt) openaiMessages.unshift({ role: 'system', content: systemPrompt });
        const requestBody = { model, messages: openaiMessages };
        if (tools?.length) requestBody.tools = tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }));
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${connection.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        const data = await openaiResponse.json();
        if (!openaiResponse.ok) throw new Error(data.error?.message || 'OpenAI API error');
        const message = data.choices[0].message;
        if (message.tool_calls) {
          toolCalls = message.tool_calls.map(tc => ({ id: tc.id, name: tc.function.name, args: JSON.parse(tc.function.arguments) }));
          response = '';
        } else {
          response = message.content;
        }
      } else if (provider === 'claude' || model.startsWith('claude-')) {
        const connection = connections.claude;
        if (!connection?.apiKey) return res.status(400).json({ error: 'Claude not connected' });
        const claudeMessages = messages.filter(msg => msg.role !== 'tool').map(msg => ({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.toolCalls ? msg.toolCalls.map(tc => ({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.args })) : msg.content
        }));
        const requestBody = { model, messages: claudeMessages, max_tokens: 2000, system: systemPrompt };
        if (tools?.length) requestBody.tools = tools.map(t => ({ name: t.name, description: t.description, input_schema: t.parameters }));
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': connection.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        const data = await claudeResponse.json();
        if (!claudeResponse.ok) throw new Error(data.error?.message || 'Claude API error');
        const toolUses = (data.content || []).filter(c => c.type === 'tool_use');
        if (toolUses.length) {
          toolCalls = toolUses.map(tu => ({ id: tu.id, name: tu.name, args: tu.input }));
          response = '';
        } else {
          response = (data.content || []).find(c => c.type === 'text')?.text || '';
        }
      } else {
        return res.status(400).json({ error: 'Unsupported provider for tools' });
      }

      res.json({ response, toolCalls });
    } catch (error) {
      logger.error('Error in tool calling endpoint:', { errorMessage: error.message });
      if (!res.headersSent) res.status(500).json({ error: error.message });
    } finally {
      end({ route: '/api/chat/tools', code: res.statusCode, method: 'POST' });
      httpRequestsTotal.inc({ route: '/api/chat/tools', code: res.statusCode, method: 'POST' });
    }
  });

  return router;
}
