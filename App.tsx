"use client";

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PinnedBar } from './components/PinnedBar';
import { Stories } from './components/Stories';
import { FeaturedCard, GridCard } from './components/PostCards';
import { ChatInterface } from './components/ChatInterface';
import { LocaisGrid } from './components/LocaisGrid';
import { ProfileView } from './components/ProfileView';
import { SidebarMenu } from './components/SidebarMenu';
import { CreateContentModal } from './components/CreateContentModal';
import { AuthView } from './components/AuthView';
import { DbSetupModal } from './components/DbSetupModal';
import { FloatingActionDock } from './components/FloatingActionDock';
import { AllChatsView } from './components/AllChatsView';
import { RouletteView } from './components/RouletteView';
import { InventoryView } from './components/InventoryView';
import { TabType, User, Post, MenuItem } from './types';
import { CURRENT_USER } from './constants';
import { supabase } from './supabase';
import { supabaseService } from './services/supabaseService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
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
  
  const [visitedRooms, setVisitedRooms] = useState<string[]>([]);
  const [confirmedRooms, setConfirmedRooms] = useState<string[]>([]);

  useEffect(() => {
    const savedConfirmed = localStorage.getItem('magic_confirmed_rooms');
    const savedVisited = localStorage.getItem('magic_visited_rooms');
    if (savedConfirmed) setConfirmedRooms(JSON.parse(savedConfirmed));
    if (savedVisited) setVisitedRooms(JSON.parse(savedVisited));

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          fetchInitialData(session.user.id);
        } else {
          setIsAuthenticated(false);
          setLoading(false);
        }
      } catch (e) {
        setIsAuthenticated(false);
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const fetchInitialData = async (userId: string) => {
    try {
      const profile = await supabaseService.getProfile(userId);
      if (profile) {
        setCurrentUser({
          ...profile,
          money: profile.money || 3000,
          hp: profile.hp || 100,
          maxHp: profile.maxHp || 100,
          hunger: profile.hunger || 50,
          thirst: profile.thirst || 50,
          alcohol: profile.alcohol || 0
        });
      }
      const dbPosts = await supabaseService.getPosts();
      setPosts(dbPosts || []);
      const members = await supabaseService.getAllProfiles();
      setCommunityMembers(members || []);
    } catch (error: any) {
      if (error?.message?.includes('profiles')) setShowDbSetup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (changes: { hp?: number; hunger?: number; thirst?: number; alcohol?: number; money?: number }) => {
    setCurrentUser(prev => {
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

  const handleRouletteResult = (id: string, name: string, hpImpact: number) => {
    handleUpdateStatus({ hp: hpImpact });
    if (hpImpact < 0) setCurrentUser(prev => ({ ...prev, currentDisease: id }));
    fetchInitialData(currentUser.id); // Recarregar para atualizar last_spin_at
  };

  const handleEnterRoom = (roomId: string) => {
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

  return (
    <div className="flex justify-center h-[100dvh] bg-[#020105] overflow-hidden">
      <div className="w-full max-w-md bg-background-dark h-full relative flex flex-col border-x border-white/5 overflow-hidden">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onProfileClick={() => setSelectedUser(currentUser)} onMenuClick={() => setIsSidebarOpen(true)} />
        <PinnedBar />
        <div className="flex-1 overflow-y-auto scrollbar-hide relative">
          {renderMainContent()}
        </div>

        <SidebarMenu 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          user={currentUser} 
          onOpenProfile={() => setSelectedUser(currentUser)}
          onOpenInventory={() => setIsInventoryOpen(true)}
          onOpenChats={() => setIsAllChatsOpen(true)}
          onLogout={async () => { await supabase.auth.signOut(); setIsAuthenticated(false); }}
        />

        {isInventoryOpen && <InventoryView userId={currentUser.id} onClose={() => setIsInventoryOpen(false)} onConsume={handleConsumeItem} />}
        {isCreateModalOpen && <CreateContentModal onClose={() => setIsCreateModalOpen(false)} onSuccess={() => fetchInitialData(currentUser.id)} userId={currentUser.id} />}
        {selectedUser && <ProfileView user={selectedUser} currentUserId={currentUser.id} allPosts={posts} onClose={() => setSelectedUser(null)} onUpdate={(u) => { setCurrentUser(u); fetchInitialData(u.id); }} />}
        {selectedLocalChat && <ChatInterface onUpdateStatus={handleUpdateStatus} onConsumeItems={handleBuyItems} currentUser={currentUser} locationContext={selectedLocalChat} onNavigate={handleEnterRoom} onClose={() => setSelectedLocalChat(null)} />}
        {isAllChatsOpen && <AllChatsView visitedRooms={visitedRooms} onClose={() => setIsAllChatsOpen(false)} onSelectChat={handleEnterRoom} onLeaveChat={handleLeaveRoom} />}
        {isRouletteOpen && <RouletteView userId={currentUser.id} lastSpinAt={currentUser.last_spin_at} onClose={() => setIsRouletteOpen(false)} onResult={handleRouletteResult} />}
        {!selectedLocalChat && !selectedUser && !isCreateModalOpen && <FloatingActionDock activeTab={activeTab} onCreateClick={() => setIsCreateModalOpen(true)} onAllChatsClick={() => setIsAllChatsOpen(true)} onRouletteClick={() => setIsRouletteOpen(true)} />}
        {showDbSetup && <DbSetupModal onClose={() => setShowDbSetup(false)} />}
      </div>
    </div>
  );
};

export default App;