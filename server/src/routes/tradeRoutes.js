/**
 * Trade routes.
 *
 * POST /api/trades/buy       — Execute a market buy order.
 * POST /api/trades/sell      — Execute a market sell order.
 * GET  /api/portfolio        — Get the authenticated user's portfolio.
 * GET  /api/trades/history   — Get the authenticated user's trade history.
 */

import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { tradeSchema, validate } from '../validators/schemas.js';
import tradingEngine from '../services/TradingEngine.js';

const router = Router();

// All trade routes require authentication.
router.use(authMiddleware);

router.post('/buy', validate(tradeSchema), (req, res) => {
  const { ticker, quantity } = req.body;
  const result = tradingEngine.buy(req.user.id, ticker, quantity);

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.json({
    success: true,
    data: {
      transaction: result.transaction,
      portfolio: tradingEngine.getPortfolio(req.user.id),
    },
  });
});

router.post('/sell', validate(tradeSchema), (req, res) => {
  const { ticker, quantity } = req.body;
  const result = tradingEngine.sell(req.user.id, ticker, quantity);

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.json({
    success: true,
    data: {
      transaction: result.transaction,
      portfolio: tradingEngine.getPortfolio(req.user.id),
    },
  });
});

router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const transactions = tradingEngine.getTransactions(req.user.id, limit);

  res.json({ success: true, data: { transactions } });
});

export default router;

// Portfolio route is mounted separately at /api/portfolio in index.js
export function portfolioRoute(req, res) {
  const portfolio = tradingEngine.getPortfolio(req.user.id);
  res.json({ success: true, data: portfolio });
}
