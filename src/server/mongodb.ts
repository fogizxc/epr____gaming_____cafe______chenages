import { Db, MongoClient } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;
let connectPromise: Promise<Db> | null = null;

export async function getMongoDb(): Promise<Db> {
  if (db) return db;
  if (connectPromise) return connectPromise;
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error('MONGODB_URI is not configured');

  connectPromise = (async () => {
    client = new MongoClient(uri, {
      appName: process.env.MONGODB_APP_NAME?.trim() || 'gaming-cafe-epr',
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 30),
      minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 2),
      maxIdleTimeMS: Number(process.env.MONGODB_MAX_IDLE_TIME_MS || 60000),
      serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
      connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 5000),
      socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 20000),
      waitQueueTimeoutMS: Number(process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS || 10000),
      retryReads: true,
      retryWrites: true,
    });
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    db = client.db(process.env.MONGODB_DB_NAME?.trim() || 'bytes_brew_epr');
    return db;
  })();

  try { return await connectPromise; }
  catch (error) { connectPromise = null; client = null; db = null; throw error; }
}

export const getDb = getMongoDb;
export function getMongoClient(): MongoClient | null { return client; }
export async function closeMongoDb(): Promise<void> { if (client) await client.close(); client = null; db = null; connectPromise = null; }
export function isMongoConfigured(): boolean { return Boolean(process.env.MONGODB_URI?.trim()); }
