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
import { TabType, User, Post } from './types';
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

  useEffect(() => {
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

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          fetchInitialData(session.user.id);
        }
      } else {
        setIsAuthenticated(false);
        setLoading(false);
        setCurrentUser(CURRENT_USER);
      }
    });

    return () => {
      authSub.unsubscribe();
    };
  }, []);

  const fetchInitialData = async (userId: string) => {
    try {
      const profile = await supabaseService.getProfile(userId);
      if (profile) {
        setCurrentUser({
          ...profile,
          hp: profile.hp || 100,
          maxHp: profile.maxHp || 100
        });
      }
      
      const dbPosts = await supabaseService.getPosts();
      setPosts(dbPosts || []);

      const members = await supabaseService.getAllProfiles();
      setCommunityMembers(members || []);

    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      if (error?.message?.includes('profiles') || error?.message?.includes('relation')) {
        setShowDbSetup(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHp = (hpChange: number) => {
    setCurrentUser(prev => {
      const currentHp = prev.hp || 100;
      const maxHp = prev.maxHp || 100;
      const newHp = Math.max(0, Math.min(maxHp, currentHp + hpChange));
      return { ...prev, hp: newHp };
    });
  };

  const handleRouletteResult = (id: string, name: string, hpImpact: number) => {
    handleUpdateHp(hpImpact);
    if (hpImpact < 0) {
      setCurrentUser(prev => ({ ...prev, currentDisease: id }));
    }
  };

  const handleClearDisease = (hpRestore: number) => {
    handleUpdateHp(hpRestore);
    setCurrentUser(prev => ({ ...prev, currentDisease: undefined }));
  };

  const refreshPosts = async () => {
    const dbPosts = await supabaseService.getPosts();
    setPosts(dbPosts || []);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    if (selectedUser?.id === updatedUser.id) setSelectedUser(updatedUser);
    setCommunityMembers(prev => prev.map(m => m.id === updatedUser.id ? updatedUser : m));
    refreshPosts();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(CURRENT_USER);
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
            {posts.length > 0 ? (
              <>
                <FeaturedCard post={posts[0]} />
                <div className="px-6 mt-8 grid grid-cols-2 gap-4">
                  {posts.slice(1).map(post => (
                    <div key={post.id} onClick={() => setSelectedUser(post.author)}>
                      <GridCard post={post} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="px-10 py-20 text-center opacity-40">
                <span className="material-symbols-rounded text-6xl mb-4 text-primary">auto_stories</span>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Nada postado ainda.</p>
              </div>
            )}
          </div>
        );
      case TabType.Feed:
        return (
          <div className="p-6 space-y-6 pb-40">
            {posts.map(post => (
              <div key={post.id} className="bg-surface-purple/30 rounded-[40px] p-8 border border-white/5">
                <h4 className="text-white font-black text-xl mb-4">{post.title}</h4>
                <p className="text-white/50 text-sm italic mb-6">"{post.excerpt}"</p>
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setSelectedUser(post.author)}>
                   <img src={post.author.avatar} className="w-8 h-8 rounded-full" alt="avatar" />
                   <span className="text-[10px] font-black text-white/80">{post.author.name}</span>
                </div>
              </div>
            ))}
          </div>
        );
      case TabType.Global:
        return (
          <div className="p-8 grid grid-cols-2 gap-6 pb-40">
            {communityMembers.map((user) => (
              <button key={user.id} onClick={() => setSelectedUser(user)} className="bg-surface-purple/20 p-6 rounded-[40px] flex flex-col items-center border border-white/5 hover:bg-white/5 transition-colors">
                <img src={user.avatar} className="w-20 h-20 rounded-[28px] mb-4 object-cover" alt={user.name} />
                <span className="text-xs font-black text-white truncate w-full text-center">{user.name}</span>
              </button>
            ))}
          </div>
        );
      case TabType.Locais:
        return <LocaisGrid onSelect={setSelectedLocalChat} />;
      case TabType.Chat:
        return <ChatInterface onUpdateHp={handleUpdateHp} onClearDisease={handleClearDisease} currentUser={currentUser} onMemberClick={setSelectedUser} onClose={() => setActiveTab(TabType.Destaque)} />;
      default:
        return null;
    }
  };

  if (isAuthenticated === null) return null;

  if (!isAuthenticated) {
    return <AuthView onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex justify-center min-h-screen bg-[#020105]">
      <div className="w-full max-w-md bg-background-dark min-h-screen relative flex flex-col border-x border-white/5 overflow-hidden">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onProfileClick={() => setSelectedUser(currentUser)} onMenuClick={() => setIsSidebarOpen(true)} />
        <PinnedBar />
        <div className="flex-1 overflow-y-auto scrollbar-hide relative">
          {renderMainContent()}
        </div>
        <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} user={currentUser} onOpenProfile={() => setSelectedUser(currentUser)} onLogout={handleLogout} />
        {isCreateModalOpen && <CreateContentModal onClose={() => setIsCreateModalOpen(false)} onSuccess={refreshPosts} userId={currentUser.id} />}
        {showDbSetup && <DbSetupModal onClose={() => setShowDbSetup(false)} />}
        {selectedUser && <ProfileView user={selectedUser} currentUserId={currentUser.id} allPosts={posts} onClose={() => setSelectedUser(null)} onUpdate={handleUpdateUser} />}
        {selectedLocalChat && <ChatInterface onUpdateHp={handleUpdateHp} onClearDisease={handleClearDisease} currentUser={currentUser} onMemberClick={setSelectedUser} locationContext={selectedLocalChat} onClose={() => setSelectedLocalChat(null)} />}
        {isAllChatsOpen && <AllChatsView onClose={() => setIsAllChatsOpen(false)} onSelectChat={setSelectedLocalChat} />}
        {isRouletteOpen && <RouletteView onClose={() => setIsRouletteOpen(false)} onResult={handleRouletteResult} />}
        {!selectedLocalChat && !selectedUser && !isCreateModalOpen && <FloatingActionDock activeTab={activeTab} onCreateClick={() => setIsCreateModalOpen(true)} onAllChatsClick={() => setIsAllChatsOpen(true)} onRouletteClick={() => setIsRouletteOpen(true)} />}
      </div>
    </div>
  );
};

export default App;