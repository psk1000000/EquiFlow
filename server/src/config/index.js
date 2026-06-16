/**
 * Centralized application configuration.
 *
 * All magic numbers, feature flags, and environment-dependent values live here.
 * Importing from a single config module avoids scattered literals and makes
 * the application easy to reconfigure for different deployment environments.
 */

/** @type {number} Server port — honours the PORT env var for cloud deployments. */
const PORT = parseInt(process.env.PORT, 10) || 3001;

/** @type {string[]} Allowed CORS origins for the React dev server and production build. */
const CORS_ORIGINS = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:4173',  // Vite preview
  'http://localhost:3000',  // Alternate dev port
];

/**
 * Stock definitions.
 *
 * Each stock is configured with parameters for the Geometric Brownian Motion
 * (GBM) price simulator:
 *   - initialPrice : starting price when the simulation boots
 *   - volatility   : annualised σ — higher means wilder swings
 *   - drift        : annualised μ — positive = upward trend
 *
 * These values are loosely inspired by real-world characteristics of each
 * company's stock behaviour to make the simulation feel authentic.
 */
const STOCKS = {
  GOOG: {
    ticker: 'GOOG',
    name: 'Alphabet Inc.',
    initialPrice: 178.25,
    volatility: 0.28,
    drift: 0.08,
    color: '#4285f4',
  },
  TSLA: {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    initialPrice: 248.50,
    volatility: 0.55,
    drift: 0.12,
    color: '#e82127',
  },
  AMZN: {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    initialPrice: 192.75,
    volatility: 0.32,
    drift: 0.10,
    color: '#ff9900',
  },
  META: {
    ticker: 'META',
    name: 'Meta Platforms, Inc.',
    initialPrice: 510.30,
    volatility: 0.38,
    drift: 0.09,
    color: '#0668e1',
  },
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    initialPrice: 135.40,
    volatility: 0.48,
    drift: 0.15,
    color: '#76b900',
  },
};

/** @type {string[]} Ordered list of supported ticker symbols. */
const SUPPORTED_TICKERS = Object.keys(STOCKS);

/** @type {number} Milliseconds between each price tick. */
const SIMULATION_INTERVAL_MS = 1000;

/** @type {number} Maximum data points retained per stock for sparkline charts. */
const PRICE_HISTORY_SIZE = 60;

/** @type {number} Virtual cash each new user starts with. */
const STARTING_CASH = 100_000;

/** @type {number} Minimum quantity per trade order. */
const MIN_TRADE_QUANTITY = 1;

/** @type {number} Maximum quantity per single trade order (risk guardrail). */
const MAX_TRADE_QUANTITY = 1000;

/** @type {number} Maximum notifications stored per user. */
const MAX_NOTIFICATIONS_PER_USER = 50;

/**
 * Price alert threshold.
 * A notification fires when a stock moves more than this percentage
 * from the session open price.
 * @type {number}
 */
const PRICE_ALERT_THRESHOLD_PCT = 5;

/** Rate limiter settings. */
const RATE_LIMIT = {
  windowMs: 60_000,    // 1-minute window
  maxRequests: 100,    // requests per window per IP
};

export {
  PORT,
  CORS_ORIGINS,
  STOCKS,
  SUPPORTED_TICKERS,
  SIMULATION_INTERVAL_MS,
  PRICE_HISTORY_SIZE,
  STARTING_CASH,
  MIN_TRADE_QUANTITY,
  MAX_TRADE_QUANTITY,
  MAX_NOTIFICATIONS_PER_USER,
  PRICE_ALERT_THRESHOLD_PCT,
  RATE_LIMIT,
};
