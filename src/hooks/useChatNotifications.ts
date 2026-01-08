import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';

interface ChatNotification {
  location: string;
  subLocation: string | null;
  unreadCount: number;
  lastMessageAt: string;
  lastMessageContent: string | null;
  lastMessageAuthor: string | null;
}

interface LastMessageInfo {
  content: string | null;
  author: string | null;
  timestamp: string;
}

// List of public chat locations that should always show unread notifications
const PUBLIC_CHAT_LOCATIONS = ['hospital', 'creche', 'restaurante', 'padaria', 'pousada', 'farmacia', 'supermercado', 'praia', 'chat_off'];

// List of restricted sub-locations that require authorization
// Users should NOT receive notifications or see previews for these unless they have access
const RESTRICTED_SUB_LOCATIONS = [
  // Hospital - salas de consulta
  'hospital:Sala 1', 'hospital:Sala 2', 'hospital:Sala 3', 'hospital:Sala 4', 'hospital:Sala 5',
  'hospital:Cirurgia',
  // Restaurante e Padaria - cozinha
  'restaurante:Cozinha', 'padaria:Cozinha',
  // Creche - sala de aula e parquinho
  'creche:Sala de Aula', 'creche:Parquinho',
];

// Helper to check if a location is restricted
export function isRestrictedLocation(location: string, subLocation?: string | null): boolean {
  const key = subLocation ? `${location}:${subLocation}` : location;
  return RESTRICTED_SUB_LOCATIONS.includes(key);
}

