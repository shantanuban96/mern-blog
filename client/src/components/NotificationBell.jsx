import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    if (open) markAllRead();
    setOpen(!open);
  };

  return (
    <div className="bell">
      <button className="btn btn-small btn-light" onClick={toggle} aria-label="Notifications">
        🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="dropdown">
          {notifications.length === 0 && <p className="muted">No notifications yet</p>}
          {notifications.map((n) => (
            <Link key={n.id} to={n.link} className={n.read ? 'muted' : ''} onClick={toggle}>
              {n.message}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
