/**
 * Formatting utilities for prices, numbers, dates, and percentages.
 */

/**
 * Format a number as USD currency.
 * @param {number} value
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatCurrency(value, decimals = 2) {
  if (value == null || isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number with commas.
 * @param {number} value
 * @param {number} [decimals=0]
 * @returns {string}
 */
export function formatNumber(value, decimals = 0) {
  if (value == null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a percentage with sign.
 * @param {number} value
 * @returns {string}
 */
export function formatPercent(value) {
  if (value == null || isNaN(value)) return '0.00%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format a price change with sign.
 * @param {number} value
 * @returns {string}
 */
export function formatChange(value) {
  if (value == null || isNaN(value)) return '$0.00';
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

/**
 * Format an ISO timestamp to a human-readable time string.
 * @param {string} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Format an ISO timestamp to relative time (e.g., "2m ago").
 * @param {string} timestamp
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}
