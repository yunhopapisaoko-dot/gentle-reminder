import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';
import { sendPushNotification, getUserDisplayName } from '../utils/pushNotifications';

export interface PrivateConversation {
  id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
  updated_at: string;
  other_user?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    race?: 'draeven' | 'sylven' | 'lunari';
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
}

export interface PrivateMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  reply_to_id?: string | null;
  reply_to_name?: string | null;
  reply_to_text?: string | null;
  created_at: string;
}

export function usePrivateConversations(userId: string | null) {
  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Fetch all conversations where user is a participant
      const { data: convs, error } = await supabase
        .from('private_conversations')
        .select('*')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (!convs || convs.length === 0) {
        setConversations([]);
        setTotalUnread(0);
        setLoading(false);
        return;
      }

      // Get other user IDs
      const otherUserIds = convs.map(c => 
        c.participant_1 === userId ? c.participant_2 : c.participant_1
      );

      // Fetch profiles for other users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, race')
        .in('user_id', otherUserIds);

      // Fetch last message and unread count for each conversation
      const conversationsWithDetails = await Promise.all(
        convs.map(async (conv) => {
          const otherUserId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;
          const otherUser = profiles?.find(p => p.user_id === otherUserId);

          // Get last message
          const { data: lastMsg } = await supabase
            .from('private_messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('private_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', userId);

          return {
            ...conv,
            other_user: otherUser ? {
              id: otherUser.user_id,
              full_name: otherUser.full_name,
              username: otherUser.username,
              avatar_url: otherUser.avatar_url,
              race: otherUser.race as 'draeven' | 'sylven' | 'lunari' | undefined
            } : undefined,
            last_message: lastMsg || undefined,
            unread_count: unreadCount || 0
          } as PrivateConversation;
        })
      );

      setConversations(conversationsWithDetails);
      setTotalUnread(conversationsWithDetails.reduce((sum, c) => sum + c.unread_count, 0));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const startConversation = useCallback(async (otherUserId: string) => {
    if (!userId) return null;

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('private_conversations')
      .select('id')
      .or(`and(participant_1.eq.${userId},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${userId})`)
      .maybeSingle();

    if (existing) {
      return existing.id;
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('private_conversations')
      .insert({
        participant_1: userId,
        participant_2: otherUserId
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    await fetchConversations();
    return newConv.id;
  }, [userId, fetchConversations]);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!userId) return;

    await supabase
      .from('private_messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('read', false);

    setConversations(prev => 
      prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c)
    );
    setTotalUnread(prev => {
      const conv = conversations.find(c => c.id === conversationId);
      return Math.max(0, prev - (conv?.unread_count || 0));
    });
  }, [userId, conversations]);

  // Subscribe to new messages
  useEffect(() => {
    if (!userId) return;

    fetchConversations();

    const channel = supabase
      .channel('private-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages'
        },
        async (payload) => {
          const newMsg = payload.new as PrivateMessage;
          
          // Update conversation with new message
          setConversations(prev => {
            const updated = prev.map(c => {
              if (c.id === newMsg.conversation_id) {
                return {
                  ...c,
                  last_message: {
                    content: newMsg.content,
                    created_at: newMsg.created_at,
                    sender_id: newMsg.sender_id
                  },
                  unread_count: newMsg.sender_id !== userId ? c.unread_count + 1 : c.unread_count
                };
              }
              return c;
            });
            
            // Sort by updated_at (most recent first)
            return updated.sort((a, b) => {
              const aTime = a.last_message?.created_at || a.updated_at;
              const bTime = b.last_message?.created_at || b.updated_at;
              return new Date(bTime).getTime() - new Date(aTime).getTime();
            });
          });

          if (newMsg.sender_id !== userId) {
            setTotalUnread(prev => prev + 1);
            
            // Send push notification for private message
            try {
              const senderName = await getUserDisplayName(newMsg.sender_id);
              const truncatedContent = newMsg.content.length > 50 
                ? newMsg.content.substring(0, 50) + '...' 
                : newMsg.content;
              
              await sendPushNotification({
                userId: userId,
                title: `💬 ${senderName}`,
                body: truncatedContent,
                type: 'private_message',
                url: '/',
                conversationId: newMsg.conversation_id
              });
            } catch (error) {
              console.error('Error sending push notification:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversations]);

  return {
    conversations,
    loading,
    totalUnread,
    fetchConversations,
    startConversation,
    markConversationAsRead
  };
}
