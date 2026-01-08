import { useEffect, useRef } from 'react';
import { supabase } from '../../supabase';

/**
 * Hook que registra a presença do usuário no canal global E no banco de dados.
 * O updated_at do profile é usado para persistir a presença por 20 minutos após fechar o app.
 */
export function useGlobalPresence(currentUserId: string | null) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentUserId) return;

    // Função para atualizar presença no banco de dados
    const updatePresenceInDb = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('user_id', currentUserId);
      } catch (e) {
        console.warn('[GlobalPresence] Erro ao atualizar presença no banco:', e);
      }
    };

    // Atualizar imediatamente ao conectar
    updatePresenceInDb();

    // Criar canal de presença global (para updates em tempo real)
    const channel = supabase.channel('global_presence', {
      config: { presence: { key: currentUserId } },
    });

    channelRef.current = channel;

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[GlobalPresence] Usuário registrado como online:', currentUserId);
        await channel.track({
          user_id: currentUserId,
          online_at: new Date().toISOString(),
        });
      }
    });

    // Heartbeat a cada 60 segundos para manter presença ativa no banco E no canal
    heartbeatRef.current = setInterval(() => {
      // Atualizar no banco de dados (persiste por 20 min após fechar app)
      updatePresenceInDb();
      
      // Atualizar no canal realtime (para updates instantâneos)
      if (channelRef.current) {
        channelRef.current.track({
          user_id: currentUserId,
          online_at: new Date().toISOString(),
        });
      }
    }, 60000); // 60 segundos

    // Atualizar ao interagir com a página (visibilidade)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresenceInDb();
        if (channelRef.current) {
          channelRef.current.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('[GlobalPresence] Desconectando presença global');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentUserId]);
}
