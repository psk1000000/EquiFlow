import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime } from '../../utils/formatters';
import { NOTIFICATION_TYPES } from '../../utils/constants';
import './Navbar.css';

export default function Navbar({ connected, notifications, unreadCount, markAsRead, clearAll }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarLetter = user?.email?.charAt(0)?.toUpperCase() || '?';

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">📊</span>
        <span className="navbar-title">EquiFlow</span>
      </div>

      <div className="navbar-right">
        <div className="navbar-status">
          <span className={`status-dot ${connected ? 'connected' : ''}`} />
          <span>{connected ? 'Live' : 'Connecting…'}</span>
        </div>

        <div className="notification-wrapper" ref={dropdownRef}>
          <button
            className="notification-bell"
            onClick={() => setShowDropdown(!showDropdown)}
            id="notification-bell-btn"
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showDropdown && (
            <div className="notification-dropdown glass-elevated" id="notification-dropdown">
              <div className="notification-dropdown-header">
                <h3>Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { clearAll(); setShowDropdown(false); }}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">No notifications yet</div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => markAsRead(n.id)}
                    >
                      <span className="notification-icon">
                        {NOTIFICATION_TYPES[n.type]?.icon || '📌'}
                      </span>
                      <div className="notification-content">
                        <div className="notification-title">{n.title}</div>
                        <div className="notification-message">{n.message}</div>
                      </div>
                      <span className="notification-time">{formatRelativeTime(n.timestamp)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="navbar-user">
          <div className="navbar-avatar">{avatarLetter}</div>
          <span className="navbar-email">{user?.email}</span>
        </div>

        <button
          className="btn btn-ghost btn-logout"
          onClick={logout}
          id="logout-btn"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
