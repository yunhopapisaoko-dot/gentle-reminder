import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';

interface PresenceState {
  onlineUsers: Set<string>;
  lastSeen: Map<string, Date>;
}

const OFFLINE_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes

export function usePresence(currentUserId: string | null) {
  const [state, setState] = useState<PresenceState>({
    onlineUsers: new Set(),
    lastSeen: new Map(),
  });

  const isUserOnline = useCallback((userId: string): boolean => {
    if (state.onlineUsers.has(userId)) return true;
    
    const lastSeenTime = state.lastSeen.get(userId);
    if (!lastSeenTime) return false;
    
    const timeSinceLastSeen = Date.now() - lastSeenTime.getTime();
    return timeSinceLastSeen < OFFLINE_THRESHOLD_MS;
  }, [state.onlineUsers, state.lastSeen]);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel('global_presence', {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const onlineUserIds = new Set<string>();
        
        Object.keys(presenceState).forEach((key) => {
          onlineUserIds.add(key);
        });
        
        setState(prev => ({
          onlineUsers: onlineUserIds,
          lastSeen: new Map([...prev.lastSeen, ...Array.from(onlineUserIds).map(id => [id, new Date()] as [string, Date])]),
        }));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setState(prev => ({
          onlineUsers: new Set([...prev.onlineUsers, key]),
          lastSeen: new Map([...prev.lastSeen, [key, new Date()]]),
        }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setState(prev => {
          const newOnline = new Set(prev.onlineUsers);
          newOnline.delete(key);
          return {
            onlineUsers: newOnline,
            lastSeen: new Map([...prev.lastSeen, [key, new Date()]]),
          };
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Heartbeat to maintain presence
    const heartbeat = setInterval(() => {
      channel.track({
        user_id: currentUserId,
        online_at: new Date().toISOString(),
      });
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return { isUserOnline, onlineUsers: state.onlineUsers };
}
