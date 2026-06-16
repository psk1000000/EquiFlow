/**
 * Stock Simulation Engine — Geometric Brownian Motion (GBM).
 *
 * Generates realistic stock price movements using the discrete-time GBM model,
 * which is the industry-standard stochastic process for modelling equity prices
 * (it underpins the Black-Scholes option pricing model).
 *
 * The discrete approximation at each time step Δt is:
 *
 *   S(t+Δt) = S(t) × exp((μ − σ²/2)Δt + σ√Δt × Z)
 *
 * Where:
 *   S(t)  = current price
 *   μ     = annualised drift (expected return)
 *   σ     = annualised volatility
 *   Δt    = time step in years (1 second ≈ 1/(252×6.5×3600) of a trading year)
 *   Z     = standard normal random variable (Box-Muller transform)
 *
 * This approach produces prices that:
 *   - Are always positive (log-normal distribution)
 *   - Exhibit realistic clustering of volatility
 *   - Show meaningful trends rather than pure noise
 *   - Differ visibly between high-vol (TSLA) and low-vol (GOOG) stocks
 */

import { EventEmitter } from 'events';
import { STOCKS, SUPPORTED_TICKERS, SIMULATION_INTERVAL_MS } from '../config/index.js';
import PriceHistoryStore from './PriceHistoryStore.js';

/**
 * Generate a standard normal random variable using the Box-Muller transform.
 *
 * @returns {number}
 */
