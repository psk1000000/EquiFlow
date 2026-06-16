/**
 * Per-user portfolio management.
 *
 * Tracks cash balance, stock holdings (with average cost basis), and a full
 * transaction audit trail.  Uses FIFO cost-basis accounting for realised P&L
 * on sell orders.
 */

import { v4 as uuidv4 } from 'uuid';
import { STARTING_CASH } from '../config/index.js';

/**
 * @typedef {Object} Holding
 * @property {number} quantity       - Number of shares held.
 * @property {number} totalCost      - Cumulative cost of all purchases (for avg cost).
 * @property {number} avgCostBasis   - Weighted average price per share.
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {'BUY'|'SELL'} type
 * @property {string} ticker
 * @property {number} quantity
 * @property {number} pricePerShare
 * @property {number} totalValue
 * @property {number} [realisedPnL]  - Only present on SELL orders.
 * @property {string} timestamp
 */

class PortfolioStore {
  constructor() {
    /** @type {Map<string, { cash: number, holdings: Map<string, Holding>, transactions: Transaction[] }>} */
    this._portfolios = new Map();
  }

  /**
   * Ensure a portfolio exists for the given user.
   *
   * @param {string} userId
   * @returns {{ cash: number, holdings: Map<string, Holding>, transactions: Transaction[] }}
   */
  _ensurePortfolio(userId) {
    if (!this._portfolios.has(userId)) {
      this._portfolios.set(userId, {
        cash: STARTING_CASH,
        holdings: new Map(),
        transactions: [],
      });
    }
    return this._portfolios.get(userId);
  }

  /**
   * Execute a buy order.
   *
   * @param {string}  userId
   * @param {string}  ticker
   * @param {number}  quantity
   * @param {number}  pricePerShare  - Current market price from simulation.
   * @returns {{ success: boolean, transaction?: Transaction, error?: string }}
   */
  buy(userId, ticker, quantity, pricePerShare) {
    const portfolio = this._ensurePortfolio(userId);
    const totalCost = quantity * pricePerShare;

    if (totalCost > portfolio.cash) {
      return {
        success: false,
        error: `Insufficient funds. Required: $${totalCost.toFixed(2)}, Available: $${portfolio.cash.toFixed(2)}`,
      };
    }

    // Deduct cash
    portfolio.cash -= totalCost;

    // Update holding
    const existing = portfolio.holdings.get(ticker) || {
      quantity: 0,
      totalCost: 0,
      avgCostBasis: 0,
    };

    existing.quantity += quantity;
    existing.totalCost += totalCost;
    existing.avgCostBasis = existing.totalCost / existing.quantity;
    portfolio.holdings.set(ticker, existing);

    // Record transaction
    const transaction = {
      id: uuidv4(),
      type: 'BUY',
      ticker,
      quantity,
      pricePerShare,
      totalValue: totalCost,
      timestamp: new Date().toISOString(),
    };
    portfolio.transactions.unshift(transaction);

    return { success: true, transaction };
  }

  /**
   * Execute a sell order.
   *
   * Calculates realised P&L based on the average cost basis.
   *
   * @param {string}  userId
   * @param {string}  ticker
   * @param {number}  quantity
   * @param {number}  pricePerShare
   * @returns {{ success: boolean, transaction?: Transaction, error?: string }}
   */
  sell(userId, ticker, quantity, pricePerShare) {
    const portfolio = this._ensurePortfolio(userId);
    const holding = portfolio.holdings.get(ticker);

    if (!holding || holding.quantity < quantity) {
      const available = holding ? holding.quantity : 0;
      return {
        success: false,
        error: `Insufficient shares. Requested: ${quantity}, Available: ${available}`,
      };
    }

    const totalProceeds = quantity * pricePerShare;
    const costBasisForSold = quantity * holding.avgCostBasis;
    const realisedPnL = totalProceeds - costBasisForSold;

    // Credit cash
    portfolio.cash += totalProceeds;

    // Update holding
    holding.quantity -= quantity;
    holding.totalCost -= costBasisForSold;
    if (holding.quantity <= 0) {
      portfolio.holdings.delete(ticker);
    }

    // Record transaction
    const transaction = {
      id: uuidv4(),
      type: 'SELL',
      ticker,
      quantity,
      pricePerShare,
      totalValue: totalProceeds,
      realisedPnL,
      timestamp: new Date().toISOString(),
    };
    portfolio.transactions.unshift(transaction);

    return { success: true, transaction };
  }

  /**
   * Get a serialisable snapshot of the user's portfolio.
   *
   * @param {string} userId
   * @param {Object<string, number>} currentPrices - ticker → current price map.
   * @returns {Object}
   */
  getPortfolio(userId, currentPrices = {}) {
    const portfolio = this._ensurePortfolio(userId);
    const holdings = [];
    let totalUnrealisedPnL = 0;
    let totalHoldingsValue = 0;

    for (const [ticker, holding] of portfolio.holdings) {
      const currentPrice = currentPrices[ticker] || 0;
      const marketValue = holding.quantity * currentPrice;
      const unrealisedPnL = marketValue - holding.totalCost;
      const unrealisedPnLPct = holding.totalCost > 0
        ? ((unrealisedPnL / holding.totalCost) * 100)
        : 0;

      totalUnrealisedPnL += unrealisedPnL;
      totalHoldingsValue += marketValue;

      holdings.push({
        ticker,
        quantity: holding.quantity,
        avgCostBasis: holding.avgCostBasis,
        currentPrice,
        marketValue,
        unrealisedPnL,
        unrealisedPnLPct,
      });
    }

    // Calculate total realised P&L from all sell transactions
    const totalRealisedPnL = portfolio.transactions
      .filter((t) => t.type === 'SELL')
      .reduce((sum, t) => sum + (t.realisedPnL || 0), 0);

    return {
      cash: portfolio.cash,
      holdings,
      totalHoldingsValue,
      totalPortfolioValue: portfolio.cash + totalHoldingsValue,
      totalRealisedPnL,
      totalUnrealisedPnL,
      totalPnL: totalRealisedPnL + totalUnrealisedPnL,
    };
  }

  /**
   * Get the transaction history for a user.
   *
   * @param {string} userId
   * @param {number} [limit=20]
   * @returns {Transaction[]}
   */
  getTransactions(userId, limit = 20) {
    const portfolio = this._ensurePortfolio(userId);
    return portfolio.transactions.slice(0, limit);
  }
}

const portfolioStore = new PortfolioStore();
export default portfolioStore;
