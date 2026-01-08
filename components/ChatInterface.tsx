"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, User, MenuItem, OrderItem } from '../types';
import { MENUS, SUB_LOCATIONS, SubLocation, DISEASE_DETAILS, DiseaseInfo } from '../constants';
import { MenuView } from './MenuView';
import { HospitalConsultations } from './HospitalConsultations';
import { JobApplicationModal } from './JobApplicationModal';
import { ManagerDashboard } from './ManagerDashboard';
import { WorkerView } from './WorkerView';
import { TreatmentStatusModal } from './TreatmentStatusModal'; // Novo import

import { VIPReservationModal } from './VIPReservationModal';
import { PharmacyView } from './PharmacyView';
import { FridgeModal } from './FridgeModal';
import { RecipesModal } from './RecipesModal';
import { ChatInfoPanel } from '../src/components/ChatInfoPanel';
import { UserStatusModal } from '../src/components/UserStatusModal';
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
  onUpdateStatus?: (changes: { hp?: number; hunger?: number; thirst?: number; alcohol?: number; money?: number }) => void;
  onConsumeItems?: (items: MenuItem[]) => void;
  onClearDisease?: (hpRestore: number) => void;
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
  onUpdateStatus, 
  onConsumeItems, 
  onClearDisease,
  onNavigate,
  onMarkAsRead
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [offMessages, setOffMessages] = useState<ChatMessage[]>([]);
  const [roomMessages, setRoomMessages] = useState<Record<string, ChatMessage[]>>({});
  const [currentSubLoc, setCurrentSubLoc] = useState<SubLocation | null>(null);
  const [workerRole, setWorkerRole] = useState<string | null>(null);
  const [authorizedRooms, setAuthorizedRooms] = useState<string[]>([]);
  const [characterAge, setCharacterAge] = useState<number | null>(null);
  const [isOffChatMode, setIsOffChatMode] = useState(false);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConsultations, setShowConsultations] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showManagerDash, setShowManagerDash] = useState(false);
  const [showWorkerPanel, setShowWorkerPanel] = useState(false);
  const [showGrantAccess, setShowGrantAccess] = useState(false);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showFridge, setShowFridge] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showTreatmentStatus, setShowTreatmentStatus] = useState(false); // Novo estado
  const [hasVIPAccess, setHasVIPAccess] = useState(false);
  const [activeVIPReservation, setActiveVIPReservation] = useState<any>(null);
  
  // Treatment timer state
  const [activeTreatment, setActiveTreatment] = useState<any>(null);
  const [treatmentTimeRemaining, setTreatmentTimeRemaining] = useState<number>(0);
  const [treatmentApprover, setTreatmentApprover] = useState<{ name: string; avatar_url: string | null } | null>(null);

  const [onlineMembers, setOnlineMembers] = useState<User[]>([]);
  const [presentMembers, setPresentMembers] = useState<User[]>([]); // Members currently in this chat room
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionTab, setSuggestionTab] = useState<'locais' | 'acoes'>('locais');
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedTargetUser, setSelectedTargetUser] = useState<User | null>(null);
  const [itemActionMode, setItemActionMode] = useState<'use' | 'send' | 'share' | null>(null);
  
  // Reply functionality
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
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
  const hasMenu = MENUS[contextKey] !== undefined;
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
    if (workerRole) return true;
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
      supabaseService.tryTriggerMonkeyDoctor(loc.name).then(triggered => {
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
            race: msg.profiles?.race || 'draeven',
            currentDisease: msg.profiles?.current_disease || undefined
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
      supabaseService.checkWorkerStatus(currentUser.id, locationContext).then(setWorkerRole);
      supabaseService.checkRoomAccess(currentUser.id, locationContext).then(setAuthorizedRooms);
      supabaseService.getAllProfiles().then(setOnlineMembers);
      supabaseService.getUserCharacterAge(currentUser.id).then(setCharacterAge);
      
      if (locationContext === 'restaurante' || locationContext === 'padaria') {
        supabaseService.checkVIPAccess(currentUser.id, locationContext).then(setHasVIPAccess);
        supabaseService.getActiveVIPReservation(locationContext).then(setActiveVIPReservation);
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
              race: profile?.race || 'draeven',
              currentDisease: profile?.current_disease || undefined
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
                isLeader: p.is_leader,
                currentDisease: p.current_disease || undefined
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

  // Load active treatment when in hospital
  useEffect(() => {
    if (!isHospital || !currentUser?.id) return;
    
    const loadActiveTreatment = async () => {
      const treatment = await supabaseService.getUserActiveTreatment(currentUser.id);
      setActiveTreatment(treatment);
    };
    
    loadActiveTreatment();
    
    // Subscribe to treatment updates
    const channel = supabase
      .channel('treatment-timer')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'treatment_requests',
          filter: `patient_id=eq.${currentUser.id}`
        },
        () => loadActiveTreatment()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isHospital, currentUser?.id]);

  // Start treatment timer when patient enters required room
  useEffect(() => {
    if (!isHospital || !currentUser?.id || !activeTreatment) return;
    
    // If treatment has required_room but no started_at, check if user is in the room
    if (activeTreatment.required_room && !activeTreatment.started_at) {
      const userCurrentRoom = currentSubLoc?.name;
      
      if (userCurrentRoom === activeTreatment.required_room) {
        // User entered the required room, start the timer
        console.log('[Treatment] Starting timer - user entered required room:', activeTreatment.required_room);
        supabaseService.startTreatmentTimer(activeTreatment.id)
          .then(() => {
            // Reload the treatment to get updated started_at
            supabaseService.getUserActiveTreatment(currentUser.id).then(setActiveTreatment);
          })
          .catch(console.error);
      }
    }
  }, [isHospital, currentUser?.id, activeTreatment, currentSubLoc?.name]);

  // Load approver profile (avatar + name)
  useEffect(() => {
    const approvedBy = activeTreatment?.approved_by as string | undefined;
    if (!isHospital || !approvedBy) {
      setTreatmentApprover(null);
      return;
    }

    const fetchApprover = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('user_id', approvedBy)
        .maybeSingle();
      
      if (!data) {
        setTreatmentApprover(null);
        return;
      }
      setTreatmentApprover({
        name: (data.full_name || data.username || 'Aprovado') as string,
        avatar_url: (data.avatar_url || null) as string | null,
      });
    };
    
    fetchApprover().catch(() => setTreatmentApprover(null));
  }, [isHospital, activeTreatment?.approved_by]);

  // Treatment timer countdown - uses started_at (when patient entered room)
  useEffect(() => {
    // If treatment has required_room but no started_at, timer hasn't started yet
    if (!activeTreatment?.started_at) {
      setTreatmentTimeRemaining(0);
      return;
    }

    const calculateRemaining = () => {
      const startedAt = new Date(activeTreatment.started_at).getTime();
      const cureTimeMs = activeTreatment.cure_time_minutes * 60 * 1000;
      const endTime = startedAt + cureTimeMs;
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      
      if (remaining === 0 && currentUser?.id) {
        supabaseService.completeTreatment(activeTreatment.id, currentUser.id)
          .then(() => setActiveTreatment(null))
          .catch(console.error);
      }
      
      return remaining;
    };

    setTreatmentTimeRemaining(calculateRemaining());
    
    const interval = setInterval(() => {
      setTreatmentTimeRemaining(calculateRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTreatment, currentUser?.id]);
  const formatTreatmentTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'instant'
      });
    }
  }, [messages, roomMessages, offMessages, currentSubLoc, isLoading, isOffChatMode]);

  // Clear approver info when treatment ends
  useEffect(() => {
    if (!activeTreatment) {
      setTreatmentApprover(null);
    }
  }, [activeTreatment]);

  useEffect(() => {
    if (input === '/' || input === '*') {
      setShowSuggestions(true);
      setSuggestionTab('acoes'); // Default to "Ações" tab to show present users
      setSelectedItem(null);
      setItemActionMode(null);
      supabaseService.getInventory(currentUser.id).then(setInventoryItems);
    } else if (!input.startsWith('/') && !input.startsWith('*')) {
      setShowSuggestions(false);
    }
  }, [input, currentUser.id]);

  const handleUseItem = async (item: any) => {
    try {
      await supabaseService.consumeFromInventory(item.id, item.quantity);
      const attrs = item.attributes || {};
      if (onUpdateStatus) {
        onUpdateStatus({
          hunger: attrs.hunger || 0,
          thirst: attrs.thirst || 0,
          alcohol: attrs.alcohol || 0
        });
      }
      handleSend(`*Usou ${item.item_name}*`);
      setShowSuggestions(false);
      setSelectedItem(null);
      setInput('');
    } catch (error: any) {
      alert("Erro ao usar item: " + error.message);
    }
  };

  const handleSendItem = async (item: any, targetUser: User) => {
    try {
      await supabaseService.consumeFromInventory(item.id, 1);
      await supabaseService.addToInventory(targetUser.id, {
        id: item.item_id,
        name: item.item_name,
        description: item.attributes?.description || '',
        price: 0,
        image: item.item_image,
        category: item.category || 'Item',
        hungerRestore: item.attributes?.hunger,
        thirstRestore: item.attributes?.thirst,
        alcoholLevel: item.attributes?.alcohol
      });
      handleSend(`*Enviou ${item.item_name} para ${targetUser.name}*`);
      setShowSuggestions(false);
      setSelectedItem(null);
      setSelectedTargetUser(null);
      setItemActionMode(null);
      setInput('');
    } catch (error: any) {
      alert("Erro ao enviar item: " + error.message);
    }
  };

  const handleShareItem = async (item: any, targetUser: User) => {
    try {
      await supabaseService.consumeFromInventory(item.id, item.quantity);
      const attrs = item.attributes || {};
      
      const hungerBonus = attrs.hunger || 0;
      const thirstBonus = attrs.thirst || 0;
      const alcoholBonus = attrs.alcohol || 0;
      
      if (onUpdateStatus) {
        onUpdateStatus({
          hunger: hungerBonus,
          thirst: thirstBonus,
          alcohol: alcoholBonus
        });
      }
      
      // Atualiza o outro usuário via Edge Function (bypassa RLS de forma segura)
      if (hungerBonus || thirstBonus || alcoholBonus) {
        const { error: fnError } = await supabase.functions.invoke('apply-vital-deltas', {
          body: {
            userId: targetUser.id,
            hungerDelta: hungerBonus,
            thirstDelta: thirstBonus,
            alcoholDelta: alcoholBonus,
          }
        });

        if (fnError) throw fnError;
      }
      
      handleSend(`*Dividiu ${item.item_name} com ${targetUser.name} — ambos receberam os benefícios!*`);
      setShowSuggestions(false);
      setSelectedItem(null);
      setSelectedTargetUser(null);
      setItemActionMode(null);
      setInput('');
    } catch (error: any) {
      alert("Erro ao dividir item: " + error.message);
    }
  };

  const handleOrderConfirmed = async (items: MenuItem[], orderItems: OrderItem[], preparationTime: number) => {
    const total = items.reduce((acc, item) => acc + item.price, 0);
    const totalInt = Math.round(total); // food_orders.total_price é integer

    if ((currentUser.money || 0) < total) {
      alert("Saldo insuficiente para este pedido!");
      return;
    }

    try {
      await supabaseService.createFoodOrder(
        currentUser.id,
        currentUser.name,
        locationContext || 'restaurante',
        orderItems,
        totalInt,
        preparationTime
      );
      
      handleSend(`*Fez um pedido no valor de ${total.toFixed(2)} MKC. Aguardando preparo (~${preparationTime}min)...*`);
      setShowMenu(false);
    } catch (error: any) {
      alert("Erro ao criar pedido: " + error.message);
    }
  };

  const handleTreat = async (disease: DiseaseInfo) => {
    if ((currentUser.money || 0) < disease.treatmentCost) {
      alert("Saldo insuficiente para o tratamento!");
      return;
    }

    try {
      const newBalance = (currentUser.money || 0) - disease.treatmentCost;
      await supabaseService.updateMoney(currentUser.id, newBalance);
      
      if (onUpdateStatus) onUpdateStatus({ money: -disease.treatmentCost });
      if (onClearDisease) onClearDisease(Math.abs(disease.hpImpact));
      
      handleSend(`*Pagou ${disease.treatmentCost} MKC pelo antídoto e está se sentindo muito melhor!*`);
      setShowConsultations(false);
    } catch (error: any) {
      alert("Erro ao processar pagamento: " + error.message);
    }
  };


  const activeMessages = isOffChatMode 
    ? offMessages 
    : currentSubLoc 
      ? (roomMessages[currentSubLoc.name] || []) 
      : messages;

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

  const handleSend = async (customMsg?: string) => {
    const textToSend = (customMsg || input).trim();
    if (!textToSend || isLoading) return;

    if (!isOffChatMode && (textToSend.startsWith('/') || textToSend.startsWith('*'))) {
      const target = textToSend.slice(1).toLowerCase();
      const loc = LOCATIONS_LIST.find(l => l.id === target || l.name.toLowerCase() === target);
      if (loc && onNavigate) {
        onNavigate(loc.id);
        setInput('');
        setShowSuggestions(false);
        setReplyTo(null);
        return;
      }
    }

    // Format message with reply info
    let finalText = textToSend;
    if (replyTo) {
      // Limpa metadados de outras respostas no texto original para evitar replicação de headers
      const cleanReplyText = replyTo.text.replace(/^\[reply:@[^|]+\|[^\]]+\]\n/, '');
      const replyPreview = cleanReplyText.length > 50 ? cleanReplyText.slice(0, 50) + '...' : cleanReplyText;
      finalText = `[reply:@${replyTo.author?.name}|${replyPreview}]\n${textToSend}`;
    }

    // Don't add message optimistically - let realtime handle it to avoid duplicates
    // The message will appear when realtime subscription receives the INSERT event
    
    if (!customMsg) setInput('');
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
      setInput('');
    } catch (error: any) {
      alert("Erro ao liberar sala: " + error.message);
    }
  };

  const handleSuggestionClick = (locId: string) => {
    if (onNavigate) {
      onNavigate(locId);
      setInput('');
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
          {!isChatOff && isPousadaKitchen && (
            <>
              <button onClick={() => setShowFridge(true)} className="w-11 h-11 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-lg border border-white/20 active:scale-90 transition-all">
                <span className="material-symbols-rounded">kitchen</span>
              </button>
              <button onClick={() => setShowRecipes(true)} className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg border border-white/20 active:scale-90 transition-all">
                <span className="material-symbols-rounded">menu_book</span>
              </button>
            </>
          )}

          {!isChatOff && locationContext && !currentSubLoc && (
            <>
              {workerRole ? (
                <button onClick={() => setShowWorkerPanel(true)} className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg border border-white/20 active:scale-90 transition-all">
                  <span className="material-symbols-rounded">assignment</span>
                </button>
              ) : (
                <button onClick={() => setShowJobModal(true)} className="w-11 h-11 rounded-2xl bg-white/5 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all">
                  <span className="material-symbols-rounded">work</span>
                </button>
              )}
            </>
          )}

          {!isChatOff && isHospital && !currentSubLoc && (
            <button 
              onClick={() => {
                if (activeTreatment) {
                  setShowTreatmentStatus(true); // Abre o novo modal moderno
                } else {
                  setShowConsultations(true);
                }
              }} 
              className={`w-11 h-11 rounded-full ${activeTreatment && !activeTreatment.started_at ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'} text-white flex items-center justify-center shadow-lg border border-white/20 active:scale-90`}
            >
              <span className="material-symbols-rounded">{activeTreatment && !activeTreatment.started_at ? 'door_open' : 'stethoscope'}</span>
            </button>
          )}
          {!isChatOff && isPharmacy && !currentSubLoc && (
            <button onClick={() => setShowPharmacy(true)} className="px-5 py-3 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20 active:scale-95 transition-all">Balcão</button>
          )}
          {!isChatOff && hasMenu && !currentSubLoc && !isHospital && !isPharmacy && (
            <button onClick={() => setShowMenu(true)} className="px-5 py-3 rounded-2xl bg-secondary text-white text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20 active:scale-95 transition-all">Menu</button>
          )}
          <button onClick={handleClose} className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-2xl flex items-center justify-center border border-white/10 text-white shadow-lg active:scale-90" title="Voltar"><span className="material-symbols-rounded">close</span></button>
        </div>
      </div>

      {/* Outros modais... */}
      {showTreatmentStatus && activeTreatment && (
        <TreatmentStatusModal
          diseaseName={activeTreatment.disease_name}
          timeRemaining={formatTreatmentTime(treatmentTimeRemaining)}
          progress={activeTreatment.started_at ? (1 - treatmentTimeRemaining / (activeTreatment.cure_time_minutes * 60 * 1000)) * 100 : 0}
          approverName={treatmentApprover?.name}
          approverAvatar={treatmentApprover?.avatar_url}
          requiredRoom={activeTreatment.required_room}
          isWaitingForRoom={!activeTreatment.started_at && !!activeTreatment.required_room}
          onClose={() => setShowTreatmentStatus(false)}
        />
      )}

      {isOffChatMode && (
        <div className={`relative z-10 px-6 py-2 border-b flex items-center justify-center gap-2 ${isChatOff ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-amber-500/20 border-amber-500/30'}`}>
          <span className={`material-symbols-rounded text-sm ${isChatOff ? 'text-cyan-400' : 'text-amber-500'}`}>info</span>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isChatOff ? 'text-cyan-400' : 'text-amber-500'}`}>{isChatOff ? 'Chat livre - Sem personagem, sem roleplay!' : 'Chat fora do roleplay - Converse livremente!'}</span>
        </div>
      )}

      {/* Treatment Timer - shown in hospital chats when treatment is active */}
      {isHospital && activeTreatment && treatmentTimeRemaining > 0 && (
        <div className="relative z-10 px-6 py-4 border-b bg-gradient-to-r from-emerald-900/60 to-cyan-900/60 border-emerald-500/30 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={treatmentApprover?.avatar_url || '/jyp-avatar.jpg'}
                alt={treatmentApprover ? `Avatar de ${treatmentApprover.name}` : 'Avatar do aprovador'}
                className="w-12 h-12 rounded-2xl object-cover border border-emerald-500/30"
              />
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Tratamento aprovado</p>
                <p className="text-white/60 text-[11px] font-bold">
                  {activeTreatment.disease_name}
                  {treatmentApprover?.name ? ` • ${treatmentApprover.name}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Tempo Restante</p>
                <p className="text-2xl font-black text-emerald-400 italic tracking-tight">{formatTreatmentTime(treatmentTimeRemaining)}</p>
              </div>
              <div className="w-12 h-12 relative">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3"/>
                  <circle 
                    cx="18" cy="18" r="15" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    strokeDasharray={`${(1 - treatmentTimeRemaining / (activeTreatment.cure_time_minutes * 60 * 1000)) * 94.2} 94.2`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-rounded text-emerald-400 text-lg">schedule</span>
                </div>
              </div>
            </div>
          </div>
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
          const shouldShowRoomButton = roomButtonName && isMonkeyDoctor && activeTreatment && treatmentTimeRemaining > 0 && 
            (!roomButtonPatientId || roomButtonPatientId === currentUser?.id);
          
          const bubbleClasses = `max-w-full px-5 py-3.5 rounded-[24px] text-[13.5px] font-bold leading-relaxed shadow-[0_10px_20px_rgba(0,0,0,0.3)] border border-white bg-white text-black break-words [overflow-wrap:anywhere] [word-break:break-word]`;
          
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
                  onTouchStart={() => handleLongPressStart(msg)}
                  onTouchEnd={handleLongPressEnd}
                  onTouchCancel={handleLongPressEnd}
                  onMouseDown={() => handleLongPressStart(msg)}
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
                        <p key={i} className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{line || '\u00A0'}</p>
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
                onTouchStart={() => handleLongPressStart(msg)}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressEnd}
                onMouseDown={() => handleLongPressStart(msg)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
              >
                <button onClick={() => msg.author && !isJYP && !isMonkeyDoctor && setStatusModalUser(msg.author)} className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-[16px] border-2 border-white/20 overflow-hidden shadow-xl flex items-center justify-center ${isJYP ? 'bg-pink-500' : isMonkeyDoctor ? 'bg-emerald-500' : 'bg-surface-purple'}`}>
                    {isJYP ? <img src="/jyp-avatar.jpg" className="w-full h-full object-cover" alt="JYP" /> : isMonkeyDoctor ? <span className="text-2xl">🐵</span> : <img src={msg.author?.avatar} className="w-full h-full object-cover" alt="avatar" />}
                  </div>
                  {msg.author?.currentDisease && !isJYP && !isMonkeyDoctor && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-background-dark flex items-center justify-center animate-pulse">
                      <span className="material-symbols-rounded text-[10px] text-white">coronavirus</span>
                    </div>
                  )}
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
                 onClick={() => { setSuggestionTab('locais'); setSelectedItem(null); setItemActionMode(null); }}
                 className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${suggestionTab === 'locais' ? 'bg-primary text-white' : 'bg-white/5 text-white/40'}`}
               >
                 <span className="material-symbols-rounded text-sm mr-2">location_on</span>
                 Locais
               </button>
               <button 
                 onClick={() => { setSuggestionTab('acoes'); setSelectedItem(null); setItemActionMode(null); }}
                 className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${suggestionTab === 'acoes' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/40'}`}
               >
                 <span className="material-symbols-rounded text-sm mr-2">restaurant</span>
                 Ações
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
                                {member.currentDisease && (
                                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full border-2 border-background-dark flex items-center justify-center animate-pulse">
                                    <span className="material-symbols-rounded text-[10px] text-white">coronavirus</span>
                                  </div>
                                )}
                              </div>
                              <span className="text-[8px] font-black text-white/60 uppercase truncate w-14 text-center">{member.name.split(' ')[0]}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 px-2">
                      <div className="flex-1 h-px bg-white/10"></div>
                      <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Inventário</span>
                      <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    {!selectedItem ? (
                      inventoryItems.length === 0 ? (
                        <div className="py-6 text-center opacity-40">
                          <span className="material-symbols-rounded text-3xl mb-2 block">inventory_2</span>
                          <p className="text-[9px] font-black uppercase tracking-widest">Inventário vazio</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide">
                          {inventoryItems.map(item => (
                            <button
                              key={item.id}
                              onClick={() => setSelectedItem(item)}
                              className="w-full flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-emerald-500 hover:border-emerald-500 transition-all active:scale-98 group"
                            >
                              <img src={item.item_image} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt={item.item_name} />
                              <div className="flex-1 text-left">
                                <p className="text-[11px] font-black text-white">{item.item_name}</p>
                                <p className="text-[8px] text-white/30 uppercase tracking-widest">{item.category} • x{item.quantity}</p>
                              </div>
                              <div className="flex items-center space-x-2 text-[8px] text-white/40">
                                {item.attributes?.hunger && <span className="flex items-center"><span className="material-symbols-rounded text-xs text-amber-400 mr-1">restaurant</span>{item.attributes.hunger}</span>}
                                {item.attributes?.thirst && <span className="flex items-center"><span className="material-symbols-rounded text-xs text-cyan-400 mr-1">water_drop</span>{item.attributes.thirst}</span>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )
                   ) : !itemActionMode ? (
                     <div className="space-y-4 animate-in zoom-in">
                       <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                         <img src={selectedItem.item_image} className="w-16 h-16 rounded-xl object-cover" alt={selectedItem.item_name} />
                         <div>
                           <p className="text-sm font-black text-white">{selectedItem.item_name}</p>
                           <p className="text-[9px] text-white/40">{selectedItem.category}</p>
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-3">
                         <button
                           onClick={() => handleUseItem(selectedItem)}
                           className="flex flex-col items-center p-4 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all active:scale-95"
                         >
                           <span className="material-symbols-rounded text-2xl mb-2">restaurant</span>
                           <span className="text-[8px] font-black uppercase tracking-widest">Usar</span>
                         </button>
                         <button
                           onClick={() => setItemActionMode('send')}
                           className="flex flex-col items-center p-4 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 transition-all active:scale-95"
                         >
                           <span className="material-symbols-rounded text-2xl mb-2">send</span>
                           <span className="text-[8px] font-black uppercase tracking-widest">Enviar</span>
                         </button>
                         <button
                           onClick={() => setItemActionMode('share')}
                           className="flex flex-col items-center p-4 rounded-2xl bg-pink-500 text-white hover:bg-pink-600 transition-all active:scale-95"
                         >
                           <span className="material-symbols-rounded text-2xl mb-2">group</span>
                           <span className="text-[8px] font-black uppercase tracking-widest">Dividir</span>
                         </button>
                       </div>
                       
                       <button onClick={() => setSelectedItem(null)} className="w-full py-3 rounded-xl bg-white/5 text-white/20 text-[8px] font-black uppercase tracking-widest">Voltar</button>
                     </div>
                   ) : (
                      <div className="space-y-4 animate-in zoom-in">
                        <div className="px-2">
                          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                            {itemActionMode === 'send' ? 'Enviar para quem?' : 'Dividir com quem?'}
                          </p>
                        </div>
                        
                        {presentMembers.filter(m => m.id !== currentUser.id).length === 0 ? (
                          <div className="py-8 text-center opacity-40">
                            <span className="material-symbols-rounded text-4xl mb-2 block">person_off</span>
                            <p className="text-[10px] font-black uppercase tracking-widest">Nenhum usuário no chat</p>
                            <p className="text-[8px] text-white/30 mt-1">Apenas usuários presentes aparecem aqui</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-3">
                            {presentMembers.filter(m => m.id !== currentUser.id).map(member => (
                              <button
                                key={member.id}
                                onClick={() => {
                                  if (itemActionMode === 'send') {
                                    handleSendItem(selectedItem, member);
                                  } else {
                                    handleShareItem(selectedItem, member);
                                  }
                                }}
                                className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-95"
                              >
                                <img src={member.avatar} className="w-12 h-12 rounded-2xl border border-white/10 mb-2" alt={member.name} />
                                <span className="text-[8px] font-black text-white/60 uppercase truncate w-full text-center">{member.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <button onClick={() => setItemActionMode(null)} className="w-full py-3 rounded-xl bg-white/5 text-white/20 text-[8px] font-black uppercase tracking-widest">Voltar</button>
                      </div>
                   )}
                 </div>
               )}
             </div>
             
             {workerRole && suggestionTab === 'locais' && !showGrantAccess && (
               <button 
                 onClick={() => setShowGrantAccess(true)}
                 className="mt-4 flex items-center justify-center space-x-2 bg-primary text-white px-4 py-3 rounded-xl w-full"
               >
                 <span className="material-symbols-rounded text-sm">key</span>
                 <span className="text-[8px] font-black uppercase tracking-widest">Liberar Sala</span>
               </button>
             )}
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

        <div className={`flex items-center space-x-3 rounded-[40px] p-2.5 pl-5 border shadow-2xl ${isOffChatMode ? 'bg-amber-900/50 border-amber-500/30' : 'bg-zinc-900 border-white/10'}`}>
          {!isOffChatMode && (
            <button onClick={() => setShowActionModal(true)} className="relative w-13 h-13 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/15">
              <span className="material-symbols-rounded text-3xl">add</span>
              {unreadSubLocations.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-zinc-900 animate-pulse">
                  <span className="text-[8px] font-black text-white">{unreadSubLocations.length}</span>
                </div>
              )}
            </button>
          )}
          <textarea 
            value={input} 
            onChange={(e) => {
              setInput(e.target.value);
              
              // Send typing indicator
              if (presenceChannelRef.current && e.target.value.trim()) {
                presenceChannelRef.current.track({ isTyping: true, name: currentUser.name });
                
                // Clear previous timeout
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                
                // Set timeout to stop typing indicator after 2 seconds of inactivity
                typingTimeoutRef.current = setTimeout(() => {
                  if (presenceChannelRef.current) {
                    presenceChannelRef.current.track({ isTyping: false, name: currentUser.name });
                  }
                }, 2000);
              } else if (presenceChannelRef.current && !e.target.value.trim()) {
                presenceChannelRef.current.track({ isTyping: false, name: currentUser.name });
              }
            }} 
            onKeyDown={(e) => {
              // On mobile (touch devices), Enter creates new line. On desktop, Enter sends (Shift+Enter for new line)
              const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
              if (e.key === 'Enter' && !isMobile && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={replyTo ? `Sua resposta...` : isOffChatMode ? "Mensagem livre..." : currentSubLoc ? `Roleplay em ${currentSubLoc.name}...` : "O que você faz agora?"} 
            className="flex-1 bg-transparent border-none text-[15px] focus:ring-0 placeholder:text-white/20 text-white font-bold py-4 px-2 resize-none min-h-[52px] max-h-[120px] overflow-y-auto"
            rows={1}
          />
          <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className={`w-13 h-13 rounded-full flex items-center justify-center transition-all ${isLoading || !input.trim() ? 'bg-white/5 text-white/10' : isOffChatMode ? 'bg-amber-500 text-white active:scale-90' : 'bg-primary text-white active:scale-90'}`}><span className="material-symbols-rounded text-3xl">send</span></button>
        </div>
      </div>

      {/* Action Modal e outros componentes... (mantidos iguais) */}
      {showActionModal && (
        <div className="fixed inset-0 z-[160] bg-black/95 flex items-end animate-in fade-in duration-400">
          <div className="w-full bg-background-dark rounded-t-[60px] border-t border-white/10 p-10 pb-16 animate-in slide-in-from-bottom duration-500 shadow-[0_-30px_120px_rgba(0,0,0,1)]">
            <div className="w-16 h-1.5 bg-white/5 rounded-full mx-auto mb-6"></div>
            
            <div className="mb-8 bg-zinc-900 border border-white/10 rounded-[32px] p-6 flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white border border-white/10">
                    <span className="material-symbols-rounded text-2xl">payments</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Minha Carteira</p>
                    <p className="text-xl font-black text-white tracking-tighter">{(currentUser?.money || 0).toFixed(2)} MKC</p>
                  </div>
               </div>
               <div className="bg-primary px-4 py-2 rounded-xl">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Premium</span>
               </div>
            </div>

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
                  const canAccessVIP = isVIPRoom && (hasVIPAccess || workerRole);
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

      {showJobModal && locationContext && <JobApplicationModal location={locationContext} userId={currentUser.id} onClose={() => setShowJobModal(false)} onSuccess={() => setShowJobModal(false)} onManagerAccess={() => { setShowJobModal(false); setShowManagerDash(true); }} />}
      {showManagerDash && locationContext && <ManagerDashboard location={locationContext} onClose={() => setShowManagerDash(false)} />}
      {showWorkerPanel && locationContext && workerRole && <WorkerView location={locationContext} role={workerRole} onClose={() => setShowWorkerPanel(false)} onManageTeam={() => { setShowWorkerPanel(false); setShowManagerDash(true); }} currentUserId={currentUser?.id} />}
      {showMenu && hasMenu && !currentSubLoc && <MenuView locationName={locationContext || ''} items={MENUS[contextKey]} onClose={() => setShowMenu(false)} onOrderConfirmed={handleOrderConfirmed} />}
      {showConsultations && isHospital && <HospitalConsultations onClose={() => setShowConsultations(false)} onTreat={handleTreat} currentUserId={currentUser?.id} currentUserName={currentUser?.name} />}
      {showVIPModal && locationContext && <VIPReservationModal location={locationContext} currentUser={currentUser} onClose={() => setShowVIPModal(false)} onSuccess={() => { setShowVIPModal(false); supabaseService.checkVIPAccess(currentUser.id, locationContext).then(setHasVIPAccess); }} onMoneyChange={(amount) => onUpdateStatus?.({ money: amount })} />}
      
      {showPharmacy && <PharmacyView onClose={() => setShowPharmacy(false)} currentUser={currentUser} onUpdateMoney={(amount) => onUpdateStatus?.({ money: amount })} />}
      {showFridge && <FridgeModal userId={currentUser.id} userName={currentUser.name} onClose={() => setShowFridge(false)} />}
      {showRecipes && <RecipesModal userId={currentUser.id} userName={currentUser.name} onClose={() => setShowRecipes(false)} />}
      
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
    </div>
  </div>
  );

};