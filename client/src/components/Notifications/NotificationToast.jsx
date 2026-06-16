import { NOTIFICATION_TYPES } from '../../utils/constants';
import './Notifications.css';

/**
 * Toast notification container — renders slide-in toasts from the top-right.
 */
export default function NotificationToast({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((toast) => {
        const config = NOTIFICATION_TYPES[toast.type] || {};
        return (
          <div
            key={toast.id}
            className="toast glass-elevated"
            style={{ '--toast-color': config.color }}
            onClick={() => onDismiss(toast.id)}
          >
            <span className="toast-icon">{config.icon || '📌'}</span>
            <div className="toast-body">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-message">{toast.message}</div>
            </div>
            <button
              className="toast-close"
              onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
