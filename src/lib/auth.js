import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { dbProxy, clientProxy } from '../config/db.js';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (_) {}
}

const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((url) => url.trim().replace(/\/+$/, '')).filter(Boolean)
  : [];

const backendUrl = (
  process.env.BETTER_AUTH_URL ||
  `http://localhost:${process.env.PORT || 5000}`
).trim().replace(/\/+$/, '');

const trustedOrigins = Array.from(
  new Set([
    ...frontendUrls,
    ...corsOrigins,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    backendUrl,
  ].filter(Boolean))
);

export const auth = betterAuth({
  database: mongodbAdapter(dbProxy, {
    client: clientProxy,
  }),
  baseURL: backendUrl,
  secret: process.env.BETTER_AUTH_SECRET || 'developer-mehedi-default-secret-key-min-32-chars',
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // Prevent uncontrolled public signups on admin portfolio
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    },
  },
});
