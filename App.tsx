
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
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const meta = session.user.user_metadata;
          const userData = {
            id: session.user.id,
            name: meta?.full_name || session.user.email?.split('@')[0] || 'Explorador',
            username: meta?.username || 'user_' + session.user.id.slice(0, 5),
            avatar: meta?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
            bio: meta?.bio || 'Viajante do MagicTalk'
          };
          setCurrentUser(userData);
          setIsAuthenticated(true);
          await fetchInitialData(session.user.id);
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

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsAuthenticated(true);

        // Garante que o usuário local seja atualizado imediatamente com dados da sessão
        // Isso evita que fique preso no usuário padrão (Tadachi) se o fetchInitialData falhar
        const meta = session.user.user_metadata;
        const userData = {
          id: session.user.id,
          name: meta?.full_name || session.user.email?.split('@')[0] || 'Explorador',
          username: meta?.username || 'user_' + session.user.id.slice(0, 5),
          avatar: meta?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
          bio: meta?.bio || 'Viajante do MagicTalk'
        };
        setCurrentUser(userData);

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          await fetchInitialData(session.user.id);
        } else {
          setLoading(false);
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

  const fetchInitialData = async (userId: string) => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        supabaseService.getProfile(userId),
        supabaseService.getPosts(),
        supabaseService.getAllProfiles()
      ]);

      const [profileRes, postsRes, membersRes] = results;

      if (profileRes.status === 'fulfilled' && profileRes.value) {
        setCurrentUser(profileRes.value);
      }

      if (postsRes.status === 'fulfilled' && postsRes.value) {
        setPosts(postsRes.value);
      }

      if (membersRes.status === 'fulfilled' && membersRes.value) {
        setCommunityMembers(membersRes.value);
      }

      const hasMissingTableError = results.some(r =>
        r.status === 'rejected' && (r.reason?.message?.includes('cache') || r.reason?.code === '42P01')
      );

      if (hasMissingTableError) {
        setShowDbSetup(true);
      }

    } catch (error) {
      console.error("Erro na sincronização de dados.");
    } finally {
      setLoading(false);
    }
  };

  const refreshPosts = async () => {
    try {
      const dbPosts = await supabaseService.getPosts();
      setPosts(dbPosts || []);
    } catch (e) { }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);

    if (selectedUser?.id === updatedUser.id) {
      setSelectedUser(updatedUser);
    }

    setCommunityMembers(prev => prev.map(member =>
      member.id === updatedUser.id ? updatedUser : member
    ));

    setPosts(prev => prev.map(post => {
      if (post.author.id === updatedUser.id) {
        return { ...post, author: updatedUser };
      }
      return post;
    }));

    refreshPosts();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    console.log("Logout iniciado...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Erro no signOut:", error);
    } catch (e) {
      console.error("Exceção no signOut:", e);
    }

    // Força limpeza do estado local sempre
    setIsAuthenticated(false);
    setCurrentUser(CURRENT_USER);
    setPosts([]);
    setCommunityMembers([]);
    console.log("Estado local limpo.");
  };

  const renderMainContent = () => {
    if (loading && activeTab !== TabType.Chat) {
      return (
        <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-1000">
          <div className="relative w-16 h-16 mb-8">
            <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-rounded text-primary animate-pulse">auto_awesome</span>
            </div>
          </div>
          <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] italic">Sincronizando Realidade...</p>
        </div>
      );
    }

    switch (activeTab) {
      case TabType.Destaque:
        return (
          <div className="pb-40">
            <Stories members={communityMembers} onSelectArtist={(user) => setSelectedUser(user)} />

            {posts.length > 0 ? (
              <>
                <FeaturedCard post={posts[0]} />
                <div className="px-6 mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Atualizações da Comunidade</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {posts.slice(1).map(post => (
                      <div key={post.id} onClick={() => setSelectedUser(post.author)}>
                        <GridCard post={post} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="px-10 py-20 text-center opacity-40">
                <span className="material-symbols-rounded text-6xl mb-4 text-primary">auto_stories</span>
                <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">O mundo está em silêncio</h4>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-relaxed">Seja o primeiro a escrever a história deste reino.<br />Clique no botão + abaixo.</p>
              </div>
            )}
          </div>
        );
      case TabType.Feed:
        return (
          <div className="p-6 grid grid-cols-1 gap-6 pb-40">
            <div className="px-2 mb-2 flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30">Linha do Tempo Real</h3>
              <span className="text-[9px] font-black text-primary uppercase tracking-widest">{posts.length} Atividades</span>
            </div>

            {posts.length > 0 ? (
              posts.map(post => (
                <div key={post.id} className="bg-surface-purple/30 rounded-[40px] overflow-hidden border border-white/5 shadow-2xl animate-in fade-in duration-700 hover:border-primary/20 transition-all group">
                  {post.imageUrl && (
                    <div className="relative aspect-video overflow-hidden">
                      <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>
                  )}
                  <div className="p-8">
                    <h4 className="text-white font-black text-xl mb-2 tracking-tight drop-shadow-sm">{post.title}</h4>
                    <p className="text-white/50 text-[13px] font-medium leading-relaxed line-clamp-3 mb-6 italic">"{post.excerpt}"</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center space-x-3 cursor-pointer group/author" onClick={() => setSelectedUser(post.author)}>
                        <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary to-secondary">
                          <img src={post.author.avatar} className="w-7 h-7 rounded-full border border-background-dark" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-white/80 group-hover/author:text-primary transition-colors">{post.author.name}</span>
                          <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-0.5">{post.timestamp}</p>
                        </div>
                      </div>
                      <button className="bg-white/5 px-5 py-2.5 rounded-2xl text-white text-[9px] font-black uppercase tracking-wider hover:bg-white/10 transition-all border border-white/10">Expandir</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-32 text-center opacity-20">
                <p className="text-sm font-black uppercase tracking-[0.3em]">Nenhuma postagem real ainda.</p>
              </div>
            )}
          </div>
        );
      case TabType.Global:
        return (
          <div className="p-8 pb-40 space-y-12 animate-in zoom-in duration-700">
            <div className="flex items-center justify-between px-2">
              <div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl">Habitantes</h2>
                <div className="flex items-center space-x-2 mt-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                  <p className="text-[10px] font-black text-primary/80 uppercase tracking-[0.4em]">Explorando a Rede</p>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-3xl px-6 py-3 rounded-2xl border border-white/10 shadow-xl">
                <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">{communityMembers.length} Registrados</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {communityMembers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="group relative flex flex-col items-center p-8 bg-surface-purple/20 rounded-[48px] border border-white/5 hover:bg-surface-purple/40 transition-all duration-700 hover:border-primary/40 active:scale-[0.96] shadow-3xl overflow-hidden"
                >
                  <div className="relative mb-6">
                    <div className="absolute -inset-4 bg-gradient-to-tr from-primary via-secondary to-primary rounded-[32px] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                    <img src={user.avatar} className="relative w-24 h-24 rounded-[32px] object-cover border border-white/10 shadow-2xl group-hover:rotate-3 transition-transform duration-700" alt={user.name} />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-background-dark rounded-full shadow-2xl"></div>
                  </div>
                  <h4 className="text-base font-black text-white italic tracking-tight text-center truncate w-full px-2 group-hover:text-primary transition-colors">
                    {user.name}
                  </h4>
                  <h5 className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mt-2">
                    @{user.username}
                  </h5>
                </button>
              ))}

              {communityMembers.length === 0 && (
                <div className="col-span-2 py-20 text-center opacity-20">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">Aguardando os primeiros cidadãos...</p>
                </div>
              )}
            </div>
          </div>
        );
      case TabType.Locais:
        return <LocaisGrid onSelect={(id) => setSelectedLocalChat(id)} />;
      case TabType.Chat:
        return <ChatInterface onClose={() => setActiveTab(TabType.Destaque)} />;
      default:
        return null;
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 bg-background-dark flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-30 blur-[120px] animate-pulse pointer-events-none"></div>
        <div className="relative group">
          <div className="absolute -inset-16 bg-primary/20 blur-[80px] rounded-full group-hover:opacity-100 opacity-60 transition-opacity animate-pulse"></div>
          <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase animate-bounce scale-110 drop-shadow-[0_0_30px_rgba(139,92,246,0.5)]">MagicTalk</h1>
        </div>
        <div className="mt-16 w-64 h-1.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
          <div className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full animate-[loading_2s_ease-in-out_infinite] w-full origin-left"></div>
        </div>
        <p className="mt-8 text-[11px] font-black text-primary/40 uppercase tracking-[0.5em] animate-pulse italic">Sincronizando Realidade...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex justify-center min-h-screen bg-[#020105] font-display selection:bg-primary/30">
      <div className="w-full max-w-md bg-background-dark min-h-screen relative shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col border-x border-white/5">
        <div className="sticky top-0 z-40 shadow-2xl">
          <Header
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            currentUser={currentUser}
            onProfileClick={() => setSelectedUser(currentUser)}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
          <PinnedBar />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div key={activeTab} className="animate-in zoom-in duration-700">
            {renderMainContent()}
          </div>
        </div>

        <SidebarMenu
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={currentUser}
          onOpenProfile={() => setSelectedUser(currentUser)}
          onLogout={handleLogout}
        />

        {isCreateModalOpen && (
          <CreateContentModal
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => { refreshPosts(); fetchInitialData(currentUser.id); }}
            userId={currentUser.id}
          />
        )}

        {showDbSetup && (
          <DbSetupModal onClose={() => setShowDbSetup(false)} />
        )}

        {selectedUser && (
          <ProfileView
            user={selectedUser}
            currentUserId={currentUser.id}
            allPosts={posts}
            onClose={() => setSelectedUser(null)}
            onUpdate={handleUpdateUser}
          />
        )}

        {selectedLocalChat && (
          <ChatInterface
            locationContext={selectedLocalChat}
            onClose={() => setSelectedLocalChat(null)}
          />
        )}

        {!selectedLocalChat && !selectedUser && !isCreateModalOpen && (
          <div className="fixed bottom-10 left-0 right-0 px-8 flex justify-end items-center z-30 pointer-events-none">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="pointer-events-auto relative w-16 h-16 active:scale-[0.85] transition-all group"
            >
              <div className="absolute -inset-2 bg-gradient-to-tr from-primary via-secondary to-primary rounded-[24px] blur-2xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-16 h-16 bg-surface-purple rounded-[22px] flex items-center justify-center border-2 border-white/20 shadow-4xl group-hover:border-white/40 transition-all">
                <span className="material-symbols-rounded text-white text-4xl font-black">add</span>
              </div>
            </button>
          </div>
        )}

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1.5 bg-white/10 rounded-full z-50 backdrop-blur-xl"></div>
      </div>
    </div>
  );
};

export default App;
