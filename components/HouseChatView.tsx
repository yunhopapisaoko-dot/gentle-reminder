"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, User } from '../types';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../supabase';
import { ChatInfoPanel } from '../src/components/ChatInfoPanel';

// Import house wallpapers
import houseSala from '../src/assets/wallpapers/house-sala.jpg';
import houseQuarto1 from '../src/assets/wallpapers/house-quarto1.jpg';
import houseQuarto2 from '../src/assets/wallpapers/house-quarto2.jpg';
import houseBanheiro from '../src/assets/wallpapers/house-banheiro.jpg';
import houseCozinha from '../src/assets/wallpapers/house-cozinha.jpg';
import houseAreaExterna from '../src/assets/wallpapers/house-area-externa.jpg';

interface HouseRoom {
  id: string;
  name: string;
  icon: string;
  wallpaper: string;
}

const HOUSE_ROOMS: HouseRoom[] = [
  { id: 'sala', name: 'Sala', icon: 'weekend', wallpaper: houseSala },
  { id: 'quarto1', name: 'Quarto 1', icon: 'bed', wallpaper: houseQuarto1 },
  { id: 'quarto2', name: 'Quarto 2', icon: 'bed', wallpaper: houseQuarto2 },
  { id: 'banheiro', name: 'Banheiro', icon: 'shower', wallpaper: houseBanheiro },
  { id: 'cozinha', name: 'Cozinha', icon: 'cooking', wallpaper: houseCozinha },
  { id: 'area_externa', name: 'Área Externa', icon: 'deck', wallpaper: houseAreaExterna },
];

const RACE_THEMES: Record<string, { color: string, icon: string, bg: string }> = {
  'draeven': { color: 'text-rose-500', icon: 'local_fire_department', bg: 'bg-rose-500/10' },
  'sylven': { color: 'text-emerald-500', icon: 'eco', bg: 'bg-emerald-500/10' },
  'lunari': { color: 'text-cyan-400', icon: 'dark_mode', bg: 'bg-cyan-400/10' },
};

const getRaceTheme = (race?: string) => {
  const key = (race || 'draeven').toLowerCase();
  return RACE_THEMES[key] || RACE_THEMES['draeven'];
};

interface HouseChatViewProps {
  houseId: string;
  ownerName: string;
  currentUser: User;
  onClose: () => void;
  onMemberClick?: (user: User) => void;
  onLeaveHouse?: (houseId: string) => Promise<void>;
  isOwner?: boolean;
}

const GAP_THRESHOLD_MS = 20 * 60 * 1000;

