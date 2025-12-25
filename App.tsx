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

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        await fetchInitialData(session.user.id, session.user);
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsAuthenticated(true);
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          await fetchInitialData(session.user.id, session.user);
        }
      } else {
        setIsAuthenticated(false);
        setLoading(false);
        setCurrentUser(CURRENT_USER);
      }
    });

    const postSub = supabaseService.subscribeToPosts(() => {
      refreshPosts();
    });

    return () => {
      authSub.unsubscribe();
      postSub.unsubscribe();
    };
  }, []);

  const fetchInitialData = async (userId: string, authUser?: any) => {
    setLoading(true);
    try {
      const [profile, dbPosts, members] = await Promise.all([
        supabaseService.getProfile(userId),
        supabaseService.getPosts(),
        supabaseService.getAllProfiles()
      ]);

      if (profile) {
        setCurrentUser(profile);
      } else if (authUser) {
        // Fallback se o perfil ainda não foi criado pela trigger do Supabase
        const meta = authUser.user_metadata;
        setCurrentUser({
          id: userId,
          name: meta?.full_name || 'Explorador',
          username: meta?.username || 'user',
          avatar: meta?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          bio: ''
        });
      }

      setPosts(dbPosts || []);
      setCommunityMembers(members || []);

    } catch (error: any) {
      if (error?.message?.includes('profiles')) {
        setShowDbSetup(true);
      }
    } finally {
      setLoading(false);
    }
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
        <span className="material-symbols-rounded text-primary text-5xl mb-4">cyclone</span>
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
                <div className="flex items-center space-x-3" onClick={() => setSelectedUser(post.author)}>
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
              <button key={user.id} onClick={() => setSelectedUser(user)} className="bg-surface-purple/20 p-6 rounded-[40px] flex flex-col items-center border border-white/5">
                <img src={user.avatar} className="w-20 h-20 rounded-[28px] mb-4 object-cover" alt={user.name} />
                <span className="text-xs font-black text-white truncate w-full text-center">{user.name}</span>
              </button>
            ))}
          </div>
        );
      case TabType.Locais:
        return <LocaisGrid onSelect={setSelectedLocalChat} />;
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
      <div className="w-full max-w-md bg-background-dark min-h-screen relative flex flex-col border-x border-white/5">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onProfileClick={() => setSelectedUser(currentUser)}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <PinnedBar />
        
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {renderMainContent()}
        </div>

        <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} user={currentUser} onOpenProfile={() => setSelectedUser(currentUser)} onLogout={handleLogout} />

        {isCreateModalOpen && <CreateContentModal onClose={() => setIsCreateModalOpen(false)} onSuccess={refreshPosts} userId={currentUser.id} />}
        {showDbSetup && <DbSetupModal onClose={() => setShowDbSetup(false)} />}
        {selectedUser && <ProfileView user={selectedUser} currentUserId={currentUser.id} allPosts={posts} onClose={() => setSelectedUser(null)} onUpdate={handleUpdateUser} />}
        {selectedLocalChat && <ChatInterface locationContext={selectedLocalChat} onClose={() => setSelectedLocalChat(null)} />}

        {!selectedLocalChat && !selectedUser && !isCreateModalOpen && (
          <button onClick={() => setIsCreateModalOpen(true)} className="fixed bottom-10 right-10 w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xl z-30">
            <span className="material-symbols-rounded text-4xl">add</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default App;