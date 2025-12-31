import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

interface ChatNotification {
  location: string;
  subLocation: string | null;
  unreadCount: number;
  lastMessageAt: string;
}

export function useChatNotifications(userId: string | null) {
  const [chatNotifications, setChatNotifications] = useState<Map<string, ChatNotification>>(new Map());
  const [totalUnread, setTotalUnread] = useState(0);
  const [lastSeenTimestamps, setLastSeenTimestamps] = useState<Map<string, string>>(new Map());

  // Load last seen timestamps from localStorage
  useEffect(() => {
    if (!userId) return;
    
    const stored = localStorage.getItem(`chat-seen-${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLastSeenTimestamps(new Map(Object.entries(parsed)));
      } catch (e) {
        console.error('Error parsing chat seen timestamps:', e);
      }
    }
  }, [userId]);

  // Mark a chat as read
  const markChatAsRead = useCallback((location: string, subLocation?: string | null) => {
    if (!userId) return;
    
    const key = subLocation ? `${location}:${subLocation}` : location;
    const now = new Date().toISOString();
    
    setLastSeenTimestamps(prev => {
      const updated = new Map(prev);
      updated.set(key, now);
      
      // Save to localStorage
      const obj: Record<string, string> = {};
      updated.forEach((v, k) => { obj[k] = v; });
      localStorage.setItem(`chat-seen-${userId}`, JSON.stringify(obj));
      
      return updated;
    });

    setChatNotifications(prev => {
      const updated = new Map(prev);
      const existing = updated.get(key);
      if (existing) {
        updated.set(key, { ...existing, unreadCount: 0 });
      }
      return updated;
    });

    setTotalUnread(prev => {
      const existing = chatNotifications.get(key);
      return Math.max(0, prev - (existing?.unreadCount || 0));
    });
  }, [userId, chatNotifications]);

  // Subscribe to new chat messages
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('chat-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMsg = payload.new as {
            id: string;
            user_id: string;
            location: string;
            sub_location: string | null;
            created_at: string;
          };
          
          // Don't notify for own messages
          if (newMsg.user_id === userId) return;
          
          // Skip OFF chat messages
          if (newMsg.sub_location === 'OFF') return;
          
          const key = newMsg.sub_location 
            ? `${newMsg.location}:${newMsg.sub_location}` 
            : newMsg.location;
          
          const lastSeen = lastSeenTimestamps.get(key);
          const msgTime = new Date(newMsg.created_at).getTime();
          const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
          
          // Only count if message is newer than last seen
          if (msgTime > lastSeenTime) {
            setChatNotifications(prev => {
              const updated = new Map(prev);
              const existing = updated.get(key);
              
              updated.set(key, {
                location: newMsg.location,
                subLocation: newMsg.sub_location,
                unreadCount: (existing?.unreadCount || 0) + 1,
                lastMessageAt: newMsg.created_at
              });
              
              return updated;
            });
            
            setTotalUnread(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, lastSeenTimestamps]);

  // Get unread count for a specific location
  const getUnreadCount = useCallback((location: string, subLocation?: string | null): number => {
    const key = subLocation ? `${location}:${subLocation}` : location;
    return chatNotifications.get(key)?.unreadCount || 0;
  }, [chatNotifications]);

  // Get total unread for a location (including all sub-locations)
  const getLocationUnread = useCallback((location: string): number => {
    let count = 0;
    chatNotifications.forEach((notif, key) => {
      if (key === location || key.startsWith(`${location}:`)) {
        count += notif.unreadCount;
      }
    });
    return count;
  }, [chatNotifications]);

  return {
    chatNotifications,
    totalUnread,
    markChatAsRead,
    getUnreadCount,
    getLocationUnread
  };
}