const formatTimeSeparator = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) return `Hoje às ${timeStr}`;
  if (isYesterday) return `Ontem às ${timeStr}`;
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${dateStr} às ${timeStr}`;
};

const shouldShowTimeSeparator = (currentTimestamp?: string, previousTimestamp?: string): boolean => {
  if (!currentTimestamp) return false;
  if (!previousTimestamp) return true;
  const currentTime = new Date(currentTimestamp).getTime();
  const previousTime = new Date(previousTimestamp).getTime();
  return (currentTime - previousTime) >= GAP_THRESHOLD_MS;
};

export const HouseChatView: React.FC<HouseChatViewProps> = ({
  houseId,
  ownerName,
  currentUser,
  onClose,
  onMemberClick,
  onLeaveHouse,
  isOwner = false
}) => {
  const [currentRoom, setCurrentRoom] = useState<HouseRoom>(HOUSE_ROOMS[0]); // Starts in Sala
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatLocation = `house_${houseId}_${currentRoom.id}`;

  // Load all users for invite modal
  useEffect(() => {
    const loadUsers = async () => {
      const users = await supabaseService.getAllProfiles();
      setAllUsers(users.filter(u => u.id !== currentUser.id));
    };
    loadUsers();
    
    // Load existing invites
    const loadInvites = async () => {
      const { data } = await supabase
        .from('house_invites')
        .select('invited_user_id')
        .eq('house_id', houseId);
      if (data) {
        setInvitedUsers(data.map(i => i.invited_user_id));
      }
    };
    loadInvites();
  }, [currentUser.id, houseId]);

  const loadMessages = useCallback(async () => {
    setMessagesLoaded(false);
    try {
      const dbMessages = await supabaseService.getChatMessages(chatLocation, null);
      
      if (!dbMessages) return;
      
      const formattedMessages: ChatMessage[] = dbMessages.map(msg => ({
        id: msg.id,
        role: 'user',
        text: msg.content,
        timestamp: msg.created_at,
        author: {
          id: msg.user_id,
          name: msg.character_name || msg.profiles?.full_name || 'Viajante',
          username: msg.profiles?.username || 'user',
          avatar: msg.character_avatar || msg.profiles?.avatar_url || '',
          race: msg.profiles?.race || 'draeven'
        }
      }));
      
      setMessages(formattedMessages);
      setMessagesLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      setMessagesLoaded(true);
    }
  }, [chatLocation]);

  useEffect(() => {
    loadMessages();
    
    const channel = supabase
      .channel(`house-chat-${chatLocation}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `location=eq.${chatLocation}`
        },
        async (payload) => {
          const msg = payload.new as any;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('race, full_name, username, avatar_url')
            .eq('user_id', msg.user_id)
            .single();

          const newMessage: ChatMessage = {
            id: msg.id,
            role: 'user',
            text: msg.content,
            timestamp: msg.created_at,
            author: {
              id: msg.user_id,
              name: msg.character_name || profile?.full_name || 'Viajante',
              username: profile?.username || 'user',
              avatar: msg.character_avatar || profile?.avatar_url || '',
              race: profile?.race || 'draeven'
            }
          };

          setMessages(prev => prev.some(m => m.id === newMessage.id) ? prev : [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatLocation, loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'instant'
      });
    }
  }, [messages, isLoading]);

  const handleClose = () => {
    // Use browser back to return to previous screen
    window.history.back();
  };

  const handleLongPressStart = (msg: ChatMessage) => {
    longPressTimerRef.current = setTimeout(() => {
      setReplyTo(msg);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    setIsLoading(true);
    setInput('');

    // Format message with reply info if replying
    let finalMessage = messageText;
    if (replyTo) {
      const replyName = replyTo.author?.name || 'Alguém';
      // Limpa metadados de outras respostas no texto original para evitar replicação de headers
      const cleanReplyText = replyTo.text.replace(/^\[respondendo @[^:]+: ".*?"\]\n/, '');
      const replyTextSnippet = cleanReplyText.length > 40 ? cleanReplyText.slice(0, 40) + '...' : cleanReplyText;
      finalMessage = `[respondendo @${replyName}: "${replyTextSnippet}"]\n${messageText}`;
    }

    try {
      // Always use user's profile (not character) for house chat
      await supabaseService.sendChatMessage(
        currentUser.id,
        chatLocation,
        finalMessage,
        currentUser.name,
        currentUser.avatar,
        undefined
      );
      setReplyTo(null);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoomChange = (room: HouseRoom) => {
    setCurrentRoom(room);
    setShowRoomSelector(false);
    setMessages([]);
  };

  const handleInviteUser = async (userId: string) => {
    try {
      await supabase.from('house_invites').insert({
        house_id: houseId,
        invited_user_id: userId,
        invited_by: currentUser.id
      });
      setInvitedUsers(prev => [...prev, userId]);
    } catch (error) {
      console.error('Erro ao convidar:', error);
    }
  };

  const handleRevokeInvite = async (userId: string) => {
    try {
      await supabase.from('house_invites')
        .delete()
        .eq('house_id', houseId)
        .eq('invited_user_id', userId);
      setInvitedUsers(prev => prev.filter(id => id !== userId));
    } catch (error) {
      console.error('Erro ao revogar convite:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[750] bg-background-dark overflow-hidden">
      {/* Painel animado: o fundo fica fixo para evitar mostrar a tela de Destaque durante o slide */}
      <div className={`relative flex flex-col h-[100dvh] overflow-hidden will-change-transform ${isClosing ? 'animate-out slide-out-right duration-300' : 'animate-in slide-in-right duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]'}`}>

        {/* Background Wallpaper */}
        <div className="absolute inset-0 z-0">
          <img 
            src={currentRoom.wallpaper} 
            className="w-full h-full object-cover transition-all duration-700" 
            alt={currentRoom.name}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </div>

        {/* Header */}
        <div className="pt-14 px-6 pb-5 bg-black/30 backdrop-blur-2xl border-b border-white/10 relative z-20 animate-in fade-in slide-in-from-top-4 duration-500 delay-100 fill-mode-both">
          <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all shadow-lg backdrop-blur-md">
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <button 
              onClick={() => setShowChatInfo(true)}
              className="flex items-center space-x-4 active:opacity-70 transition-opacity"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl border border-white/20">
                <span className="material-symbols-rounded text-white text-2xl">{currentRoom.icon}</span>
              </div>
              <div className="flex flex-col text-left">
                <h3 className="text-lg font-black text-white leading-none tracking-tight">{currentRoom.name}</h3>
                <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mt-1">Toque para info</span>
              </div>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Invite Button (only for owner) */}
            {isOwner && (
              <button 
                onClick={() => setShowInviteModal(true)} 
                className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 active:scale-90 transition-all shadow-lg backdrop-blur-md hover:bg-emerald-500/30"
              >
                <span className="material-symbols-rounded text-2xl">person_add</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Room Selector Dropdown (moved to bottom) */}
      {showRoomSelector && (
        <div className="absolute bottom-28 left-5 z-50 w-56 bg-black/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 fade-in duration-200">
          <div className="p-3">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] px-3 mb-2">Cômodos</p>
            {HOUSE_ROOMS.map((room) => (
              <button
                key={room.id}
                onClick={() => handleRoomChange(room)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
                  currentRoom.id === room.id 
                    ? 'bg-primary/20 border border-primary/40' 
                    : 'hover:bg-white/5'
                }`}
              >
                <span className={`material-symbols-rounded ${currentRoom.id === room.id ? 'text-primary' : 'text-white/60'}`}>
                  {room.icon}
                </span>
                <span className={`text-sm font-bold ${currentRoom.id === room.id ? 'text-primary' : 'text-white/80'}`}>
                  {room.name}
                </span>
                {currentRoom.id === room.id && (
                  <span className="ml-auto material-symbols-rounded text-primary text-lg">check</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowInviteModal(false)} />
          <div className="relative w-full max-w-sm bg-background-dark border border-white/10 rounded-[40px] p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-white">Convidar para Casa</h3>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">Quem pode visitar</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            
            <div className="max-h-80 overflow-y-auto space-y-2">
              {allUsers.map(user => {
                const isInvited = invitedUsers.includes(user.id);
                return (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center space-x-3">
                      <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} className="w-10 h-10 rounded-xl object-cover" alt="" />
                      <div>
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <p className="text-[9px] font-bold text-white/40">@{user.username}</p>
                      </div>
                    </div>
                    {isInvited ? (
                      <button 
                        onClick={() => handleRevokeInvite(user.id)}
                        className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest"
                      >
                        Remover
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleInviteUser(user.id)}
                        className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest"
                      >
                        Convidar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={scrollRef}
        onClick={() => { showRoomSelector && setShowRoomSelector(false); }}
        className={`flex-1 overflow-y-auto scrollbar-hide p-5 space-y-4 relative z-10 transition-all ${messagesLoaded ? 'messages-fade-in' : 'opacity-0'}`}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50">
            <span className="material-symbols-rounded text-6xl text-white/20 mb-4">{currentRoom.icon}</span>
            <p className="text-sm font-bold text-white/30">Sem mensagens neste cômodo</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showSeparator = shouldShowTimeSeparator(msg.timestamp, prevMsg?.timestamp);
            const raceTheme = getRaceTheme(msg.author?.race);
            const isCurrentUser = msg.author?.id === currentUser.id;

            // Updated bubble classes: added select-none and touch-callout none
            const bubbleClasses = `max-w-full px-5 py-3.5 rounded-[24px] text-[13.5px] font-bold leading-relaxed shadow-[0_10px_20px_rgba(0,0,0,0.3)] border border-white bg-white text-black break-words [overflow-wrap:anywhere] [word-break:break-word] select-none [-webkit-touch-callout:none]`;

            return (
              <React.Fragment key={msg.id}>
                {showSeparator && (
                  <div className="flex items-center justify-center my-6">
                    <div className="flex items-center gap-3 px-4 py-2 bg-black/30 backdrop-blur-xl rounded-full border border-white/10">
                      <span className="material-symbols-rounded text-white/40 text-sm">schedule</span>
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                        {formatTimeSeparator(msg.timestamp || '')}
                      </span>
                    </div>
                  </div>
                )}
                
                <div 
                  className={`flex items-start space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  onTouchStart={() => handleLongPressStart(msg)}
                  onTouchEnd={handleLongPressEnd}
                  onMouseDown={() => handleLongPressStart(msg)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                >
                  <button onClick={() => msg.author && onMemberClick?.(msg.author as User)} className="flex-shrink-0">
                    <img 
                      src={msg.author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} 
                      className="w-8 h-8 rounded-xl object-cover border-2 border-white/20 shadow-lg" 
                      alt="avatar" 
                    />
                  </button>
                  <div className={`max-w-[78%] flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center space-x-2 mb-1.5 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <span className="text-[11px] font-black text-white tracking-tight">{msg.author?.name || 'Viajante'}</span>
                      <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-md ${raceTheme.bg.replace('/10', '')} border border-white/10`}>
                        <span className={`material-symbols-rounded text-[8px] text-white`}>{raceTheme.icon}</span>
                      </div>
                    </div>
                    <div className={`${bubbleClasses} ${isCurrentUser ? 'rounded-tr-none' : 'rounded-tl-none'} ${replyTo?.id === msg.id ? 'ring-2 ring-primary' : ''} transition-transform active:scale-[0.98]`}>
                      {/* Lógica de resposta integrada */}
                      {msg.text.includes('[respondendo') && (
                        <div className={`mb-3 pl-3 py-1.5 border-l-4 rounded-r-xl bg-black/5 text-[11px] text-black/60 italic overflow-hidden border-primary`}>
                          <p className="truncate block opacity-80 leading-tight">
                            {msg.text.split('\n')[0]}
                          </p>
                        </div>
                      )}
                      
                      {/* Formatação especial de texto (Ação/Diálogo) */}
                      {(msg.text.includes('[respondendo') ? msg.text.split('\n').slice(1).join('\n') : msg.text).split('\n').map((line, i) => {
                        const parts = line.split(/(\*[^*]+\*|-[^-]+-)/g);
                        return (
                          <p key={i} className="mb-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                            {parts.map((part, j) => {
                              if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                                return (
                                  <span key={j} className="text-black/40 font-medium italic break-words [overflow-wrap:anywhere]">
                                    {part.slice(1, -1)}
                                  </span>
                                );
                              }
                              if (part.startsWith('-') && part.endsWith('-') && part.length > 2) {
                                return (
                                  <span key={j} className="text-black font-bold break-words [overflow-wrap:anywhere]">
                                    {part.slice(1, -1)}
                                  </span>
                                );
                              }
                              return (
                                <span key={j} className="break-words [overflow-wrap:anywhere]">
                                  {part}
                                </span>
                              );
                            })}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-5 py-6 bg-black/60 backdrop-blur-2xl border-t border-white/10 pb-10 relative z-20">
        {/* Reply Preview */}
        {replyTo && (
          <div className="mb-4 mx-auto max-w-lg animate-in slide-in-from-bottom duration-300">
            <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[28px] overflow-hidden shadow-2xl flex items-stretch">
              <div className="w-1.5 bg-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
              <div className="flex-1 p-4 pr-12 relative">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-primary">Respondendo para {replyTo.author?.name || 'Alguém'}</p>
                <p className="text-[13px] text-white/60 truncate italic leading-none">
                  "{(() => {
                    // Limpa metadados de outras respostas no texto original para evitar replicação de headers
                    const cleanText = replyTo.text.replace(/^\[respondendo @[^:]+: ".*?"\]\n/, '');
                    return cleanText.length > 60 ? cleanText.slice(0, 60) + '...' : cleanText;
                  })()}"
                </p>
                <button onClick={() => setReplyTo(null)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40 active:scale-90 transition-all"><span className="material-symbols-rounded text-xl">close</span></button>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-end space-x-3">
          {/* Room Selector Button */}
          <button 
            onClick={() => setShowRoomSelector(!showRoomSelector)} 
            className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all shadow-lg backdrop-blur-md hover:bg-white/20 flex-shrink-0"
          >
            <span className="material-symbols-rounded text-2xl">{showRoomSelector ? 'close' : 'add'}</span>
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
              if (e.key === 'Enter' && !isMobile && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={replyTo ? "Sua resposta..." : `Mensagem na ${currentRoom.name}...`}
            rows={1}
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
            className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/30 focus:ring-primary focus:border-primary transition-all resize-none scrollbar-hide"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white active:scale-90 transition-all shadow-xl disabled:opacity-50 disabled:scale-100 flex-shrink-0"
          >
            <span className="material-symbols-rounded text-2xl">send</span>
          </button>
        </div>
      </div>

      {/* Chat Info Panel */}
      <ChatInfoPanel
        isOpen={showChatInfo}
        onClose={() => setShowChatInfo(false)}
        currentUserId={currentUser.id}
        location={chatLocation}
        chatName={`${currentRoom.name} - Casa de ${ownerName}`}
        chatIcon={currentRoom.icon}
        onLeaveChat={!isOwner && onLeaveHouse ? async () => {
          // User is a guest - remove invite and leave properly
          await onLeaveHouse(houseId);
          handleClose();
        } : undefined}
        onUserClick={onMemberClick}
      />
    </div>
  </div>
  );
};