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

function createRateLimiter({
  windowMs = 60 * 1000, // 1 minute window
  max = 25,              // max requests per window per IP
  message = 'Too many requests. Please slow down and wait a moment.'
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
    const now = Date.now();

    let record = requests.get(ip);
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
      requests.set(ip, record);
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
    max: 25,
    message: 'Rate limit reached: Maximum 25 chat messages per minute. Please wait a moment.'
  }),
  titleLimiter: createRateLimiter({
    windowMs: 60 * 1000,
    max: 15,
    message: 'Rate limit reached for title generation. Please slow down.'
  }),
  toolLimiter: createRateLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Rate limit reached for tool executions. Please slow down.'
  })
};
