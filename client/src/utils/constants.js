/**
 * Application constants — stock metadata, colors, and configuration.
 */

export const SUPPORTED_STOCKS = {
  GOOG: {
    ticker: 'GOOG',
    name: 'Alphabet Inc.',
    color: '#4285f4',
    logo: '🔍',
  },
  TSLA: {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    color: '#e82127',
    logo: '⚡',
  },
  AMZN: {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    color: '#ff9900',
    logo: '📦',
  },
  META: {
    ticker: 'META',
    name: 'Meta Platforms, Inc.',
    color: '#0668e1',
    logo: '🌐',
  },
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    color: '#76b900',
    logo: '🎮',
  },
};

export const SUPPORTED_TICKERS = Object.keys(SUPPORTED_STOCKS);

export const SENTIMENT_CONFIG = {
  bullish: { label: 'Bullish', color: '#22c55e', icon: '🟢' },
  bearish: { label: 'Bearish', color: '#ef4444', icon: '🔴' },
  neutral: { label: 'Neutral', color: '#94a3b8', icon: '⚪' },
};

export const NOTIFICATION_TYPES = {
  TRADE_EXECUTED: { color: '#22c55e', icon: '💰' },
  PRICE_ALERT: { color: '#f59e0b', icon: '📈' },
  NEWS_ALERT: { color: '#3b82f6', icon: '📰' },
};

export const API_BASE = '/api';
export const SOCKET_URL = window.location.origin;
