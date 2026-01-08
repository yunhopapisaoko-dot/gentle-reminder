import React, { useEffect, useMemo, useState } from 'react';
import { User, Post } from '../types';
import { PostDetailView } from './PostDetailView';
import { EditProfileModal } from './EditProfileModal';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../supabase';
import { DISEASE_DETAILS } from '../constants';

interface UserConversation {
  id: string;
  other_user: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  message_count: number;
}

interface ProfileViewProps {
  user: User;
  currentUserId: string;
  currentUserIsLeader?: boolean;
  allPosts?: Post[];
  onClose: () => void;
  onUpdate?: (updatedUser: User) => void;
  onStartChat?: (userId: string) => void;
  onViewConversation?: (conversationId: string, otherUser: { id: string; full_name: string; username: string; avatar_url: string | null }) => void;
  onOpenProfile?: (userId: string) => void;
}

// Configuração visual das raças: Cores e Ícones oficiais sincronizados
const RACE_THEMES: Record<string, { color: string, icon: string, bg: string }> = {
  'Draeven': { color: 'text-rose-500', icon: 'local_fire_department', bg: 'bg-rose-500/10' },
  'Sylven': { color: 'text-emerald-500', icon: 'eco', bg: 'bg-emerald-500/10' },
  'Lunari': { color: 'text-cyan-400', icon: 'dark_mode', bg: 'bg-cyan-400/10' },
};

