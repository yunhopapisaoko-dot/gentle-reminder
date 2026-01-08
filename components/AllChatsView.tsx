"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { usePrivateConversations, PrivateConversation } from '../src/hooks/usePrivateConversations';
import { useChatNotifications } from '../src/hooks/useChatNotifications';
import { useRoomAuthorizations } from '../src/hooks/useRoomAuthorizations';
import { supabase } from '../supabase';

interface AllChatsViewProps {
  onClose: () => void;
  onSelectChat: (id: string) => void;
  onLeaveChat: (id: string) => void;
  visitedRooms: string[];
  currentUserId: string;
  onOpenPrivateChat: (conversation: PrivateConversation) => void;
  hasCharacter?: boolean;
  onNavigateToCharacters?: () => void;
}

const LOCAIS_METADATA: Record<string, any> = {
  hospital: { name: 'Hospital Central', icon: 'medical_services', color: 'from-blue-500 to-cyan-400' },
  restaurante: { name: 'Neon Grill', icon: 'restaurant', color: 'from-orange-500 to-amber-400' },
  padaria: { name: 'Baguette Miku', icon: 'bakery_dining', color: 'from-yellow-600 to-orange-400' },
  creche: { name: 'Sweet Kids', icon: 'child_care', color: 'from-pink-500 to-fuchsia-400' },
  pousada: { name: 'Pousada', icon: 'hotel', color: 'from-purple-500 to-indigo-500' },
  farmacia: { name: 'Farmácia', icon: 'local_pharmacy', color: 'from-teal-500 to-emerald-500' },
  chat_off: { name: 'Chat OFF', icon: 'forum', color: 'from-cyan-500 to-purple-600' },
};

const RACE_THEMES: Record<string, { color: string, icon: string, bg: string }> = {
  'draeven': { color: 'text-rose-500', icon: 'local_fire_department', bg: 'bg-rose-500/10' },
  'sylven': { color: 'text-emerald-500', icon: 'eco', bg: 'bg-emerald-500/10' },
  'lunari': { color: 'text-cyan-400', icon: 'dark_mode', bg: 'bg-cyan-400/10' },
};

const getRaceTheme = (race?: string) => {
  const key = (race || 'draeven').toLowerCase();
  return RACE_THEMES[key] || RACE_THEMES['draeven'];
};

