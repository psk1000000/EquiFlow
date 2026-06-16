/**
 * Authentication routes.
 *
 * POST /api/auth/login   — Create or resume a session by email.
 * POST /api/auth/logout  — Invalidate the current session.
 */

import { Router } from 'express';
import userStore from '../models/UserStore.js';
import { loginSchema, validate } from '../validators/schemas.js';

const router = Router();

router.post('/login', validate(loginSchema), (req, res) => {
  const { email } = req.body;
  const userData = userStore.loginOrCreate(email);

  console.log(`[Auth] Login: ${email} (session ${userData.token.slice(0, 8)}…)`);

  res.json({
    success: true,
    data: {
      id: userData.id,
      email: userData.email,
      token: userData.token,
      subscriptions: userData.subscriptions,
    },
  });
});

router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    userStore.logout(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
