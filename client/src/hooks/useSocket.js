/**
 * useSocket — Socket.IO connection lifecycle hook.
 *
 * Establishes a WebSocket connection when the user is authenticated,
 * tracks connection status, and handles automatic cleanup on logout
 * or component unmount.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

/**
 * @returns {{
 *   socket: import('socket.io-client').Socket|null,
 *   connected: boolean,
 *   subscribe: (ticker: string) => Promise<Object>,
 *   unsubscribe: (ticker: string) => Promise<Object>,
 * }}
 */
export function useSocket() {
  const { token, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const subscribedRef = useRef(new Set());

  // Connect / disconnect based on auth state
  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    const socket = connectSocket(token);
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      // Re-subscribe to all previously subscribed stocks after reconnect
      for (const ticker of subscribedRef.current) {
        socket.emit('stock:subscribe', { ticker });
      }
    };

    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // If already connected (immediate), set state
    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      disconnectSocket();
      setConnected(false);
    };
  }, [token, isAuthenticated]);

  /** Subscribe to a stock ticker. */
  const subscribe = useCallback((ticker) => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        return reject(new Error('Socket not connected'));
      }

      socket.emit('stock:subscribe', { ticker }, (response) => {
        if (response.success) {
          subscribedRef.current.add(ticker);
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  /** Unsubscribe from a stock ticker. */
  const unsubscribe = useCallback((ticker) => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        return reject(new Error('Socket not connected'));
      }

      socket.emit('stock:unsubscribe', { ticker }, (response) => {
        if (response.success) {
          subscribedRef.current.delete(ticker);
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  return {
    socket: socketRef.current,
    connected,
    subscribe,
    unsubscribe,
  };
}
