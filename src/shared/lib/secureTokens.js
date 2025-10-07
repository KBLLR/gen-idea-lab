/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

const DEFAULT_DB_NAME = process.env.MONGODB_DB || 'app';
const COLLECTION = 'service_tokens';
const KEY_VERSION = 1;

function getKey() {
  const b64 = process.env.ENCRYPTION_KEY;
  if (b64) {
    const buf = Buffer.from(b64, 'base64');
    if (buf.length !== 32) {
      console.warn('ENCRYPTION_KEY must be 32 bytes (base64). Using first 32 bytes.');
      return buf.subarray(0, 32);
    }
    return buf;
  }
  // Dev fallback: ephemeral key so we don’t crash locally; tokens won’t persist across restarts.
  console.warn('ENCRYPTION_KEY not set. Using ephemeral key (dev only).');
  if (!global.__EPHEMERAL_KEY__) global.__EPHEMERAL_KEY__ = crypto.randomBytes(32);
  return global.__EPHEMERAL_KEY__;
}

function encrypt(plaintext) {
  if (plaintext == null) return null;
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

function decrypt(enc) {
  if (!enc) return null;
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(enc.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(enc.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(enc.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

let client = null;
let db = null;

async function getMongoClient() {
  try {
    const mod = await import('mongodb');
    return mod.MongoClient;
  } catch (err) {
    throw new Error("MongoDB driver not installed. Run 'npm i mongodb' to enable token persistence.");
  }
}

async function getDb() {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    // MongoDB is optional - return null to use in-memory fallback
    console.warn('[SecureTokens] MONGODB_URI not set. Service connections will not persist across restarts.');
    return null;
  }
  try {
    const MongoClient = await getMongoClient();
    client = new MongoClient(uri, { maxPoolSize: 5 });
    await client.connect();
    db = client.db(DEFAULT_DB_NAME);
    await db.collection(COLLECTION).createIndex({ userId: 1, provider: 1 }, { unique: true });
    return db;
  } catch (error) {
    console.error('[SecureTokens] Failed to connect to MongoDB:', error.message);
    return null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

export const tokenStore = {
  // Upsert OAuth tokens with optional info
  async upsertOAuthToken(userId, provider, { accessToken, refreshToken, scopes = [], expiresAt = null, info = {} } = {}) {
    const database = await getDb();
    if (!database) {
      console.warn(`[SecureTokens] Cannot persist OAuth token for ${provider} - no database`);
      return;
    }
    const doc = {
      userId,
      provider,
      type: 'oauth',
      enc: {
        access: encrypt(accessToken),
        refresh: encrypt(refreshToken),
        apiKey: null,
      },
      scopes,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      info: info || {},
      keyVersion: KEY_VERSION,
      updatedAt: nowIso(),
    };
    await database.collection(COLLECTION).updateOne(
      { userId, provider },
      { $set: doc, $setOnInsert: { createdAt: nowIso() } },
      { upsert: true }
    );
  },

  async getOAuthToken(userId, provider) {
    const database = await getDb();
    if (!database) return null;
    const doc = await database.collection(COLLECTION).findOne({ userId, provider, type: 'oauth' });
    if (!doc) return null;
    return {
      accessToken: decrypt(doc.enc?.access),
      refreshToken: decrypt(doc.enc?.refresh),
      scopes: doc.scopes || [],
      expiresAt: doc.expiresAt ? new Date(doc.expiresAt) : null,
      info: doc.info || {},
    };
  },

  async updateAccessToken(userId, provider, { accessToken, expiresAt }) {
    const database = await getDb();
    if (!database) return;
    await database.collection(COLLECTION).updateOne(
      { userId, provider, type: 'oauth' },
      { $set: { 'enc.access': encrypt(accessToken), expiresAt: expiresAt ? new Date(expiresAt) : null, updatedAt: nowIso() } }
    );
  },

  // API key based services
  async upsertApiKey(userId, provider, apiKey, info = {}) {
    const database = await getDb();
    if (!database) {
      console.warn(`[SecureTokens] Cannot persist API key for ${provider} - no database`);
      return;
    }
    const doc = {
      userId,
      provider,
      type: 'api_key',
      enc: {
        access: null,
        refresh: null,
        apiKey: encrypt(apiKey),
      },
      scopes: [],
      expiresAt: null,
      info: info || {},
      keyVersion: KEY_VERSION,
      updatedAt: nowIso(),
    };
    await database.collection(COLLECTION).updateOne(
      { userId, provider },
      { $set: doc, $setOnInsert: { createdAt: nowIso() } },
      { upsert: true }
    );
  },

  async getApiKey(userId, provider) {
    const database = await getDb();
    if (!database) return null;
    const doc = await database.collection(COLLECTION).findOne({ userId, provider, type: 'api_key' });
    if (!doc) return null;
    return { apiKey: decrypt(doc.enc?.apiKey), info: doc.info || {} };
  },

  // Endpoint/URL based services (e.g., local Ollama, DrawThings)
  async upsertEndpoint(userId, provider, { url, transport = 'http', info = {} }) {
    const database = await getDb();
    if (!database) {
      console.warn(`[SecureTokens] Cannot persist endpoint for ${provider} - no database`);
      return;
    }
    const doc = {
      userId,
      provider,
      type: 'endpoint',
      enc: { access: null, refresh: null, apiKey: null },
      scopes: [],
      expiresAt: null,
      info: { ...(info || {}), url, transport },
      keyVersion: KEY_VERSION,
      updatedAt: nowIso(),
    };
    await database.collection(COLLECTION).updateOne(
      { userId, provider },
      { $set: doc, $setOnInsert: { createdAt: nowIso() } },
      { upsert: true }
    );
  },

  async getProvider(userId, provider) {
    const database = await getDb();
    if (!database) return null;
    return await database.collection(COLLECTION).findOne({ userId, provider });
  },

  async removeProvider(userId, provider) {
    const database = await getDb();
    if (!database) return;
    await database.collection(COLLECTION).deleteOne({ userId, provider });
  },

  async listConnected(userId) {
    const database = await getDb();
    if (!database) return [];
    const list = await database.collection(COLLECTION).find({ userId }).toArray();
    const map = {};
    for (const doc of list) {
      map[doc.provider] = {
        connected: true,
        type: doc.type,
        info: doc.info || {},
      };
    }
    return map;
  },
};

// Google token refresh helper
export async function ensureGoogleAccessToken(userId, provider, { clientId, clientSecret }) {
  const record = await tokenStore.getOAuthToken(userId, provider);
  if (!record) return null;
  const { accessToken, refreshToken, expiresAt } = record;
  const bufferMs = 60 * 1000; // 60s buffer
  const now = Date.now();
  if (accessToken && (!expiresAt || now + bufferMs < new Date(expiresAt).getTime())) {
    return accessToken;
  }
  if (!refreshToken) return accessToken; // cannot refresh

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    console.warn('Google refresh failed', resp.status, txt);
    return accessToken; // return possibly expired token to avoid total failure
  }
  const data = await resp.json();
  const newAccess = data.access_token;
  const expiresIn = data.expires_in ? now + data.expires_in * 1000 : null;
  await tokenStore.updateAccessToken(userId, provider, { accessToken: newAccess, expiresAt: expiresIn });
  return newAccess;
}

export default tokenStore;
