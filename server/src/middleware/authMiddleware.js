/**
 * Authentication middleware.
 *
 * Extracts the session token from the Authorization header (Bearer scheme)
 * and attaches the authenticated user to `req.user`.
 */

import userStore from '../models/UserStore.js';

/**
 * Express middleware that gates access to authenticated users.
 *
 * Expected header format: `Authorization: Bearer <token>`
 *
 * @type {import('express').RequestHandler}
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Provide a Bearer token.',
    });
  }

  const token = authHeader.slice(7); // Strip "Bearer "
  const user = userStore.getByToken(token);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token. Please log in again.',
    });
  }

  req.user = user;
  next();
}

export default authMiddleware;
