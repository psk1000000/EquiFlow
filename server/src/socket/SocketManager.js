/**
 * Socket.IO Manager — WebSocket Pub/Sub Layer.
 *
 * Implements a room-based publish/subscribe pattern where each stock ticker
 * is a Socket.IO room.  Users join rooms when they subscribe to a stock and
 * leave when they unsubscribe, so price updates are only sent to interested
 * clients — this is far more efficient than broadcasting everything to
 * everyone.
 *
 * Room naming convention:
 *   - `stock:GOOG`  — per-stock price + news rooms
 *   - `user:{id}`   — private room for user-specific notifications
 */

import { SUPPORTED_TICKERS, STOCKS } from '../config/index.js';
import userStore from '../models/UserStore.js';
import simulationEngine from '../services/StockSimulationEngine.js';
import newsGenerator from '../services/NewsGenerator.js';
import notificationService from '../services/NotificationService.js';
import { subscriptionSchema } from '../validators/schemas.js';

/**
 * Track socket → user mapping for cleanup on disconnect.
 * @type {Map<string, { userId: string, token: string, subscriptions: Set<string> }>}
 */
const socketSessions = new Map();

/**
 * Initialise Socket.IO event handlers.
 *
 * @param {import('socket.io').Server} io
 */
function initSocketManager(io) {
  // ─── Authentication middleware ────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const user = userStore.getByToken(token);
    if (!user) {
      return next(new Error('Invalid or expired token'));
    }

    socket.userId = user.id;
    socket.userEmail = user.email;
    next();
  });

  // ─── Connection handler ───────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { userId, userEmail } = socket;
    console.log(`[Socket] Connected: ${userEmail} (${socket.id})`);

    // Join the user's private notification room
    socket.join(`user:${userId}`);

    // Track this socket's session
    socketSessions.set(socket.id, {
      userId,
      token: socket.handshake.auth.token,
      subscriptions: new Set(),
    });

    // ─── Subscribe to a stock ─────────────────────────────────────────
    socket.on('stock:subscribe', (data, ack) => {
      const { error } = subscriptionSchema.validate(data);
      if (error) {
        return ack?.({ success: false, error: error.details[0].message });
      }

      const { ticker } = data;
      const session = socketSessions.get(socket.id);
      if (!session) return;

      // Join the stock room
      socket.join(`stock:${ticker}`);
      session.subscriptions.add(ticker);

      // Persist to user store
      userStore.setSubscriptions(userId, [...session.subscriptions]);

      // Send current price + history immediately
      const priceData = simulationEngine.getPrice(ticker);
      const history = simulationEngine.getHistory(ticker);

      socket.emit('stock:price-update', { ...priceData, history });

      console.log(`[Socket] ${userEmail} subscribed to ${ticker}`);
      ack?.({ success: true, ticker });
    });

    // ─── Unsubscribe from a stock ─────────────────────────────────────
    socket.on('stock:unsubscribe', (data, ack) => {
      const { error } = subscriptionSchema.validate(data);
      if (error) {
        return ack?.({ success: false, error: error.details[0].message });
      }

      const { ticker } = data;
      const session = socketSessions.get(socket.id);
      if (!session) return;

      socket.leave(`stock:${ticker}`);
      session.subscriptions.delete(ticker);

      userStore.setSubscriptions(userId, [...session.subscriptions]);

      console.log(`[Socket] ${userEmail} unsubscribed from ${ticker}`);
      ack?.({ success: true, ticker });
    });

    // ─── Mark notification as read ────────────────────────────────────
    socket.on('notification:mark-read', ({ notificationId }) => {
      notificationService.markAsRead(userId, notificationId);
    });

    // ─── Clear all notifications ──────────────────────────────────────
    socket.on('notification:clear-all', () => {
      notificationService.clearAll(userId);
    });

    // ─── Disconnect cleanup ───────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      const session = socketSessions.get(socket.id);
      socketSessions.delete(socket.id);
      console.log(`[Socket] Disconnected: ${userEmail} (${reason})`);
    });
  });

  // ─── Price update broadcasting ──────────────────────────────────────
  for (const ticker of SUPPORTED_TICKERS) {
    simulationEngine.on(`price:${ticker}`, (data) => {
      const history = simulationEngine.getHistory(ticker);
      io.to(`stock:${ticker}`).emit('stock:price-update', { ...data, history });
    });
  }

  // ─── Price alert forwarding ─────────────────────────────────────────
  notificationService.on('priceAlert', ({ ticker, direction, changePercent, price }) => {
    // Find all users subscribed to this ticker and create notifications for them
    for (const [socketId, session] of socketSessions) {
      if (session.subscriptions.has(ticker)) {
        notificationService.createPriceAlert(
          session.userId, ticker, direction, changePercent, price
        );
      }
    }
  });

  // ─── News broadcasting ─────────────────────────────────────────────
  notificationService.setNewsDispatchCallback((newsItem) => {
    if (newsItem.ticker) {
      // Stock-specific news → broadcast to that stock's room
      io.to(`stock:${newsItem.ticker}`).emit('news:update', newsItem);

      // Also create a notification for subscribed users
      for (const [socketId, session] of socketSessions) {
        if (session.subscriptions.has(newsItem.ticker)) {
          notificationService.createNewsNotification(session.userId, newsItem);
        }
      }
    } else {
      // Market-wide news → broadcast to all connected clients
      io.emit('news:update', newsItem);
    }
  });

  // ─── Notification dispatch via user's private room ──────────────────
  notificationService.setDispatchCallback((userId, notification) => {
    io.to(`user:${userId}`).emit('notification', notification);
  });

  console.log('[Socket] Manager initialised with room-based pub/sub');
}

export default initSocketManager;
