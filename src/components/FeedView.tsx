import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Heart, MessageCircle, Star, StarOff } from 'lucide-react';

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
}

export const FeedView: React.FC<FeedViewProps> = ({ currentUserId, onUserClick }) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    fetchPosts();
    
    // Realtime subscription para posts
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
  }, [currentUserId]);

  const fetchPosts = async () => {
    try {
      // Buscar posts
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar profiles, likes count, comments count e status de like do usuário
      const postsWithDetails = await Promise.all((postsData || []).map(async (post) => {
        // Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .eq('user_id', post.user_id)
          .single();

        // Likes count
        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Comments count
        const { count: commentsCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // User liked
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

      // Filtrar post em destaque (foto destacada nos últimos 3 dias)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const featured = postsWithDetails.find(p => 
        p.image_url && 
        p.featured_at && 
        new Date(p.featured_at) > threeDaysAgo
      );

      setFeaturedPost(featured || null);
      setPosts(postsWithDetails);
    } catch (err) {
      console.error('Erro ao buscar posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.is_liked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: currentUserId });
    }

    // Atualização otimista
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 }
        : p
    ));
    if (featuredPost?.id === postId) {
      setFeaturedPost(prev => prev ? { ...prev, is_liked: !prev.is_liked, likes_count: prev.is_liked ? prev.likes_count - 1 : prev.likes_count + 1 } : null);
    }
  };

  const handleFeature = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post || !post.image_url) return;
    if (post.user_id !== currentUserId) return;

    // Verificar se o usuário já tem outro post em destaque
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

    if (activeFeatured) {
      alert('Você já tem uma foto em destaque! Aguarde ela expirar (3 dias) para destacar outra.');
      return;
    }

    // Toggle destaque
    const newFeaturedAt = post.featured_at ? null : new Date().toISOString();
    await supabase.from('posts').update({ featured_at: newFeaturedAt }).eq('id', postId);
    fetchPosts();
  };

  const loadComments = async (postId: string) => {
    setLoadingComments(true);
    const { data } = await supabase
      .from('comments')
      .select('*, profiles:user_id (full_name, username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments(data || []);
    setLoadingComments(false);
  };

  const handleOpenPost = async (post: FeedPost) => {
    setSelectedPost(post);
    await loadComments(post.id);
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !selectedPost) return;
    await supabase.from('comments').insert({
      post_id: selectedPost.id,
      user_id: currentUserId,
      content: commentInput.trim()
    });
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
      {/* Post em Destaque */}
      {featuredPost && (
        <div className="mx-4 my-6 relative rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
          <div className="aspect-[16/10] relative">
            <img
              src={featuredPost.image_url!}
              alt={featuredPost.title || 'Destaque'}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            
            <div className="absolute top-4 left-4">
              <span className="bg-primary/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> Em Destaque
              </span>
            </div>

            <div className="absolute bottom-0 inset-x-0 p-6">
              {featuredPost.title && (
                <h2 className="text-xl font-black text-white mb-2 leading-tight">{featuredPost.title}</h2>
              )}
              <p className="text-sm text-white/70 line-clamp-2 mb-4">{featuredPost.content}</p>
              
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => onUserClick?.(featuredPost.profile?.user_id || featuredPost.user_id)}
                  className="flex items-center gap-2"
                >
                  <img
                    src={featuredPost.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${featuredPost.user_id}`}
                    className="w-8 h-8 rounded-full border border-white/20"
                    alt=""
                  />
                  <span className="text-xs font-bold text-white">{featuredPost.profile?.full_name || 'Usuário'}</span>
                </button>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(featuredPost.id)}
                    className={`flex items-center gap-1 ${featuredPost.is_liked ? 'text-red-500' : 'text-white/60'}`}
                  >
                    <Heart className={`w-5 h-5 ${featuredPost.is_liked ? 'fill-current' : ''}`} />
                    <span className="text-xs font-bold">{featuredPost.likes_count}</span>
                  </button>
                  <button
                    onClick={() => handleOpenPost(featuredPost)}
                    className="flex items-center gap-1 text-white/60"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-xs font-bold">{featuredPost.comments_count}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Posts */}
      <div className="space-y-4 px-4">
        {posts.filter(p => p.id !== featuredPost?.id).map(post => (
          <div 
            key={post.id} 
            className="bg-white/[0.03] rounded-[24px] border border-white/5 overflow-hidden"
          >
            {/* Header do post */}
            <div className="p-4 flex items-center justify-between">
              <button 
                onClick={() => onUserClick?.(post.profile?.user_id || post.user_id)}
                className="flex items-center gap-3"
              >
                <img
                  src={post.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
                  className="w-10 h-10 rounded-full border border-white/10"
                  alt=""
                />
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{post.profile?.full_name || 'Usuário'}</p>
                  <p className="text-[10px] text-white/40">@{post.profile?.username || 'user'} • {formatDate(post.created_at)}</p>
                </div>
              </button>

              {/* Botão de destacar (apenas para fotos do próprio usuário) */}
              {post.image_url && post.user_id === currentUserId && (
                <button
                  onClick={() => handleFeature(post.id)}
                  className={`p-2 rounded-full ${post.featured_at ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'} hover:bg-white/10 transition-colors`}
                  title={post.featured_at ? 'Remover destaque' : 'Destacar foto'}
                >
                  {post.featured_at ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                </button>
              )}
            </div>

            {/* Conteúdo */}
            <div className="px-4 pb-3">
              {post.title && <h3 className="text-base font-bold text-white mb-1">{post.title}</h3>}
              <p className="text-sm text-white/70 whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Imagem */}
            {post.image_url && (
              <div className="relative">
                <img
                  src={post.image_url}
                  alt=""
                  className="w-full max-h-[400px] object-cover"
                />
              </div>
            )}

            {/* Ações */}
            <div className="p-4 flex items-center gap-6 border-t border-white/5">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-2 ${post.is_liked ? 'text-red-500' : 'text-white/50 hover:text-white/80'} transition-colors`}
              >
                <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                <span className="text-sm font-bold">{post.likes_count}</span>
              </button>
              <button
                onClick={() => handleOpenPost(post)}
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
            <p className="text-white/30 text-sm">Nenhum post ainda. Seja o primeiro!</p>
          </div>
        )}
      </div>

      {/* Modal de Comentários */}
      {selectedPost && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Comentários</h3>
            <button onClick={() => setSelectedPost(null)} className="text-white/60 p-2">
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingComments ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : comments.length > 0 ? (
              comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <img
                    src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`}
                    className="w-8 h-8 rounded-full"
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
