"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, User } from '../types';
import { SUB_LOCATIONS, SubLocation } from '../constants';
import { ChatInfoPanel } from '../src/components/ChatInfoPanel';
import { UserStatusModal } from '../src/components/UserStatusModal';
import { ChatInput } from '../src/components/ChatInput';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../supabase';
import { sendPushToAllExcept, getUserDisplayName } from '../src/utils/pushNotifications';

// Import wallpapers
import hospitalEntrance from '../src/assets/wallpapers/hospital-entrance.jpg';
import crecheEntrance from '../src/assets/wallpapers/creche-entrance.jpg';
import restauranteMain from '../src/assets/wallpapers/restaurante-main.jpg';
import padariaMain from '../src/assets/wallpapers/padaria-main.jpg';
import pousadaEntrance from '../src/assets/wallpapers/pousada-entrance.jpg';
import farmaciaMain from '../src/assets/wallpapers/farmacia-main.jpg';
import supermercadoMain from '../src/assets/wallpapers/supermercado-main.jpg';
import praiaMain from '../src/assets/wallpapers/praia-main.jpg';

interface ChatInterfaceProps {
  locationContext?: string;
  onClose?: () => void;
  onLeaveRoom?: () => void;
  currentUser: User;
  onMemberClick?: (user: User) => void;
  onNavigate?: (locationId: string) => void;
  onMarkAsRead?: (location: string, subLocation?: string | null) => void;
}

const LOCATIONS_LIST = [
  { id: 'hospital', name: 'Hospital', icon: 'medical_services' },
  { id: 'creche', name: 'Creche', icon: 'child_care' },
  { id: 'restaurante', name: 'Restaurante', icon: 'restaurant' },
  { id: 'padaria', name: 'Padaria', icon: 'bakery_dining' },
  { id: 'pousada', name: 'Pousada', icon: 'hotel' },
  { id: 'farmacia', name: 'Farmácia', icon: 'local_pharmacy' },
];

const LOCAIS_NAMES: Record<string, string> = {
  hospital: 'Hospital',
  creche: 'Creche',
  restaurante: 'Restaurante',
  padaria: 'Padaria',
  pousada: 'Pousada',
  farmacia: 'Farmácia',
  supermercado: 'Supermercado',
  praia: 'Praia',
  chat_off: 'Chat OFF',
};

const RACE_THEMES: Record<string, { color: string, icon: string, bg: string }> = {
  'draeven': { color: 'text-rose-500', icon: 'local_fire_department', bg: 'bg-rose-500/10' },
  'sylven': { color: 'text-emerald-500', icon: 'eco', bg: 'bg-emerald-500/10' },
  'lunari': { color: 'text-cyan-400', icon: 'dark_mode', bg: 'bg-cyan-400/10' },
  'ai': { color: 'text-primary', icon: 'auto_awesome', bg: 'bg-primary/10' }
};

const getRaceTheme = (race?: string, isAI?: boolean) => {
  if (isAI) return RACE_THEMES['ai'];
  const key = (race || 'draeven').toLowerCase();
  return RACE_THEMES[key] || RACE_THEMES['draeven'];
};

const WALLPAPERS: Record<string, string> = {
  hospital: hospitalEntrance,
  creche: crecheEntrance,
  restaurante: restauranteMain,
  padaria: padariaMain,
  pousada: pousadaEntrance,
  farmacia: farmaciaMain,
  supermercado: supermercadoMain,
  praia: praiaMain,
  default: hospitalEntrance
};

const ICONS: Record<string, string> = {
  hospital: 'medical_services',
  creche: 'child_care',
  restaurante: 'restaurant',
  padaria: 'bakery_dining',
  pousada: 'hotel',
  farmacia: 'local_pharmacy',
  default: 'chat'
};

// Time gap formatting helpers
const GAP_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes in milliseconds

const formatTimeSeparator = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) {
    return `Hoje às ${timeStr}`;
  } else if (isYesterday) {
    return `Ontem às ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${dateStr} às ${timeStr}`;
  }
};

