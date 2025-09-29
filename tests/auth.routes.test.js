import { jest } from '@jest/globals';
import request from 'supertest';

process.env.NODE_ENV = 'test';

const verifyGoogleTokenMock = jest.fn();
const generateJWTMock = jest.fn();
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

const optionalAuthMock = jest.fn((req, res, next) => {
  const token = req.cookies?.auth_token || req.headers?.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const user = verifyJWTMock(token);
      req.user = user;
    } catch (error) {
      if (typeof res.clearCookie === 'function') {
        res.clearCookie('auth_token');
      }
    }
  }

  next();
});

jest.unstable_mockModule('../src/lib/auth.js', () => ({
  verifyGoogleToken: verifyGoogleTokenMock,
  generateJWT: generateJWTMock,
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
geminiBootstrap.setClient({
  models: {
    generateContent: jest.fn(),
  },
});
const agent = request.agent(app);

const expectUnsafeNone = (res) => {
  expect(res.headers['cross-origin-opener-policy']).toBe('unsafe-none');
};

describe('Authentication routes', () => {
  const user = {
    id: 'user-123',
    email: 'tester@code.berlin',
    name: 'Test User',
    picture: 'https://example.com/avatar.png',
    domain: 'code.berlin',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    verifyJWTMock.mockImplementation(() => {
      throw new Error('Invalid or expired token');
    });
  });

  describe('POST /auth/google', () => {
    it('returns 400 when idToken is missing', async () => {
      const res = await agent.post('/auth/google').send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'ID token required' });
      expectUnsafeNone(res);
    });

    it('sets auth cookie on successful authentication', async () => {
      verifyGoogleTokenMock.mockResolvedValueOnce(user);
      generateJWTMock.mockReturnValueOnce('signed-jwt');
      verifyJWTMock.mockImplementation(token => ({ ...user, token }));

      const res = await agent
        .post('/auth/google')
        .send({ idToken: 'valid-token' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ user: { name: user.name, email: user.email, picture: user.picture } });
      expectUnsafeNone(res);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toEqual(expect.stringContaining('auth_token=signed-jwt'));
      expect(cookies[0]).toEqual(expect.stringContaining('HttpOnly'));
      expect(cookies[0]).toEqual(expect.stringContaining('SameSite=Lax'));
      expect(cookies[0]).toEqual(expect.stringContaining('Max-Age=604800'));
    });

    it('propagates authentication failures', async () => {
      verifyGoogleTokenMock.mockRejectedValueOnce(new Error('Only code.berlin email addresses are allowed'));

      const res = await agent
        .post('/auth/google')
        .send({ idToken: 'invalid' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Only code.berlin email addresses are allowed' });
      expectUnsafeNone(res);
    });
  });

  describe('GET /auth/me', () => {
    it('returns 401 when no session cookie is present', async () => {
      const res = await agent.get('/auth/me');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Not authenticated' });
      expectUnsafeNone(res);
    });

    it('returns user details when the session is valid', async () => {
      verifyJWTMock.mockImplementationOnce(() => user);

      const res = await agent
        .get('/auth/me')
        .set('Cookie', ['auth_token=valid-jwt']);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ user: { name: user.name, email: user.email, picture: user.picture } });
      expectUnsafeNone(res);
    });
  });

  describe('POST /auth/logout', () => {
    it('clears the auth cookie even if none is provided', async () => {
      const res = await agent.post('/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Logged out successfully' });
      expectUnsafeNone(res);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toEqual(expect.stringContaining('auth_token=;'));
      expect(cookies[0]).toEqual(expect.stringContaining('Expires='));
    });

    it('clears the auth cookie when a session cookie exists', async () => {
      const res = await agent
        .post('/auth/logout')
        .set('Cookie', ['auth_token=existing']);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Logged out successfully' });
      expectUnsafeNone(res);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toEqual(expect.stringContaining('auth_token=;'));
      expect(cookies[0]).toEqual(expect.stringContaining('Expires='));
    });
  });
});