export const AllChatsView: React.FC<AllChatsViewProps> = ({ onClose, onSelectChat, onLeaveChat, visitedRooms, currentUserId, onOpenPrivateChat, hasCharacter = false, onNavigateToCharacters }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [optionsFor, setOptionsFor] = useState<string | null>(null);
  const [userHouse, setUserHouse] = useState<{ id: string; owner_name: string } | null>(null);
  const [invitedHouses, setInvitedHouses] = useState<{ id: string; owner_name: string }[]>([]);
  const pressTimer = useRef<any>(null);
  
  const { conversations, loading: loadingConversations, totalUnread } = usePrivateConversations(currentUserId);
  const { authorizedRooms } = useRoomAuthorizations(currentUserId);
  const { chatNotifications, getLocationUnread, totalUnread: totalRoleplayUnread, getLastMessage } = useChatNotifications(currentUserId, visitedRooms, null, authorizedRooms);

  // Fetch user's house and invited houses
  useEffect(() => {
    const fetchHouses = async () => {
      // Own house
      const { data: ownHouse } = await supabase.from('houses').select('id, owner_name').eq('owner_id', currentUserId).maybeSingle();
      setUserHouse(ownHouse);
      
      // Houses user is invited to
      const { data: invites } = await supabase
        .from('house_invites')
        .select('house_id, houses(id, owner_name)')
        .eq('invited_user_id', currentUserId);
      
      if (invites) {
        const houses = invites
          .filter(i => i.houses)
          .map(i => ({ id: (i.houses as any).id, owner_name: (i.houses as any).owner_name }));
        setInvitedHouses(houses);
      }
    };
    fetchHouses();
  }, [currentUserId]);

  const handleClose = () => {
    // Use browser back to return to previous screen
    window.history.back();
  };

  const allChats = useMemo(() => {
    // Preparar chats de RPG
    const roleplayChats = visitedRooms.map(id => {
      const notification = chatNotifications.get(id);
      const lastMessage = getLastMessage(id);
      const defaultMessage = id === 'chat_off' ? 'Conversa em tempo real' : 'RPG em andamento...';
      
      return {
        id,
        ...LOCAIS_METADATA[id],
        type: 'roleplay' as const,
        lastMessage: lastMessage.content 
          ? (lastMessage.author ? `${lastMessage.author}: ${lastMessage.content}` : lastMessage.content)
          : defaultMessage,
        timestamp: lastMessage.timestamp || notification?.lastMessageAt || new Date(0).toISOString(),
        unread_count: getLocationUnread(id)
      };
    });

    // Preparar casa do usuário
    const ownHouseChats = userHouse ? [{
      id: `house_${userHouse.id}_sala`,
      houseId: userHouse.id,
      name: `Casa de ${userHouse.owner_name}`,
      icon: 'home',
      color: 'from-primary to-purple-600',
      type: 'house' as const,
      isOwner: true,
      lastMessage: 'Sua casa • Clique para entrar',
      timestamp: new Date().toISOString(),
      unread_count: 0
    }] : [];

    // Preparar casas onde o usuário foi convidado
    const invitedHouseChats = invitedHouses.map(house => ({
      id: `house_${house.id}_sala`,
      houseId: house.id,
      name: `Casa de ${house.owner_name}`,
      icon: 'home',
      color: 'from-amber-500 to-orange-600',
      type: 'house' as const,
      isOwner: false,
      lastMessage: 'Você foi convidado',
      timestamp: new Date().toISOString(),
      unread_count: 0
    }));

    // Preparar DMs
    const privateChats = conversations.map(conv => ({
      ...conv,
      id: conv.id,
      type: 'private' as const,
      timestamp: conv.last_message?.created_at || conv.updated_at || conv.created_at
    }));

    // Unificar e Filtrar
    const merged = [...ownHouseChats, ...invitedHouseChats, ...privateChats, ...roleplayChats].filter(chat => {
      const search = searchQuery.toLowerCase();
      if ('other_user' in chat) {
        return chat.other_user?.full_name?.toLowerCase().includes(search) ||
          chat.other_user?.username?.toLowerCase().includes(search);
      }
      return chat.name?.toLowerCase().includes(search);
    });

    // Ordenar por atividade mais recente (timestamp)
    return merged.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  }, [conversations, visitedRooms, searchQuery, chatNotifications, getLocationUnread, getLastMessage, userHouse, invitedHouses]);

  const startPress = (id: string) => {
    pressTimer.current = setTimeout(() => {
      setOptionsFor(id);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
  };

  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleLeave = (id: string) => {
    onLeaveChat(id);
    setOptionsFor(null);
  };

  const handleLeaveHouse = async (houseId: string) => {
    // Remove invite from database
    await supabase.from('house_invites')
      .delete()
      .eq('house_id', houseId)
      .eq('invited_user_id', currentUserId);
    
    // Remove from local state
    setInvitedHouses(prev => prev.filter(h => h.id !== houseId));
    
    // Remove ALL visited chats entries for this house (all rooms)
    // The format is house_{houseId}_{roomId}
    const { data: visitedChats } = await supabase
      .from('user_visited_chats')
      .select('chat_id')
      .eq('user_id', currentUserId)
      .like('chat_id', `house_${houseId}%`);
    
    if (visitedChats && visitedChats.length > 0) {
      for (const chat of visitedChats) {
        onLeaveChat(chat.chat_id);
      }
    }
    
    setOptionsFor(null);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (date.getTime() === 0) return 'Ativo';
    
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className={`fixed inset-0 z-[550] bg-background-dark flex flex-col h-[100dvh] overflow-hidden will-change-transform ${isClosing ? 'animate-out slide-out-right duration-300' : 'animate-in slide-in-right duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]'}`}>
      
      {/* Header */}
      <div className="pt-16 px-6 pb-6 bg-black/40 backdrop-blur-3xl border-b border-white/5 relative z-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Conversas</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-1.5">Sua rede ativa</p>
            </div>
          </div>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-rounded">chat_bubble</span>
            </div>
            {(totalUnread + totalRoleplayUnread) > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {(totalUnread + totalRoleplayUnread) > 9 ? '9+' : (totalUnread + totalRoleplayUnread)}
              </span>
            )}
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
            <span className="material-symbols-rounded text-xl">search</span>
          </div>
          <input 
            type="text"
            placeholder="Buscar por nome ou local..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-[24px] py-4 pl-14 pr-6 text-sm text-white font-bold focus:ring-primary focus:border-primary placeholder:text-white/10 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-4 pb-32">
        {loadingConversations ? (
          <div className="py-32 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Sincronizando...</p>
          </div>
        ) : allChats.length > 0 ? (
          allChats.map((chat) => {
            if ('other_user' in chat && chat.type === 'private') {
              const conv = chat as any;
              return (
                <button
                  key={conv.id}
                  onClick={() => onOpenPrivateChat(conv)}
                  className="w-full group relative flex items-center space-x-5 p-5 rounded-[36px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 active:bg-white/[0.08] active:scale-[0.96] transition-all duration-200 overflow-hidden"
                >
                  <div className="relative">
                    <img 
                      src={conv.other_user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} 
                      className="w-16 h-16 rounded-[24px] object-cover border-2 border-primary/20 shadow-2xl transition-transform group-hover:scale-105"
                      alt={conv.other_user?.full_name}
                    />
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0 pr-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center space-x-2 min-w-0">
                        <h4 className={`text-[15px] font-black tracking-tight leading-none truncate ${conv.unread_count > 0 ? 'text-white' : 'text-white/80'}`}>
                          {conv.other_user?.full_name || 'Usuário'}
                        </h4>
                        {conv.other_user?.race && (
                          <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-md ${getRaceTheme(conv.other_user.race).bg} border border-white/10 flex-shrink-0`}>
                            <span className={`material-symbols-rounded text-[10px] ${getRaceTheme(conv.other_user.race).color}`}>{getRaceTheme(conv.other_user.race).icon}</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${conv.unread_count > 0 ? 'text-primary' : 'text-white/20'}`}>
                        {formatTime(conv.timestamp)}
                      </span>
                    </div>
                    <p className={`text-xs font-bold truncate italic leading-relaxed ${conv.unread_count > 0 ? 'text-white/60' : 'text-white/40'}`}>
                      {conv.last_message ? (
                        <>
                          {conv.last_message.sender_id === currentUserId ? 'Você: ' : ''}
                          "{conv.last_message.content}"
                        </>
                      ) : (
                        'Inicie uma conversa'
                      )}
                    </p>
                  </div>
                  <span className="material-symbols-rounded text-white/10 group-hover:text-primary transition-colors">chevron_right</span>
                </button>
              );
            }

            // House chat
            if (chat.type === 'house') {
              const houseChat = chat as any;
              const isOwnHouse = houseChat.isOwner;
              
              return (
                <button
                  key={houseChat.id}
                  onMouseDown={() => !isOwnHouse && startPress(houseChat.houseId)}
                  onMouseUp={endPress}
                  onMouseLeave={endPress}
                  onTouchStart={() => !isOwnHouse && startPress(houseChat.houseId)}
                  onTouchEnd={endPress}
                  onClick={() => !optionsFor && onSelectChat(houseChat.id)}
                  className={`w-full group relative flex items-center space-x-5 p-5 rounded-[36px] ${isOwnHouse ? 'bg-primary/5 border-primary/20' : 'bg-amber-500/5 border-amber-500/20'} border hover:bg-opacity-10 active:scale-[0.96] transition-all duration-200 overflow-hidden`}
                >
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-[24px] bg-gradient-to-br ${houseChat.color} flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-105`}>
                      <span className="material-symbols-rounded text-3xl">{houseChat.icon}</span>
                    </div>
                  </div>
                  <div className="flex-1 text-left min-w-0 pr-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-[15px] font-black tracking-tight leading-none truncate text-white">{houseChat.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full ${isOwnHouse ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-400'} text-[8px] font-black uppercase tracking-widest`}>
                          {isOwnHouse ? '🏠 SUA' : '🏠 CONVIDADO'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-bold truncate italic leading-relaxed text-white/50">
                      "{houseChat.lastMessage}"
                    </p>
                  </div>
                  <span className={`material-symbols-rounded ${isOwnHouse ? 'text-primary/50 group-hover:text-primary' : 'text-amber-500/50 group-hover:text-amber-400'} transition-colors`}>chevron_right</span>
                  
                  {/* Leave option for invited houses */}
                  {optionsFor === houseChat.houseId && !isOwnHouse && (
                    <div className="absolute inset-0 bg-rose-500/95 backdrop-blur-xl flex items-center justify-between px-8 animate-in zoom-in duration-300">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Sair desta casa?</p>
                      <div className="flex space-x-3">
                         <button onClick={(e) => { e.stopPropagation(); setOptionsFor(null); }} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"><span className="material-symbols-rounded">close</span></button>
                         <button onClick={(e) => { e.stopPropagation(); handleLeaveHouse(houseChat.houseId); }} className="px-5 py-2 rounded-xl bg-white text-rose-500 text-[10px] font-black uppercase tracking-widest shadow-lg">Sair</button>
                      </div>
                    </div>
                  )}
                </button>
              );
            }
            
            const rpChat = chat as any;
            const isChatOff = rpChat.id === 'chat_off';
            const canEnter = isChatOff || hasCharacter;
            
            return (
              <button
                key={rpChat.id}
                onMouseDown={() => startPress(rpChat.id)}
                onMouseUp={endPress}
                onMouseLeave={endPress}
                onTouchStart={() => startPress(rpChat.id)}
                onTouchEnd={endPress}
                onClick={() => !optionsFor && onSelectChat(rpChat.id)}
                className={`w-full group relative flex items-center space-x-5 p-5 rounded-[36px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 active:bg-white/[0.08] active:scale-[0.96] transition-all duration-200 overflow-hidden ${!canEnter ? 'opacity-60' : ''}`}
              >
                <div className="relative">
                  <div className={`w-16 h-16 rounded-[24px] bg-gradient-to-br ${rpChat.color} flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-105`}>
                    <span className="material-symbols-rounded text-3xl">{rpChat.icon}</span>
                  </div>
                  {rpChat.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                      {rpChat.unread_count > 9 ? '9+' : rpChat.unread_count}
                    </span>
                  )}
                  {!canEnter && (
                    <div className="absolute inset-0 bg-black/60 rounded-[24px] flex items-center justify-center">
                       <span className="material-symbols-rounded text-white text-xl">lock</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0 pr-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-[15px] font-black tracking-tight leading-none truncate ${rpChat.unread_count > 0 ? 'text-white' : 'text-white/80'}`}>{rpChat.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full ${isChatOff ? 'bg-cyan-500/20 text-cyan-400' : 'bg-secondary/20 text-secondary'} text-[8px] font-black uppercase tracking-widest`}>
                        {isChatOff ? 'OFF' : 'RP'}
                      </span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${rpChat.unread_count > 0 ? 'text-primary' : 'text-white/20'}`}>{formatTime(rpChat.timestamp)}</span>
                  </div>
                  <p className={`text-xs font-bold truncate italic leading-relaxed ${rpChat.unread_count > 0 ? 'text-white/60' : 'text-white/40'}`}>
                    {canEnter ? `"${rpChat.lastMessage}"` : "Crie uma ficha para acessar"}
                  </p>
                </div>
                
                {optionsFor === rpChat.id && (
                  <div className="absolute inset-0 bg-primary/95 backdrop-blur-xl flex items-center justify-between px-8 animate-in zoom-in duration-300">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Deseja sair deste chat?</p>
                    <div className="flex space-x-3">
                       <button onClick={(e) => { e.stopPropagation(); setOptionsFor(null); }} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"><span className="material-symbols-rounded">close</span></button>
                       <button onClick={(e) => { e.stopPropagation(); handleLeave(rpChat.id); }} className="px-5 py-2 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">Sair</button>
                    </div>
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center opacity-30">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
              <span className="material-symbols-rounded text-4xl text-white/30">chat</span>
            </div>
            <p className="text-sm font-black uppercase tracking-[0.3em] mb-2">Nenhuma conversa</p>
            <p className="text-xs text-white/50">Sua jornada começa aqui!</p>
          </div>
        )}
      </div>

      <div className="px-10 pb-12 text-center">
         <p className="text-[8px] font-black text-white/10 uppercase tracking-widest">
           Pressione e segure para sair de um chat
         </p>
      </div>
    </div>
  );
};