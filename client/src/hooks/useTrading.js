/**
 * useTrading — trading and portfolio management hook.
 *
 * Provides methods to execute buy/sell orders via the REST API and
 * manages the portfolio state with periodic refresh from live prices.
 */

import { useState, useCallback, useEffect } from 'react';
import { tradeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * @returns {{
 *   portfolio: Object|null,
 *   transactions: Array,
 *   loading: boolean,
 *   error: string|null,
 *   executeBuy: (ticker: string, quantity: number) => Promise<Object>,
 *   executeSell: (ticker: string, quantity: number) => Promise<Object>,
 *   refreshPortfolio: () => Promise<void>,
 * }}
 */
export function useTrading() {
  const { token } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /** Fetch current portfolio from server. */
  const refreshPortfolio = useCallback(async () => {
    if (!token) return;
    try {
      const [portfolioRes, historyRes] = await Promise.all([
        tradeAPI.getPortfolio(token),
        tradeAPI.getHistory(token, 50),
      ]);
      setPortfolio(portfolioRes.data);
      setTransactions(historyRes.data.transactions);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh portfolio:', err.message);
    }
  }, [token]);

  // Initial portfolio load
  useEffect(() => {
    refreshPortfolio();
  }, [refreshPortfolio]);

  // Auto-refresh portfolio every 5 seconds to reflect price changes
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(refreshPortfolio, 5000);
    return () => clearInterval(interval);
  }, [token, refreshPortfolio]);

  /** Execute a buy order. */
  const executeBuy = useCallback(async (ticker, quantity) => {
    setLoading(true);
    setError(null);
    try {
      const result = await tradeAPI.buy(ticker, quantity, token);
      setPortfolio(result.data.portfolio);
      // Refresh transaction history
      const historyRes = await tradeAPI.getHistory(token, 50);
      setTransactions(historyRes.data.transactions);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  /** Execute a sell order. */
  const executeSell = useCallback(async (ticker, quantity) => {
    setLoading(true);
    setError(null);
    try {
      const result = await tradeAPI.sell(ticker, quantity, token);
      setPortfolio(result.data.portfolio);
      const historyRes = await tradeAPI.getHistory(token, 50);
      setTransactions(historyRes.data.transactions);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    portfolio,
    transactions,
    loading,
    error,
    executeBuy,
    executeSell,
    refreshPortfolio,
  };
}
