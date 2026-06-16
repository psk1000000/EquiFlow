/**
 * Sliding-window rate limiter middleware.
 *
 * Uses an in-memory Map keyed by IP address.  Each entry stores an array of
 * request timestamps.  On every request, timestamps outside the current window
 * are pruned, and the request is allowed only if the remaining count is below
 * the configured maximum.
 *
 * This is deliberately simple — a production deployment would use Redis or a
 * dedicated rate-limit service.  The sliding-window approach is chosen over a
 * fixed-window because it prevents the "burst at window boundary" problem.
 */

import { RATE_LIMIT } from '../config/index.js';

/** @type {Map<string, number[]>} IP → array of request timestamps. */
const requestLog = new Map();

/**
 * Periodic cleanup to prevent unbounded memory growth from stale IPs.
 * Runs every 5 minutes.
 */
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT.windowMs;
  for (const [ip, timestamps] of requestLog) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) {
      requestLog.delete(ip);
    } else {
      requestLog.set(ip, filtered);
    }
  }
}, 5 * 60 * 1000);

/**
 * @type {import('express').RequestHandler}
 */
function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;

  let timestamps = requestLog.get(ip) || [];
  timestamps = timestamps.filter((t) => t > windowStart);
  timestamps.push(now);
  requestLog.set(ip, timestamps);

  // Set informational headers (like GitHub's API does)
  const remaining = Math.max(0, RATE_LIMIT.maxRequests - timestamps.length);
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT.maxRequests);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil((windowStart + RATE_LIMIT.windowMs) / 1000));

  if (timestamps.length > RATE_LIMIT.maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfterMs: RATE_LIMIT.windowMs,
    });
  }

  next();
}

export default rateLimiter;
