import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth.js';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (_) {}
}

/**
 * Middleware that strictly verifies a valid Better Auth session and ensures
 * the authenticated user possesses administrator privileges.
 *
 * Rules:
 * 1. Checks session validity using the official Better Auth getSession API.
 * 2. Unauthenticated requests are rejected with 401 Unauthorized.
 * 3. Authenticated requests from non-admin users are rejected with 403 Forbidden.
 * 4. Never trusts client-submitted role fields; verifies directly from authenticated session user.
 * 5. Attaches req.user and req.session upon successful verification.
 */
export async function requireAdmin(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
      });
    }

    const authorizedAdminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const userEmail = (session.user.email || '').toLowerCase().trim();
    const userRole = session.user.role;

    const isAdmin =
      (authorizedAdminEmail && userEmail === authorizedAdminEmail) ||
      userRole === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Admin access required',
      });
    }

    req.user = session.user;
    req.session = session.session;
    return next();
  } catch (error) {
    console.error('[Auth Middleware] Admin verification error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Session verification failed',
    });
  }
}

/**
 * Optional helper middleware to require any authenticated session (user or admin).
 */
export async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
      });
    }

    req.user = session.user;
    req.session = session.session;
    return next();
  } catch (error) {
    console.error('[Auth Middleware] Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Session verification failed',
    });
  }
}
