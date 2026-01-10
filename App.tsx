"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { PinnedBar } from './components/PinnedBar';
import { Stories } from './components/Stories';
import { FeaturedCard, GridCard } from './components/PostCards';
import { ChatInterface } from './components/ChatInterface';
import { LocaisGrid } from './components/LocaisGrid';
import { ProfileView } from './components/ProfileView';
import { SidebarMenu } from './components/SidebarMenu';
import { CreateContentModal } from './components/CreateContentModal';
import { CharactersGrid } from './components/CharactersGrid';
import { CreateCharacterModal } from './components/CreateCharacterModal';
import { AuthView } from './components/AuthView';
import { DbSetupModal } from './components/DbSetupModal';
import { FloatingActionDock } from './components/FloatingActionDock';
import { AllChatsView } from './components/AllChatsView';
import { PrivateChatView } from './components/PrivateChatView';
import { HouseChatView } from './components/HouseChatView';
import { AdminConversationsView } from './components/AdminConversationsView';
import { FeedView } from './src/components/FeedView';
import { FeaturedView } from './src/components/FeaturedView';
import { GlobalUsersGrid } from './src/components/GlobalUsersGrid';
import { ConnectivityMonitor } from './components/ConnectivityMonitor';
import { PostDetailView } from './components/PostDetailView';
import { TabType, User, Post, MenuItem } from './types';
import { supabase } from './supabase';
import { supabaseService } from './services/supabaseService';
import { usePrivateConversations, PrivateConversation } from './src/hooks/usePrivateConversations';
import { useChatNotifications } from './src/hooks/useChatNotifications';
import { useRoomAuthorizations } from './src/hooks/useRoomAuthorizations';


