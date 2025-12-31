"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { RouletteView } from './components/RouletteView';
import { InventoryView } from './components/InventoryView';
import { SupermarketView } from './components/SupermarketView';
import { PrivateChatView } from './components/PrivateChatView';
import { FeedView } from './src/components/FeedView';
import { GlobalUsersGrid } from './src/components/GlobalUsersGrid';
import { TabType, User, Post, MenuItem } from './types';
import { supabase } from './supabase';
import { supabaseService } from './services/supabaseService';
import { usePrivateConversations, PrivateConversation } from './src/hooks/usePrivateConversations';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [communityMembers, setCommunityMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDbSetup, setShowDbSetup] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>(TabType.Destaque);
  const [selectedLocalChat, setSelectedLocalChat] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [isAllChatsOpen, setIsAllChatsOpen] = useState(false);
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSupermarketOpen, setIsSupermarketOpen] = useState(false);
  const [isCreateCharacterOpen, setIsCreateCharacterOpen] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  
  const [visitedRooms, setVisitedRooms] = useState<string[]>([]);
  const [confirmedRooms, setConfirmedRooms] = useState<string[]>([]);
  
  // Swipe State
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 70; // Sensibilidade do deslize

  // Private chat state
  const [activePrivateChat, setActivePrivateChat] = useState<PrivateConversation | null>(null);
  const { startConversation, markConversationAsRead, totalUnread } = usePrivateConversations(currentUser?.id || null);

  useEffect(() => {
    const savedConfirmed = localStorage.getItem('magic_confirmed_rooms');
    const savedVisited = localStorage.getItem('magic_visited_rooms');
    if (savedConfirmed) setConfirmedRooms(JSON.parse(savedConfirmed));
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

  useEffect(() => {
    if (!currentUser || !currentUser.isActiveRP) return;
    
    const interval = setInterval(() => {
      setCurrentUser(prev => {
        if (!prev) return prev;
        const newHunger = Math.max(0, (prev.hunger ?? 100) - 1);
        const newThirst = Math.max(0, (prev.thirst ?? 100) - 1);
        
        supabaseService.updateVitalStatus(prev.id, {
          hunger: newHunger,
          energy: newThirst
        });
        
        return {
          ...prev,
          hunger: newHunger,
          thirst: newThirst
        };
      });
    }, 60000);
    
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.isActiveRP]);

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
          isActiveRP: profile.isActiveRP
        });
      }
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

  // SWIPE NAVIGATION HANDLERS
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
        // Swipe para a esquerda -> próxima aba
        setActiveTab(tabs[currentIndex + 1]);
        if (navigator.vibrate) navigator.vibrate(10);
      } else if (isRightSwipe && currentIndex > 0) {
        // Swipe para a direita -> aba anterior
        setActiveTab(tabs[currentIndex - 1]);
        if (navigator.vibrate) navigator.vibrate(10);
      }
    }
  };

  const handleUpdateStatus = (changes: { hp?: number; hunger?: number; thirst?: number; alcohol?: number; money?: number }) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const maxHp = prev.maxHp || 100;
      return {
        ...prev,
        hp: Math.max(0, Math.min(maxHp, (prev.hp || 100) + (changes.hp || 0))),
        hunger: Math.max(0, Math.min(100, (prev.hunger || 50) + (changes.hunger || 0))),
        thirst: Math.max(0, Math.min(100, (prev.thirst || 50) + (changes.thirst || 0))),
        alcohol: Math.max(0, Math.min(100, (prev.alcohol || 0) + (changes.alcohol || 0))),
        money: (prev.money || 0) + (changes.money || 0)
      };
    });
  };

  const handleBuyItems = async (items: MenuItem[]) => {
    if (!currentUser) return;
    for (const item of items) {
      await supabaseService.addToInventory(currentUser.id, item);
    }
  };

  const handleConsumeItem = (item: any) => {
    handleUpdateStatus({
      hp: item.attributes?.hp || 0,
      hunger: item.attributes?.hunger || 0,
      thirst: item.attributes?.thirst || 0,
      alcohol: item.attributes?.alcohol || 0
    });
    alert(`Você usou ${item.item_name}! ✨`);
  };

  const handleRouletteResult = async (id: string, name: string, hpImpact: number) => {
    if (!currentUser) return;
    
    try {
      // Se é doença (tem impacto negativo no HP)
      if (hpImpact < 0) {
        await supabaseService.applyDiseaseFromRoulette(currentUser.id, id, hpImpact);
        setCurrentUser(prev => prev ? { 
          ...prev, 
          currentDisease: id,
          hp: Math.max(0, (prev.hp || 100) + hpImpact)
        } : prev);
      } else if (id.startsWith('p')) {
        // É um prêmio em dinheiro
        const prizeMap: Record<string, number> = {
          'p1': 1,
          'p2': 10,
          'p3': 100,
          'p4': 10000
        };
        const prizeAmount = prizeMap[id] || 0;
        if (prizeAmount > 0) {
          await supabaseService.applyPrizeFromRoulette(currentUser.id, prizeAmount);
          setCurrentUser(prev => prev ? {
            ...prev,
            money: (prev.money || 0) + prizeAmount
          } : prev);
        }
      }
      
      // Recarregar dados do usuário para garantir sincronização
      await fetchInitialData(currentUser.id);
    } catch (error) {
      console.error("Erro ao aplicar resultado da roleta:", error);
    }
  };

  const handleEnterRoom = (roomId: string) => {
    if (!currentUser?.isActiveRP && roomId !== 'supermercado' && roomId !== 'imobiliaria') {
        alert("Ative seu status de Roleplay no menu lateral para entrar em locais.");
        return;
    }

    if (roomId === 'supermercado') {
      setIsSupermarketOpen(true);
      return;
    }
    
    setSelectedLocalChat(roomId);
    const newVisited = visitedRooms.includes(roomId) ? visitedRooms : [roomId, ...visitedRooms];
    const newConfirmed = confirmedRooms.includes(roomId) ? confirmedRooms : [...confirmedRooms, roomId];
    setVisitedRooms(newVisited);
    setConfirmedRooms(newConfirmed);
    localStorage.setItem('magic_visited_rooms', JSON.stringify(newVisited));
    localStorage.setItem('magic_confirmed_rooms', JSON.stringify(newConfirmed));
  };

  const handleLeaveRoom = (roomId: string) => {
    const newVisited = visitedRooms.filter(id => id !== roomId);
    const newConfirmed = confirmedRooms.filter(id => id !== roomId);
    setVisitedRooms(newVisited);
    setConfirmedRooms(newConfirmed);
    localStorage.setItem('magic_visited_rooms', JSON.stringify(newVisited));
    localStorage.setItem('magic_confirmed_rooms', JSON.stringify(newConfirmed));
  };

  const handleStartPrivateChat = async (userId: string) => {
    const conversationId = await startConversation(userId);
    if (conversationId) {
      const otherUser = communityMembers.find(m => m.id === userId);
      if (otherUser) {
        setActivePrivateChat({
          id: conversationId,
          participant_1: currentUser!.id,
          participant_2: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          other_user: {
            id: otherUser.id,
            full_name: otherUser.name,
            username: otherUser.username,
            avatar_url: otherUser.avatar
          },
          unread_count: 0
        });
        setSelectedUser(null);
      }
    }
  };

  const renderMainContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-32 animate-pulse">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Sincronizando...</p>
      </div>
    );

    switch (activeTab) {
      case TabType.Destaque:
        return (
          <div className="pb-40">
            <Stories members={communityMembers} onSelectArtist={setSelectedUser} />
            <FeedView 
              currentUserId={currentUser.id} 
              showFeaturedOnly={true}
              onUserClick={(userId) => {
                const user = communityMembers.find(m => m.id === userId);
                if (user) setSelectedUser(user);
              }}
            />
          </div>
        );
      case TabType.Feed:
        return (
          <FeedView 
            currentUserId={currentUser.id} 
            onUserClick={(userId) => {
              const user = communityMembers.find(m => m.id === userId);
              if (user) setSelectedUser(user);
            }}
          />
        );
      case TabType.Global:
        return (
          <GlobalUsersGrid 
            members={communityMembers} 
            onSelectUser={setSelectedUser} 
          />
        );
      case TabType.Locais:
        return (
          <LocaisGrid 
            onSelect={handleEnterRoom} 
            confirmedRooms={confirmedRooms}
            currentUser={currentUser}
            characters={characters}
            onMoneyChange={(newBalance) => {
              setCurrentUser(prev => prev ? { ...prev, money: newBalance } : prev);
            }}
          />
        );
      case TabType.Personagens:
        return (
          <CharactersGrid 
            characters={characters} 
            currentUserId={currentUser.id}
            onCreateClick={() => setIsCreateCharacterOpen(true)}
            onRefresh={() => fetchInitialData(currentUser.id)}
          />
        );
      case TabType.Chat:
        return (
          <ChatInterface 
            onUpdateStatus={handleUpdateStatus} 
            onConsumeItems={handleBuyItems}
            currentUser={currentUser} 
            onMemberClick={setSelectedUser} 
            onNavigate={handleEnterRoom}
            onClose={() => setActiveTab(TabType.Destaque)} 
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

  if (!currentUser) return null;

  return (
    <div className="flex justify-center h-[100dvh] bg-[#020105] overflow-hidden">
      <div className="w-full max-w-md bg-background-dark h-full relative flex flex-col border-x border-white/5 overflow-hidden">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onProfileClick={() => setSelectedUser(currentUser)} onMenuClick={() => setIsSidebarOpen(true)} />
        <PinnedBar />
        
        {/* Swipable Content Area */}
        <div 
          className="flex-1 overflow-y-auto scrollbar-hide relative"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {renderMainContent()}
        </div>

        <SidebarMenu 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          user={currentUser} 
          onOpenProfile={() => setSelectedUser(currentUser)}
          onOpenInventory={() => setIsInventoryOpen(true)}
          onOpenChats={() => setIsAllChatsOpen(true)}
          onStatusChange={(isActive) => setCurrentUser(prev => prev ? { ...prev, isActiveRP: isActive } : null)}
          onLogout={async () => { await supabase.auth.signOut(); setIsAuthenticated(false); }}
        />

        {isInventoryOpen && <InventoryView userId={currentUser.id} onClose={() => setIsInventoryOpen(false)} onConsume={handleConsumeItem} />}
        {isSupermarketOpen && (
          <SupermarketView 
            userId={currentUser.id} 
            userName={currentUser.name}
            userMoney={currentUser.money || 0}
            onClose={() => setIsSupermarketOpen(false)} 
            onMoneyChange={(newBalance) => setCurrentUser(prev => prev ? { ...prev, money: newBalance } : prev)}
          />
        )}
        {isCreateModalOpen && <CreateContentModal onClose={() => setIsCreateModalOpen(false)} onSuccess={() => fetchInitialData(currentUser.id)} userId={currentUser.id} />}
        {isCreateCharacterOpen && (
          <CreateCharacterModal 
            userId={currentUser.id}
            onClose={() => setIsCreateCharacterOpen(false)} 
            onSuccess={() => {
              setIsCreateCharacterOpen(false);
              fetchInitialData(currentUser.id);
            }} 
          />
        )}
        {selectedUser && <ProfileView user={selectedUser} currentUserId={currentUser.id} allPosts={posts} onClose={() => setSelectedUser(null)} onUpdate={(u) => { setCurrentUser(u); fetchInitialData(u.id); }} onStartChat={handleStartPrivateChat} />}
        {selectedLocalChat && <ChatInterface onUpdateStatus={handleUpdateStatus} onConsumeItems={handleBuyItems} currentUser={currentUser} locationContext={selectedLocalChat} onNavigate={handleEnterRoom} onClose={() => setSelectedLocalChat(null)} />}
        {isAllChatsOpen && (
          <AllChatsView 
            visitedRooms={visitedRooms} 
            onClose={() => setIsAllChatsOpen(false)} 
            onSelectChat={handleEnterRoom} 
            onLeaveChat={handleLeaveRoom}
            currentUserId={currentUser.id}
            onOpenPrivateChat={(conv) => {
              setActivePrivateChat(conv);
              setIsAllChatsOpen(false);
            }}
          />
        )}
        {activePrivateChat && activePrivateChat.other_user && (
          <PrivateChatView
            conversationId={activePrivateChat.id}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            currentUserAvatar={currentUser.avatar}
            otherUser={activePrivateChat.other_user}
            onClose={() => setActivePrivateChat(null)}
            onMarkAsRead={() => markConversationAsRead(activePrivateChat.id)}
          />
        )}
        {isRouletteOpen && <RouletteView userId={currentUser.id} lastSpinAt={currentUser.last_spin_at} onClose={() => setIsRouletteOpen(false)} onResult={handleRouletteResult} />}
        {!selectedLocalChat && !selectedUser && !isCreateModalOpen && !activePrivateChat && <FloatingActionDock activeTab={activeTab} onCreateClick={() => setIsCreateModalOpen(true)} onAllChatsClick={() => setIsAllChatsOpen(true)} onRouletteClick={() => setIsRouletteOpen(true)} unreadMessages={totalUnread} />}
        {showDbSetup && <DbSetupModal onClose={() => setShowDbSetup(false)} />}
      </div>
    </div>
  );
};

export default App;