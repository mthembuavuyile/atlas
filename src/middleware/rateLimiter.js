/**
 * IP-Based Rate Limiting Middleware
 * Protects endpoints from spam, DoS, and automated scraping without requiring user logins.
 */

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['cf-connecting-ip'] ||
         req.headers['x-real-ip'] ||
         req.socket.remoteAddress ||
         'unknown-ip';
}

function isLocalhost(ip) {
  return !ip ||
         ip === '127.0.0.1' ||
         ip === '::1' ||
         ip === '::ffff:127.0.0.1' ||
         ip === 'localhost';
}

function createRateLimiter({
  windowMs = 60 * 1000, // 1 minute window
  max = 60,              // max requests per window per IP
  message = 'Too many requests. Please slow down and wait a moment.',
  maxEntries = 50000     // Hard cap to prevent memory exhaustion under DDoS
} = {}) {
  const requests = new Map();

  // Periodic cleanup of expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now > data.resetTime) {
        requests.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return function rateLimiterMiddleware(req, res, next) {
    const ip = getClientIp(req);

    // Bypass local development
    if (isLocalhost(ip) && process.env.NODE_ENV !== 'production') {
      return next();
    }

    const now = Date.now();

    let record = requests.get(ip);
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
      requests.set(ip, record);

      // Evict oldest entries if map exceeds hard cap
      if (requests.size > maxEntries) {
        const firstKey = requests.keys().next().value;
        requests.delete(firstKey);
      }
    }

    record.count += 1;
    const remaining = Math.max(0, max - record.count);
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: message,
        retryAfterSeconds: retryAfterSec
      });
    }

    next();
  };
}

module.exports = {
  createRateLimiter,
  getClientIp,
  chatLimiter: createRateLimiter({
    windowMs: 60 * 1000,
    max: 60,
    message: 'Rate limit reached: Maximum 60 chat messages per minute. Please wait a moment.'
  }),
  titleLimiter: createRateLimiter({
    windowMs: 60 * 1000,
    max: 40,
    message: 'Rate limit reached for title generation. Please slow down.'
  }),
  toolLimiter: createRateLimiter({
    windowMs: 60 * 1000,
    max: 50,
    message: 'Rate limit reached for tool executions. Please slow down.'
  })
};
