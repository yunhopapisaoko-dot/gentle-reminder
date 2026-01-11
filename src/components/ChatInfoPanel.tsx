import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { supabase } from '../../supabase';
import { usePresence } from '../hooks/usePresence';

interface ChatInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  location: string;
  subLocation?: string | null;
  chatName: string;
  chatIcon: string;
  onLeaveChat?: () => void | Promise<void>;
  onUserClick?: (user: User) => void;
}

interface ChatMember {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  race: string;
  is_online: boolean;
  is_present: boolean; // Currently in this location
}

const CHAT_DESCRIPTIONS: Record<string, string> = {
  hospital: 'Centro médico onde os habitantes podem buscar tratamento para doenças e ferimentos. Conta com o Dr. MonkeyDoctor, especialista em todas as enfermidades.',
  creche: 'Um lugar seguro e acolhedor para as crianças da comunidade. Aqui elas podem brincar, aprender e fazer novos amigos.',
  restaurante: 'O melhor restaurante da região! Sirva-se de pratos deliciosos preparados pela nossa equipe. Não esqueça de experimentar as especialidades da casa.',
  padaria: 'Pães fresquinhos, bolos caseiros e muito mais. O aroma de café e pão recém-assado vai conquistar você.',
  pousada: 'Um lugar aconchegante para descansar. A cozinha comunitária permite que os hóspedes preparem suas próprias refeições.',
  farmacia: 'Medicamentos, testes e produtos de saúde. Os farmacêuticos estão prontos para ajudar com suas necessidades.',
  supermercado: 'Encontre tudo que precisa! De alimentos a itens do dia-a-dia, com preços acessíveis e variedade.',
  praia: 'Areias douradas e mar cristalino. O lugar perfeito para relaxar, nadar ou simplesmente contemplar o horizonte.',
  chat_off: 'Espaço livre para conversas fora do roleplay. Aqui você pode ser você mesmo, sem personagem!',
};

const SUBLOCATION_DESCRIPTIONS: Record<string, Record<string, string>> = {
  hospital: {
    'Sala de Cirurgia': 'Área restrita para procedimentos cirúrgicos. Apenas pacientes autorizados e equipe médica.',
    'Quarto de Internação': 'Quartos confortáveis para recuperação dos pacientes após tratamentos.',
  },
  pousada: {
    'Cozinha': 'Cozinha comunitária equipada. Prepare suas receitas usando ingredientes da geladeira!',
    'Dormitório': 'Camas confortáveis para uma boa noite de sono.',
    'Quintal': 'Área externa com jardim para relaxar ao ar livre.',
  },
  farmacia: {
    'Estoque': 'Área de armazenamento de medicamentos. Acesso restrito a funcionários.',
    'Balcão': 'Atendimento ao cliente e venda de produtos farmacêuticos.',
  },
};

