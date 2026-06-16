/**
 * Stock data routes (REST).
 *
 * GET /api/stocks              — List all supported stocks with current prices.
 * GET /api/stocks/:ticker      — Get a single stock's current data.
 * GET /api/stocks/:ticker/history — Get price history for sparkline charts.
 */

import { Router } from 'express';
import { SUPPORTED_TICKERS } from '../config/index.js';
import simulationEngine from '../services/StockSimulationEngine.js';

const router = Router();

router.get('/', (_req, res) => {
  const prices = simulationEngine.getAllPrices();

  res.json({
    success: true,
    data: {
      stocks: SUPPORTED_TICKERS.map((ticker) => prices[ticker]),
      supportedTickers: SUPPORTED_TICKERS,
    },
  });
});

router.get('/:ticker', (req, res) => {
  const ticker = req.params.ticker.toUpperCase();

  if (!SUPPORTED_TICKERS.includes(ticker)) {
    return res.status(404).json({
      success: false,
      error: `Unsupported ticker: ${ticker}. Supported: ${SUPPORTED_TICKERS.join(', ')}`,
    });
  }

  const data = simulationEngine.getPrice(ticker);
  res.json({ success: true, data });
});

router.get('/:ticker/history', (req, res) => {
  const ticker = req.params.ticker.toUpperCase();

  if (!SUPPORTED_TICKERS.includes(ticker)) {
    return res.status(404).json({
      success: false,
      error: `Unsupported ticker: ${ticker}`,
    });
  }

  const history = simulationEngine.getHistory(ticker);
  res.json({ success: true, data: { ticker, history } });
});

export default router;
