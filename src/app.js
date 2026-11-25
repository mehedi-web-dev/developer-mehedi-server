import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { getDB, isDBConnected } from './config/db.js';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (_) {}
}

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

// CORS configuration
const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((url) => url.trim().replace(/\/+$/, '')).filter(Boolean)
  : [];

const backendUrl = (process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || 5000}`)
  .trim()
  .replace(/\/+$/, '');

const allowedOrigins = Array.from(
  new Set([
    ...frontendUrls,
    ...corsOrigins,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    backendUrl,
  ])
);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Non-browser or same-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// 1. Better Auth request handler for Express 5
// In Express 5 (path-to-regexp v8), wildcards require the '*splat' syntax.
// Mounted BEFORE body parsers to preserve the raw request stream
app.all(['/api/auth', '/api/auth/*splat'], toNodeHandler(auth));

// 2. Global body parsers (mounted AFTER Better Auth)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome / status route
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    name: 'developer-mehedi-server',
    message: 'Developer Mehedi Portfolio Backend API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      health: '/api/health',
    },
  });
});

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  try {
    const db = getDB();
    await db.command({ ping: 1 });
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = isDBConnected() ? 'connected' : `error: ${err.message}`;
  }

  const configuredEnv = {
    MONGODB_URI: Boolean(process.env.MONGODB_URI),
    DB_NAME: Boolean(process.env.DB_NAME),
    BETTER_AUTH_SECRET: Boolean(process.env.BETTER_AUTH_SECRET),
    BETTER_AUTH_URL: Boolean(process.env.BETTER_AUTH_URL),
    FRONTEND_URL: Boolean(process.env.FRONTEND_URL),
    ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
    ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
  };

  const isHealthy = dbStatus === 'connected' && configuredEnv.MONGODB_URI && configuredEnv.BETTER_AUTH_SECRET;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    database: dbStatus,
    environmentConfigured: configuredEnv,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[App Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

export default app;
