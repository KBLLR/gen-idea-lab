/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { MongoClient } from 'mongodb';

let _client = null;
let _db = null;

export async function getDb() {
  if (_db) return _db;
  const uri = process.env.MONGODB_URI || process.env.CHATS_MONGO_DB_URI;
  const dbName = process.env.MONGODB_DB || 'project-idea-gen';
  if (!uri) throw new Error('MONGODB_URI is not set');
  _client = new MongoClient(uri, { maxPoolSize: 10 });
  await _client.connect();
  _db = _client.db(dbName);
  return _db;
}
