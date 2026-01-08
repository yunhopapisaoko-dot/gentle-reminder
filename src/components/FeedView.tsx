"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Heart, MessageCircle, Star, StarOff, Pencil, MoreVertical, Trash2, Share2 } from 'lucide-react';
import { FeedVideoPlayer } from './FeedVideoPlayer';

interface FeedPost {
  id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  video_url: string | null;
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
  onPostClick?: (post: any) => void;
  showFeaturedOnly?: boolean;
}

export const FeedView: React.FC<FeedViewProps> = ({ currentUserId, onUserClick, onPostClick, showFeaturedOnly = false }) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts(true);
    
    const channel = supabase
      .channel('feed-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => fetchPosts(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => fetchPosts(false))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, showFeaturedOnly]);

  const fetchPosts = async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    
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

      let filteredPosts = postsWithDetails.filter(p => 
        !p.featured_at || 
        (!p.image_url && !p.video_url) ||
        new Date(p.featured_at) <= threeDaysAgo
      );

      setPosts(filteredPosts);
    } catch (err) {
      console.error('Erro ao buscar posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const post = posts.find(p => p.id === postId);
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
    fetchPosts(false);
  };

  const handleFeature = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const post = posts.find(p => p.id === postId);
    if (!post || !post.image_url) return;
    if (post.user_id !== currentUserId) return;

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

  const handleDelete = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este post?')) return;
    
    await supabase.from('comments').delete().eq('post_id', postId);
    await supabase.from('likes').delete().eq('post_id', postId);
    await supabase.from('posts').delete().eq('id', postId);
    
    setMenuOpen(null);
    fetchPosts();
  };

  const toggleMenu = (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMenuOpen(menuOpen === postId ? null : postId);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-30">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sincronizando Feed</p>
      </div>
    );
  }

  return (
    <div className="pb-40 px-4 space-y-8 max-w-lg mx-auto animate-in fade-in duration-700">
      {posts.map(post => (
        <div 
          key={post.id} 
          onClick={() => onPostClick?.(post)}
          className="relative bg-white/[0.02] rounded-[48px] border border-white/5 overflow-hidden cursor-pointer hover:bg-white/[0.04] transition-all duration-500 shadow-2xl group/post active:scale-[0.99] flex flex-col"
        >
          {/* Inner Glow Effect */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

          {/* Header */}
          <div className="p-6 pb-4 flex items-center justify-between">
            <button 
              onClick={(e) => { e.stopPropagation(); onUserClick?.(post.user_id); }}
              className="flex items-center gap-4 group"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary/40 to-secondary/40 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img
                  src={post.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
                  className="relative w-12 h-12 rounded-2xl border-2 border-white/10 object-cover shadow-lg"
                  alt=""
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-white leading-none uppercase tracking-tighter italic">{post.profile?.full_name || 'Usuário'}</p>
                <p className="text-[10px] text-white/30 mt-1.5 uppercase font-black tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  @{post.profile?.username || 'user'}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              {post.image_url && post.user_id === currentUserId && (
                <button
                  onClick={(e) => handleFeature(post.id, e)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${post.featured_at ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'bg-white/5 text-white/20 border border-white/5 hover:text-white/40'}`}
                >
                  {post.featured_at ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                </button>
              )}

              {post.user_id === currentUserId && (
                <div className="relative">
                  <button 
                    onClick={(e) => toggleMenu(post.id, e)} 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${menuOpen === post.id ? 'bg-white/10 text-white' : 'bg-white/5 text-white/20 hover:text-white/40 border border-white/5'}`}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {menuOpen === post.id && (
                    <div className="absolute right-0 top-full mt-2 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-[100] overflow-hidden min-w-[180px] animate-in zoom-in duration-200">
                      <button onClick={(e) => handleEdit(post, e)} className="w-full px-6 py-4 flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-white hover:bg-white/5 border-b border-white/5 transition-colors">
                        <Pencil className="w-4 h-4 text-primary" /> Editar
                      </button>
                      <button onClick={(e) => handleDelete(post.id, e)} className="w-full px-6 py-4 flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Media Content - IMAGEM OU VÍDEO */}
          <div className="relative w-full group/media overflow-hidden bg-black/20">
            {post.video_url ? (
              <FeedVideoPlayer src={post.video_url} />
            ) : post.image_url ? (
              <div className="relative flex justify-center overflow-hidden">
                <img
                  src={post.image_url}
                  alt=""
                  className="max-w-full max-h-[500px] object-contain transition-transform duration-[2000ms] group-hover/post:scale-105"
                />
              </div>
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark/20 via-transparent to-transparent pointer-events-none"></div>
          </div>

          {/* Post Content */}
          <div className="p-8">
            {editingPost === post.id ? (
              <div className="space-y-4 animate-in fade-in" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold focus:ring-primary outline-none"
                />
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-sm text-white italic resize-none focus:ring-primary outline-none"
                  rows={4}
                />
                <div className="flex gap-3">
                  <button onClick={(e) => handleSaveEdit(post.id, e)} className="flex-1 bg-primary py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Salvar</button>
                  <button onClick={() => setEditingPost(null)} className="flex-1 bg-white/5 py-4 rounded-2xl text-white/40 text-[10px] font-black uppercase tracking-widest border border-white/5">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {post.title && (
                  <h3 className="text-xl font-black text-white tracking-tighter uppercase leading-tight italic drop-shadow-md">
                    {post.title}
                  </h3>
                )}
                <p className="text-sm font-bold text-white/70 leading-relaxed italic opacity-90 line-clamp-4">
                  "{post.content}"
                </p>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="p-6 px-10 flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-10">
              <button 
                onClick={(e) => handleLike(post.id, e)} 
                className={`flex flex-col items-center gap-2 transition-all duration-300 ${post.is_liked ? 'text-rose-500' : 'text-white/30 hover:text-white/50'}`}
              >
                <Heart className={`w-7 h-7 ${post.is_liked ? 'fill-current drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' : ''}`} />
                <span className="text-[10px] font-black tracking-widest uppercase">{post.likes_count}</span>
              </button>
              
              <div className="flex flex-col items-center gap-2 text-white/30 group-hover/post:text-white/40 transition-colors">
                <MessageCircle className="w-7 h-7" />
                <span className="text-[10px] font-black tracking-widest uppercase">{post.comments_count}</span>
              </div>
            </div>

            <button className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/20 hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all active:scale-90">
               <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}

      {/* Decorative Final Line */}
      <div className="pt-20 pb-10 flex flex-col items-center opacity-10">
         <div className="w-px h-12 bg-gradient-to-b from-white to-transparent"></div>
         <p className="text-[8px] font-black uppercase tracking-[1.5em] mt-6 ml-[1.5em]">Fim das Novidades</p>
      </div>
    </div>
  );
};