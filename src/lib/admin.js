import { auth } from './auth.js';
import { getDB } from '../config/db.js';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (_) {}
}

/**
 * Initializes or verifies the authorized admin account in MongoDB.
 *
 * @param {object} [options]
 * @param {string} [options.email] - Admin email
 * @param {string} [options.password] - Admin password
 * @param {string} [options.name] - Admin name
 * @returns {Promise<{ created: boolean, user: object|null, reason?: string }>}
 */
export async function initializeAdmin(options = {}) {
  const adminEmail = (options.email || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const adminPassword = options.password || process.env.ADMIN_PASSWORD;
  const adminName = options.name || process.env.ADMIN_NAME || 'Developer Mehedi';

  if (!adminEmail || !adminPassword) {
    console.warn('[Admin Setup] ADMIN_EMAIL or ADMIN_PASSWORD not configured. Skipping initial admin seeding.');
    return { created: false, user: null, reason: 'missing_credentials' };
  }

  try {
    const ctx = await auth.$context;
    const existingRecord = await ctx.internalAdapter.findUserByEmail(adminEmail);
    const existingUser = existingRecord?.user || existingRecord;

    if (existingUser) {
      if (existingUser.role !== 'admin') {
        const db = getDB();
        await db.collection('user').updateOne(
          { email: adminEmail },
          { $set: { role: 'admin', updatedAt: new Date() } }
        );
        existingUser.role = 'admin';
      }
      console.log(`[Admin Setup] Verified authorized admin account (${adminEmail}) in database.`);
      return { created: false, user: existingUser };
    }

    console.log(`[Admin Setup] Initializing first admin account (${adminEmail})...`);
    const now = new Date();

    const user = await ctx.internalAdapter.createUser({
      name: adminName,
      email: adminEmail,
      role: 'admin',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    const userId = user.id || (user._id ? user._id.toString() : String(user));
    const hashedPassword = await ctx.password.hash(adminPassword);

    await ctx.internalAdapter.createAccount({
      userId,
      accountId: userId,
      providerId: 'credential',
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`[Admin Setup] Successfully created authorized admin account: ${adminEmail}`);
    return { created: true, user };
  } catch (error) {
    console.error('[Admin Setup] Failed to initialize admin account:', error.message);
    return { created: false, user: null, error: error.message };
  }
}
