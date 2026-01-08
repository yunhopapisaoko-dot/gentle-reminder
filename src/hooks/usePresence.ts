import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Usar uma key estável para observer (não muda a cada render)
  const observerKeyRef = useRef<string>(`observer-${Math.random().toString(16).slice(2)}`);

  const isUserOnline = useCallback((userId: string): boolean => {
    // Se está no realtime presence, está online
    if (state.onlineUsers.has(userId)) return true;
    
    // Se tem lastSeen recente (do banco), considera online
    const lastSeenTime = state.lastSeen.get(userId);
    if (!lastSeenTime) return false;
    
    const timeSinceLastSeen = Date.now() - lastSeenTime.getTime();
    return timeSinceLastSeen < OFFLINE_THRESHOLD_MS;
  }, [state.onlineUsers, state.lastSeen]);

  // Buscar usuários ativos do banco (updated_at nos últimos 20 minutos)
  useEffect(() => {
    const fetchActiveUsers = async () => {
      const twentyMinutesAgo = new Date(Date.now() - OFFLINE_THRESHOLD_MS).toISOString();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, updated_at')
        .gte('updated_at', twentyMinutesAgo);
      
      if (error) {
        console.error('[usePresence] Erro ao buscar usuários ativos:', error);
        return;
      }
      
      if (data) {
        const newLastSeen = new Map<string, Date>();
        data.forEach(profile => {
          newLastSeen.set(profile.user_id, new Date(profile.updated_at));
        });
        
        console.log('[usePresence] Usuários ativos do banco:', data.length);
        
        setState(prev => ({
          ...prev,
          lastSeen: new Map([...prev.lastSeen, ...newLastSeen]),
        }));
      }
    };

    // Buscar imediatamente
    fetchActiveUsers();
    
    // Atualizar a cada 60 segundos
    const interval = setInterval(fetchActiveUsers, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Escutar atualizações realtime do profiles para detectar atividade
  useEffect(() => {
    const channel = supabase
      .channel('profiles-activity')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          const userId = payload.new.user_id;
          const updatedAt = payload.new.updated_at;
          
          if (userId && updatedAt) {
            setState(prev => ({
              ...prev,
              lastSeen: new Map([...prev.lastSeen, [userId, new Date(updatedAt)]]),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // NOTA: não criamos/removemos o canal realtime de presence aqui.
  // O canal `global_presence` deve ser gerenciado apenas pelo `useGlobalPresence`
  // (senão um component pode dar removeChannel e derrubar o tracking do usuário).
  // Para o "online" no Global, usamos atividade via banco (profiles.updated_at).

  return { isUserOnline, onlineUsers: state.onlineUsers };
}
