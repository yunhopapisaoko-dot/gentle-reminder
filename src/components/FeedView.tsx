import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Heart, MessageCircle, Star, StarOff, Pencil, X, Check, MoreVertical, Trash2, Send, Share2 } from 'lucide-react';

interface FeedPost {
  id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
  featured_at: string | null;
  user_id: string;
  profile?: {
    user_id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

interface FeedViewProps {
  currentUserId: string;
  onUserClick?: (userId: string) => void;
  showFeaturedOnly?: boolean;
}

export const FeedView: React.FC<FeedViewProps> = ({ currentUserId, onUserClick, showFeaturedOnly = false }) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    
    const channel = supabase
      .channel('feed-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        fetchPosts();
        if (selectedPost) loadComments(selectedPost.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, showFeaturedOnly]);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithDetails = await Promise.all((postsData || []).map(async (post) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .eq('user_id', post.user_id)
          .single();

        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const { count: commentsCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const { data: likedData } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', currentUserId)
          .maybeSingle();

        return {
          ...post,
          profile: profileData,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          is_liked: !!likedData
        };
      }));

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      let filteredPosts: FeedPost[];
      
      if (showFeaturedOnly) {
        filteredPosts = postsWithDetails.filter(p => 
          p.image_url && 
          p.featured_at && 
          new Date(p.featured_at) > threeDaysAgo
        );
      } else {
        filteredPosts = postsWithDetails.filter(p => 
          !p.featured_at || 
          !p.image_url ||
          new Date(p.featured_at) <= threeDaysAgo
        );
      }

      setPosts(filteredPosts);
    } catch (err) {
      console.error('Erro ao buscar posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const post = posts.find(p => p.id === postId) || selectedPost;
    if (!post) return;

    if (post.is_liked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: currentUserId });
      
      if (post.user_id !== currentUserId) {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', currentUserId)
          .single();
        
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: currentUserId,
          actor_name: myProfile?.full_name || 'Usuário',
          actor_avatar: myProfile?.avatar_url,
          type: 'like',
          post_id: postId
        });
      }
    }

    const updatePost = (p: FeedPost) => 
      p.id === postId 
        ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 }
        : p;

    setPosts(prev => prev.map(updatePost));
    if (selectedPost?.id === postId) {
      setSelectedPost(prev => prev ? updatePost(prev) : null);
    }
  };

  const handleFeature = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const post = posts.find(p => p.id === postId);
    if (!post || !post.image_url) return;
    if (post.user_id !== currentUserId) return;

    const { data: existingFeatured } = await supabase
      .from('posts')
      .select('id, featured_at')
      .eq('user_id', currentUserId)
      .not('featured_at', 'is', null);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const activeFeatured = existingFeatured?.find(p => 
      p.id !== postId && 
      p.featured_at && 
      new Date(p.featured_at) > threeDaysAgo
    );

    if (activeFeatured && !post.featured_at) {
      alert('Você já tem uma foto em destaque! Aguarde ela expirar (3 dias) para destacar outra.');
      return;
    }

    const newFeaturedAt = post.featured_at ? null : new Date().toISOString();
    await supabase.from('posts').update({ featured_at: newFeaturedAt }).eq('id', postId);
    fetchPosts();
  };

  const handleEdit = (post: FeedPost, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingPost(post.id);
    setEditTitle(post.title || '');
    setEditContent(post.content);
  };

  const handleSaveEdit = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await supabase.from('posts').update({ 
      title: editTitle.trim() || null, 
      content: editContent.trim() 
    }).eq('id', postId);
    setEditingPost(null);
    fetchPosts();
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingPost(null);
  };

  const handleDelete = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este post?')) return;
    
    await supabase.from('comments').delete().eq('post_id', postId);
    await supabase.from('likes').delete().eq('post_id', postId);
    await supabase.from('posts').delete().eq('id', postId);
    
    setMenuOpen(null);
    if (selectedPost?.id === postId) setSelectedPost(null);
    fetchPosts();
  };

  const toggleMenu = (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMenuOpen(menuOpen === postId ? null : postId);
  };

  const loadComments = async (postId: string) => {
    setLoadingComments(true);
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    const commentsWithProfiles = await Promise.all((commentsData || []).map(async (comment) => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('user_id', comment.user_id)
        .maybeSingle();
      return { ...comment, profiles: profileData };
    }));
    
    setComments(commentsWithProfiles);
    setLoadingComments(false);
  };

  const handleOpenPost = async (post: FeedPost) => {
    setSelectedPost(post);
    await loadComments(post.id);
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !selectedPost) return;
    
    const commentContent = commentInput.trim();
    
    const { data: newComment } = await supabase.from('comments').insert({
      post_id: selectedPost.id,
      user_id: currentUserId,
      content: commentContent
    }).select('id').single();
    
    if (selectedPost.user_id !== currentUserId) {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', currentUserId)
        .single();
      
      await supabase.from('notifications').insert({
        user_id: selectedPost.user_id,
        actor_id: currentUserId,
        actor_name: myProfile?.full_name || 'Usuário',
        actor_avatar: myProfile?.avatar_url,
        type: 'comment',
        post_id: selectedPost.id,
        comment_id: newComment?.id || null,
        content: commentContent.substring(0, 100)
      });
    }
    
    setCommentInput('');
    loadComments(selectedPost.id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-40">
      <div className={`space-y-4 ${showFeaturedOnly ? 'px-4 pt-4' : 'px-4'}`}>
        {posts.map(post => (
          <div 
            key={post.id} 
            onClick={() => handleOpenPost(post)}
            className="bg-white/[0.03] rounded-[24px] border border-white/5 overflow-hidden cursor-pointer hover:bg-white/[0.05] transition-all active:scale-[0.98]"
          >
            <div className="p-4 flex items-center justify-between">
              <button 
                onClick={(e) => { e.stopPropagation(); onUserClick?.(post.profile?.user_id || post.user_id); }}
                className="flex items-center gap-3"
              >
                <img
                  src={post.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
                  className="w-10 h-10 rounded-full border border-white/10 object-cover"
                  alt=""
                />
                <div className="text-left">
                  <p className="text-sm font-bold text-white leading-none">{post.profile?.full_name || 'Usuário'}</p>
                  <p className="text-[10px] text-white/30 mt-1 uppercase font-black tracking-widest">@{post.profile?.username || 'user'} • {formatDate(post.created_at)}</p>
                </div>
              </button>

              <div className="flex items-center gap-2">
                {post.image_url && post.user_id === currentUserId && (
                  <button
                    onClick={(e) => handleFeature(post.id, e)}
                    className={`p-2 rounded-xl ${post.featured_at ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'} hover:bg-white/10 transition-colors`}
                  >
                    {post.featured_at ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                  </button>
                )}

                {post.user_id === currentUserId && editingPost !== post.id && (
                  <div className="relative">
                    <button
                      onClick={(e) => toggleMenu(post.id, e)}
                      className="p-2 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {menuOpen === post.id && (
                      <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden min-w-[150px] animate-in zoom-in duration-200">
                        <button
                          onClick={(e) => { handleEdit(post, e); setMenuOpen(null); }}
                          className="w-full px-5 py-4 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white hover:bg-white/5 transition-colors border-b border-white/5"
                        >
                          <Pencil className="w-4 h-4 text-primary" />
                          Editar
                        </button>
                        <button
                          onClick={(e) => handleDelete(post.id, e)}
                          className="w-full px-5 py-4 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 pb-3">
              {editingPost === post.id ? (
                <div className="space-y-3" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Título (opcional)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                  />
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white resize-none focus:ring-1 focus:ring-primary outline-none"
                    rows={3}
                  />
                  <div className="flex gap-2 pb-2">
                    <button
                      onClick={(e) => handleSaveEdit(post.id, e)}
                      className="flex-1 bg-primary py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 bg-white/5 py-2.5 rounded-xl text-white/40 text-[10px] font-black uppercase tracking-widest"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {post.title && <h3 className="text-base font-black text-white italic tracking-tight mb-1 uppercase">{post.title}</h3>}
                  <p className="text-sm text-white/60 leading-relaxed font-medium">
                    {post.content}
                  </p>
                </>
              )}
            </div>

            {post.image_url && (
              <div className="flex justify-center bg-black/40 overflow-hidden">
                <img
                  src={post.image_url}
                  alt=""
                  className="max-w-full max-h-[400px] object-contain transition-transform duration-700 hover:scale-105"
                />
              </div>
            )}

            {post.featured_at && showFeaturedOnly && (
              <div className="px-5 py-2 bg-primary/10 border-t border-primary/20 flex items-center justify-between">
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-current" /> Destaque da Comunidade
                </span>
                <span className="text-[8px] font-bold text-white/20 uppercase">Expira em 3 dias</span>
              </div>
            )}

            <div className="p-4 px-6 flex items-center gap-8 border-t border-white/5">
              <button
                onClick={(e) => handleLike(post.id, e)}
                className={`flex items-center gap-2 group transition-all ${post.is_liked ? 'text-red-500' : 'text-white/30 hover:text-white/60'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${post.is_liked ? 'bg-red-500/10' : 'bg-white/5 group-hover:bg-white/10'}`}>
                  <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-xs font-black tracking-widest">{post.likes_count}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleOpenPost(post); }}
                className="flex items-center gap-2 group text-white/30 hover:text-white/60 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-all">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-black tracking-widest">{post.comments_count}</span>
              </button>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-32 opacity-20">
            <span className="material-symbols-rounded text-6xl mb-4">explore</span>
            <p className="text-sm font-black uppercase tracking-[0.3em]">
              {showFeaturedOnly ? 'Nenhum destaque hoje' : 'Feed em silêncio...'}
            </p>
          </div>
        )}
      </div>

      {/* NOVO: Modal de Detalhes Moderno */}
      {selectedPost && (
        <div className="fixed inset-0 z-[550] bg-background-dark flex flex-col h-[100dvh] overflow-hidden animate-in slide-in-right">
          
          {/* Custom Header */}
          <div className="pt-14 px-6 pb-5 bg-black/40 backdrop-blur-3xl border-b border-white/5 relative z-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedPost(null)}
                className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <button 
                onClick={() => { 
                  setSelectedPost(null); 
                  onUserClick?.(selectedPost.profile?.user_id || selectedPost.user_id); 
                }}
                className="flex items-center gap-3 text-left"
              >
                <img
                  src={selectedPost.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPost.user_id}`}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-lg"
                  alt=""
                />
                <div>
                  <p className="text-sm font-black text-white leading-none">{selectedPost.profile?.full_name || 'Membro'}</p>
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">Ver Perfil</p>
                </div>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
               {selectedPost.user_id === currentUserId && (
                 <button onClick={(e) => toggleMenu('modal-' + selectedPost.id, e)} className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-white active:scale-90">
                    <MoreVertical className="w-5 h-5" />
                 </button>
               )}
            </div>

            {/* Menu Contextual do Modal */}
            {menuOpen === 'modal-' + selectedPost.id && (
              <div className="absolute right-6 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden min-w-[160px] animate-in zoom-in duration-200">
                <button
                  onClick={(e) => { handleEdit(selectedPost, e); setMenuOpen(null); setSelectedPost(null); }}
                  className="w-full px-5 py-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 border-b border-white/5"
                >
                  <Pencil className="w-4 h-4 text-primary" /> Editar Post
                </button>
                <button
                  onClick={(e) => { handleDelete(selectedPost.id, e); setSelectedPost(null); }}
                  className="w-full px-5 py-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" /> Excluir Post
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide pb-32">
            {/* Post Content Area */}
            <div className="p-6 pb-4">
              {selectedPost.title && (
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-4 leading-tight">
                  {selectedPost.title}
                </h2>
              )}
              <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 mb-6">
                <p className="text-[15px] font-medium text-white/80 leading-relaxed whitespace-pre-wrap italic">
                  "{selectedPost.content}"
                </p>
              </div>
            </div>

            {/* Post Image Area */}
            {selectedPost.image_url && (
              <div className="relative group px-4 mb-8">
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 via-secondary/20 to-primary/20 rounded-[40px] blur-2xl opacity-40"></div>
                <div className="relative rounded-[36px] overflow-hidden bg-black/40 border border-white/10 shadow-2xl">
                  <img
                    src={selectedPost.image_url}
                    alt=""
                    className="w-full max-h-[70vh] object-contain mx-auto"
                  />
                </div>
              </div>
            )}

            {/* Interaction Bar */}
            <div className="px-8 flex items-center justify-between mb-8">
              <div className="flex items-center gap-8">
                <button
                  onClick={() => handleLike(selectedPost.id)}
                  className={`flex flex-col items-center gap-1.5 transition-all ${selectedPost.is_liked ? 'text-red-500 scale-110' : 'text-white/30 hover:text-white/50'}`}
                >
                  <Heart className={`w-7 h-7 ${selectedPost.is_liked ? 'fill-current' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{selectedPost.likes_count}</span>
                </button>
                <div className="flex flex-col items-center gap-1.5 text-white/30">
                  <MessageCircle className="w-7 h-7" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{comments.length}</span>
                </div>
                <button className="flex flex-col items-center gap-1.5 text-white/30 hover:text-primary transition-colors">
                  <Share2 className="w-7 h-7" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Compartilhar</span>
                </button>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Publicado em</p>
                <p className="text-[11px] font-black text-white/50 italic">{formatDate(selectedPost.created_at)}</p>
              </div>
            </div>

            {/* Comments Section */}
            <div className="px-6 space-y-6">
              <div className="flex items-center gap-3 px-2 mb-2">
                <div className="w-1 h-4 bg-primary rounded-full"></div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Discussão</h3>
              </div>

              {loadingComments ? (
                <div className="py-20 flex flex-col items-center justify-center opacity-40">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Sincronizando vozes...</p>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-5">
                  {comments.map(comment => (
                    <div key={comment.id} className="group flex gap-4 animate-in slide-in-from-bottom duration-300">
                      <img
                        src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`}
                        className="w-10 h-10 rounded-[14px] object-cover border border-white/10 flex-shrink-0 shadow-lg"
                        alt=""
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-black text-white truncate">
                            {comment.profiles?.full_name || 'Viajante'}
                            <span className="ml-2 text-[9px] text-primary font-black uppercase tracking-tighter opacity-60">@{comment.profiles?.username || 'user'}</span>
                          </p>
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{formatDate(comment.created_at)}</span>
                        </div>
                        <div className="bg-white/[0.04] border border-white/5 rounded-2xl rounded-tl-none p-4 hover:bg-white/[0.06] transition-colors">
                          <p className="text-xs font-bold text-white/70 leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center mx-2 group">
                  <MessageCircle className="w-12 h-12 text-white/10 mb-4 group-hover:scale-110 transition-transform duration-500" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">O silêncio ecoa... Inicie a conversa!</p>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Input Bar */}
          <div className="px-6 py-8 bg-black/60 backdrop-blur-3xl border-t border-white/10 pb-12 relative z-30">
            <div className="relative group max-w-lg mx-auto">
              <input
                type="text"
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                placeholder="Qual o seu comentário?"
                className="w-full bg-white/[0.05] border border-white/10 rounded-[28px] pl-6 pr-16 py-4 text-sm text-white font-bold placeholder:text-white/10 focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentInput.trim()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  commentInput.trim() 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 active:scale-90 hover:scale-105' 
                    : 'bg-white/5 text-white/10'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};