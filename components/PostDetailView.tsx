import React, { useState, useEffect } from 'react';
import { Post, Comment, User } from '../types';
import { Heart, MessageCircle, X, Send, Share2, MoreVertical } from 'lucide-react';
import { supabase } from '../supabase';

interface PostDetailViewProps {
  post: Post;
  currentUser: User;
  onClose: () => void;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({ post, currentUser, onClose }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(parseInt(post.likes || '0'));
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [commentInput, setCommentInput] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    loadComments();
    checkIfLiked();
  }, [post.id]);

  const loadComments = async () => {
    setIsLoadingComments(true);
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    
    if (commentsData) {
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      const formattedComments = commentsData.map(c => {
        const profile = profileMap.get(c.user_id);
        return {
          id: c.id,
          author: {
            id: c.user_id,
            name: profile?.full_name || 'Viajante',
            username: profile?.username || 'user',
            avatar: profile?.avatar_url || ''
          },
          text: c.content,
          timestamp: new Date(c.created_at).toLocaleDateString()
        } as Comment;
      });
      setComments(formattedComments);
    }
    setIsLoadingComments(false);
  };

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', currentUser.id)
      .maybeSingle();
    setIsLiked(!!data);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleLike = async () => {
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', currentUser.id);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: currentUser.id });
      setLikesCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    
    const { data: newComment } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: currentUser.id,
      content: commentInput.trim()
    }).select().single();

    if (newComment) {
      setComments([...comments, {
        id: newComment.id,
        author: currentUser,
        text: commentInput.trim(),
        timestamp: 'Agora'
      }]);
      setCommentInput('');
    }
  };

  const formatDate = (dateStr: string) => {
    if (dateStr === 'Agora') return 'Agora';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`fixed inset-0 z-[500] bg-background-dark flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-right' : 'animate-in slide-in-right'}`}>
      
      {/* Header Premium */}
      <div className="pt-14 px-6 pb-5 bg-black/40 backdrop-blur-3xl border-b border-white/10 relative z-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleClose}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src={post.author.avatar}
              className="w-10 h-10 rounded-xl object-cover border border-white/10"
              alt=""
            />
            <div>
              <p className="text-sm font-black text-white leading-none">{post.author.name}</p>
              <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">@{post.author.username}</p>
            </div>
          </div>
        </div>
        <button className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90">
          <MoreVertical className="w-5 h-5 opacity-40" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-32">
        <div className="p-6 pb-4">
          {post.title && (
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-4 leading-tight">
              {post.title}
            </h2>
          )}
          <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 mb-6">
            <p className="text-[15px] font-bold text-white/80 leading-relaxed whitespace-pre-wrap">
              {post.excerpt}
            </p>
          </div>
        </div>

        {post.imageUrl && (
          <div className="relative px-4 mb-8">
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-[40px] blur-2xl opacity-40"></div>
            <div className="relative rounded-[36px] overflow-hidden bg-black/40 border border-white/10 shadow-2xl">
              <img
                src={post.imageUrl}
                alt=""
                className="w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
          </div>
        )}

        <div className="px-8 flex items-center justify-between mb-8">
          <div className="flex items-center gap-8">
            <button
              onClick={handleLike}
              className={`flex flex-col items-center gap-1.5 transition-all ${isLiked ? 'text-red-500 scale-110' : 'text-white/30 hover:text-white/50'}`}
            >
              <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">{likesCount}</span>
            </button>
            <div className="flex flex-col items-center gap-1.5 text-white/30">
              <MessageCircle className="w-7 h-7" />
              <span className="text-[10px] font-black uppercase tracking-widest">{comments.length}</span>
            </div>
            <button className="flex flex-col items-center gap-1.5 text-white/30 hover:text-primary transition-colors">
              <Share2 className="w-7 h-7" />
              <span className="text-[10px] font-black uppercase tracking-widest">Enviar</span>
            </button>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Postado em</p>
            <p className="text-[11px] font-black text-white/50">{post.timestamp}</p>
          </div>
        </div>

        <div className="px-6 space-y-6">
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="w-1 h-4 bg-primary rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Comentários</h3>
          </div>

          {isLoadingComments ? (
            <div className="py-20 flex flex-col items-center justify-center opacity-40">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[9px] font-black uppercase tracking-widest">Lendo vozes...</p>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-white/[0.03] border border-white/5 rounded-[28px] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={comment.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.id}`}
                        className="w-10 h-10 rounded-[14px] object-cover border border-white/10"
                        alt=""
                      />
                      <div>
                        <p className="text-xs font-black text-white">{comment.author.name}</p>
                        <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-0.5">@{comment.author.username}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{formatDate(comment.timestamp)}</span>
                  </div>
                  <div className="px-2">
                    <p className="text-sm font-bold text-white/70 leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center mx-2">
              <MessageCircle className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Sem comentários ainda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Input Bar Premium */}
      <div className="px-6 py-8 bg-black/60 backdrop-blur-3xl border-t border-white/10 pb-12 relative z-30">
        <div className="relative group max-w-lg mx-auto">
          <input
            type="text"
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleAddComment()}
            placeholder="Diga algo bacana..."
            className="w-full bg-white/[0.05] border border-white/10 rounded-[28px] pl-6 pr-16 py-5 text-sm text-white font-bold placeholder:text-white/10 focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          <button
            onClick={handleAddComment}
            disabled={!commentInput.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              commentInput.trim() 
                ? 'bg-primary text-white shadow-lg shadow-primary/30 active:scale-90 hover:scale-105' 
                : 'bg-white/5 text-white/10'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};