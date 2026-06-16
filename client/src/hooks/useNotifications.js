/**
 * useNotifications — notification management hook.
 *
 * Listens for real-time notification events via Socket.IO, manages a
 * notification queue for toast display, and tracks read/unread state.
 */

import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../services/socket';

/**
 * @returns {{
 *   notifications: Array,
 *   unreadCount: number,
 *   toasts: Array,
 *   dismissToast: (id: string) => void,
 *   markAsRead: (id: string) => void,
 *   clearAll: () => void,
 * }}
 */
export function useNotifications(connected) {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Listen for incoming notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNotification = (notification) => {
      // Add to notification list
      setNotifications((prev) => [notification, ...prev].slice(0, 50));

      // Add to toast queue
      setToasts((prev) => [...prev, notification]);

      // Auto-dismiss toast after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== notification.id));
      }, 5000);
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [connected]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAsRead = useCallback((id) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('notification:mark-read', { notificationId: id });
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearAll = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('notification:clear-all');
    }
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    toasts,
    dismissToast,
    markAsRead,
    clearAll,
  };
}
