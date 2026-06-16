/**
 * Socket.IO client singleton.
 *
 * Manages a single WebSocket connection with automatic reconnection.
 * The connection is only established after authentication, passing the
 * session token via the `auth` handshake option.
 */

import { io } from 'socket.io-client';

let socket = null;

/**
 * Establish a Socket.IO connection with the given auth token.
 *
 * @param {string} token - Session token from login.
 * @returns {import('socket.io-client').Socket}
 */
export function connectSocket(token) {
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io(window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
  });

  socket.on('reconnect', (attempt) => {
    console.log(`[Socket] Reconnected after ${attempt} attempt(s)`);
  });

  return socket;
}

/**
 * Get the current socket instance (may be null if not connected).
 *
 * @returns {import('socket.io-client').Socket|null}
 */
export function getSocket() {
  return socket;
}

/**
 * Disconnect and clean up the socket.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
