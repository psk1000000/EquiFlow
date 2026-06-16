/**
 * Notification Service.
 *
 * Listens to events from other services (TradingEngine, StockSimulationEngine,
 * NewsGenerator) and produces user-facing notifications.  Notifications are
 * dispatched via a callback (set by SocketManager) and also stored per-user
 * for the notification centre history.
 */

import { v4 as uuidv4 } from 'uuid';
import { MAX_NOTIFICATIONS_PER_USER, PRICE_ALERT_THRESHOLD_PCT } from '../config/index.js';
import tradingEngine from './TradingEngine.js';
import simulationEngine from './StockSimulationEngine.js';
import newsGenerator from './NewsGenerator.js';

/**
 * @typedef {Object} Notification
 * @property {string}  id
 * @property {'TRADE_EXECUTED'|'PRICE_ALERT'|'NEWS_ALERT'} type
 * @property {string}  title
 * @property {string}  message
 * @property {string}  [ticker]
 * @property {string}  timestamp
 * @property {boolean} read
 */

class NotificationService {
  constructor() {
    /**
     * userId → Notification[]
     * @type {Map<string, Notification[]>}
     */
    this._notifications = new Map();

    /**
     * Callback for dispatching a notification to a specific user via WebSocket.
     * Set by SocketManager after initialisation.
     * @type {((userId: string, notification: Notification) => void) | null}
     */
    this._dispatchCallback = null;

    /**
     * Callback for dispatching a news item to stock subscribers.
     * @type {((newsItem: Object) => void) | null}
     */
    this._newsDispatchCallback = null;

    /**
     * Track which alerts have already fired per user per ticker per session
     * to avoid notification spam. key: `${userId}:${ticker}:${direction}`
     * @type {Set<string>}
     */
    this._firedAlerts = new Set();

    this._bindListeners();
  }

  /**
   * Register the WebSocket dispatch function.
   * Called once by SocketManager during setup.
   */
  setDispatchCallback(callback) {
    this._dispatchCallback = callback;
  }

  /**
   * Register the news broadcast function.
   */
  setNewsDispatchCallback(callback) {
    this._newsDispatchCallback = callback;
  }

  /**
   * Get stored notifications for a user.
   *
   * @param {string} userId
   * @returns {Notification[]}
   */
  getNotifications(userId) {
    return this._notifications.get(userId) || [];
  }

  /**
   * Mark a notification as read.
   *
   * @param {string} userId
   * @param {string} notificationId
   */
  markAsRead(userId, notificationId) {
    const notifications = this._notifications.get(userId);
    if (!notifications) return;
    const notif = notifications.find((n) => n.id === notificationId);
    if (notif) notif.read = true;
  }

  /**
   * Clear all notifications for a user.
   */
  clearAll(userId) {
    this._notifications.set(userId, []);
  }

  /** @private  Bind to service events. */
  _bindListeners() {
    // Trade execution notifications
    tradingEngine.on('trade', (event) => {
      const { userId, type, ticker, quantity, price } = event;
      const emoji = type === 'BUY' ? '🛒' : '💰';
      const action = type === 'BUY' ? 'Bought' : 'Sold';

      this._createAndDispatch(userId, {
        type: 'TRADE_EXECUTED',
        title: `${emoji} ${action} ${ticker}`,
        message: `${action} ${quantity} share${quantity > 1 ? 's' : ''} of ${ticker} at $${price.toFixed(2)}`,
        ticker,
      });
    });

    // Price alert notifications (±5% from open)
    simulationEngine.on('tick', (updates) => {
      for (const [ticker, data] of Object.entries(updates)) {
        if (Math.abs(data.changePercent) >= PRICE_ALERT_THRESHOLD_PCT) {
          const direction = data.changePercent > 0 ? 'up' : 'down';
          // This will be dispatched to all users subscribed to this ticker
          // SocketManager handles the user-targeting
          this.emit('priceAlert', {
            ticker,
            direction,
            changePercent: data.changePercent,
            price: data.price,
          });
        }
      }
    });

    // News → notification forwarding
    newsGenerator.on('news', (newsItem) => {
      // Forward to SocketManager for room-based broadcast
      if (this._newsDispatchCallback) {
        this._newsDispatchCallback(newsItem);
      }
    });
  }

  /**
   * Create a price alert notification for a specific user.
   * Called by SocketManager when it knows which users are subscribed.
   */
  createPriceAlert(userId, ticker, direction, changePercent, price) {
    const alertKey = `${userId}:${ticker}:${direction}`;
    if (this._firedAlerts.has(alertKey)) return; // Already alerted

    this._firedAlerts.add(alertKey);

    const emoji = direction === 'up' ? '📈' : '📉';
    const verb = direction === 'up' ? 'up' : 'down';

    this._createAndDispatch(userId, {
      type: 'PRICE_ALERT',
      title: `${emoji} ${ticker} Price Alert`,
      message: `${ticker} is ${verb} ${Math.abs(changePercent).toFixed(1)}% today — now at $${price.toFixed(2)}`,
      ticker,
    });
  }

  /**
   * Create a news notification for a specific user.
   */
  createNewsNotification(userId, newsItem) {
    this._createAndDispatch(userId, {
      type: 'NEWS_ALERT',
      title: `📰 ${newsItem.ticker || 'Market'} News`,
      message: newsItem.headline,
      ticker: newsItem.ticker,
    });
  }

  /**
   * @private
   * Create, store, and dispatch a notification.
   */
  _createAndDispatch(userId, { type, title, message, ticker }) {
    const notification = {
      id: uuidv4(),
      type,
      title,
      message,
      ticker: ticker || null,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Store
    if (!this._notifications.has(userId)) {
      this._notifications.set(userId, []);
    }
    const list = this._notifications.get(userId);
    list.unshift(notification);
    if (list.length > MAX_NOTIFICATIONS_PER_USER) {
      list.pop();
    }

    // Dispatch via WebSocket
    if (this._dispatchCallback) {
      this._dispatchCallback(userId, notification);
    }
  }
}

// Mix in EventEmitter for price alert broadcasting
import { EventEmitter } from 'events';
Object.setPrototypeOf(NotificationService.prototype, EventEmitter.prototype);

const notificationService = new NotificationService();
export default notificationService;
