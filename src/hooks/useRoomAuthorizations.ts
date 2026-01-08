import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';

/**
 * Hook that fetches and maintains the list of restricted rooms the user has access to.
 * Returns a Set of room keys in format "location:room_name" (e.g., "hospital:Sala 1")
 */
export function useRoomAuthorizations(userId: string | null) {
  const [authorizedRooms, setAuthorizedRooms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAuthorizations = useCallback(async () => {
    if (!userId) {
      setAuthorizedRooms(new Set());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('room_authorizations')
        .select('location, room_name')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching room authorizations:', error);
        setLoading(false);
        return;
      }

      const rooms = new Set<string>();
      (data || []).forEach(auth => {
        // Create key in format "location:room_name"
        rooms.add(`${auth.location}:${auth.room_name}`);
      });

      setAuthorizedRooms(rooms);
    } catch (e) {
      console.error('Error fetching room authorizations:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAuthorizations();
  }, [fetchAuthorizations]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('room-authorizations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_authorizations',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Refetch on any change (INSERT, UPDATE, DELETE)
          fetchAuthorizations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchAuthorizations]);

  return { authorizedRooms, loading, refetch: fetchAuthorizations };
}