export const ProfileView: React.FC<ProfileViewProps> = ({ user, currentUserId, currentUserIsLeader, allPosts = [], onClose, onUpdate, onStartChat, onViewConversation, onOpenProfile }) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'Posts' | 'Mídia' | 'Coleção' | 'Mensagens'>('Posts');
  const [loadedPosts, setLoadedPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [userConversations, setUserConversations] = useState<UserConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  
  const isOwnProfile = String(user.id).toLowerCase() === String(currentUserId).toLowerCase();
  const showMessagesTab = currentUserIsLeader && !isOwnProfile;

  // Preferir posts já carregados no estado global, mas garantir carregamento no perfil
  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      const fromAll = allPosts.filter(p => (p.author?.id || '') === user.id);
      if (mounted) setLoadedPosts(fromAll);

      // Se não houver posts locais, busca direto do banco
      if (fromAll.length === 0) {
        try {
          if (mounted) setIsLoadingPosts(true);
          const fresh = await supabaseService.getPostsByUser(user.id);
          if (mounted) setLoadedPosts(fresh);
        } catch (e) {
          console.error('Erro ao buscar posts do perfil:', e);
        } finally {
          if (mounted) setIsLoadingPosts(false);
        }
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [user.id, allPosts]);

  // Fetch user's private conversations (for admin view)
  useEffect(() => {
    if (!showMessagesTab) return;
    
    let mounted = true;
    const fetchUserConversations = async () => {
      setIsLoadingConversations(true);
      try {
        // Get all conversations where this user is a participant
        const { data: convs } = await supabase
          .from('private_conversations')
          .select('*')
          .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
          .order('updated_at', { ascending: false });

        if (!convs || convs.length === 0) {
          if (mounted) setUserConversations([]);
          return;
        }

        // Get other user IDs
        const otherUserIds = convs.map(c => 
          c.participant_1 === user.id ? c.participant_2 : c.participant_1
        );

        // Fetch profiles for other users
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .in('user_id', otherUserIds);

        // Get message count and last message for each conversation
        const conversationsWithDetails = await Promise.all(
          convs.map(async (conv) => {
            const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
            const otherUser = profiles?.find(p => p.user_id === otherUserId);

            // Get last message
            const { data: lastMsg } = await supabase
              .from('private_messages')
              .select('content, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Get message count
            const { count } = await supabase
              .from('private_messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id);

            return {
              id: conv.id,
              other_user: otherUser ? {
                id: otherUser.user_id,
                full_name: otherUser.full_name,
                username: otherUser.username,
                avatar_url: otherUser.avatar_url
              } : { id: otherUserId, full_name: 'Usuário', username: 'user', avatar_url: null },
              last_message: lastMsg || undefined,
              message_count: count || 0
            } as UserConversation;
          })
        );

        if (mounted) setUserConversations(conversationsWithDetails);
      } catch (error) {
        console.error('Error fetching user conversations:', error);
      } finally {
        if (mounted) setIsLoadingConversations(false);
      }
    };

    fetchUserConversations();
    return () => { mounted = false; };
  }, [user.id, showMessagesTab]);

  const userPosts = useMemo(() => {
    return loadedPosts;
  }, [loadedPosts]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const raceTheme = user.race ? RACE_THEMES[user.race] : null;

  return (
    <div className={`fixed inset-0 z-[800] bg-background-dark flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-right' : 'animate-in slide-in-right'}`}>
      
      {/* Botões de Ação Superiores */}
      <div className="absolute top-0 left-0 right-0 z-[250] px-6 pt-12 flex justify-between items-center pointer-events-none">
        <button 
          onClick={handleClose}
          className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all pointer-events-auto shadow-2xl"
        >
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>

        {isOwnProfile ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="px-6 h-12 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-[0_10px_40px_rgba(139,92,246,0.6)] active:scale-90 transition-all pointer-events-auto flex items-center space-x-2 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
            <span className="material-symbols-rounded text-lg">edit</span>
            <span>Editar Perfil</span>
          </button>
        ) : (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onStartChat?.(user.id);
            }}
            className="px-6 h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-[0_10px_40px_rgba(6,182,212,0.5)] active:scale-90 transition-all pointer-events-auto flex items-center space-x-2 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
            <span className="material-symbols-rounded text-lg">chat</span>
            <span>Mensagem</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Banner Section */}
        <div className="relative h-[48vh] overflow-hidden">
          <img 
            src={user.banner || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000'} 
            className="w-full h-full object-cover scale-105" 
            alt="Banner" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-background-dark"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center">
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary via-secondary to-primary rounded-[48px] blur-2xl opacity-40 animate-pulse"></div>
              <div className="relative w-32 h-32 rounded-[42px] bg-background-dark p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <img key={user.avatar} src={user.avatar} className="w-full h-full object-cover rounded-[38px] border-2 border-white/10" alt={user.name} />
              </div>
              {user.isLeader && (
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-2xl shadow-xl border-4 border-background-dark flex items-center justify-center">
                  <span className="material-symbols-rounded text-lg fill-current">shield_person</span>
                </div>
              )}
              {user.currentDisease && (
                <div className="absolute -top-2 -left-2 bg-red-500 text-white p-2 rounded-2xl shadow-xl border-4 border-background-dark flex items-center justify-center animate-pulse">
                  <span className="material-symbols-rounded text-lg">coronavirus</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-3">
                 {user.isLeader && (
                  <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center space-x-1.5">
                      <span className="material-symbols-rounded text-sm">stars</span>
                      <span>Líder</span>
                    </span>
                  </div>
                )}
                {raceTheme && (
                  <div className={`px-5 py-2 rounded-full ${raceTheme.bg} border border-white/10 backdrop-blur-xl flex items-center space-x-2 transition-all hover:scale-105`}>
                    <span className={`material-symbols-rounded text-[14px] ${raceTheme.color}`}>{raceTheme.icon}</span>
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${raceTheme.color}`}>{user.race}</span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">{user.name}</h2>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-primary"></span>
                  <span className="text-xs font-black text-primary tracking-[0.4em] uppercase italic">@{user.username}</span>
                  <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-primary"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info & Tabs Section */}
        <div className="px-6 space-y-8 pb-32">
          {/* Disease Card - only show if user has a disease */}
          {user.currentDisease && DISEASE_DETAILS[user.currentDisease] && (
            <div className="relative bg-gradient-to-br from-red-900/40 to-red-950/40 backdrop-blur-3xl p-6 rounded-[32px] border border-red-500/30 overflow-hidden animate-pulse-slow">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center flex-shrink-0 border border-red-500/30">
                  <span className="material-symbols-rounded text-2xl text-red-400">{DISEASE_DETAILS[user.currentDisease].icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Enfermo</span>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <h4 className="text-lg font-black text-white mb-2">{DISEASE_DETAILS[user.currentDisease].name}</h4>
                  <p className="text-xs text-white/50 mb-3 italic">{DISEASE_DETAILS[user.currentDisease].description}</p>
                  <div className="flex flex-wrap gap-2">
                    {DISEASE_DETAILS[user.currentDisease].symptoms.map((symptom, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-full bg-red-500/20 text-[10px] font-bold text-red-300 border border-red-500/20">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="relative bg-white/[0.03] backdrop-blur-3xl p-8 rounded-[48px] border border-white/5 text-center overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
             <p className="text-sm font-medium text-white/70 leading-relaxed italic relative z-10">
                "{user.bio || 'Explorando as fronteiras da MagicTalk.'}"
             </p>
          </div>

          <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded-[32px] border border-white/5 sticky top-0 z-20 backdrop-blur-2xl shadow-xl">
            {(showMessagesTab ? ['Posts', 'Mídia', 'Mensagens'] as const : ['Posts', 'Mídia', 'Coleção'] as const).map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat as any)}
                className={`flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-500 relative overflow-hidden ${
                  activeCategory === cat ? 'bg-white text-black shadow-2xl' : 'text-white/25 hover:text-white/40'
                }`}
              >
                {cat === 'Mensagens' && <span className="material-symbols-rounded text-xs mr-1">visibility</span>}
                {cat}
                {activeCategory === cat && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary/20"></div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {activeCategory === 'Posts' && (
              <div className="grid grid-cols-1 gap-5">
                {isLoadingPosts ? (
                  <div className="py-24 text-center opacity-60 flex flex-col items-center">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Carregando posts…</p>
                  </div>
                ) : userPosts.length > 0 ? userPosts.map((post) => (
                  <button 
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="flex flex-col text-left bg-white/[0.03] rounded-[40px] border border-white/5 overflow-hidden p-8 hover:bg-white/[0.06] hover:border-white/10 transition-all group relative active:scale-[0.98]"
                  >
                    {post.videoUrl ? (
                      <div className="w-full h-48 rounded-3xl overflow-hidden mb-6 -mt-2 relative bg-black">
                        <video src={post.videoUrl} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <span className="material-symbols-rounded text-white text-2xl">play_arrow</span>
                          </div>
                        </div>
                      </div>
                    ) : post.imageUrl ? (
                      <div className="w-full h-48 rounded-3xl overflow-hidden mb-6 -mt-2">
                        <img src={post.imageUrl} className="w-full h-full object-cover" alt="Foto do post" loading="lazy" />
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-secondary/20 p-[1px]">
                          <img src={post.author.avatar} className="w-full h-full rounded-2xl object-cover" alt={`Avatar de ${post.author.name}`} loading="lazy" />
                        </div>
                        <div>
                          <span className="text-[13px] font-black text-white tracking-tight">{post.author.name}</span>
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">{post.timestamp}</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/10 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                        <span className="material-symbols-rounded text-lg">open_in_new</span>
                      </div>
                    </div>
                    <h4 className="text-lg font-black text-white mb-3 tracking-tight italic uppercase">{post.title}</h4>
                    <p className="text-sm font-medium text-white/50 leading-relaxed line-clamp-3 italic opacity-80 group-hover:opacity-100 transition-opacity">
                      "{post.excerpt}"
                    </p>
                  </button>
                )) : (
                  <div className="py-24 text-center opacity-30 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 animate-pulse">
                      <span className="material-symbols-rounded text-4xl text-white/20">history_edu</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Silêncio na Linha do Tempo</p>
                  </div>
                )}
              </div>
            )}
            
            {activeCategory === 'Mídia' && (
              <div className="grid grid-cols-3 gap-2">
                {userPosts.filter(p => p.imageUrl || p.videoUrl).length > 0 ? (
                  userPosts.filter(p => p.imageUrl || p.videoUrl).map((post) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/5 hover:border-primary/50 transition-all group relative active:scale-95"
                    >
                      {post.videoUrl ? (
                        <>
                          <video src={post.videoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" muted />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <span className="material-symbols-rounded text-white text-xl">play_arrow</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                        <span className="material-symbols-rounded text-white text-xl">open_in_full</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-3 py-24 text-center opacity-30 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 animate-pulse">
                      <span className="material-symbols-rounded text-4xl text-white/20">photo_library</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhuma mídia ainda</p>
                  </div>
                )}
              </div>
            )}

            {activeCategory === 'Coleção' && (
               <div className="py-32 text-center opacity-10 flex flex-col items-center">
                  <span className="material-symbols-rounded text-6xl mb-4">construction</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">Módulo em Desenvolvimento</p>
               </div>
            )}

            {activeCategory === 'Mensagens' && showMessagesTab && (
              <div className="space-y-3">
                {isLoadingConversations ? (
                  <div className="py-24 text-center opacity-60 flex flex-col items-center">
                    <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Carregando conversas…</p>
                  </div>
                ) : userConversations.length > 0 ? (
                  <>
                    <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4">
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-rounded text-sm">shield_person</span>
                        Acesso Restrito - {userConversations.length} conversa(s) encontrada(s)
                      </p>
                    </div>
                    {userConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => onViewConversation?.(conv.id, conv.other_user)}
                        className="w-full flex items-center gap-4 p-4 bg-white/[0.03] rounded-3xl border border-white/5 hover:bg-white/[0.06] hover:border-amber-500/30 transition-all group active:scale-[0.98]"
                      >
                        <div className="relative">
                          <img 
                            src={conv.other_user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.other_user.id}`} 
                            className="w-14 h-14 rounded-2xl object-cover border border-white/10"
                            alt={conv.other_user.full_name}
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                            <span className="material-symbols-rounded text-amber-500 text-xs">chat</span>
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-black text-white tracking-tight">{conv.other_user.full_name}</p>
                          <p className="text-[10px] font-bold text-white/40">@{conv.other_user.username}</p>
                          {conv.last_message && (
                            <p className="text-[10px] text-white/30 mt-1 line-clamp-1 italic">
                              "{conv.last_message.content}"
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="px-2 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                            <span className="text-[9px] font-black text-amber-500">{conv.message_count} msg</span>
                          </div>
                          <span className="material-symbols-rounded text-white/20 group-hover:text-amber-500 transition-colors">arrow_forward</span>
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="py-24 text-center opacity-30 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                      <span className="material-symbols-rounded text-4xl text-white/20">forum</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhuma conversa encontrada</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && isOwnProfile && (
        <EditProfileModal 
          user={user} 
          onClose={() => setIsEditing(false)} 
          onUpdate={(updated) => {
            if (onUpdate) onUpdate(updated);
          }}
        />
      )}

      {selectedPost && (
        <PostDetailView 
          post={selectedPost} 
          currentUser={{ ...user, id: currentUserId }} 
          onClose={() => setSelectedPost(null)}
          onPostDeleted={async () => {
            setSelectedPost(null);
            // Recarregar posts após exclusão
            try {
              const fresh = await supabaseService.getPostsByUser(user.id);
              setLoadedPosts(fresh);
            } catch (e) {
              console.error('Erro ao recarregar posts:', e);
            }
          }}
          onUserClick={(userId) => onOpenProfile?.(userId)}
        />
      )}
    </div>
  );
};