export const ChatInfoPanel: React.FC<ChatInfoPanelProps> = ({
  isOpen,
  onClose,
  currentUserId,
  location,
  subLocation,
  chatName,
  chatIcon,
  onLeaveChat,
  onUserClick
}) => {
  const [chatMembers, setChatMembers] = useState<ChatMember[]>([]);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { isUserOnline } = usePresence(currentUserId);

  // Get description
  const description = subLocation 
    ? SUBLOCATION_DESCRIPTIONS[location]?.[subLocation] || CHAT_DESCRIPTIONS[location] || 'Um lugar para conversar e interagir.'
    : CHAT_DESCRIPTIONS[location] || 'Um lugar para conversar e interagir.';

  // Nota: não assinamos o canal `global_presence` aqui para não conflitar com o tracking
  // feito pelo `useGlobalPresence`. O status online vem do hook `usePresence`.

  // Load all users who have joined this chat (from user_visited_chats)
  useEffect(() => {
    if (!isOpen) return;

    const loadChatMembers = async () => {
      // Get all users who have visited this chat
      const { data: visitedData, error: visitedError } = await supabase
        .from('user_visited_chats')
        .select('user_id')
        .eq('chat_id', location);

      if (visitedError) {
        console.error('Error fetching visited chats:', visitedError);
        return;
      }

      const userIds = visitedData?.map(v => v.user_id) || [];
      
      if (userIds.length === 0) {
        setChatMembers([]);
        return;
      }

      // Get profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, race, current_location, current_sub_location')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      const members: ChatMember[] = (profilesData || []).map(profile => ({
        user_id: profile.user_id,
        full_name: profile.full_name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        race: profile.race,
        is_online: isUserOnline(profile.user_id),
        is_present: profile.current_location === location && 
          (subLocation ? profile.current_sub_location === subLocation : true)
      }));

      // Sort: present users first, then online users, then offline
      members.sort((a, b) => {
        if (a.is_present !== b.is_present) return a.is_present ? -1 : 1;
        if (a.is_online !== b.is_online) return a.is_online ? -1 : 1;
        return a.full_name.localeCompare(b.full_name);
      });

      setChatMembers(members);
    };

    loadChatMembers();

    // Subscribe to realtime changes in user_visited_chats
    const visitedChannel = supabase
      .channel(`chat-members-${location}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_visited_chats',
          filter: `chat_id=eq.${location}`
        },
        () => {
          loadChatMembers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          loadChatMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(visitedChannel);
    };
  }, [isOpen, location, subLocation, isUserOnline]);

  const handleLongPressStart = () => {
    if (!onLeaveChat) return;
    
    setIsLongPressing(true);
    longPressTimerRef.current = setTimeout(async () => {
      if (navigator.vibrate) navigator.vibrate(100);
      await onLeaveChat();
      onClose();
      setIsLongPressing(false);
    }, 1500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPressing(false);
  };

  const handleUserClick = (user: ChatMember) => {
    if (onUserClick && user.user_id !== currentUserId) {
      onUserClick({
        id: user.user_id,
        name: user.full_name,
        username: user.username,
        avatar: user.avatar_url || '',
        race: user.race as any
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  const memberCount = chatMembers.length;
  const presentCount = chatMembers.filter(m => m.is_present).length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      
      {/* Panel */}
      <div className="fixed inset-x-0 top-0 z-[501] max-h-[85vh] bg-gradient-to-b from-black/95 to-black/90 backdrop-blur-2xl border-b border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-top duration-300">
        {/* Header */}
        <div className="pt-14 px-6 pb-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl border border-white/20">
                <span className="material-symbols-rounded text-white text-3xl">{chatIcon}</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-2xl font-black text-white leading-none tracking-tight">{chatName}</h3>
                <div className="flex items-center mt-2 space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                    {presentCount} {presentCount === 1 ? 'pessoa' : 'pessoas'} aqui
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-5 border-b border-white/5">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Sobre este local</p>
          <p className="text-sm text-white/70 leading-relaxed">{description}</p>
        </div>

        {/* Members */}
        <div className="px-6 py-4 overflow-y-auto max-h-[40vh] scrollbar-hide">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">
            Membros no chat ({memberCount})
          </p>
          
          {memberCount === 0 ? (
            <div className="py-8 text-center">
              <span className="material-symbols-rounded text-5xl text-white/10 mb-3">person_off</span>
              <p className="text-xs font-bold text-white/30">Ninguém entrou neste chat ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chatMembers.map((user) => {
                const isCurrentUser = user.user_id === currentUserId;
                
                return (
                  <button
                    key={user.user_id}
                    onClick={() => handleUserClick(user)}
                    disabled={isCurrentUser}
                    className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${
                      isCurrentUser 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5'
                    }`}
                  >
                    <div className="relative">
                      <img 
                        src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                        className={`w-12 h-12 rounded-xl object-cover border ${user.is_online ? 'border-white/10' : 'border-white/5 opacity-60'}`}
                        alt=""
                      />
                      {user.is_online && (
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${user.is_present ? 'bg-emerald-500' : 'bg-yellow-500'} border-2 border-black`} />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className={`text-sm font-bold truncate ${user.is_online ? 'text-white' : 'text-white/50'}`}>
                        {user.full_name}
                        {isCurrentUser && <span className="text-primary ml-2">(você)</span>}
                      </p>
                      <p className={`text-[11px] font-bold truncate ${user.is_online ? 'text-white/40' : 'text-white/20'}`}>
                        @{user.username}
                        {user.is_present && <span className="text-emerald-400 ml-2">• aqui agora</span>}
                        {user.is_online && !user.is_present && <span className="text-yellow-400 ml-2">• online</span>}
                      </p>
                    </div>
                    {!isCurrentUser && (
                      <span className="material-symbols-rounded text-white/30 text-xl">chevron_right</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Leave button */}
        {onLeaveChat && (
          <div className="px-6 py-5 border-t border-white/10">
            <button
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              onTouchCancel={handleLongPressEnd}
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              className={`relative w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all overflow-hidden ${
                isLongPressing 
                  ? 'bg-rose-500/30 border-rose-500/50 text-rose-400' 
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              } border`}
            >
              <span className="flex items-center justify-center gap-3">
                <span className="material-symbols-rounded">{isLongPressing ? 'exit_to_app' : 'logout'}</span>
                {isLongPressing ? 'Saindo...' : 'Segure para sair do chat'}
              </span>
              
              {/* Progress bar */}
              {isLongPressing && (
                <div className="absolute bottom-0 left-0 h-1 bg-rose-500 animate-[progress-bar_1.5s_linear_forwards]" />
              )}
            </button>
          </div>
        )}

        <style>{`
          @keyframes progress-bar {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    </>
  );
};