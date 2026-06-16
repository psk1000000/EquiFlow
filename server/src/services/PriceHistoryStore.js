/**
 * Ring-buffer price history store.
 *
 * Maintains a fixed-size circular buffer of price data points per stock
 * ticker.  When the buffer is full, the oldest entry is silently overwritten.
 * This gives O(1) insertion and O(n) read — ideal for sparkline chart data
 * where we only ever need the most recent N points.
 */

import { PRICE_HISTORY_SIZE } from '../config/index.js';

class PriceHistoryStore {
  /**
   * @param {number} [maxSize] - Maximum data points per ticker.
   */
  constructor(maxSize = PRICE_HISTORY_SIZE) {
    /** @type {number} */
    this._maxSize = maxSize;

    /**
     * ticker → { buffer: Array, head: number, count: number }
     * @type {Map<string, Object>}
     */
    this._buffers = new Map();
  }

  /**
   * Initialise the ring buffer for a ticker.
   *
   * @param {string} ticker
   */
  init(ticker) {
    this._buffers.set(ticker, {
      buffer: new Array(this._maxSize),
      head: 0,
      count: 0,
    });
  }

  /**
   * Push a new data point into the ring buffer.
   *
   * @param {string} ticker
   * @param {{ price: number, timestamp: number, high: number, low: number }} dataPoint
   */
  push(ticker, dataPoint) {
    const ring = this._buffers.get(ticker);
    if (!ring) return;

    ring.buffer[ring.head] = dataPoint;
    ring.head = (ring.head + 1) % this._maxSize;
    if (ring.count < this._maxSize) ring.count++;
  }

  /**
   * Retrieve the most recent data points for a ticker, in chronological order.
   *
   * @param {string} ticker
   * @param {number} [count] - How many points to retrieve (defaults to all).
   * @returns {Array}
   */
  getHistory(ticker, count) {
    const ring = this._buffers.get(ticker);
    if (!ring || ring.count === 0) return [];

    const n = Math.min(count || ring.count, ring.count);
    const result = [];

    // Walk backwards from head by `n` positions.
    let idx = (ring.head - n + this._maxSize) % this._maxSize;
    for (let i = 0; i < n; i++) {
      result.push(ring.buffer[idx]);
      idx = (idx + 1) % this._maxSize;
    }

    return result;
  }

  /**
   * Get the latest data point for a ticker.
   *
   * @param {string} ticker
   * @returns {Object|null}
   */
  getLatest(ticker) {
    const ring = this._buffers.get(ticker);
    if (!ring || ring.count === 0) return null;
    const idx = (ring.head - 1 + this._maxSize) % this._maxSize;
    return ring.buffer[idx];
  }
}

export default PriceHistoryStore;
