import { useState, useEffect, useCallback } from 'react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  generateAutomaticNotifications,
  NotificationRow,
  NotificationPreferenceRow,
  NotificationPreferenceUpdates,
} from '@/services/notifications';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferenceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      await generateAutomaticNotifications();
      const res = await fetchNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);

      const pref = await fetchNotificationPreferences();
      setPreferences(pref);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await load();
    })();
    return () => {
      active = false;
    };
  }, [load]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleUpdatePreferences = async (updates: NotificationPreferenceUpdates) => {
    const updated = await updateNotificationPreferences(updates);
    setPreferences(updated);
    return updated;
  };

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    error,
    reload: load,
    markAsRead: handleMarkAsRead,
    markAllRead: handleMarkAllRead,
    deleteNotification: handleDelete,
    updatePreferences: handleUpdatePreferences,
  };
}
