import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Heart, MessageCircle, Star, StarOff, Pencil, X, Check } from 'lucide-react';

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
        // Para aba Destaque: apenas fotos destacadas nos últimos 3 dias
        filteredPosts = postsWithDetails.filter(p => 
          p.image_url && 
          p.featured_at && 
          new Date(p.featured_at) > threeDaysAgo
        );
      } else {
        // Para Feed: todos os posts EXCETO os que estão em destaque
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
      
      // Create notification for post owner (if not liking own post)
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

  const loadComments = async (postId: string) => {
    setLoadingComments(true);
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    // Fetch profiles separately to avoid relation issues
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
    
    // Create notification for post owner (if not commenting on own post)
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
    if (mins < 60) return `${mins}min`;
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
      {/* Lista de Posts */}
      <div className={`space-y-4 ${showFeaturedOnly ? 'px-4 pt-4' : 'px-4'}`}>
        {posts.map(post => (
          <div 
            key={post.id} 
            onClick={() => handleOpenPost(post)}
            className="bg-white/[0.03] rounded-[24px] border border-white/5 overflow-hidden cursor-pointer hover:bg-white/[0.05] transition-colors"
          >
            {/* Header do post */}
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
                  <p className="text-sm font-bold text-white">{post.profile?.full_name || 'Usuário'}</p>
                  <p className="text-[10px] text-white/40">@{post.profile?.username || 'user'} • {formatDate(post.created_at)}</p>
                </div>
              </button>

              <div className="flex items-center gap-2">
                {/* Botão de editar (apenas para dono do post) */}
                {post.user_id === currentUserId && editingPost !== post.id && (
                  <button
                    onClick={(e) => handleEdit(post, e)}
                    className="p-2 rounded-full bg-white/5 text-white/40 hover:bg-white/10 transition-colors"
                    title="Editar post"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}

                {/* Botão de destacar (apenas para fotos do próprio usuário) */}
                {post.image_url && post.user_id === currentUserId && (
                  <button
                    onClick={(e) => handleFeature(post.id, e)}
                    className={`p-2 rounded-full ${post.featured_at ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'} hover:bg-white/10 transition-colors`}
                    title={post.featured_at ? 'Remover destaque' : 'Destacar foto'}
                  >
                    {post.featured_at ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Conteúdo */}
            <div className="px-4 pb-3">
              {editingPost === post.id ? (
                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Título (opcional)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleSaveEdit(post.id, e)}
                      className="flex items-center gap-1 bg-primary px-3 py-1.5 rounded-lg text-white text-xs font-bold"
                    >
                      <Check className="w-3 h-3" /> Salvar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg text-white/60 text-xs font-bold"
                    >
                      <X className="w-3 h-3" /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {post.title && <h3 className="text-base font-bold text-white mb-1">{post.title}</h3>}
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{post.content}</p>
                </>
              )}
            </div>

            {/* Imagem - sem esticar */}
            {post.image_url && (
              <div className="flex justify-center bg-black/20">
                <img
                  src={post.image_url}
                  alt=""
                  className="max-w-full max-h-[500px] object-contain"
                />
              </div>
            )}

            {/* Badge de destaque */}
            {post.featured_at && showFeaturedOnly && (
              <div className="px-4 py-2 bg-primary/10 border-t border-primary/20">
                <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Em destaque
                </span>
              </div>
            )}

            {/* Ações */}
            <div className="p-4 flex items-center gap-6 border-t border-white/5">
              <button
                onClick={(e) => handleLike(post.id, e)}
                className={`flex items-center gap-2 ${post.is_liked ? 'text-red-500' : 'text-white/50 hover:text-white/80'} transition-colors`}
              >
                <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                <span className="text-sm font-bold">{post.likes_count}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleOpenPost(post); }}
                className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-bold">{post.comments_count}</span>
              </button>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/30 text-sm">
              {showFeaturedOnly ? 'Nenhuma foto em destaque no momento.' : 'Nenhum post ainda. Seja o primeiro!'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Post */}
      {selectedPost && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <button 
              onClick={() => { 
                setSelectedPost(null); 
                onUserClick?.(selectedPost.profile?.user_id || selectedPost.user_id); 
              }}
              className="flex items-center gap-3"
            >
              <img
                src={selectedPost.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPost.user_id}`}
                className="w-8 h-8 rounded-full object-cover"
                alt=""
              />
              <div className="text-left">
                <p className="text-sm font-bold text-white">{selectedPost.profile?.full_name || 'Usuário'}</p>
                <p className="text-[10px] text-white/40">{formatDate(selectedPost.created_at)}</p>
              </div>
            </button>
            <button onClick={() => setSelectedPost(null)} className="text-white/60 p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Conteúdo do post */}
            <div className="p-4">
              {selectedPost.title && <h2 className="text-lg font-bold text-white mb-2">{selectedPost.title}</h2>}
              <p className="text-sm text-white/70 whitespace-pre-wrap">{selectedPost.content}</p>
            </div>

            {/* Imagem sem esticar */}
            {selectedPost.image_url && (
              <div className="flex justify-center bg-black/30">
                <img
                  src={selectedPost.image_url}
                  alt=""
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
            )}

            {/* Ações */}
            <div className="p-4 flex items-center gap-6 border-b border-white/10">
              <button
                onClick={() => handleLike(selectedPost.id)}
                className={`flex items-center gap-2 ${selectedPost.is_liked ? 'text-red-500' : 'text-white/50'}`}
              >
                <Heart className={`w-6 h-6 ${selectedPost.is_liked ? 'fill-current' : ''}`} />
                <span className="text-sm font-bold">{selectedPost.likes_count}</span>
              </button>
              <div className="flex items-center gap-2 text-white/50">
                <MessageCircle className="w-6 h-6" />
                <span className="text-sm font-bold">{comments.length}</span>
              </div>
            </div>

            {/* Comentários */}
            <div className="p-4 space-y-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Comentários</h3>
              {loadingComments ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <img
                      src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`}
                      className="w-8 h-8 rounded-full object-cover"
                      alt=""
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white">@{comment.profiles?.username || 'user'}</span>
                        <span className="text-[10px] text-white/30">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-white/70">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-white/30 text-sm py-10">Nenhum comentário ainda.</p>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-white/10 pb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                placeholder="Escreva um comentário..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentInput.trim()}
                className="bg-primary px-4 rounded-full text-white font-bold text-sm disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
