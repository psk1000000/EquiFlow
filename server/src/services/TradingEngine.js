/**
 * Trading Engine.
 *
 * Orchestrates buy/sell order execution by delegating to the PortfolioStore
 * and fetching current prices from the StockSimulationEngine.  Emits trade
 * events so the NotificationService can react to them.
 */

import { EventEmitter } from 'events';
import { SUPPORTED_TICKERS } from '../config/index.js';
import portfolioStore from '../models/PortfolioStore.js';
import simulationEngine from './StockSimulationEngine.js';

class TradingEngine extends EventEmitter {
  /**
   * Execute a buy order at the current market price.
   *
   * @param {string} userId
   * @param {string} ticker
   * @param {number} quantity
   * @returns {{ success: boolean, transaction?: Object, error?: string }}
   */
  buy(userId, ticker, quantity) {
    if (!SUPPORTED_TICKERS.includes(ticker)) {
      return { success: false, error: `Unsupported ticker: ${ticker}` };
    }

    const priceData = simulationEngine.getPrice(ticker);
    if (!priceData) {
      return { success: false, error: 'Price data unavailable. Try again shortly.' };
    }

    const result = portfolioStore.buy(userId, ticker, quantity, priceData.price);

    if (result.success) {
      this.emit('trade', {
        userId,
        type: 'BUY',
        ticker,
        quantity,
        price: priceData.price,
        transaction: result.transaction,
      });
    }

    return result;
  }

  /**
   * Execute a sell order at the current market price.
   *
   * @param {string} userId
   * @param {string} ticker
   * @param {number} quantity
   * @returns {{ success: boolean, transaction?: Object, error?: string }}
   */
  sell(userId, ticker, quantity) {
    if (!SUPPORTED_TICKERS.includes(ticker)) {
      return { success: false, error: `Unsupported ticker: ${ticker}` };
    }

    const priceData = simulationEngine.getPrice(ticker);
    if (!priceData) {
      return { success: false, error: 'Price data unavailable. Try again shortly.' };
    }

    const result = portfolioStore.sell(userId, ticker, quantity, priceData.price);

    if (result.success) {
      this.emit('trade', {
        userId,
        type: 'SELL',
        ticker,
        quantity,
        price: priceData.price,
        transaction: result.transaction,
      });
    }

    return result;
  }

  /**
   * Get the user's portfolio with current market values.
   *
   * @param {string} userId
   * @returns {Object}
   */
  getPortfolio(userId) {
    return portfolioStore.getPortfolio(userId, simulationEngine.getPriceMap());
  }

  /**
   * Get transaction history for a user.
   *
   * @param {string} userId
   * @param {number} [limit]
   * @returns {Array}
   */
  getTransactions(userId, limit) {
    return portfolioStore.getTransactions(userId, limit);
  }
}

const tradingEngine = new TradingEngine();
export default tradingEngine;
