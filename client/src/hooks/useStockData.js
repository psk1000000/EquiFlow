/**
 * useStockData — real-time stock price state management.
 *
 * Listens to Socket.IO price update events and manages the stock data state
 * for all subscribed tickers.  Also manages the subscription list and
 * provides subscribe/unsubscribe handlers.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';

/**
 * @returns {{
 *   stocks: Object<string, Object>,
 *   subscriptions: string[],
 *   news: Array,
 *   handleSubscribe: (ticker: string) => Promise<void>,
 *   handleUnsubscribe: (ticker: string) => Promise<void>,
 * }}
 */
export function useStockData(socketHook) {
  const { socket, connected, subscribe, unsubscribe } = socketHook;

  /** ticker → { price, change, changePercent, history, ... } */
  const [stocks, setStocks] = useState({});

  /** List of currently subscribed tickers. */
  const [subscriptions, setSubscriptions] = useState([]);

  /** Recent news items. */
  const [news, setNews] = useState([]);

  // Listen for price updates
  useEffect(() => {
    const currentSocket = getSocket();
    if (!currentSocket) return;

    const handlePriceUpdate = (data) => {
      setStocks((prev) => ({
        ...prev,
        [data.ticker]: {
          ...data,
          updatedAt: Date.now(),
        },
      }));
    };

    const handleNewsUpdate = (newsItem) => {
      setNews((prev) => [newsItem, ...prev].slice(0, 50)); // Keep last 50
    };

    currentSocket.on('stock:price-update', handlePriceUpdate);
    currentSocket.on('news:update', handleNewsUpdate);

    return () => {
      currentSocket.off('stock:price-update', handlePriceUpdate);
      currentSocket.off('news:update', handleNewsUpdate);
    };
  }, [connected]);

  /** Subscribe to a stock. */
  const handleSubscribe = useCallback(async (ticker) => {
    if (subscriptions.includes(ticker)) return;

    try {
      await subscribe(ticker);
      setSubscriptions((prev) => [...prev, ticker]);
    } catch (err) {
      console.error(`Failed to subscribe to ${ticker}:`, err.message);
      throw err;
    }
  }, [subscribe, subscriptions]);

  /** Unsubscribe from a stock. */
  const handleUnsubscribe = useCallback(async (ticker) => {
    try {
      await unsubscribe(ticker);
      setSubscriptions((prev) => prev.filter((t) => t !== ticker));
      setStocks((prev) => {
        const next = { ...prev };
        delete next[ticker];
        return next;
      });
    } catch (err) {
      console.error(`Failed to unsubscribe from ${ticker}:`, err.message);
      throw err;
    }
  }, [unsubscribe]);

  return {
    stocks,
    subscriptions,
    news,
    handleSubscribe,
    handleUnsubscribe,
  };
}