export function useChatNotifications(userId: string | null, subscribedRooms: string[] = [], activeLocation: string | null = null, userAuthorizedRooms: Set<string> = new Set()) {
  const [chatNotifications, setChatNotifications] = useState<Map<string, ChatNotification>>(new Map());
  const [lastMessages, setLastMessages] = useState<Map<string, LastMessageInfo>>(new Map());
  const [totalUnread, setTotalUnread] = useState(0);
  const [lastSeenTimestamps, setLastSeenTimestamps] = useState<Map<string, string>>(new Map());

  // Load last seen timestamps from database (synced across devices)
  useEffect(() => {
    if (!userId) return;
    
    const loadFromDatabase = async () => {
      // First, load from database
      const { data: dbReceipts, error } = await supabase
        .from('chat_read_receipts')
        .select('location, sub_location, last_seen_at')
        .eq('user_id', userId);
      
      let timestamps = new Map<string, string>();
      
      if (!error && dbReceipts) {
        dbReceipts.forEach(receipt => {
          const key = receipt.sub_location 
            ? `${receipt.location}:${receipt.sub_location}` 
            : receipt.location;
          timestamps.set(key, receipt.last_seen_at);
        });
      }
      
      // Migrate from localStorage if there are entries not in database
      const stored = localStorage.getItem(`chat-seen-${userId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const localTimestamps = new Map<string, string>(Object.entries(parsed));
          
          // Check for entries in localStorage that aren't in database
          const toMigrate: Array<{location: string, sub_location: string | null, last_seen_at: string}> = [];
          
          localTimestamps.forEach((lastSeen, key) => {
            if (!timestamps.has(key)) {
              const [location, subLocation] = key.includes(':') ? key.split(':') : [key, null];
              toMigrate.push({
                location,
                sub_location: subLocation,
                last_seen_at: lastSeen
              });
              timestamps.set(key, lastSeen);
            }
          });
          
          // Migrate to database
          if (toMigrate.length > 0) {
            for (const entry of toMigrate) {
              await supabase.from('chat_read_receipts').upsert({
                user_id: userId,
                location: entry.location,
                sub_location: entry.sub_location || '',
                last_seen_at: entry.last_seen_at
              }, { onConflict: 'user_id,location,sub_location' });
            }
          }
        } catch (e) {
          console.error('Error migrating chat seen timestamps:', e);
        }
      }
      
      setLastSeenTimestamps(timestamps);
      
      // Now fetch initial unread counts
      await fetchInitialData(timestamps);
    };
    
    const fetchInitialData = async (timestamps: Map<string, string>) => {
      try {
        // Get recent messages from public chats - include ALL messages (main and sub-locations)
        const { data: messages, error } = await supabase
          .from('chat_messages')
          .select('id, location, sub_location, content, character_name, created_at, user_id')
          .in('location', PUBLIC_CHAT_LOCATIONS)
          .order('created_at', { ascending: false })
          .limit(1000);

        if (error) {
          console.error('Error fetching initial chat messages:', error);
          return;
        }

        if (!messages || messages.length === 0) return;

        const notificationsMap = new Map<string, ChatNotification>();
        const lastMessagesMap = new Map<string, LastMessageInfo>();
        let total = 0;

        // First pass: get the latest message for each location (for preview)
        // Skip restricted locations the user doesn't have access to
        messages.forEach(msg => {
          const key = msg.sub_location 
            ? `${msg.location}:${msg.sub_location}` 
            : msg.location;
          
          // Skip restricted locations user doesn't have access to
          if (isRestrictedLocation(msg.location, msg.sub_location) && !userAuthorizedRooms.has(key)) {
            return;
          }
          
          // Track the latest message for each location (regardless of read status)
          if (!lastMessagesMap.has(key)) {
            lastMessagesMap.set(key, {
              content: msg.content,
              author: msg.character_name || null,
              timestamp: msg.created_at
            });
          }
        });

        // Second pass: count unread messages
        messages.forEach(msg => {
          // Skip own messages for unread count
          if (msg.user_id === userId) return;
          
          const key = msg.sub_location 
            ? `${msg.location}:${msg.sub_location}` 
            : msg.location;
          
          // Skip restricted locations user doesn't have access to
          if (isRestrictedLocation(msg.location, msg.sub_location) && !userAuthorizedRooms.has(key)) {
            return;
          }
          
          // For sub-locations, also check the main location's lastSeen as fallback
          let lastSeen = timestamps.get(key);
          if (!lastSeen && msg.sub_location) {
            lastSeen = timestamps.get(msg.location);
          }
          
          const isPublicChat = PUBLIC_CHAT_LOCATIONS.includes(msg.location);
          
          // For public chats that were never visited, use a default "last seen" of 24 hours ago
          // This way users see recent activity in chats they haven't entered yet
          let effectiveLastSeen = lastSeen;
          if (!lastSeen && isPublicChat) {
            // Only show unread for public chats if they're in subscribedRooms (visited)
            // OR if message is from the last 2 hours (to show recent activity)
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
            if (subscribedRooms.includes(msg.location)) {
              // User has visited before, count all since they left
              effectiveLastSeen = twoHoursAgo; // Fallback for edge case
            } else {
              // Never visited - don't count as unread to avoid overwhelming notifications
              return;
            }
          }
          
          if (!effectiveLastSeen) return;
          
          const msgTime = new Date(msg.created_at).getTime();
          const lastSeenTime = new Date(effectiveLastSeen).getTime();

          if (msgTime > lastSeenTime) {
            const existing = notificationsMap.get(key);
            const lastMsg = lastMessagesMap.get(key);
            
            notificationsMap.set(key, {
              location: msg.location,
              subLocation: msg.sub_location,
              unreadCount: (existing?.unreadCount || 0) + 1,
              lastMessageAt: lastMsg?.timestamp || msg.created_at,
              lastMessageContent: lastMsg?.content || msg.content,
              lastMessageAuthor: lastMsg?.author || msg.character_name || null
            });
            total++;
          }
        });

        setLastMessages(lastMessagesMap);
        setChatNotifications(notificationsMap);
        setTotalUnread(total);
      } catch (e) {
        console.error('Error in fetchInitialData:', e);
      }
    };

    loadFromDatabase();
  }, [userId, subscribedRooms]);

  // Mark a chat as read - saves to database for cross-device sync
  const markChatAsRead = useCallback(async (location: string, subLocation?: string | null) => {
    if (!userId) return;
    
    const key = subLocation ? `${location}:${subLocation}` : location;
    const now = new Date().toISOString();
    
    // Save to database for cross-device sync
    try {
      await supabase.from('chat_read_receipts').upsert({
        user_id: userId,
        location,
        sub_location: subLocation || '',
        last_seen_at: now
      }, { onConflict: 'user_id,location,sub_location' });
    } catch (e) {
      console.error('Error saving chat read receipt:', e);
    }
    
    setLastSeenTimestamps(prev => {
      const updated = new Map(prev);
      updated.set(key, now);
      
      // Also save to localStorage for immediate access
      const obj: Record<string, string> = {};
      updated.forEach((v, k) => { obj[k] = v; });
      localStorage.setItem(`chat-seen-${userId}`, JSON.stringify(obj));
      
      return updated;
    });

    setChatNotifications(prev => {
      const updated = new Map(prev);
      const existing = updated.get(key);
      if (existing) {
        setTotalUnread(currentTotal => Math.max(0, currentTotal - existing.unreadCount));
        updated.set(key, { ...existing, unreadCount: 0 });
      }
      return updated;
    });
  }, [userId]);

  // Subscribe to new chat messages
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('chat-messages-notifications-v2')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          const newMsg = payload.new as {
            id: string;
            user_id: string;
            location: string;
            sub_location: string | null;
            content: string;
            character_name: string | null;
            created_at: string;
          };
          
          const key = newMsg.sub_location 
            ? `${newMsg.location}:${newMsg.sub_location}` 
            : newMsg.location;
          
          // Skip restricted locations user doesn't have access to (for both preview and notifications)
          const isRestricted = isRestrictedLocation(newMsg.location, newMsg.sub_location);
          const hasAccess = userAuthorizedRooms.has(key);
          
          // For restricted locations, only update lastMessages if user has access
          if (!isRestricted || hasAccess) {
            setLastMessages(prev => {
              const updated = new Map(prev);
              updated.set(key, {
                content: newMsg.content,
                author: newMsg.character_name || null,
                timestamp: newMsg.created_at
              });
              return updated;
            });
          }
          
          // Don't count unread for restricted locations without access
          if (isRestricted && !hasAccess) return;
          
          // Don't count own messages as unread
          if (newMsg.user_id === userId) return;
          
          // For sub-locations, also check the main location's lastSeen as fallback
          let lastSeen = lastSeenTimestamps.get(key);
          if (!lastSeen && newMsg.sub_location) {
            lastSeen = lastSeenTimestamps.get(newMsg.location);
          }
          
          const isPublicChat = PUBLIC_CHAT_LOCATIONS.includes(newMsg.location);
          const hasVisited = subscribedRooms.includes(newMsg.location) || lastSeen;
          
          // Only notify chats that the user has already visited (is in subscribedRooms or has lastSeen)
          if (!hasVisited) return;
          
          // Don't notify if user is actively in this chat (including any sub-location)
          // activeLocation might be just "hospital" or "hospital:Entrada"
          const activeBase = activeLocation?.includes(':') ? activeLocation.split(':')[0] : activeLocation;
          const msgBase = newMsg.location.includes(':') ? newMsg.location.split(':')[0] : newMsg.location;
          
          // Check if user is in the same main location OR the exact same sub-location
          const isInThisExactChat = activeLocation === key;
          const isInSameMainLocation = activeBase === newMsg.location;
          if (isInThisExactChat || isInSameMainLocation) return;
          
          // Determine the effective last seen time
          let effectiveLastSeenTime: number;
          if (lastSeen) {
            effectiveLastSeenTime = new Date(lastSeen).getTime();
          } else if (hasVisited) {
            // User visited but no lastSeen timestamp - use 2 hours ago as fallback
            effectiveLastSeenTime = Date.now() - 2 * 60 * 60 * 1000;
          } else {
            return;
          }
          
          const msgTime = new Date(newMsg.created_at).getTime();
          
          if (msgTime > effectiveLastSeenTime) {
            setChatNotifications(prev => {
              const updated = new Map(prev);
              const existing = updated.get(key);
              
              updated.set(key, {
                location: newMsg.location,
                subLocation: newMsg.sub_location,
                unreadCount: (existing?.unreadCount || 0) + 1,
                lastMessageAt: newMsg.created_at,
                lastMessageContent: newMsg.content,
                lastMessageAuthor: newMsg.character_name || null
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
  }, [userId, lastSeenTimestamps, activeLocation, subscribedRooms]);

  // Get unread count for a specific location
  const getUnreadCount = useCallback((location: string, subLocation?: string | null): number => {
    const key = subLocation ? `${location}:${subLocation}` : location;
    return chatNotifications.get(key)?.unreadCount || 0;
  }, [chatNotifications]);

  // Get last message info for a location (uses lastMessages map, not notifications)
  // Also checks sub-locations and returns the most recent message across all of them
  const getLastMessage = useCallback((location: string): { content: string | null; author: string | null; timestamp: string } => {
    let mostRecentMsg: { content: string | null; author: string | null; timestamp: string } = {
      content: null,
      author: null,
      timestamp: new Date(0).toISOString()
    };
    let mostRecentTime = 0;

    // Check main location
    const mainMsg = lastMessages.get(location);
    if (mainMsg) {
      const msgTime = new Date(mainMsg.timestamp).getTime();
      if (msgTime > mostRecentTime) {
        mostRecentTime = msgTime;
        mostRecentMsg = { content: mainMsg.content, author: mainMsg.author, timestamp: mainMsg.timestamp };
      }
    }

    // Check all sub-locations for this location
    lastMessages.forEach((msg, key) => {
      if (key.startsWith(`${location}:`)) {
        const msgTime = new Date(msg.timestamp).getTime();
        if (msgTime > mostRecentTime) {
          mostRecentTime = msgTime;
          const subLocation = key.split(':')[1];
          mostRecentMsg = { 
            content: msg.content, 
            author: msg.author ? `${msg.author} (${subLocation})` : subLocation,
            timestamp: msg.timestamp 
          };
        }
      }
    });

    // Fallback to notification if no lastMessage found
    if (mostRecentTime === 0) {
      const notification = chatNotifications.get(location);
      if (notification) {
        return {
          content: notification.lastMessageContent,
          author: notification.lastMessageAuthor,
          timestamp: notification.lastMessageAt
        };
      }
    }

    return mostRecentMsg;
  }, [lastMessages, chatNotifications]);

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

  // Get list of sub-locations with unread messages for a given location
  const getUnreadSubLocations = useCallback((location: string): string[] => {
    const unreadSubs: string[] = [];
    chatNotifications.forEach((notif, key) => {
      if (key.startsWith(`${location}:`) && notif.unreadCount > 0) {
        const subLocation = key.split(':')[1];
        if (subLocation) {
          unreadSubs.push(subLocation);
        }
      }
    });
    return unreadSubs;
  }, [chatNotifications]);

  // Clear all notifications for a chat (when user leaves the chat)
  const clearChatNotifications = useCallback(async (location: string) => {
    if (!userId) return;
    
    // Remove from database
    try {
      await supabase
        .from('chat_read_receipts')
        .delete()
        .eq('user_id', userId)
        .eq('location', location);
    } catch (e) {
      console.error('Error clearing chat read receipts:', e);
    }
    
    // Remove from lastSeenTimestamps (localStorage)
    setLastSeenTimestamps(prev => {
      const updated = new Map(prev);
      // Remove the main location and any sub-locations
      const keysToRemove: string[] = [];
      updated.forEach((_, key) => {
        if (key === location || key.startsWith(`${location}:`)) {
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach(key => updated.delete(key));
      
      // Save to localStorage
      const obj: Record<string, string> = {};
      updated.forEach((v, k) => { obj[k] = v; });
      localStorage.setItem(`chat-seen-${userId}`, JSON.stringify(obj));
      
      return updated;
    });

    // Remove from notifications
    setChatNotifications(prev => {
      const updated = new Map(prev);
      let removedCount = 0;
      
      const keysToRemove: string[] = [];
      updated.forEach((notif, key) => {
        if (key === location || key.startsWith(`${location}:`)) {
          removedCount += notif.unreadCount;
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach(key => updated.delete(key));
      
      setTotalUnread(currentTotal => Math.max(0, currentTotal - removedCount));
      
      return updated;
    });

    // Remove from lastMessages
    setLastMessages(prev => {
      const updated = new Map(prev);
      const keysToRemove: string[] = [];
      updated.forEach((_, key) => {
        if (key === location || key.startsWith(`${location}:`)) {
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach(key => updated.delete(key));
      return updated;
    });
  }, [userId]);

  return {
    chatNotifications,
    lastMessages,
    totalUnread,
    markChatAsRead,
    getUnreadCount,
    getLocationUnread,
    getUnreadSubLocations,
    getLastMessage,
    clearChatNotifications
  };
}