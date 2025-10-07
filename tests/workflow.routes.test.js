import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret';

import app from '../server/index.js';

const authHeader = () => {
  const token = jwt.sign({ id: 'u1', email: 'tester@code.berlin', name: 'Tester' }, process.env.AUTH_SECRET);
  return { Authorization: `Bearer ${token}` };
};

describe('POST /api/workflow/generate-docs', () => {
  test('200 happy path', async () => {
    const body = {
      templateId: 'process_journal',
      workflowResult: {
        workflow_id: 'wf_1',
        steps: [{ name: 'Step 1', model: 'gemini-2.5-flash' }]
      }
    };

    const res = await request(app)
      .post('/api/workflow/generate-docs')
      .set(authHeader())
      .send(body)
      .expect(200);

    expect(res.body).toHaveProperty('ok', true);
    expect(typeof res.body.doc).toBe('string');
    expect(res.body.doc).toMatch(/Workflow|Process|Steps/i);
  });

  test('400 unknown templateId', async () => {
    const res = await request(app)
      .post('/api/workflow/generate-docs')
      .set(authHeader())
      .send({ templateId: 'nope', workflowResult: { steps: [{ name: 's' }] } })
      .expect(400);
    expect(res.body.error).toMatch(/Unknown templateId/i);
  });

  test('400 missing steps', async () => {
    const res = await request(app)
      .post('/api/workflow/generate-docs')
      .set(authHeader())
      .send({ templateId: 'process_journal', workflowResult: { steps: [] } })
      .expect(400);
    expect(res.body.error).toMatch(/steps.*non-empty/i);
  });

  test('400 missing payload', async () => {
    const res = await request(app)
      .post('/api/workflow/generate-docs')
      .set(authHeader())
      .send({})
      .expect(400);
    expect(res.body.error).toMatch(/Missing required fields|templateId.*workflowResult/i);
  });

  test('401 when unauthenticated', async () => {
    await request(app)
      .post('/api/workflow/generate-docs')
      .send({ templateId: 'process_journal', workflowResult: { steps: [{ name: 's' }] } })
      .expect(401);
  });
});

describe('GET /api/workflow/templates', () => {
  test('lists available templates', async () => {
    const res = await request(app)
      .get('/api/workflow/templates')
      .set(authHeader())
      .expect(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(Array.isArray(res.body.templates)).toBe(true);
    expect(res.body.templates.some(t => t.id === 'process_journal')).toBe(true);
  });
});
