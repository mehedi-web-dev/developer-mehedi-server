/**
 * In-memory sliding window rate limiter for public abuse protection.
 *
 * @param {object} options
 * @param {number} [options.windowMs=900000] - Time window in milliseconds (default: 15 minutes)
 * @param {number} [options.max=5] - Maximum requests allowed per window per IP
 * @param {string} [options.message='Too many requests, please try again later.']
 */
export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 5;
  const message = options.message || 'Too many requests from this IP, please try again later.';

  // Map of ip -> array of request timestamps
  const ipRequests = new Map();

  // Periodic cleanup every 5 minutes to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of ipRequests.entries()) {
      const validTimestamps = timestamps.filter((time) => now - time < windowMs);
      if (validTimestamps.length === 0) {
        ipRequests.delete(ip);
      } else {
        ipRequests.set(ip, validTimestamps);
      }
    }
  }, 5 * 60 * 1000);

  cleanupInterval.unref();

  return (req, res, next) => {
    // Determine client IP safely (respecting trust proxy)
    const clientIp =
      req.ip ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    const timestamps = ipRequests.get(clientIp) || [];

    // Filter out timestamps outside the active window
    const validTimestamps = timestamps.filter((time) => now - time < windowMs);

    if (validTimestamps.length >= max) {
      const oldest = validTimestamps[0];
      const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);

      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: retryAfterSeconds,
      });
    }

    validTimestamps.push(now);
    ipRequests.set(clientIp, validTimestamps);
    next();
  };
}
