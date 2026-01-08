import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../../supabase';

interface NewMessagePayload {
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
}

interface UnreadChats {
  privateChats: Set<string>;
  publicChats: Set<string>;
  houseChats: Set<string>;
}

// List of restricted sub-locations that require authorization
// Mirroring the list from useChatNotifications for consistency
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
function isRestrictedLocation(location: string, subLocation?: string | null): boolean {
  const key = subLocation ? `${location}:${subLocation}` : location;
  return RESTRICTED_SUB_LOCATIONS.includes(key);
}

export function useNewMessageNotification(
  userId: string | null,
  activeConversationId: string | null,
  onNewMessage?: (payload: NewMessagePayload) => void,
  subscribedRooms?: string[],
  activePublicChatId?: string | null,
  activeHouseChatId?: string | null,
  userAuthorizedRooms?: Set<string>
) {
  const activeConvRef = useRef(activeConversationId);
  const activePublicRef = useRef(activePublicChatId);
  const activeHouseRef = useRef(activeHouseChatId);
  const subscribedRoomsRef = useRef(subscribedRooms);
  const authorizedRoomsRef = useRef(userAuthorizedRooms);
  
  const [unreadChats, setUnreadChats] = useState<UnreadChats>({
    privateChats: new Set(),
    publicChats: new Set(),
    houseChats: new Set()
  });
  
  useEffect(() => {
    activeConvRef.current = activeConversationId;
  }, [activeConversationId]);
  
  useEffect(() => {
    activePublicRef.current = activePublicChatId;
    // Clear this chat from unread when entering (including all related locations)
    if (activePublicChatId) {
      setUnreadChats(prev => {
        const newPublic = new Set(prev.publicChats);
        // Remove exact match
        newPublic.delete(activePublicChatId);
        // Also remove if we're entering a parent location (e.g., entering "pousada" clears "pousada")
        // or if we're entering any sub-location (e.g., entering "pousada:Entrada" also clears "pousada")
        const baseLocation = activePublicChatId.includes(':') 
          ? activePublicChatId.split(':')[0] 
          : activePublicChatId;
        newPublic.delete(baseLocation);
        // Remove any sub-locations of this base
        Array.from(newPublic).forEach(loc => {
          if (loc.startsWith(baseLocation + ':')) {
            newPublic.delete(loc);
          }
        });
        return { ...prev, publicChats: newPublic };
      });
    }
  }, [activePublicChatId]);
  
  useEffect(() => {
    activeHouseRef.current = activeHouseChatId;
    // Clear this chat from unread when entering
    if (activeHouseChatId) {
      setUnreadChats(prev => {
        const newHouse = new Set(prev.houseChats);
        newHouse.delete(activeHouseChatId);
        return { ...prev, houseChats: newHouse };
      });
    }
  }, [activeHouseChatId]);
  
  useEffect(() => {
    subscribedRoomsRef.current = subscribedRooms;
  }, [subscribedRooms]);
  
  useEffect(() => {
    authorizedRoomsRef.current = userAuthorizedRooms;
  }, [userAuthorizedRooms]);

  // Clear private chat unread when entering
  useEffect(() => {
    if (activeConversationId) {
      setUnreadChats(prev => {
        const newPrivate = new Set(prev.privateChats);
        newPrivate.delete(activeConversationId);
        return { ...prev, privateChats: newPrivate };
      });
    }
  }, [activeConversationId]);

  const hasUnread = unreadChats.privateChats.size > 0 || 
                    unreadChats.publicChats.size > 0 || 
                    unreadChats.houseChats.size > 0;

  const clearUnread = useCallback((type: 'private' | 'public' | 'house', chatId: string) => {
    setUnreadChats(prev => {
      if (type === 'private') {
        const newPrivate = new Set(prev.privateChats);
        newPrivate.delete(chatId);
        return { ...prev, privateChats: newPrivate };
      } else if (type === 'public') {
        const newPublic = new Set(prev.publicChats);
        newPublic.delete(chatId);
        return { ...prev, publicChats: newPublic };
      } else {
        const newHouse = new Set(prev.houseChats);
        newHouse.delete(chatId);
        return { ...prev, houseChats: newHouse };
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Channel for private messages
    const privateChannel = supabase
      .channel('new-private-message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages'
        },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };
          
          // Ignore own messages
          if (msg.sender_id === userId) return;
          
          // Check if we're in this conversation - if so, don't show notification
          if (activeConvRef.current === msg.conversation_id) return;
          
          // Add to unread
          setUnreadChats(prev => {
            const newPrivate = new Set(prev.privateChats);
            newPrivate.add(msg.conversation_id);
            return { ...prev, privateChats: newPrivate };
          });
          
          // Fetch sender profile for toast
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', msg.sender_id)
            .single();
          
          onNewMessage?.({
            conversationId: msg.conversation_id,
            senderId: msg.sender_id,
            senderName: profile?.full_name || 'Alguém',
            content: msg.content
          });
        }
      )
      .subscribe();

    // Channel for public chat messages
    const publicChannel = supabase
      .channel('new-public-message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const msg = payload.new as {
            id: string;
            location: string;
            sub_location: string | null;
            user_id: string;
            content: string;
            created_at: string;
          };
          
          // Ignore own messages
          if (msg.user_id === userId) return;
          
          // Check if user is subscribed to this room
          const rooms = subscribedRoomsRef.current || [];
          if (!rooms.includes(msg.location)) return;
          
          // Check if this is a restricted location - don't notify unless user has authorization
          const locationKey = msg.sub_location 
            ? `${msg.location}:${msg.sub_location}` 
            : msg.location;
          if (isRestrictedLocation(msg.location, msg.sub_location)) {
            const authorized = authorizedRoomsRef.current || new Set();
            if (!authorized.has(locationKey)) {
              return; // User doesn't have access to this restricted location
            }
          }
          
          // Check if this is a house chat
          if (msg.location.startsWith('house_')) {
            // If we're in this house chat, don't mark as unread
            if (activeHouseRef.current === msg.location) return;
            
            setUnreadChats(prev => {
              const newHouse = new Set(prev.houseChats);
              newHouse.add(msg.location);
              return { ...prev, houseChats: newHouse };
            });
          } else {
            // Regular public chat
            // If we're in this public chat (any sub-location), don't mark as unread
            const currentChat = activePublicRef.current;
            
            // Get base location from current chat and message
            const currentBase = currentChat?.includes(':') ? currentChat.split(':')[0] : currentChat;
            const msgBase = msg.location.includes(':') ? msg.location.split(':')[0] : msg.location;
            
            // Check if we're anywhere in this chat's location tree
            const isInThisChat = currentChat === msg.location || 
                                 currentBase === msgBase ||
                                 (currentChat && currentChat.startsWith(msg.location + ':')) ||
                                 (currentChat && msg.location.startsWith(currentChat + ':'));
            if (isInThisChat) return;
            
            setUnreadChats(prev => {
              const newPublic = new Set(prev.publicChats);
              newPublic.add(msg.location);
              return { ...prev, publicChats: newPublic };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(privateChannel);
      supabase.removeChannel(publicChannel);
    };
  }, [userId, onNewMessage]);

  return { hasUnread, unreadChats, clearUnread };
}
