
import React, { useState } from 'react';
import { Post, Comment } from '../types';
import { CURRENT_USER } from '../constants';

interface PostDetailViewProps {
  post: Post;
  onClose: () => void;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({ post, onClose }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [commentInput, setCommentInput] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 250); // Tempo da animação zoom-out
  };

  const handleLike = () => setIsLiked(!isLiked);

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      author: CURRENT_USER,
      text: commentInput,
      timestamp: 'Agora'
    };
    setComments([newComment, ...comments]);
    setCommentInput('');
  };

  return (
    <div className={`fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col h-[100dvh] ${isClosing ? 'animate-out zoom-out' : 'animate-in zoom-in'}`}>
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between border-b border-white/10 relative z-10">
        <div className="flex items-center space-x-3">
          <img src={post.author.avatar} className="w-8 h-8 rounded-full border border-primary/50" alt={post.author.name} />
          <div>
            <p className="text-xs font-black text-white leading-none">{post.author.name}</p>
            <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">{post.timestamp}</p>
          </div>
        </div>
        <button onClick={handleClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-90">
          <span className="material-symbols-rounded">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="w-full">
          {post.imageUrl ? (
            <img src={post.imageUrl} className="w-full object-contain max-h-[60vh] bg-black/20" alt={post.title} />
          ) : (
            <div className="px-8 py-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-y border-white/5">
               <h2 className="text-2xl font-black text-white mb-4 leading-tight">{post.title}</h2>
               <p className="text-white/80 text-base leading-relaxed font-medium italic">"{post.excerpt}"</p>
            </div>
          )}

          <div className="p-6 flex items-center space-x-6">
            <button onClick={handleLike} className="flex items-center space-x-2 group">
              <span className={`material-symbols-rounded text-2xl transition-all ${isLiked ? 'text-secondary fill-current scale-110' : 'text-white/40'}`}>
                favorite
              </span>
              <span className={`text-xs font-black ${isLiked ? 'text-secondary' : 'text-white/40'}`}>{isLiked ? '22.3k' : post.likes}</span>
            </button>
            <div className="flex items-center space-x-2 text-white/40">
              <span className="material-symbols-rounded text-2xl">chat_bubble</span>
              <span className="text-xs font-black">{comments.length}</span>
            </div>
            <button className="flex items-center space-x-2 text-white/40">
              <span className="material-symbols-rounded text-2xl">share</span>
            </button>
          </div>

          {post.imageUrl && (
            <div className="px-6 pb-6 border-b border-white/5">
              <h2 className="text-lg font-black text-white mb-2">{post.title}</h2>
              <p className="text-sm text-white/60 leading-relaxed font-medium">{post.excerpt}</p>
            </div>
          )}

          <div className="p-6 space-y-6 pb-32">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Comentários</h3>
            {comments.length > 0 ? (
              comments.map(comment => (
                <div key={comment.id} className="flex space-x-3 group animate-in slide-in-from-bottom duration-300">
                  <img src={comment.author.avatar} className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[11px] font-black text-white">@{comment.author.username}</span>
                      <span className="text-[9px] text-white/20">{comment.timestamp}</span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed font-medium">{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center">
                <p className="text-xs text-white/20 font-black italic">Ninguém comentou ainda. Seja o primeiro! ✨</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-black/80 backdrop-blur-3xl border-t border-white/10 pb-8">
        <div className="flex items-center space-x-3 bg-white/5 rounded-2xl p-2 pl-4 border border-white/10 shadow-inner">
          <input 
            type="text" 
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder="Diga algo incrível..." 
            className="flex-1 bg-transparent border-none text-xs focus:ring-0 text-white font-bold py-2.5 placeholder:text-white/20"
          />
          <button 
            onClick={handleAddComment}
            disabled={!commentInput.trim()}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${commentInput.trim() ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'bg-white/5 text-white/20'}`}
          >
            <span className="material-symbols-rounded text-xl">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