const shouldShowTimeSeparator = (currentTimestamp?: string, previousTimestamp?: string): boolean => {
  if (!currentTimestamp) return false;
  if (!previousTimestamp) return true; // First message always shows timestamp
  
  const currentTime = new Date(currentTimestamp).getTime();
  const previousTime = new Date(previousTimestamp).getTime();
  
  return (currentTime - previousTime) >= GAP_THRESHOLD_MS;
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  locationContext, 
  onClose, 
  onLeaveRoom,
  currentUser, 
  onMemberClick, 
  onNavigate,
  onMarkAsRead
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [offMessages, setOffMessages] = useState<ChatMessage[]>([]);
  const [roomMessages, setRoomMessages] = useState<Record<string, ChatMessage[]>>({});
  const [currentSubLoc, setCurrentSubLoc] = useState<SubLocation | null>(null);
  const [authorizedRooms, setAuthorizedRooms] = useState<string[]>([]);
  const [characterAge, setCharacterAge] = useState<number | null>(null);
  const [isOffChatMode, setIsOffChatMode] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showGrantAccess, setShowGrantAccess] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [hasVIPAccess, setHasVIPAccess] = useState(false);
  const [showVIPModal, setShowVIPModal] = useState(false);

  const [onlineMembers, setOnlineMembers] = useState<User[]>([]);
  const [presentMembers, setPresentMembers] = useState<User[]>([]); // Members currently in this chat room
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionTab, setSuggestionTab] = useState<'locais' | 'acoes'>('locais');
  
  // Reply functionality
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: ChatMessage; x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Typing indicator state
  const [typingUsers, setTypingUsers] = useState<{ userId: string; name: string }[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<any>(null);
  
  // Unread messages in sub-locations
  const [unreadSubLocations, setUnreadSubLocations] = useState<string[]>([]);
  
  // User status modal
  const [statusModalUser, setStatusModalUser] = useState<User | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const contextKey = locationContext?.toLowerCase() || 'default';
  const isChatOff = contextKey === 'chat_off';
  const isHospital = contextKey === 'hospital';
  const isPharmacy = contextKey === 'farmacia';
  const isPousadaKitchen = contextKey === 'pousada' && currentSubLoc?.name === 'Cozinha';
  const activeWallpaper = currentSubLoc ? currentSubLoc.wallpaper : (WALLPAPERS[contextKey] || WALLPAPERS.default);
  
  const icon = isChatOff ? 'forum' : (ICONS[contextKey] || ICONS.default);
  const [showPharmacy, setShowPharmacy] = useState(false);
  
  // Track if messages have loaded for animation
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  useEffect(() => {
    if (isChatOff) {
      setIsOffChatMode(true);
    } else {
      setIsOffChatMode(false);
    }
  }, [isChatOff, locationContext]);

  
  const isCreche = contextKey === 'creche';
  const canAccessCrecheByAge = isCreche && characterAge !== null && characterAge >= 1 && characterAge <= 5;
  
  const internalLocs = (SUB_LOCATIONS[contextKey] || []).filter(loc => {
    // "Entrada" na Pousada é redundante (a sala principal já é a entrada).
    // Isso também evita que apareça duplicado junto do botão "Voltar" quando estamos em um sub-local.
    if (loc.name === 'Entrada') return false;
    if (!loc.restricted) return true;
    
    if (authorizedRooms.includes(loc.name)) return true;
    // Crianças de 1-5 anos podem acessar salas da creche
    if (isCreche && canAccessCrecheByAge) return true;
    return false;
  });

  const handleClose = () => {
    // Use browser back to return to previous screen
    window.history.back();
  };

  const handleLeaveChat = () => {
    setIsClosing(true);
    setTimeout(onLeaveRoom || onClose || (() => {}), 350);
  };

  // Handle sub-location navigation with browser history
  const enterSubLocation = useCallback((loc: SubLocation) => {
    setCurrentSubLoc(loc);
    window.history.pushState({ type: 'subLocation', subLocationName: loc.name }, '');
    setUnreadSubLocations(prev => prev.filter(s => s !== loc.name));
    
    // Mark as read immediately when entering sub-location
    if (locationContext && onMarkAsRead) {
      onMarkAsRead(locationContext, loc.name);
    }
    
    // Try to trigger MonkeyDoctor in hospital rooms
    if (contextKey === 'hospital' && ['Sala 1', 'Sala 2', 'Sala 3'].includes(loc.name)) {
      supabaseService.tryTriggerMonkeyDoctor(loc.name, currentUser.username).then(triggered => {
        if (triggered) {
          console.log('[MonkeyDoctor] Appeared in', loc.name);
        }
      });
    }
  }, [contextKey, locationContext, onMarkAsRead]);

  // Handle back navigation for sub-locations
  useEffect(() => {
    if (!currentSubLoc) return; // Only add listener when in a sub-location
    
    const handlePopState = (event: PopStateEvent) => {
      // Go back to main room from sub-location
      setCurrentSubLoc(null);
      // Push a new state to keep history available for closing the chat
      window.history.pushState({ type: 'chat', data: locationContext }, '');
      
      // Mark main location as read when returning from sub-location
      if (locationContext && onMarkAsRead) {
        onMarkAsRead(locationContext, null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentSubLoc, locationContext, onMarkAsRead]);

  const loadMessages = useCallback(async () => {
    const loc = (locationContext || 'global').toLowerCase();
    
    console.log('[ChatInterface] loadMessages called:', { loc, currentSubLoc: currentSubLoc?.name });
    
    try {
      const dbMessages = await supabaseService.getChatMessages(loc, currentSubLoc?.name);
      
      console.log('[ChatInterface] dbMessages received:', { 
        count: dbMessages?.length, 
        firstContent: dbMessages?.[0]?.content,
        lastContent: dbMessages?.[dbMessages?.length - 1]?.content 
      });
      
      if (!dbMessages) {
        console.log('[ChatInterface] No messages returned');
        return;
      }
      
       const SYSTEM_UUID = '00000000-0000-0000-0000-000000000000';
       
       const formattedMessages: ChatMessage[] = dbMessages.map(msg => ({
         id: msg.id,
         role: (msg.user_id === 'jyp-bandit' || msg.user_id === SYSTEM_UUID || msg.character_name === 'Sistema') ? 'model' : 'user',
         text: msg.content,
         timestamp: msg.created_at,
         isSystemMessage: msg.user_id === SYSTEM_UUID || msg.character_name === 'Sistema',
         author: msg.user_id === SYSTEM_UUID ? {
           id: SYSTEM_UUID,
           name: 'Sistema',
           username: 'sistema',
           avatar: '',
           race: 'draeven' as any
         } : msg.user_id === 'jyp-bandit' ? {
           id: 'jyp-bandit',
           name: 'JYP',
           username: 'jyp',
           avatar: '/jyp-avatar.jpg',
           race: 'draeven' as any
          } : {
            id: msg.user_id,
            name: msg.character_name || msg.profiles?.full_name || 'Viajante',
            username: msg.profiles?.username || 'user',
            avatar: msg.character_avatar || msg.profiles?.avatar_url || '',
            race: msg.profiles?.race || 'draeven'
          }
       }));
      
      console.log('[ChatInterface] Setting messages:', { count: formattedMessages.length, hasSubLoc: !!currentSubLoc });
      
      if (currentSubLoc) {
        setRoomMessages(prev => ({
          ...prev,
          [currentSubLoc.name]: formattedMessages
        }));
      } else {
        setMessages(formattedMessages);
      }

      const offDbMessages = await supabaseService.getChatMessages(loc, 'OFF');
      if (offDbMessages) {
        const formattedOffMessages: ChatMessage[] = offDbMessages.map(msg => ({
          id: msg.id,
          role: 'user',
          text: msg.content,
          timestamp: msg.created_at,
          author: {
            id: msg.user_id,
            name: msg.profiles?.full_name || 'Viajante',
            username: msg.profiles?.username || 'user',
            avatar: msg.profiles?.avatar_url || '',
            race: msg.profiles?.race || 'draeven'
          }
        }));
        setOffMessages(formattedOffMessages);
      }
      // Trigger animation after messages load
      setMessagesLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      setMessagesLoaded(true);
    }
  }, [locationContext, currentSubLoc]);

  // Reset animation state when changing sub-location
  useEffect(() => {
    setMessagesLoaded(false);
  }, [currentSubLoc?.name]);


  useEffect(() => {
    loadMessages();
    
    if (locationContext && currentUser?.id) {
      
      supabaseService.checkRoomAccess(currentUser.id, locationContext).then(setAuthorizedRooms);
      supabaseService.getAllProfiles().then(setOnlineMembers);
      supabaseService.getUserCharacterAge(currentUser.id).then(setCharacterAge);
      
      if (locationContext === 'restaurante' || locationContext === 'padaria') {
        supabaseService.checkVIPAccess(currentUser.id, locationContext).then(setHasVIPAccess);
      }
    }

    const loc = (locationContext || 'global').toLowerCase();
    const channelName = `chat-${loc}-${isOffChatMode ? 'OFF' : (currentSubLoc?.name || 'main')}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `location=eq.${loc}`
        },
        async (payload) => {
          const msg = payload.new as any;
          const targetSubLoc = isOffChatMode ? 'OFF' : (currentSubLoc?.name || null);
          
          // Check if message belongs to current view
          if (isOffChatMode) {
            if (msg.sub_location !== 'OFF') return;
          } else if (currentSubLoc) {
            if (msg.sub_location !== currentSubLoc.name) return;
          } else {
            // Aceitar mensagens onde sub_location é null, undefined ou vazia (sala principal)
            if (msg.sub_location != null && msg.sub_location !== '') return;
          }

          // Buscar dados do autor em tempo real para ter a raça correta
          const { data: profile } = await supabase.from('profiles').select('race, full_name, username, avatar_url, current_disease').eq('user_id', msg.user_id).single();

          const SYSTEM_UUID = '00000000-0000-0000-0000-000000000000';
          
          const newMessage: ChatMessage = {
            id: msg.id,
            role: (msg.user_id === 'jyp-bandit' || msg.user_id === SYSTEM_UUID || msg.character_name === 'Sistema') ? 'model' : 'user',
            text: msg.content,
            timestamp: msg.created_at,
            isSystemMessage: msg.user_id === SYSTEM_UUID || msg.character_name === 'Sistema',
            author: msg.user_id === SYSTEM_UUID ? {
              id: SYSTEM_UUID,
              name: 'Sistema',
              username: 'sistema',
              avatar: '',
              race: 'draeven' as any
            } : msg.user_id === 'jyp-bandit' ? {
              id: 'jyp-bandit',
              name: 'JYP',
              username: 'jyp',
              avatar: '/jyp-avatar.jpg',
              race: 'draeven' as any
            } : {
              id: msg.user_id,
              name: msg.character_name || profile?.full_name || 'Viajante',
              username: profile?.username || 'user',
              avatar: msg.character_avatar || profile?.avatar_url || '',
              race: profile?.race || 'draeven'
            }
          };

          if (isOffChatMode) {
            setOffMessages(prev => prev.some(m => m.id === newMessage.id) ? prev : [...prev, newMessage]);
          } else if (currentSubLoc) {
            setRoomMessages(prev => {
              const current = prev[currentSubLoc.name] || [];
              if (current.some(m => m.id === newMessage.id)) return prev;
              return { ...prev, [currentSubLoc.name]: [...current, newMessage] };
            });
          } else {
            setMessages(prev => prev.some(m => m.id === newMessage.id) ? prev : [...prev, newMessage]);
          }
          
          // Mark as read when receiving new messages while in the chat
          if (onMarkAsRead && locationContext) {
            onMarkAsRead(locationContext, currentSubLoc?.name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationContext, currentUser?.id, loadMessages, currentSubLoc?.name, isOffChatMode]);

  // Presence channel for typing indicators and tracking present members
  useEffect(() => {
    if (!locationContext || !currentUser?.id) return;
    
    const loc = locationContext;
    const subLoc = isOffChatMode ? 'OFF' : (currentSubLoc?.name || 'main');
    const presenceChannelName = `presence-chat-${loc}-${subLoc}`;
    
    const presenceChannel = supabase.channel(presenceChannelName, {
      config: { presence: { key: currentUser.id } }
    });
    
    presenceChannel
      .on('presence', { event: 'sync' }, async () => {
        const state = presenceChannel.presenceState();
        const typing: { userId: string; name: string }[] = [];
        const presentUserIds: string[] = [];
        const presenceData: Record<string, { name?: string; avatar?: string }> = {};
        
        Object.entries(state).forEach(([userId, presences]) => {
          // Track all present users
          presentUserIds.push(userId);
          const presence = (presences as any[])[0];
          presenceData[userId] = { name: presence?.name, avatar: presence?.avatar };
          
          if (userId !== currentUser.id) {
            if (presence?.isTyping) {
              typing.push({ userId, name: presence.name || 'Usuário' });
            }
          }
        });
        
        setTypingUsers(typing);
        
        // Update present members - fetch from onlineMembers or build from presence data
        const presentIdsSet = new Set(presentUserIds);
        let newPresentMembers = onlineMembers.filter(m => presentIdsSet.has(m.id));
        
        // If we have users in presence that aren't in onlineMembers, fetch their profiles
        const missingIds = presentUserIds.filter(id => !onlineMembers.some(m => m.id === id));
        if (missingIds.length > 0) {
          try {
            const missingProfiles = await supabaseService.getProfilesByIds(missingIds);
            if (missingProfiles && missingProfiles.length > 0) {
              const missingMembers: User[] = missingProfiles.map(p => ({
                id: p.user_id,
                name: p.full_name,
                username: p.username,
                avatar: p.avatar_url || '',
                race: p.race || 'draeven',
                isLeader: p.is_leader
              }));
              newPresentMembers = [...newPresentMembers, ...missingMembers];
            }
          } catch (error) {
            console.error('[Presence] Error fetching missing profiles:', error);
          }
        }
        
        // Also include users from presence data if they have name info (fallback)
        presentUserIds.forEach(userId => {
          if (!newPresentMembers.some(m => m.id === userId) && presenceData[userId]?.name) {
            newPresentMembers.push({
              id: userId,
              name: presenceData[userId].name || 'Usuário',
              username: 'user',
              avatar: presenceData[userId].avatar || '',
              race: 'draeven'
            });
          }
        });
        
        setPresentMembers(prev => {
          const prevIds = prev.map(m => m.id).sort().join(',');
          const newIds = newPresentMembers.map(m => m.id).sort().join(',');
          if (prevIds !== newIds) {
            return newPresentMembers;
          }
          return prev;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user presence with their info
          await presenceChannel.track({
            isTyping: false,
            name: currentUser.name,
            avatar: currentUser.avatar
          });
        }
      });
    
    presenceChannelRef.current = presenceChannel;
    
    return () => {
      presenceChannel.unsubscribe();
      presenceChannelRef.current = null;
    };
  }, [locationContext, currentUser?.id, currentSubLoc?.name, isOffChatMode, currentUser.name, currentUser.avatar, onlineMembers]);

  useEffect(() => {
    if (locationContext && onMarkAsRead) {
      onMarkAsRead(locationContext, currentSubLoc?.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationContext, currentSubLoc?.name]);

  // Check for unread messages in sub-locations
  useEffect(() => {
    if (!locationContext || !currentUser?.id || isOffChatMode) return;
    
    const checkUnreadSubLocations = async () => {
      const subLocs = SUB_LOCATIONS[contextKey] || [];
      if (subLocs.length === 0) return;
      
      try {
        // Get last message time for each sub-location (EXCLUDING own messages)
        const { data: lastMessages } = await supabase
          .from('chat_messages')
          .select('sub_location, created_at, user_id')
          .eq('location', locationContext)
          .not('sub_location', 'is', null)
          .neq('sub_location', '')
          .neq('user_id', currentUser.id) // Ignorar próprias mensagens
          .order('created_at', { ascending: false });
        
        if (!lastMessages || lastMessages.length === 0) {
          setUnreadSubLocations([]);
          return;
        }
        
        // Group by sub_location and get the latest (from OTHER users)
        const latestBySubLoc: Record<string, string> = {};
        lastMessages.forEach(msg => {
          if (msg.sub_location && !latestBySubLoc[msg.sub_location]) {
            latestBySubLoc[msg.sub_location] = msg.created_at;
          }
        });
        
        // Get user's read receipts for this location
        const { data: receipts } = await supabase
          .from('chat_read_receipts')
          .select('sub_location, last_seen_at')
          .eq('user_id', currentUser.id)
          .eq('location', locationContext);
        
        const receiptMap: Record<string, string> = {};
        receipts?.forEach(r => {
          if (r.sub_location) {
            receiptMap[r.sub_location] = r.last_seen_at;
          }
        });
        
        // Determine which sub-locations have unread messages from OTHER users
        const unread: string[] = [];
        Object.entries(latestBySubLoc).forEach(([subLoc, lastMsgTime]) => {
          const lastSeen = receiptMap[subLoc];
          // Só marca como não lida se a última msg de OUTRO usuário for mais recente que o last_seen
          if (!lastSeen || new Date(lastMsgTime) > new Date(lastSeen)) {
            unread.push(subLoc);
          }
        });
        
        setUnreadSubLocations(unread);
      } catch (error) {
        console.error('[ChatInterface] Error checking unread sub-locations:', error);
      }
    };
    
    checkUnreadSubLocations();
    
    // Subscribe to new messages to update unread indicator
    const channel = supabase
      .channel(`unread-check-${locationContext}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `location=eq.${locationContext}`
        },
        () => checkUnreadSubLocations()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationContext, currentUser?.id, isOffChatMode, contextKey]);

  // Sistema de tratamentos removido

  // Load approver profile (avatar + name)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'instant'
      });
    }
  }, [messages, roomMessages, offMessages, currentSubLoc, isLoading, isOffChatMode]);



  const activeMessages = isOffChatMode 
    ? offMessages 
    : currentSubLoc 
      ? (roomMessages[currentSubLoc.name] || []) 
      : messages;

  const handleLongPressStart = (msg: ChatMessage, e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    longPressTimerRef.current = setTimeout(() => {
      setContextMenu({ msg, x: clientX, y: clientY });
      if (navigator.vibrate) navigator.vibrate(50);
    }, 1000); // 1 second
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setContextMenu(null);
  };

  const handleReplyFromContext = (msg: ChatMessage) => {
    setReplyTo(msg);
    setContextMenu(null);
  };

  const handleDeleteMessage = async (msgId: string) => {
    const loc = (locationContext || 'global').toLowerCase();
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', msgId)
      .eq('user_id', currentUser.id);
    
    if (!error) {
      if (currentSubLoc) {
        setRoomMessages(prev => ({
          ...prev,
          [currentSubLoc.name]: (prev[currentSubLoc.name] || []).filter(m => m.id !== msgId)
        }));
      } else if (isOffChatMode) {
        setOffMessages(prev => prev.filter(m => m.id !== msgId));
      } else {
        setMessages(prev => prev.filter(m => m.id !== msgId));
      }
    }
    setContextMenu(null);
  };

  // Format text with italic support for *text*
  const formatMessageText = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    if (!isOffChatMode && (textToSend.startsWith('/') || textToSend.startsWith('*'))) {
      const target = textToSend.slice(1).toLowerCase();
      const loc = LOCATIONS_LIST.find(l => l.id === target || l.name.toLowerCase() === target);
      if (loc && onNavigate) {
        onNavigate(loc.id);
        setShowSuggestions(false);
        setReplyTo(null);
        return;
      }
    }

    // Format message with reply info
    let finalText = textToSend.trim();
    if (replyTo) {
      // Limpa metadados de outras respostas no texto original para evitar replicação de headers
      const cleanReplyText = replyTo.text.replace(/^\[reply:@[^|]+\|[^\]]+\]\n/, '');
      const replyPreview = cleanReplyText.length > 50 ? cleanReplyText.slice(0, 50) + '...' : cleanReplyText;
      finalText = `[reply:@${replyTo.author?.name}|${replyPreview}]\n${textToSend.trim()}`;
    }

    // Don't add message optimistically - let realtime handle it to avoid duplicates
    // The message will appear when realtime subscription receives the INSERT event
    
    setReplyTo(null);
    
    // Stop typing indicator when message is sent
    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({ isTyping: false, name: currentUser.name });
    }

    try {
      await supabaseService.sendChatMessage(
        currentUser.id,
        (locationContext || 'global').toLowerCase(),
        finalText,
        isOffChatMode ? undefined : currentUser.name,
        isOffChatMode ? undefined : currentUser.avatar,
        isOffChatMode ? 'OFF' : currentSubLoc?.name
      );
      
      // Send push notification to all users except the sender AND users present in the chat
      const displayName = currentUser.name || await getUserDisplayName(currentUser.id);
      const locationName = LOCAIS_NAMES[contextKey] || locationContext || 'Chat';
      const previewText = textToSend.length > 50 ? textToSend.slice(0, 50) + '...' : textToSend;
      
      // Get IDs of users present in the chat to exclude from notifications
      const presentUserIds = presentMembers.map(m => m.id);
      
      sendPushToAllExcept(
        currentUser.id,
        `💬 ${displayName} em ${locationName}`,
        previewText,
        'chat_message',
        (locationContext || 'global').toLowerCase(),
        presentUserIds
      );
    } catch (error) {
      console.error("Erro ao salvar mensagem:", error);
    }
  };

  const handleGrantAccess = async (targetUser: User, roomName: string) => {
    try {
      if (!locationContext) return;
      await supabaseService.grantRoomAccess(targetUser.id, locationContext, roomName, currentUser.id);
      alert(`Acesso à ${roomName} liberado para ${targetUser.name}! ✨`);
      setShowGrantAccess(false);
      setShowSuggestions(false);
    } catch (error: any) {
      alert("Erro ao liberar sala: " + error.message);
    }
  };

  const handleSuggestionClick = (locId: string) => {
    if (onNavigate) {
      onNavigate(locId);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[750] bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full">
          <img key={activeWallpaper} src={activeWallpaper} className="w-full h-full object-cover brightness-50" alt="interior" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black"></div>
        </div>
      </div>

      {/* Painel animado: o fundo fica fixo para evitar mostrar a tela de Destaque durante o slide */}
      <div className={`relative z-10 flex flex-col h-[100dvh] overflow-hidden will-change-transform ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
        <div className={`relative z-10 px-6 pt-12 pb-6 flex items-center justify-between backdrop-blur-3xl border-b ${isChatOff ? 'bg-cyan-900/40 border-cyan-500/30' : 'bg-black/40 border-white/10'}`}>

        <div className="flex items-center space-x-4">
          {currentSubLoc ? (
            <button onClick={() => setCurrentSubLoc(null)} className="w-12 h-12 rounded-[20px] bg-white/10 flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all">
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
          ) : (
            <button onClick={() => setShowChatInfo(true)} className="w-12 h-12 rounded-[20px] border border-white/30 flex items-center justify-center text-white active:scale-90 transition-all" style={{ background: isChatOff ? 'linear-gradient(to bottom right, #06b6d4, #9333ea)' : isHospital ? '#3b82f6' : 'rgba(139, 92, 246, 0.9)' }}>
              <span className="material-symbols-rounded text-2xl">{icon}</span>
            </button>
          )}
          
          <button 
            onClick={() => !currentSubLoc && setShowChatInfo(true)}
            className="text-left active:opacity-70 transition-opacity"
            disabled={!!currentSubLoc}
          >
            <h3 className="text-xl font-black text-white leading-none capitalize tracking-tighter">{isChatOff ? 'Chat OFF' : currentSubLoc ? currentSubLoc.name : (locationContext || 'Magic Chat')}</h3>
            <div className="flex items-center mt-1.5 space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isChatOff ? 'bg-cyan-400' : 'bg-green-500'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isChatOff ? 'text-cyan-300/70' : 'text-white/50'}`}>
                {isChatOff ? 'Fora do Roleplay' : currentSubLoc ? `Cenário: ${locationContext}` : 'Toque para info'}
              </span>
            </div>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button onClick={handleClose} className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-2xl flex items-center justify-center border border-white/10 text-white shadow-lg active:scale-90" title="Voltar"><span className="material-symbols-rounded">close</span></button>
        </div>
      </div>

      {isOffChatMode && (
        <div className={`relative z-10 px-6 py-2 border-b flex items-center justify-center gap-2 ${isChatOff ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-amber-500/20 border-amber-500/30'}`}>
          <span className={`material-symbols-rounded text-sm ${isChatOff ? 'text-cyan-400' : 'text-amber-500'}`}>info</span>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isChatOff ? 'text-cyan-400' : 'text-amber-500'}`}>{isChatOff ? 'Chat livre - Sem personagem, sem roleplay!' : 'Chat fora do roleplay - Converse livremente!'}</span>
        </div>
      )}


      <div ref={scrollRef} className={`flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 relative z-10 scrollbar-hide pb-32 ${messagesLoaded ? 'messages-fade-in' : 'opacity-0'}`}>
        {activeMessages.map((msg, index) => {
          const isJYP = msg.author?.id === '00000000-0000-0000-0000-000000000003' || msg.author?.name === 'JYP';
          const isSystemMsg = msg.isSystemMessage || msg.author?.id === '00000000-0000-0000-0000-000000000000';
          const theme = getRaceTheme(msg.author?.race, isJYP);
          const isOwnMessage = msg.author?.id === currentUser.id;
          
          // Check time gap for separator
          const previousMsg = index > 0 ? activeMessages[index - 1] : null;
          const showTimeSeparator = shouldShowTimeSeparator(msg.timestamp, previousMsg?.timestamp);
          
          // Mensagens de sistema (entrou/saiu do chat) - renderização especial
          if (isSystemMsg) {
            return (
              <React.Fragment key={msg.id}>
                {showTimeSeparator && msg.timestamp && (
                  <div className="flex items-center justify-center my-6">
                    <div className="flex items-center gap-3 px-4 py-2 bg-black/30 backdrop-blur-xl rounded-full border border-white/10">
                      <span className="material-symbols-rounded text-white/40 text-sm">schedule</span>
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                        {formatTimeSeparator(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-center justify-center my-6 relative py-2">
                  {/* Decorative horizontal line */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent"></div>
                  </div>
                  <div className="relative px-6 py-2 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-3xl shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${msg.text.includes('ONLINE') ? 'bg-primary shadow-[0_0_10px_#8B5CF6]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`}></div>
                      <span className="text-[9px] font-black text-white/60 tracking-[0.25em] uppercase italic">
                        {msg.text}
                      </span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          }
          
          // Check if message has reply info [reply:@Author|Snippet]
          const replyMatch = msg.text.match(/^\[reply:@([^|]+)\|([^\]]+)\]\n([\s\S]*)$/);
          const hasReply = !!replyMatch;
          const replyAuthor = replyMatch?.[1];
          const replySnippet = replyMatch?.[2];
          let actualText = hasReply ? replyMatch![3] : msg.text;
          
          // Check if this is a MonkeyDoctor message (moved up to use for room button check)
          const isMonkeyDoctor = msg.author?.name?.includes('MonkeyDoctor') || msg.author?.id === '00000000-0000-0000-0000-000000000002';
          
          // Check if message has room button [ROOM_BUTTON:SalaName] or [ROOM_BUTTON:SalaName:PatientId]
          const roomButtonMatch = actualText.match(/\[ROOM_BUTTON:([^:\]]+)(?::([^\]]+))?\]/);
          const roomButtonName = roomButtonMatch?.[1];
          const roomButtonPatientId = roomButtonMatch?.[2]; // Optional patient ID
          if (roomButtonMatch) {
            actualText = actualText.replace(/\n?\[ROOM_BUTTON:[^\]]+\]/, '').trim();
          }
          
          // Only show room button if it's for this patient or no patient specified
          const shouldShowRoomButton = roomButtonName && isMonkeyDoctor && 
            (!roomButtonPatientId || roomButtonPatientId === currentUser?.id);
          
          // Updated classes: added select-none and touch-callout none to prevent cursors/context menu
          const bubbleClasses = `max-w-full px-5 py-3.5 rounded-[24px] text-[13.5px] font-bold leading-relaxed shadow-[0_10px_20px_rgba(0,0,0,0.3)] border border-white bg-white text-black break-words [overflow-wrap:anywhere] [word-break:break-word] select-none [-webkit-touch-callout:none]`;
          
          // Function to handle room button click
          const handleRoomButtonClick = (roomName: string) => {
            const hospitalRooms = SUB_LOCATIONS['hospital'] || [];
            const targetRoom = hospitalRooms.find(r => r.name === roomName);
            if (targetRoom) {
              enterSubLocation(targetRoom);
              // Grant temporary access to the room for treatment
              if (currentUser?.id && locationContext) {
                supabaseService.grantRoomAccess(currentUser.id, locationContext, roomName, '00000000-0000-0000-0000-000000000002')
                  .catch(console.error);
              }
            }
          };
          
          // Time separator component
          const TimeSeparator = showTimeSeparator && msg.timestamp ? (
            <div className="flex items-center justify-center my-6">
              <div className="flex items-center gap-3 px-4 py-2 bg-black/30 backdrop-blur-xl rounded-full border border-white/10">
                <span className="material-symbols-rounded text-white/40 text-sm">schedule</span>
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                  {formatTimeSeparator(msg.timestamp)}
                </span>
              </div>
            </div>
          ) : null;
          
          if (isOffChatMode) {
            return (
              <React.Fragment key={msg.id}>
                {TimeSeparator}
                <div 
                  className={`flex min-w-0 items-start space-x-3 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : 'justify-start'}`}
                  onTouchStart={(e) => handleLongPressStart(msg, e)}
                  onTouchEnd={handleLongPressEnd}
                  onTouchCancel={handleLongPressEnd}
                  onMouseDown={(e) => handleLongPressStart(msg, e)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                >
                  <button onClick={() => msg.author && onMemberClick?.(msg.author)} className={`w-10 h-10 rounded-[16px] flex-shrink-0 border-2 ${isOwnMessage ? 'border-amber-500/30' : 'border-zinc-500/30'} overflow-hidden shadow-xl`}>
                    <img src={msg.author?.avatar} className="w-full h-full object-cover" alt="avatar" />
                  </button>
                  <div className={`flex flex-col space-y-1.5 max-w-[80%] w-full min-w-0 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    <span className={`text-[11px] font-bold ${isOwnMessage ? 'text-amber-500/70' : 'text-zinc-500/70'}`}>{msg.author?.name || 'Viajante'}</span>
                    <div className={`${bubbleClasses} ${isOwnMessage ? 'rounded-tr-none' : 'rounded-tl-none'} ${replyTo?.id === msg.id ? 'ring-2 ring-primary' : ''}`}>
                      {hasReply && (
                        <div className="mb-2 pl-3 py-1 border-l-2 border-amber-500 bg-black/5 rounded-r-lg text-[11px] text-black/50 italic">
                          <span className="font-semibold block not-italic">@{replyAuthor}</span>
                          <span className="truncate block">{replySnippet}</span>
                        </div>
                      )}
                      {actualText.split('\n').map((line, i) => (
                        <p key={i} className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{formatMessageText(line) || '\u00A0'}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          }
          
          // MonkeyDoctor and JYP always appear on the left side
          const forceLeftSide = isJYP || isMonkeyDoctor;
          
          return (
            <React.Fragment key={msg.id}>
              {TimeSeparator}
              <div 
                className={`flex min-w-0 items-start space-x-3 ${isOwnMessage && !forceLeftSide ? 'flex-row-reverse space-x-reverse' : 'justify-start'}`}
                onTouchStart={(e) => handleLongPressStart(msg, e)}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressEnd}
                onMouseDown={(e) => handleLongPressStart(msg, e)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
              >
                <button onClick={() => msg.author && !isJYP && !isMonkeyDoctor && setStatusModalUser(msg.author)} className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-[16px] border-2 border-white/20 overflow-hidden shadow-xl flex items-center justify-center ${isJYP ? 'bg-pink-500' : isMonkeyDoctor ? 'bg-emerald-500' : 'bg-surface-purple'}`}>
                    {isJYP ? <img src="/jyp-avatar.jpg" className="w-full h-full object-cover" alt="JYP" /> : isMonkeyDoctor ? <span className="text-2xl">🐵</span> : <img src={msg.author?.avatar} className="w-full h-full object-cover" alt="avatar" />}
                  </div>
                </button>
                <div className={`flex flex-col space-y-1.5 max-w-[80%] w-full min-w-0 ${isOwnMessage && !forceLeftSide ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center space-x-2 ${isOwnMessage && !forceLeftSide ? 'flex-row-reverse space-x-reverse' : ''}`}>
                     <span className="text-[13px] font-black text-white tracking-tight">{isJYP ? 'JYP' : isMonkeyDoctor ? 'MonkeyDoctor' : (msg.author?.name || 'Viajante')}</span>
                     <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-md ${isJYP ? 'bg-pink-500 text-white' : isMonkeyDoctor ? 'bg-emerald-500 text-white' : `${theme.bg.replace('/10', '')} ${theme.color.replace('text-', 'text-white')}`} border border-white/10`}><span className="material-symbols-rounded text-[10px]">{isJYP ? 'theater_comedy' : isMonkeyDoctor ? 'medical_services' : theme.icon}</span><span className="text-[8px] font-black uppercase tracking-widest">{isJYP ? 'Bandido' : isMonkeyDoctor ? 'Doutor' : (msg.author?.race || 'Humano')}</span></div>
                  </div>
                  <div className={`${bubbleClasses} ${isOwnMessage && !forceLeftSide ? 'rounded-tr-none' : 'rounded-tl-none'} ${replyTo?.id === msg.id ? 'ring-2 ring-primary' : ''}`}>
                    {hasReply && (
                      <div className={`mb-3 pl-3 py-1.5 border-l-4 rounded-r-xl bg-black/5 text-[11px] text-black/60 italic overflow-hidden ${isJYP ? 'border-pink-500' : isMonkeyDoctor ? 'border-emerald-500' : 'border-primary'}`}>
                        <span className="font-black block not-italic uppercase text-[9px] mb-0.5 opacity-70">@{replyAuthor}</span>
                        <span className="truncate block opacity-80 leading-tight">"{replySnippet}"</span>
                      </div>
                    )}
                    {actualText.split('\n').map((line, i) => {
                      // Parse both *action* and -dialogue- formatting
                      const parts = line.split(/(\*[^*]+\*|-[^-]+-)/g);
                      return (
                        <p key={i} className="mb-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                          {parts.map((part, j) => {
                            // Action formatting with *asterisks*
                            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                              return (
                                <span key={j} className="text-black/40 font-medium italic break-words [overflow-wrap:anywhere]">
                                  {part.slice(1, -1)}
                                </span>
                              );
                            }
                            // Dialogue formatting with -dashes-
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
                    
                    {/* Room Button for MonkeyDoctor messages - only show for the correct patient */}
                    {shouldShowRoomButton && (
                      <button
                        onClick={() => handleRoomButtonClick(roomButtonName!)}
                        className="mt-4 w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-black text-sm uppercase tracking-wide shadow-lg border border-white/20 hover:scale-[1.02] active:scale-95 transition-all animate-pulse"
                      >
                        <span className="material-symbols-rounded text-xl">door_open</span>
                        <span>Entrar na {roomButtonName}</span>
                        <span className="material-symbols-rounded text-xl">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="px-6 pb-12 pt-4 relative z-10">
        {showSuggestions && !isOffChatMode && (
          <div className="absolute bottom-[calc(100%+12px)] left-6 right-6 bg-background-dark rounded-[32px] border border-white/10 p-5 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] animate-in slide-in-bottom duration-300 max-h-[60vh] overflow-hidden flex flex-col">
             <div className="flex items-center space-x-2 mb-4">
               <button 
                 onClick={() => { setSuggestionTab('locais'); }}
                 className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${suggestionTab === 'locais' ? 'bg-primary text-white' : 'bg-white/5 text-white/40'}`}
               >
                 <span className="material-symbols-rounded text-sm mr-2">location_on</span>
                 Locais
               </button>
               <button 
                 onClick={() => { setSuggestionTab('acoes'); }}
                 className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${suggestionTab === 'acoes' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/40'}`}
               >
                 <span className="material-symbols-rounded text-sm mr-2">group</span>
                 Usuários
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto scrollbar-hide">
               {suggestionTab === 'locais' ? (
                 !showGrantAccess ? (
                   <div className="grid grid-cols-2 gap-3">
                     {LOCATIONS_LIST.map(loc => (
                       <button 
                         key={loc.id}
                         onClick={() => handleSuggestionClick(loc.id)}
                         className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary hover:border-primary transition-all active:scale-95 group"
                       >
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:bg-white group-hover:text-primary transition-all">
                           <span className="material-symbols-rounded">{loc.icon}</span>
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-white">{loc.name}</span>
                       </button>
                     ))}
                   </div>
                 ) : (
                   <div className="space-y-4 animate-in zoom-in">
                     <div className="px-2 mb-2">
                       <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Selecione o Usuário</p>
                     </div>
                      <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
                        {presentMembers.filter(m => m.id !== currentUser.id).map(member => (
                          <button 
                            key={member.id} 
                            onClick={() => {
                              const room = prompt(`Qual sala deseja liberar para ${member.name}?`);
                              if (room) handleGrantAccess(member, room);
                            }}
                            className="flex flex-col items-center space-y-2 group flex-shrink-0"
                          >
                            <img src={member.avatar} className="w-12 h-12 rounded-2xl border border-white/10 group-hover:border-primary" alt={member.name} />
                            <span className="text-[7px] font-black text-white/40 uppercase truncate w-12">{member.name}</span>
                          </button>
                        ))}
                     </div>
                     <button onClick={() => setShowGrantAccess(false)} className="w-full py-3 rounded-xl bg-white/5 text-white/20 text-[8px] font-black uppercase tracking-widest">Voltar</button>
                   </div>
                 )
               ) : (
                  <div className="space-y-4">
                    {/* Present Users Section */}
                    <div className="space-y-3">
                      <div className="px-2">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest flex items-center">
                          <span className="material-symbols-rounded text-xs mr-1 text-emerald-400">group</span>
                          Usuários no Chat ({presentMembers.filter(m => m.id !== currentUser.id).length})
                        </p>
                      </div>
                      {presentMembers.filter(m => m.id !== currentUser.id).length === 0 ? (
                        <div className="py-4 text-center bg-white/5 rounded-2xl border border-white/5">
                          <span className="material-symbols-rounded text-2xl mb-1 block text-white/20">person_off</span>
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Ninguém aqui</p>
                        </div>
                      ) : (
                        <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
                          {presentMembers.filter(m => m.id !== currentUser.id).map(member => (
                            <button
                              key={member.id}
                              onClick={() => setStatusModalUser(member)}
                              className="flex flex-col items-center space-y-2 group flex-shrink-0"
                            >
                              <div className="relative">
                                <img src={member.avatar} className="w-14 h-14 rounded-2xl border-2 border-emerald-500/50 group-hover:border-emerald-400 transition-all" alt={member.name} />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background-dark flex items-center justify-center">
                                  <span className="material-symbols-rounded text-[8px] text-white">circle</span>
                                </div>
                              </div>
                              <span className="text-[8px] font-black text-white/60 uppercase truncate w-14 text-center">{member.name.split(' ')[0]}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
             
          </div>
        )}

        {/* Reply Preview Premium */}
        {replyTo && (
          <div className="mb-3 mx-2 animate-in slide-in-from-bottom duration-300">
            <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[28px] overflow-hidden shadow-[0_-15px_40px_rgba(0,0,0,0.5)] flex items-stretch">
              <div className={`w-1.5 ${isOffChatMode ? 'bg-amber-500' : 'bg-primary'} shadow-[0_0_15px_rgba(139,92,246,0.3)]`}></div>
              <div className="flex-1 min-w-0 p-4 pr-12 relative">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isOffChatMode ? 'text-amber-500' : 'text-primary'}`}>Respondendo para {replyTo.author?.name}</p>
                <p className="text-[13px] text-white/60 truncate italic leading-none min-w-0">
                  "{(() => {
                    // Limpa metadados de outras respostas no texto original para evitar replicação de headers
                    const cleanText = replyTo.text.replace(/^\[reply:@[^|]+\|[^\]]+\]\n/, '');
                    return cleanText.length > 60 ? cleanText.slice(0, 60) + '...' : cleanText;
                  })()}"
                </p>
                <button 
                  onClick={() => setReplyTo(null)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white active:scale-90 transition-all"
                >
                  <span className="material-symbols-rounded text-xl">close</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="mb-3 mx-2 animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex items-center space-x-2 px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-white/50 font-medium">
                {typingUsers.length === 1 
                  ? `${typingUsers[0].name} está digitando...`
                  : `${typingUsers.map(u => u.name).join(', ')} estão digitando...`
                }
              </span>
            </div>
          </div>
        )}

        <ChatInput
          onSend={handleSend}
          onTypingStart={() => {
            if (presenceChannelRef.current) {
              presenceChannelRef.current.track({ isTyping: true, name: currentUser.name });
            }
          }}
          onTypingStop={() => {
            if (presenceChannelRef.current) {
              presenceChannelRef.current.track({ isTyping: false, name: currentUser.name });
            }
          }}
          isLoading={isLoading}
          placeholder={replyTo ? `Sua resposta...` : isOffChatMode ? "Mensagem livre..." : currentSubLoc ? `Roleplay em ${currentSubLoc.name}...` : "O que você faz agora?"}
          isOffChatMode={isOffChatMode}
          hasReply={!!replyTo}
          showActionButton={true}
          unreadCount={unreadSubLocations.length}
          onActionClick={() => setShowActionModal(true)}
        />
      </div>

      {/* Action Modal e outros componentes... (mantidos iguais) */}
      {showActionModal && (
        <div className="fixed inset-0 z-[160] bg-black/95 flex items-end animate-in fade-in duration-400">
          <div className="w-full bg-background-dark rounded-t-[60px] border-t border-white/10 p-10 pb-16 animate-in slide-in-from-bottom duration-500 shadow-[0_-30px_120px_rgba(0,0,0,1)]">
            <div className="w-16 h-1.5 bg-white/5 rounded-full mx-auto mb-6"></div>
            

            <div className="space-y-8">
              <div className="flex items-center justify-between px-4">
                 <div className="flex items-center space-x-3">
                   <div className="w-2 h-6 bg-primary rounded-full"></div>
                   <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Ações de Local</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5 max-h-[40vh] overflow-y-auto scrollbar-hide pb-8">
                {/* Botão Entrada - só aparece quando está em um sub-local */}
                {currentSubLoc && (
                  <button 
                    onClick={() => {
                      setCurrentSubLoc(null);
                      setShowActionModal(false);
                    }}
                    className="relative flex flex-col items-center justify-center p-8 rounded-[40px] border active:scale-95 transition-all shadow-2xl group overflow-hidden bg-primary/20 border-primary ring-2 ring-primary/30"
                  >
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5 border transition-all duration-500 bg-primary text-white border-primary">
                      <span className="material-symbols-rounded text-3xl">home</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-center text-white">
                      Entrada
                    </span>
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary px-2 py-1 rounded-full">
                      <span className="material-symbols-rounded text-[10px] text-white">arrow_back</span>
                      <span className="text-[7px] font-black text-white uppercase tracking-wider">Voltar</span>
                    </div>
                  </button>
                )}
                
                {internalLocs.map((loc, idx) => {
                  const isVIPRoom = loc.name === 'Reserva VIP';
                  const canAccessVIP = isVIPRoom && hasVIPAccess;
                  const hasUnread = unreadSubLocations.includes(loc.name);
                  const isCurrentLocation = currentSubLoc?.name === loc.name;
                  
                  return (
                    <button 
                      key={idx} 
                      onClick={() => {
                        if (isCurrentLocation) {
                          setShowActionModal(false);
                          return;
                        }
                        if (isVIPRoom && !canAccessVIP) {
                          setShowActionModal(false);
                          setShowVIPModal(true);
                        } else {
                          enterSubLocation(loc);
                          setShowActionModal(false);
                        }
                      }}
                      className={`relative flex flex-col items-center justify-center p-8 rounded-[40px] border active:scale-95 transition-all shadow-2xl group overflow-hidden ${
                        isCurrentLocation
                          ? 'bg-emerald-600/20 border-emerald-500 ring-2 ring-emerald-500/30'
                          : isVIPRoom 
                            ? 'bg-amber-600 border-amber-500' 
                            : hasUnread
                              ? 'bg-zinc-900 border-red-500/50 ring-2 ring-red-500/20'
                              : 'bg-zinc-900 border-white/5'
                      }`}
                    >
                      {/* Current location indicator */}
                      {isCurrentLocation && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500 px-2 py-1 rounded-full">
                          <span className="material-symbols-rounded text-[10px] text-white">location_on</span>
                          <span className="text-[7px] font-black text-white uppercase tracking-wider">Aqui</span>
                        </div>
                      )}
                      
                      {/* Unread indicator */}
                      {hasUnread && !isCurrentLocation && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 px-2 py-1 rounded-full animate-pulse">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          <span className="text-[7px] font-black text-white uppercase tracking-wider">Novo</span>
                        </div>
                      )}
                      
                      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-5 border transition-all duration-500 ${
                        isCurrentLocation
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : isVIPRoom
                            ? 'bg-white/20 text-white border-white/30'
                            : hasUnread
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-white/5 text-white border-white/10 group-hover:bg-primary'
                      }`}>
                        <span className="material-symbols-rounded text-3xl">{loc.icon}</span>
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-[0.25em] text-center text-white`}>
                        {loc.name}
                      </span>
                      
                      {isVIPRoom && !isCurrentLocation && (
                        <div className="absolute top-4 right-4">
                          {canAccessVIP ? (
                            <span className="material-symbols-rounded text-white text-xs">verified</span>
                          ) : (
                            <span className="material-symbols-rounded text-white text-xs">lock</span>
                          )}
                        </div>
                      )}
                      
                      {loc.restricted && !isVIPRoom && !hasUnread && !isCurrentLocation && (
                        <div className="absolute top-4 right-4"><span className="material-symbols-rounded text-primary text-xs">lock</span></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setShowActionModal(false)} className="w-full bg-white text-black py-7 rounded-[36px] text-[11px] font-black uppercase tracking-[0.5em] shadow-3xl active:scale-[0.97] transition-all">Voltar</button>
          </div>
        </div>
      )}

      
      {/* Chat Info Panel */}
      <ChatInfoPanel
        isOpen={showChatInfo}
        onClose={() => setShowChatInfo(false)}
        currentUserId={currentUser.id}
        location={locationContext || 'global'}
        subLocation={currentSubLoc?.name}
        chatName={isChatOff ? 'Chat OFF' : currentSubLoc?.name || locationContext || 'Magic Chat'}
        chatIcon={icon}
        onLeaveChat={onLeaveRoom}
        onUserClick={(user) => setStatusModalUser(user)}
      />
      
      {/* User Status Modal */}
      <UserStatusModal
        user={statusModalUser!}
        isOpen={!!statusModalUser}
        onClose={() => setStatusModalUser(null)}
        onViewProfile={(u) => {
          onMemberClick?.(u);
        }}
      />
      
      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed inset-0 z-[9999]" onClick={() => setContextMenu(null)}>
          <div 
            className="absolute bg-[#1a1a1a]/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ 
              top: Math.min(contextMenu.y, window.innerHeight - 200), 
              left: Math.min(Math.max(contextMenu.x - 100, 16), window.innerWidth - 216) 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => handleCopyMessage(contextMenu.msg.text)} 
              className="w-full px-6 py-4 flex items-center space-x-4 text-left hover:bg-white/5 border-b border-white/5 transition-colors"
            >
              <span className="material-symbols-rounded text-white/60">content_copy</span>
              <span className="text-sm font-bold text-white">Copiar texto</span>
            </button>
            <button 
              onClick={() => handleReplyFromContext(contextMenu.msg)} 
              className="w-full px-6 py-4 flex items-center space-x-4 text-left hover:bg-white/5 border-b border-white/5 transition-colors"
            >
              <span className="material-symbols-rounded text-primary">reply</span>
              <span className="text-sm font-bold text-white">Responder</span>
            </button>
            {contextMenu.msg.author?.id === currentUser.id && (
              <button 
                onClick={() => handleDeleteMessage(contextMenu.msg.id)} 
                className="w-full px-6 py-4 flex items-center space-x-4 text-left hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-rounded text-rose-500">delete</span>
                <span className="text-sm font-bold text-rose-500">Apagar mensagem</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
  );

};