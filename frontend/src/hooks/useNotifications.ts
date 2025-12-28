import { useState, useEffect } from 'react';
import type { Notification } from '../types';

const STORAGE_KEY = 'tokamak_notifications';

const loadNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => loadNotifications());

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    removeNotification,
    clearAll,
  };
}
