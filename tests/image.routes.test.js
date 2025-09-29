import { jest } from '@jest/globals';
import request from 'supertest';

process.env.NODE_ENV = 'test';

const verifyJWTMock = jest.fn();

const requireAuthMock = jest.fn((req, res, next) => {
  const token = req.cookies?.auth_token || req.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = verifyJWTMock(token);
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
});

const optionalAuthMock = jest.fn((req, _res, next) => {
  const token = req.cookies?.auth_token || req.headers?.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const user = verifyJWTMock(token);
      req.user = user;
    } catch (error) {
      // ignore invalid tokens for optional auth
    }
  }
  next();
});

jest.unstable_mockModule('../src/lib/auth.js', () => ({
  verifyGoogleToken: jest.fn(),
  generateJWT: jest.fn(),
  verifyJWT: verifyJWTMock,
  requireAuth: requireAuthMock,
  optionalAuth: optionalAuthMock,
}));

jest.unstable_mockModule('../src/lib/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}));

const serverModule = await import('../server.js');
const { app, geminiBootstrap } = serverModule;

geminiBootstrap.initializeGeminiAPI = jest.fn().mockResolvedValue();
const geminiClient = { models: { generateContent: jest.fn() } };
geminiBootstrap.setClient(geminiClient);

const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

let userCounter = 0;
const nextUser = () => {
  userCounter += 1;
  return {
    email: `image-tester+${userCounter}@code.berlin`,
    name: 'Image Tester'
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch.mockReset();
  global.fetch.mockImplementation(() => Promise.reject(new Error('Unexpected fetch invocation')));
  geminiClient.models.generateContent.mockReset();
});

describe('POST /api/image/generate', () => {
  it('generates an image via Gemini by default', async () => {
    const user = nextUser();
    verifyJWTMock.mockImplementation(() => user);

    geminiClient.models.generateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { data: 'AAA', mimeType: 'image/png' } }
            ]
          }
        }
      ]
    });

    const response = await request(app)
      .post('/api/image/generate')
      .set('Cookie', ['auth_token=test'])
      .send({
        provider: 'gemini',
        prompt: 'hello world',
        image: 'data:image/png;base64,INPUT',
        model: 'gemini-2.5-flash-image-preview'
      });

    expect(response.status).toBe(200);
    expect(response.body.image).toBe('data:image/png;base64,AAA');
    expect(geminiClient.models.generateContent).toHaveBeenCalled();
  });

  it('uses OpenAI when the provider is openai', async () => {
    const user = nextUser();
    verifyJWTMock.mockImplementation(() => user);

    await request(app)
      .post('/api/services/openai/connect')
      .set('Cookie', ['auth_token=test'])
      .send({ apiKey: 'sk-test' })
      .expect(200);

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ b64_json: 'OPENAI' }] })
    });

    const response = await request(app)
      .post('/api/image/generate')
      .set('Cookie', ['auth_token=test'])
      .send({
        provider: 'openai',
        prompt: 'create art',
        image: 'data:image/png;base64,INPUT',
        model: 'gpt-image-1'
      });

    expect(response.status).toBe(200);
    expect(response.body.image).toBe('data:image/png;base64,OPENAI');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/images/edits',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('dispatches to DrawThings when configured', async () => {
    const user = nextUser();
    verifyJWTMock.mockImplementation(() => user);

    await request(app)
      .post('/api/services/drawthings/connect')
      .set('Cookie', ['auth_token=test'])
      .send({ url: 'http://127.0.0.1:5678', transport: 'http' })
      .expect(200);

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ image: 'DRAW' })
    });

    const response = await request(app)
      .post('/api/image/generate')
      .set('Cookie', ['auth_token=test'])
      .send({
        provider: 'drawthings',
        prompt: 'stylize',
        image: 'data:image/png;base64,INPUT'
      });

    expect(response.status).toBe(200);
    expect(response.body.image).toBe('data:image/png;base64,DRAW');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:5678/v1/generate',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns a friendly error when a provider is rate limited', async () => {
    const user = nextUser();
    verifyJWTMock.mockImplementation(() => user);

    await request(app)
      .post('/api/services/openai/connect')
      .set('Cookie', ['auth_token=test'])
      .send({ apiKey: 'sk-test' })
      .expect(200);

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Quota reached' } })
    });

    const response = await request(app)
      .post('/api/image/generate')
      .set('Cookie', ['auth_token=test'])
      .send({
        provider: 'openai',
        prompt: 'rate limit check',
        image: 'data:image/png;base64,INPUT'
      });

    expect(response.status).toBe(429);
    expect(response.body).toEqual({ error: 'Quota reached', code: 'RATE_LIMIT' });
  });
});
