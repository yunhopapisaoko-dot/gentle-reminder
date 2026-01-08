"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Heart, MessageCircle, Star, ArrowUpRight } from 'lucide-react';

interface FeaturedPost {
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

interface FeaturedViewProps {
  currentUserId: string;
  onPostClick: (post: any) => void;
  onUserClick: (userId: string) => void;
}

export const FeaturedView: React.FC<FeaturedViewProps> = ({ currentUserId, onPostClick, onUserClick }) => {
  const [posts, setPosts] = useState<FeaturedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedPosts();
  }, [currentUserId]);

  const fetchFeaturedPosts = async () => {
    setLoading(true);
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .not('featured_at', 'is', null)
        .not('image_url', 'is', null)
        .order('featured_at', { ascending: false })
        .limit(8);

      if (error) throw error;

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const postsWithDetails = await Promise.all((postsData || [])
        .filter(p => new Date(p.featured_at!) > threeDaysAgo)
        .map(async (post) => {
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

      setPosts(postsWithDetails);
    } catch (err) {
      console.error('Erro ao buscar destaques:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 opacity-40">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[9px] font-black text-white uppercase tracking-[0.4em] mt-6">Ajustando Lentes</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 px-12 text-center opacity-20">
        <Star className="w-12 h-12 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aguardando momentos</p>
      </div>
    );
  }

  const [heroPost, ...listPosts] = posts;

  return (
    <div className="px-5 pt-4 pb-40 space-y-12 animate-in fade-in duration-700">
      
      {/* Hero Post - Estilo Poster Minimalista */}
      {heroPost && (
        <section className="relative group">
          <div 
            onClick={() => onPostClick(heroPost)}
            className="relative aspect-[3.8/5] rounded-[48px] overflow-hidden border border-white/10 bg-background-dark shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:border-primary/30 cursor-pointer"
          >
            {/* Imagem principal */}
            <img 
              src={heroPost.image_url!} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[8000ms] group-hover:scale-110" 
              alt="Destaque Principal" 
            />
            
            {/* Gradientes Suaves */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-background-dark/90"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent"></div>

            {/* Cabeçalho do Autor Flutuante */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none">
              <div 
                className="flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 pr-5 rounded-full pointer-events-auto active:scale-95 transition-all"
                onClick={(e) => { e.stopPropagation(); onUserClick(heroPost.user_id); }}
              >
                <img 
                  src={heroPost.profile?.avatar_url || ''} 
                  className="w-8 h-8 rounded-full object-cover border border-white/10" 
                  alt="" 
                />
                <div>
                  <p className="text-[10px] font-black text-white leading-none uppercase">{heroPost.profile?.full_name}</p>
                  <p className="text-[8px] font-bold text-primary uppercase tracking-widest mt-1">@{heroPost.profile?.username}</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50">
                <Star className="w-4 h-4 fill-current text-primary" />
              </div>
            </div>

            {/* Rodapé do Post */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pt-20">
               <div className="space-y-4">
                  {/* Título Elegante (não muito grande) */}
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter italic leading-tight drop-shadow-lg">
                    {heroPost.title || 'Momento Arcaico'}
                  </h2>
                  
                  <p className="text-[11px] font-medium text-white/40 line-clamp-2 italic pr-6">
                    "{heroPost.content}"
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-2 text-white/60">
                        <Heart className={`w-4 h-4 ${heroPost.is_liked ? 'text-red-500 fill-current' : ''}`} />
                        <span className="text-[10px] font-black">{heroPost.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-[10px] font-black">{heroPost.comments_count}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">
                       <span>Expandir</span>
                       <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </section>
      )}

      {/* Seção Mais Destaque */}
      {listPosts.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1 h-5 bg-primary rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Mais Destaque</h3>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {listPosts.map((post, idx) => (
              <div 
                key={post.id} 
                onClick={() => onPostClick(post)}
                className="relative aspect-[1/1.1] rounded-[40px] overflow-hidden border border-white/5 group active:scale-95 transition-all shadow-xl bg-surface-purple animate-in slide-in-from-bottom"
                style={{ animationDelay: `${(idx + 1) * 100}ms` }}
              >
                <img 
                  src={post.image_url!} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt="Destaque" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-[10px] font-black text-white truncate uppercase mb-1">{post.title || 'Fragmento'}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">@{post.profile?.username}</p>
                    <div className="flex items-center gap-1 text-red-500/60">
                      <Heart className="w-2.5 h-2.5 fill-current" />
                      <span className="text-[8px] font-black">{post.likes_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer Minimalista */}
      <div className="pt-20 pb-10 flex flex-col items-center opacity-10">
         <div className="w-px h-12 bg-gradient-to-b from-white to-transparent"></div>
         <p className="text-[8px] font-black uppercase tracking-[1.5em] mt-6 ml-[1.5em]">Magic Gallery</p>
      </div>
    </div>
  );
};