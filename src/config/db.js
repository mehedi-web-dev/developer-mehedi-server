import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

// Ensure environment variables are loaded in Node if process.loadEnvFile is available
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (_) {}
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'developer_mehedi';

let client = null;
let db = null;
let isConnected = false;
let isDummyClient = false;
let connectionPromise = null;

/**
 * Returns the MongoClient instance, creating it if it does not yet exist.
 */
export function getClient() {
  const activeUri = process.env.MONGODB_URI || uri;

  if (!client || (isDummyClient && activeUri)) {
    if (!activeUri) {
      console.warn('[Database] MONGODB_URI is not defined in environment variables.');
      client = new MongoClient('mongodb://localhost:27017/developer_mehedi', {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      });
      isDummyClient = true;
      return client;
    }

    if (isDummyClient && client) {
      try {
        client.close();
      } catch (_) {}
    }

    isDummyClient = false;
    client = new MongoClient(activeUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
    });
  }
  return client;
}

/**
 * Returns the active MongoDB Db instance.
 */
export function getDB() {
  const activeUri = process.env.MONGODB_URI || uri;
  const activeDbName = process.env.DB_NAME || dbName;

  if (!db || (isDummyClient && activeUri)) {
    const activeClient = getClient();
    db = activeClient.db(activeDbName);
  }
  return db;
}

/**
 * Connects to MongoDB via Native MongoClient (for Better Auth) and Mongoose (for Models),
 * verifying connectivity with a ping command.
 */
export async function connectDB() {
  const activeUri = process.env.MONGODB_URI || uri;
  if (!activeUri) {
    throw new Error('[Database] MONGODB_URI is not defined in environment variables');
  }

  const activeDbName = process.env.DB_NAME || dbName;

  if (isConnected && db && client && !isDummyClient && mongoose.connection.readyState === 1) {
    return db;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      // 1. Connect native client (for Better Auth adapter)
      const activeClient = getClient();
      await activeClient.connect();
      db = activeClient.db(activeDbName);

      // Verify connection with a ping
      await db.command({ ping: 1 });

      // 2. Connect Mongoose (for application content models)
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(activeUri, {
          dbName: activeDbName,
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
        });
      }

      isConnected = true;
      console.log(`[Database] Successfully connected to MongoDB database: "${activeDbName}" (Native + Mongoose)`);

      return db;
    } catch (error) {
      isConnected = false;
      console.error('[Database] Failed to connect to MongoDB:', error.message);
      throw error;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

/**
 * Returns true if MongoDB connection is established.
 */
export function isDBConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Dynamic Proxies for Better Auth and external callers.
 * Resolves to the active client and db instances.
 */
export const clientProxy = new Proxy({}, {
  get(_target, prop) {
    const active = getClient();
    const val = active[prop];
    return typeof val === 'function' ? val.bind(active) : val;
  },
});

export const dbProxy = new Proxy({}, {
  get(_target, prop) {
    const active = getDB();
    const val = active[prop];
    return typeof val === 'function' ? val.bind(active) : val;
  },
});

/**
 * Gracefully closes both the Mongoose connection and native MongoDB client.
 */
export async function closeDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (err) {
    console.error('[Database] Error closing Mongoose connection:', err.message);
  }

  if (client) {
    await client.close();
    client = null;
    db = null;
    isConnected = false;
    connectionPromise = null;
    console.log('[Database] MongoDB connection closed');
  }
}
