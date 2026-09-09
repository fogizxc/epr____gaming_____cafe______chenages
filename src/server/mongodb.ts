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
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      retryWrites: true,
    });
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    db = client.db(process.env.MONGODB_DB_NAME?.trim() || 'bytes_brew_epr');
    return db;
  })();

  try {
    return await connectPromise;
  } catch (error) {
    connectPromise = null;
    client = null;
    db = null;
    throw error;
  }
}

export const getDb = getMongoDb;

export async function closeMongoDb(): Promise<void> {
  if (client) await client.close();
  client = null;
  db = null;
  connectPromise = null;
}

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}
