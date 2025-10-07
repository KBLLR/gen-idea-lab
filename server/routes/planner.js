import express from 'express';
import logger from '../../src/shared/lib/logger.js';
import { requireAuth } from '../../src/shared/lib/auth.js';

export default function createPlannerRouter() {
  const router = express.Router();

  // Planner workflow generation endpoint
  router.post('/planner/generate-from-context', requireAuth, async (req, res) => {
    try {
      const { context } = req.body;
      if (!context) return res.status(400).json({ error: 'Context is required' });

      const systemPrompt = `You are a workflow generation assistant. Based on the provided application context, generate a workflow graph with nodes and connections that would be useful for the user's current situation.

Return a JSON object with:
- title: A descriptive title for the workflow
- nodes: Array of node objects with id, type, position {x, y}, and data {label, description}
- edges: Array of edge objects with id, source, target

Available node types: module, assistant, task, tool, workflow, connector, source, model-provider

Focus on creating practical, actionable workflows that relate to the user's current context.`;

      const userPrompt = `Current Application Context:
- Active App: ${context.activeApp}
- Active Module: ${context.activeModule ? `${context.activeModule.id} (${context.activeModule['Module Title']})` : 'None'}
- Connected Services: ${context.connectedServices?.join(', ') || 'None'}
- Recent Chat History: ${context.orchestratorHistory?.map(h => `${h.role}: ${h.parts[0]?.text}`).slice(-3).join('\n') || 'No recent messages'}

Generate a workflow that would be helpful for this context.`;

      // Use existing chat API for generation
      const resp = await fetch(`${req.protocol}://${req.get('host')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.cookie || '' },
        body: JSON.stringify({ model: 'gemini-2.5-flash', messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ] })
      });
      if (!resp.ok) throw new Error('Failed to generate workflow via AI');
      const aiResponse = await resp.text();

      // Extract JSON from response
      let workflowData;
      try {
        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          workflowData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        workflowData = {
          title: `Workflow for ${context.activeApp || 'Current Context'}`,
          nodes: [ { id: 'start-1', type: 'default', position: { x: 100, y: 100 }, data: { label: 'Start', description: 'Generated workflow starting point' } }, { id: 'context-1', type: 'default', position: { x: 300, y: 100 }, data: { label: 'Current Context', description: `Working with ${context.activeApp}` } } ],
          edges: [ { id: 'e1-2', source: 'start-1', target: 'context-1' } ]
        };
      }

      res.json(workflowData);
    } catch (error) {
      logger.error('Workflow generation failed:', error);
      res.status(500).json({ error: 'Failed to generate workflow' });
    }
  });

  return router;
}
