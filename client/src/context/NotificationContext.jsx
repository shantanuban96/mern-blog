import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../api/http';
import { useAuth } from './AuthContext';

// Real-time notifications (e.g. "Jane commented on your post") via Socket.io
const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return undefined;

    // The server checks the access token and joins us to our own room
    const socket = io({ auth: (send) => send({ token: getAccessToken() }) });

    socket.on('notification', (notification) => {
      setNotifications((list) => [{ ...notification, id: Date.now(), read: false }, ...list]);
    });

    return () => {
      socket.disconnect();
      setNotifications([]);
    };
  }, [user?._id]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () => setNotifications((list) => list.map((n) => ({ ...n, read: true })));

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
