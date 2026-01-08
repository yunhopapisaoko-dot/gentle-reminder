import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  actor_name: string;
  actor_avatar: string | null;
  type: 'like' | 'comment';
  post_id: string | null;
  comment_id: string | null;
  content: string | null;
  read: boolean;
  created_at: string;
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter(n => !n.read).length);
    }
    setLoading(false);
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    setNotifications(prev => {
      const notif = prev.find(n => n.id === notificationId);
      if (notif && !notif.read) {
        setUnreadCount(c => Math.max(0, c - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications
  };
}
