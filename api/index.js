import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { initializeAdmin } from '../src/lib/admin.js';

let dbPromise = null;
let adminPromise = null;

/**
 * Ensures MongoDB is connected for the serverless container instance.
 * Concurrency-safe: multiple simultaneous requests share the active promise.
 */
async function ensureDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  if (!dbPromise) {
    dbPromise = connectDB().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  await dbPromise;

  // Initialize or verify admin account on cold start
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && !adminPromise) {
    adminPromise = initializeAdmin().catch((err) => {
      adminPromise = null;
      console.warn('[Vercel Handler] Admin initialization notice:', err.message);
    });
    await adminPromise;
  }
}

/**
 * Vercel Serverless Function entrypoint.
 */
export default async function handler(req, res) {
  // 1. Normalize req.url from Vercel platform rewrite header (x-matched-path)
  const rawMatchedPath = req.headers['x-matched-path'];
  const matchedPath = Array.isArray(rawMatchedPath) ? rawMatchedPath[0] : rawMatchedPath;
  if (matchedPath && typeof matchedPath === 'string' && matchedPath.startsWith('/')) {
    const queryIndex = req.url.indexOf('?');
    const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';
    const normalizedUrl = matchedPath.includes('?') ? matchedPath : `${matchedPath}${queryString}`;
    req.url = normalizedUrl;
    req.originalUrl = normalizedUrl;
  }

  // 2. Fast-path for root or health checks if database is having transient issues
  const isHealthCheck = req.url === '/api/health' || req.url === '/health';
  if (isHealthCheck || req.url === '/') {
    try {
      await ensureDatabase();
    } catch (err) {
      console.warn('[Vercel Handler] Non-fatal DB error on status endpoint:', err.message);
    }
    return app(req, res);
  }

  // 3. For all API endpoints, ensure database connection before proceeding
  try {
    await ensureDatabase();
  } catch (error) {
    console.error('[Vercel Handler] Database connection failed:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please verify Vercel environment variables and database status.',
      error: error.message,
    });
  }

  // 4. Delegate to the Express application
  return app(req, res);
}