import { useNavigationHistory, NavigationState } from './src/hooks/useNavigationHistory';
import { useNewMessageNotification } from './src/hooks/useNewMessageNotification';
import { useGlobalPresence } from './src/hooks/useGlobalPresence';
import { useToast } from './src/hooks/use-toast';
import { Toaster } from './src/components/ui/toaster';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [communityMembers, setCommunityMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDbSetup, setShowDbSetup] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>(TabType.Destaque);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const prevTabIndex = useRef(0);

  // Sempre iniciar sem chat aberto - o usuário vê a tela de destaque primeiro
  const [selectedLocalChat, setSelectedLocalChat] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [isAllChatsOpen, setIsAllChatsOpen] = useState(false);
  const [isCreateCharacterOpen, setIsCreateCharacterOpen] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  
  const [visitedRooms, setVisitedRooms] = useState<string[]>([]);
  const [confirmedRooms, setConfirmedRooms] = useState<string[]>([]);
  
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 70;
  const pendingLeaveByChatIdRef = useRef<Map<string, Promise<void>>>(new Map());

  const [activePrivateChat, setActivePrivateChat] = useState<PrivateConversation | null>(null);
  const [activeHouseChat, setActiveHouseChat] = useState<{ houseId: string; ownerName: string; ownerId: string } | null>(null);
  const { startConversation, markConversationAsRead, totalUnread } = usePrivateConversations(currentUser?.id || null);
  const { authorizedRooms } = useRoomAuthorizations(currentUser?.id || null);
  const { markChatAsRead, getLocationUnread, totalUnread: totalChatUnread, clearChatNotifications } = useChatNotifications(currentUser?.id || null, visitedRooms, selectedLocalChat, authorizedRooms);
  const { toast } = useToast();
  
  const { hasUnread: hasNewMessages } = useNewMessageNotification(
    currentUser?.id || null,
    activePrivateChat?.id || null,
    useCallback((payload) => {
      toast({
        title: payload.senderName,
        description: payload.content.length > 50 ? payload.content.slice(0, 50) + '...' : payload.content,
      });
    }, [toast]),
    visitedRooms,
    selectedLocalChat,
    activeHouseChat ? `house_${activeHouseChat.houseId}` : null,
    authorizedRooms
  );
  
  
  
  // Registra presença global do usuário (independente da tela atual)
  useGlobalPresence(currentUser?.id || null);

  // Garante persistência: sempre que um chat público estiver aberto, registra o usuário como membro
  // (resolve casos onde o chat é aberto por notificações/atalhos e não passa pelo fluxo padrão de "entrar").
  useEffect(() => {
    const userId = currentUser?.id;
    const chatId = selectedLocalChat;
    if (!userId || !chatId) return;

    let cancelled = false;

    const ensureMembership = async () => {
      const pendingLeave = pendingLeaveByChatIdRef.current.get(chatId);
      if (pendingLeave) await pendingLeave;
      if (cancelled) return;

      try {
        await supabaseService.updateCurrentLocation(userId, chatId, null);
      } catch (e) {
        console.warn('[ensureMembership] Falha ao atualizar current_location:', e);
      }

      try {
        await supabase
          .from('user_visited_chats')
          .upsert({ user_id: userId, chat_id: chatId }, { onConflict: 'user_id,chat_id' });
      } catch (e) {
        console.warn('[ensureMembership] Falha ao salvar user_visited_chats:', e);
      }

      if (cancelled) return;

      setVisitedRooms(prev => {
        if (prev.includes(chatId)) return prev;
        const newRooms = [chatId, ...prev];
        localStorage.setItem('magic_visited_rooms', JSON.stringify(newRooms));
        return newRooms;
      });
    };

    void ensureMembership();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, selectedLocalChat]);

  const handleBackNavigation = useCallback((poppedState: NavigationState | null): boolean => {
    if (!poppedState) return false;
    
    // Handle back based on what state was popped
    switch (poppedState.type) {
      case 'postDetail':
        setSelectedPost(null);
        return true;
      case 'privateChat':
        setActivePrivateChat(null);
        // Reopen AllChatsView if it was opened from there and push its state back
        if (poppedState.fromAllChats) {
          setIsAllChatsOpen(true);
          // Re-push allchats state so next back will close it properly
          setTimeout(() => window.history.pushState({ type: 'allchats' }, ''), 0);
        }
        return true;
      case 'chat':
        handleCloseChat();
        // Reopen AllChatsView if it was opened from there and push its state back
        if (poppedState.fromAllChats) {
          setIsAllChatsOpen(true);
          setTimeout(() => window.history.pushState({ type: 'allchats' }, ''), 0);
        }
        return true;
      case 'houseChat':
        setActiveHouseChat(null);
        // Reopen AllChatsView if it was opened from there and push its state back
        if (poppedState.fromAllChats) {
          setIsAllChatsOpen(true);
          setTimeout(() => window.history.pushState({ type: 'allchats' }, ''), 0);
        }
        return true;
      case 'profile':
        setSelectedUser(null);
        return true;
      case 'createCharacter':
        setIsCreateCharacterOpen(false);
        return true;
      case 'createModal':
        setIsCreateModalOpen(false);
        return true;
      case 'allchats':
        setIsAllChatsOpen(false);
        return true;
      default:
        return false;
    }
  }, []);

  const { pushState } = useNavigationHistory(handleBackNavigation);

  // Push navigation states when opening views
  const openAllChats = useCallback(() => {
    pushState({ type: 'allchats' });
    setIsAllChatsOpen(true);
  }, [pushState]);

  const openPrivateChat = useCallback((conv: PrivateConversation, fromAllChats = false) => {
    pushState({ type: 'privateChat', data: conv, fromAllChats });
    setActivePrivateChat(conv);
    if (fromAllChats) {
      // Pequeno delay para garantir que o chat de destino comece a montar antes do AllChats sair
      setTimeout(() => setIsAllChatsOpen(false), 50);
    }
  }, [pushState]);

  const openLocalChat = useCallback((id: string) => {
    // Check if this is a house chat
    if (id.startsWith('house_')) {
      const parts = id.split('_');
      // Format: house_{houseId}_{roomId}
      const houseId = parts[1];
      // Get house owner info - we'll fetch it
      supabase.from('houses').select('owner_name, owner_id').eq('id', houseId).single().then(({ data }) => {
        pushState({ type: 'houseChat', data: { houseId, ownerName: data?.owner_name || 'Morador', ownerId: data?.owner_id || '' }, fromAllChats: false });
        setActiveHouseChat({ houseId, ownerName: data?.owner_name || 'Morador', ownerId: data?.owner_id || '' });
      });
      return;
    }
    pushState({ type: 'chat', data: id, fromAllChats: false });
    handleSelectLocal(id);
  }, [pushState]);

  // Abrir chat a partir de "Conversas" pode acontecer mesmo quando o chat ainda não está persistido.
  // Então aqui também garantimos a entrada (visitedRooms/localStorage) e o effect cuida do banco.
  const openLocalChatFromConversations = useCallback((id: string) => {
    // Check if this is a house chat
    if (id.startsWith('house_')) {
      const parts = id.split('_');
      const houseId = parts[1];
      supabase.from('houses').select('owner_name, owner_id').eq('id', houseId).single().then(({ data }) => {
        pushState({ type: 'houseChat', data: { houseId, ownerName: data?.owner_name || 'Morador', ownerId: data?.owner_id || '' }, fromAllChats: true });
        setActiveHouseChat({ houseId, ownerName: data?.owner_name || 'Morador', ownerId: data?.owner_id || '' });
        setTimeout(() => setIsAllChatsOpen(false), 50);
      });
      return;
    }
    pushState({ type: 'chat', data: id, fromAllChats: true });
    void handleSelectLocal(id);
    setTimeout(() => setIsAllChatsOpen(false), 50);
  }, [pushState]);

  const openProfile = useCallback((user: User | null) => {
    if (user) {
      pushState({ type: 'profile', data: user });
    }
    setSelectedUser(user);
  }, [pushState]);

  const openPostDetail = useCallback((post: any) => {
    pushState({ type: 'postDetail', data: post });
    setSelectedPost(post);
  }, [pushState]);


  const openCreateModal = useCallback(() => {
    pushState({ type: 'createModal' });
    setIsCreateModalOpen(true);
  }, [pushState]);

  const openCreateModalFromHeader = useCallback(() => {
    pushState({ type: 'createModal' });
    setIsCreateModalOpen(true);
  }, [pushState]);

  const openCreateCharacter = useCallback(() => {
    pushState({ type: 'createCharacter' });
    setIsCreateCharacterOpen(true);
  }, [pushState]);

  const handleTabChange = (newTab: TabType) => {
    const tabs = Object.values(TabType);
    const newIndex = tabs.indexOf(newTab);
    const prevIndex = prevTabIndex.current;

    if (newIndex > prevIndex) {
      setSlideDirection('right');
    } else if (newIndex < prevIndex) {
      setSlideDirection('left');
    }
    
    prevTabIndex.current = newIndex;
    setActiveTab(newTab);
  };

  useEffect(() => {
    const savedVisited = localStorage.getItem('magic_visited_rooms');
    if (savedVisited) setVisitedRooms(JSON.parse(savedVisited));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setIsAuthenticated(true);
          setTimeout(() => {
            fetchInitialData(session.user.id);
          }, 0);
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        fetchInitialData(session.user.id);
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for push notification clicks from Service Worker
  useEffect(() => {
    const handleNotificationClick = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const data = event.data.data;
        console.log('[App] Notification clicked, navigating to:', data);
        
        if (data?.type === 'private_message' && data?.conversationId) {
          // Navigate to private chat
          const convId = data.conversationId;
          // Find or create conversation object
          supabase.from('private_conversations')
            .select('*, profiles!private_conversations_participant_1_fkey(user_id, full_name, username, avatar_url, race), profiles!private_conversations_participant_2_fkey(user_id, full_name, username, avatar_url, race)')
            .eq('id', convId)
            .single()
            .then(({ data: convData }) => {
              if (convData && currentUser) {
                const otherUserId = convData.participant_1 === currentUser.id ? convData.participant_2 : convData.participant_1;
                const otherProfile = convData.participant_1 === currentUser.id 
                  ? (convData as any)['profiles!private_conversations_participant_2_fkey']
                  : (convData as any)['profiles!private_conversations_participant_1_fkey'];
                
                const conv: PrivateConversation = {
                  id: convData.id,
                  participant_1: convData.participant_1,
                  participant_2: convData.participant_2,
                  created_at: convData.created_at,
                  updated_at: convData.updated_at,
                  other_user: {
                    id: otherUserId,
                    full_name: otherProfile?.full_name || 'Usuário',
                    username: otherProfile?.username || 'user',
                    avatar_url: otherProfile?.avatar_url,
                    race: otherProfile?.race
                  },
                  unread_count: 0
                };
                setActivePrivateChat(conv);
              }
            });
        } else if (data?.type === 'chat_message' && data?.location) {
          // Navigate to public chat
          const location = data.location;
          if (location.startsWith('house_')) {
            // House chat
            const parts = location.split('_');
            const houseId = parts[1];
            supabase.from('houses').select('owner_name, owner_id').eq('id', houseId).single().then(({ data: houseData }) => {
              setActiveHouseChat({ houseId, ownerName: houseData?.owner_name || 'Morador', ownerId: houseData?.owner_id || '' });
            });
          } else {
            // Regular location chat
            void handleSelectLocal(location);
          }
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleNotificationClick);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleNotificationClick);
    };
  }, [currentUser]);

  const fetchInitialData = async (userId: string) => {
    try {
      const profile = await supabaseService.getProfile(userId);
      if (profile) {
        setCurrentUser({
          ...profile,
          money: profile.money || 3000,
          hp: profile.hp ?? 100,
          maxHp: profile.maxHp || 100,
          hunger: profile.hunger ?? 100,
          thirst: profile.thirst ?? 100,
          alcohol: profile.alcohol ?? 0,
          currentDisease: profile.currentDisease,
          isActiveRP: profile.isActiveRP
        });
      }
      
      // Log user IP for duplicate detection
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          fetch('https://ltjtzyzxpxrbqiajafcm.supabase.co/functions/v1/log-user-ip', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            }
          }).catch(() => {}); // Fire and forget, don't block
        }
      } catch (e) {
        // Silent fail - IP logging is not critical
      }
      
      // Carregar chats visitados do banco de dados (fonte única de verdade)
      const { data: visitedChatsData } = await supabase
        .from('user_visited_chats')
        .select('chat_id')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });
      
      // O banco de dados é a fonte de verdade - localStorage é apenas cache local
      const dbRooms = visitedChatsData?.map(v => v.chat_id) || [];
      setVisitedRooms(dbRooms);
      localStorage.setItem('magic_visited_rooms', JSON.stringify(dbRooms));
      
      const dbPosts = await supabaseService.getPosts();
      setPosts(dbPosts || []);
      const members = await supabaseService.getAllProfiles();
      setCommunityMembers(members || []);
      const chars = await supabaseService.getAllCharacters();
      setCharacters(chars || []);
    } catch (error: any) {
      if (error?.message?.includes('profiles')) setShowDbSetup(true);
    } finally {
      setLoading(false);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const tabs = Object.values(TabType);
      const currentIndex = tabs.indexOf(activeTab);

      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        handleTabChange(tabs[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        handleTabChange(tabs[currentIndex - 1]);
      }
    }
  };


  const leaveChatById = async (id: string) => {
    const existing = pendingLeaveByChatIdRef.current.get(id);
    if (existing) return existing;

    const promise = (async () => {
      if (currentUser?.id) {
        try {
          if (selectedLocalChat === id) {
            await supabaseService.updateCurrentLocation(currentUser.id, null, null);
          }
          await supabase
            .from('user_visited_chats')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('chat_id', id);
        } catch (e) {
          console.warn('[leaveChatById] Falha ao sair do chat:', e);
        }
      }

      clearChatNotifications(id);

      setVisitedRooms(prev => {
        const newRooms = prev.filter(v => v !== id);
        localStorage.setItem('magic_visited_rooms', JSON.stringify(newRooms));
        return newRooms;
      });

      if (selectedLocalChat === id) {
        setSelectedLocalChat(null);
        localStorage.removeItem('magic_active_chat');
      }
    })().finally(() => {
      pendingLeaveByChatIdRef.current.delete(id);
    });

    pendingLeaveByChatIdRef.current.set(id, promise);
    return promise;
  };

  const handleSelectLocal = async (id: string) => {
    // UI/estado local primeiro; persistência e current_location são garantidos pelo effect ensureMembership
    setSelectedLocalChat(id);
    localStorage.setItem('magic_active_chat', id);

    setVisitedRooms(prev => {
      if (prev.includes(id)) return prev;
      const newRooms = [id, ...prev];
      localStorage.setItem('magic_visited_rooms', JSON.stringify(newRooms));
      return newRooms;
    });
  };
  
  const handleCloseChat = async () => {
    // Just close the chat UI - navigation is handled by browser history
    setSelectedLocalChat(null);
    localStorage.removeItem('magic_active_chat');
  };
  
  const handleLeaveChat = () => {
    const id = selectedLocalChat;
    if (!id) {
      handleCloseChat();
      return;
    }
    leaveChatById(id);
  };

  const renderMainContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Sincronizando...</p>
      </div>
    );

    switch (activeTab) {
      case TabType.Destaque:
        return (
          <FeaturedView 
            currentUserId={currentUser!.id} 
            onPostClick={(post) => openPostDetail(post)}
            onUserClick={(userId) => {
              const user = communityMembers.find(m => m.id === userId);
              if (user) openProfile(user);
            }}
          />
        );
      case TabType.Feed:
        return (
          <FeedView 
            currentUserId={currentUser!.id} 
            onPostClick={(post) => openPostDetail(post)}
            onUserClick={(userId) => {
              const user = communityMembers.find(m => m.id === userId);
              if (user) openProfile(user);
            }}
          />
        );
      case TabType.Global:
        return (
          <GlobalUsersGrid 
            members={communityMembers} 
            onSelectUser={(user) => openProfile(user)}
            currentUserId={currentUser!.id}
          />
        );
      case TabType.Locais:
        return (
          <LocaisGrid 
            onSelect={(id) => openLocalChat(id)} 
            confirmedRooms={visitedRooms}
            currentUser={currentUser}
            characters={characters}
            onMoneyChange={(newBalance) => {
              setCurrentUser(prev => prev ? { ...prev, money: newBalance } : prev);
            }}
            onUserClick={(user) => openProfile(user)}
            getLocationUnread={getLocationUnread}
          />
        );
      case TabType.Personagens:
        return (
          <CharactersGrid 
            characters={characters} 
            currentUserId={currentUser!.id}
            onCreateClick={() => openCreateCharacter()}
            onRefresh={() => fetchInitialData(currentUser!.id)}
          />
        );
      case TabType.Chat:
        return (
          <ChatInterface 
            currentUser={currentUser!} 
            onMemberClick={(user) => openProfile(user)} 
            onNavigate={(id) => openLocalChat(id)}
            onClose={() => handleTabChange(TabType.Destaque)} 
          />
        );
      default:
        return null;
    }
  };

  if (isAuthenticated === null || (isAuthenticated && !currentUser)) return null;

  if (!isAuthenticated) {
    return <AuthView onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex justify-center h-[100dvh] bg-[#020105] overflow-hidden">
      <div className="w-full max-md bg-background-dark h-full relative flex flex-col border-x border-white/5 overflow-hidden">
        <ConnectivityMonitor />
        <Header activeTab={activeTab} setActiveTab={handleTabChange} currentUser={currentUser!} onProfileClick={() => openProfile(currentUser)} onMenuClick={() => setIsSidebarOpen(true)} onPostClick={(postId) => {
          const post = posts.find(p => p.id === postId);
          if (post) openPostDetail(post);
        }} />
        <PinnedBar />
        
        <div 
          className={`flex-1 overflow-y-auto scrollbar-hide relative ${slideDirection === 'right' ? 'tab-slide-right' : 'tab-slide-left'}`}
          key={activeTab}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {renderMainContent()}
        </div>

        <SidebarMenu 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          user={currentUser!} 
          onOpenProfile={() => openProfile(currentUser)}
          onOpenChats={() => openAllChats()}
          onStatusChange={(isActive) => setCurrentUser(prev => prev ? { ...prev, isActiveRP: isActive } : null)}
          onLogout={async () => { await supabase.auth.signOut(); setIsAuthenticated(false); }}
        />
        {isCreateModalOpen && <CreateContentModal onClose={() => setIsCreateModalOpen(false)} onSuccess={() => fetchInitialData(currentUser!.id)} userId={currentUser!.id} />}
        {isCreateCharacterOpen && <CreateCharacterModal userId={currentUser!.id} onClose={() => setIsCreateCharacterOpen(false)} onSuccess={() => { setIsCreateCharacterOpen(false); fetchInitialData(currentUser!.id); }} />}
        
        {selectedUser && (
          <ProfileView 
            user={selectedUser} 
            currentUserId={currentUser!.id} 
            currentUserIsLeader={currentUser!.isLeader}
            allPosts={posts} 
            onClose={() => setSelectedUser(null)} 
            onUpdate={(u) => { setCurrentUser(u); fetchInitialData(u.id); }}
            onOpenProfile={async (userId) => {
              const profileData = await supabaseService.getProfile(userId);
              if (profileData) {
                openProfile(profileData);
              } else {
                toast({
                  title: "Erro",
                  description: "Não foi possível carregar o perfil deste usuário.",
                  variant: "destructive"
                });
              }
            }}
            onStartChat={async (uid) => {
              const cid = await startConversation(uid);
              if (cid) {
                const u = communityMembers.find(m => m.id === uid);
                if (u) {
                  setSelectedUser(null);
                  openPrivateChat({ id: cid, participant_1: currentUser!.id, participant_2: uid, created_at: '', updated_at: '', other_user: { id: u.id, full_name: u.name, username: u.username, avatar_url: u.avatar }, unread_count: 0 });
                }
              }
            }}
          />
        )}

        {selectedPost && (
          <PostDetailView 
            post={{
              ...selectedPost,
              imageUrl: selectedPost.image_url,
              videoUrl: selectedPost.video_url,
              excerpt: selectedPost.content,
              likes: selectedPost.likes_count?.toString() || '0',
              author: {
                id: selectedPost.user_id,
                name: selectedPost.profile?.full_name || 'Membro',
                username: selectedPost.profile?.username || 'user',
                avatar: selectedPost.profile?.avatar_url || ''
              },
              timestamp: new Date(selectedPost.created_at).toLocaleDateString()
            }}
            currentUser={currentUser!} 
            onClose={() => setSelectedPost(null)} 
            onUserClick={async (userId) => {
              // 1. Primeiro buscamos os dados do usuário usando o serviço
              const profileData = await supabaseService.getProfile(userId);
              
              if (profileData) {
                // 2. Limpamos o post selecionado para evitar sobreposição de z-index
                setSelectedPost(null);
                
                // 3. Pequeno atraso para garantir que a UI processe o fechamento do post antes de abrir o perfil
                setTimeout(() => {
                  openProfile(profileData);
                }, 50);
              } else {
                toast({
                  title: "Erro",
                  description: "Não foi possível carregar o perfil deste usuário.",
                  variant: "destructive"
                });
              }
            }}
          />
        )}

        {/* Overlays de Chat devem vir DEPOIS de AllChatsView para garantir sobreposição correta durante animações */}
        {isAllChatsOpen && (
          <AllChatsView 
            visitedRooms={visitedRooms} 
            onClose={() => setIsAllChatsOpen(false)} 
            onSelectChat={(id) => { openLocalChatFromConversations(id); }} 
            onLeaveChat={(id) => { leaveChatById(id); }} 
            currentUserId={currentUser!.id} 
            hasCharacter={characters.some(c => c.user_id === currentUser!.id)} 
            onOpenPrivateChat={(conv) => { 
              openPrivateChat(conv, true); 
            }} 
          />
        )}

        {selectedLocalChat && (
          <ChatInterface 
            currentUser={currentUser!} 
            locationContext={selectedLocalChat} 
            onNavigate={(id) => openLocalChat(id)} 
            onClose={handleCloseChat}
            onLeaveRoom={handleLeaveChat}
            onMemberClick={(user) => {
              // Fecha o chat overlay antes de abrir o perfil (garante que o ProfileView apareça)
              handleCloseChat();
              setTimeout(() => openProfile(user), 50);
            }}
            onMarkAsRead={(loc, subLoc) => markChatAsRead(loc, subLoc)} 
          />
        )}
        
        {activePrivateChat && (
          <PrivateChatView
            conversationId={activePrivateChat.id}
            currentUserId={currentUser!.id}
            currentUserName={currentUser!.name}
            currentUserAvatar={currentUser!.avatar}
            otherUser={activePrivateChat.other_user!}
            onClose={() => setActivePrivateChat(null)}
            onMarkAsRead={() => markConversationAsRead(activePrivateChat.id)}
          />
        )}
        
        {activeHouseChat && (
          <HouseChatView
            houseId={activeHouseChat.houseId}
            ownerName={activeHouseChat.ownerName}
            currentUser={currentUser!}
            onClose={() => setActiveHouseChat(null)}
            onMemberClick={(user) => openProfile(user)}
            onLeaveHouse={async (houseId) => {
              // Remove invite and visited chats for this house
              await supabase.from('house_invites')
                .delete()
                .eq('house_id', houseId)
                .eq('invited_user_id', currentUser!.id);
              
              // Remove all visited chats entries for this house
              const { data: visitedChats } = await supabase
                .from('user_visited_chats')
                .select('chat_id')
                .eq('user_id', currentUser!.id)
                .like('chat_id', `house_${houseId}%`);
              
              if (visitedChats) {
                for (const chat of visitedChats) {
                  await leaveChatById(chat.chat_id);
                }
              }
              
              setActiveHouseChat(null);
            }}
            isOwner={activeHouseChat.ownerId === currentUser!.id}
          />
        )}
        
        {!selectedLocalChat && !selectedUser && !selectedPost && !isCreateModalOpen && !activePrivateChat && !activeHouseChat && <FloatingActionDock activeTab={activeTab} onCreateClick={() => openCreateModal()} onAllChatsClick={() => openAllChats()} unreadMessages={totalUnread + totalChatUnread} isSidebarOpen={isSidebarOpen} hasNewMessages={hasNewMessages} />}
        <Toaster />
      </div>
    </div>
  );
};

export default App;