function boxMullerRandom() {
  let u1, u2;
  do { u1 = Math.random(); } while (u1 === 0); // Avoid log(0)
  u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

class StockSimulationEngine extends EventEmitter {
  constructor() {
    super();

    /** Current price state per ticker. */
    this._prices = new Map();

    /** Session open prices (for calculating daily change). */
    this._openPrices = new Map();

    /** Session high / low tracking. */
    this._sessionHigh = new Map();
    this._sessionLow = new Map();

    /** Price history for sparkline charts. */
    this._history = new PriceHistoryStore();

    /** Interval handle for cleanup. */
    this._intervalId = null;

    /**
     * Time step in years.
     * Assumes ~252 trading days × 6.5 hours × 3600 seconds per year.
     */
    this._dt = SIMULATION_INTERVAL_MS / 1000 / (252 * 6.5 * 3600);

    // Initialise each stock with its configured starting price.
    for (const ticker of SUPPORTED_TICKERS) {
      const config = STOCKS[ticker];
      this._prices.set(ticker, config.initialPrice);
      this._openPrices.set(ticker, config.initialPrice);
      this._sessionHigh.set(ticker, config.initialPrice);
      this._sessionLow.set(ticker, config.initialPrice);
      this._history.init(ticker);
    }
  }

  /**
   * Start the simulation loop.
   * Emits a `tick` event every interval with price data for all stocks.
   */
  start() {
    if (this._intervalId) return; // Already running

    console.log('[SimEngine] Starting stock simulation (GBM model)');
    console.log(`[SimEngine] Tick interval: ${SIMULATION_INTERVAL_MS}ms`);

    // Emit an initial tick so clients get data immediately on connect.
    this._tick();

    this._intervalId = setInterval(() => this._tick(), SIMULATION_INTERVAL_MS);
  }

  /** Stop the simulation loop. */
  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
      console.log('[SimEngine] Simulation stopped');
    }
  }

  /**
   * Generates a simulated order book (bids and asks) around a given price.
   *
   * @param {number} currentPrice
   * @returns {Object} { bids: Array, asks: Array }
   * @private
   */
  _generateOrderBook(currentPrice) {
    const bids = [];
    const asks = [];
    let bidPrice = currentPrice - 0.01;
    let askPrice = currentPrice + 0.01;

    for (let i = 0; i < 15; i++) {
      // Randomize distance from spread slightly
      bidPrice -= Math.random() * 0.05;
      askPrice += Math.random() * 0.05;

      bids.push({
        price: Math.max(0.01, Math.round(bidPrice * 100) / 100),
        size: Math.floor(Math.random() * 500) + 10,
      });

      asks.push({
        price: Math.round(askPrice * 100) / 100,
        size: Math.floor(Math.random() * 500) + 10,
      });
    }

    return { bids, asks };
  }

  /**
   * Single simulation tick — advance every stock price by one GBM step.
   * @private
   */
  _tick() {
    const timestamp = Date.now();
    const updates = {};

    for (const ticker of SUPPORTED_TICKERS) {
      const config = STOCKS[ticker];
      const currentPrice = this._prices.get(ticker);

      // GBM discrete step (log-normal)
      const z = boxMullerRandom();
      const exponent =
        (config.drift - 0.5 * config.volatility ** 2) * this._dt +
        config.volatility * Math.sqrt(this._dt) * z;
      let newPrice = currentPrice * Math.exp(exponent);

      // Floor price at $1 to prevent nonsensical values
      newPrice = Math.max(1, newPrice);

      // Round to 2 decimal places (cents)
      newPrice = Math.round(newPrice * 100) / 100;

      // Update state
      this._prices.set(ticker, newPrice);

      // Update session high/low
      const high = Math.max(this._sessionHigh.get(ticker), newPrice);
      const low = Math.min(this._sessionLow.get(ticker), newPrice);
      this._sessionHigh.set(ticker, high);
      this._sessionLow.set(ticker, low);

      // Calculate change from session open
      const openPrice = this._openPrices.get(ticker);
      const change = newPrice - openPrice;
      const changePercent = (change / openPrice) * 100;

      // Store in history ring buffer
      const dataPoint = { price: newPrice, timestamp, high, low };
      this._history.push(ticker, dataPoint);

      updates[ticker] = {
        ticker,
        name: config.name,
        color: config.color,
        price: newPrice,
        previousPrice: currentPrice,
        open: openPrice,
        high,
        low,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        timestamp,
        orderBook: this._generateOrderBook(newPrice),
      };
    }

    // Emit per-stock events (for targeted room broadcasts)
    for (const ticker of SUPPORTED_TICKERS) {
      this.emit(`price:${ticker}`, updates[ticker]);
    }

    // Emit a single combined event (for admin / debug)
    this.emit('tick', updates);
  }

  /**
   * Get the current price snapshot for a single stock.
   *
   * @param {string} ticker
   * @returns {Object|null}
   */
  getPrice(ticker) {
    const price = this._prices.get(ticker);
    if (price === undefined) return null;

    const config = STOCKS[ticker];
    const openPrice = this._openPrices.get(ticker);
    const change = price - openPrice;
    const changePercent = (change / openPrice) * 100;

    return {
      ticker,
      name: config.name,
      color: config.color,
      price,
      open: openPrice,
      high: this._sessionHigh.get(ticker),
      low: this._sessionLow.get(ticker),
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      timestamp: Date.now(),
      orderBook: this._generateOrderBook(price),
    };
  }

  /**
   * Get current prices for all stocks.
   *
   * @returns {Object<string, Object>}
   */
  getAllPrices() {
    const result = {};
    for (const ticker of SUPPORTED_TICKERS) {
      result[ticker] = this.getPrice(ticker);
    }
    return result;
  }

  /**
   * Get a simple ticker → price map (used by portfolio valuation).
   *
   * @returns {Object<string, number>}
   */
  getPriceMap() {
    const map = {};
    for (const [ticker, price] of this._prices) {
      map[ticker] = price;
    }
    return map;
  }

  /**
   * Get the price history for a ticker (for sparkline charts).
   *
   * @param {string} ticker
   * @param {number} [count]
   * @returns {Array}
   */
  getHistory(ticker, count) {
    return this._history.getHistory(ticker, count);
  }
}

// Singleton — the simulation runs once and is shared across all connections.
const simulationEngine = new StockSimulationEngine();
export default simulationEngine;
