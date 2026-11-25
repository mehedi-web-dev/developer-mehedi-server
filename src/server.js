import app from './app.js';
import { connectDB, closeDB } from './config/db.js';
import { initializeAdmin } from './lib/admin.js';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (_) {}
}

const PORT = process.env.PORT || 5000;
let server = null;

async function startServer() {
  try {
    // 1. Start HTTP server so endpoints are immediately responsive
    server = app.listen(PORT, () => {
      console.log(`[Server] developer-mehedi-server running on port ${PORT} (PID: ${process.pid})`);
      console.log(`[Server] Auth endpoint: http://localhost:${PORT}/api/auth`);
      console.log(`[Server] Health endpoint: http://localhost:${PORT}/api/health`);
    });

    // 2. Establish database connection in background
    console.log('[Server] Connecting to MongoDB...');
    try {
      await connectDB();
      // 3. Initialize admin account if configured
      if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
        await initializeAdmin();
      }
    } catch (dbErr) {
      console.warn('[Server] Note: MongoDB connection deferred or offline:', dbErr.message);
    }
  } catch (error) {
    console.error('[Server] Startup failed:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

  const forceExitTimeout = setTimeout(() => {
    console.error('[Server] Graceful shutdown timed out after 10s. Forcing exit.');
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  if (server) {
    server.close(async (err) => {
      if (err) {
        console.error('[Server] Error while closing HTTP server:', err);
      } else {
        console.log('[Server] HTTP server closed.');
      }

      try {
        await closeDB();
      } catch (dbErr) {
        console.error('[Server] Error closing database connection:', dbErr);
      }

      process.exit(0);
    });
  } else {
    try {
      await closeDB();
    } catch (dbErr) {
      console.error('[Server] Error closing database connection:', dbErr);
    }
    process.exit(0);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();

export default app;
