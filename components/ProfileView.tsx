import React, { useState, useMemo } from 'react';
import { User, Post } from '../types';
import { PostDetailView } from './PostDetailView';
import { EditProfileModal } from './EditProfileModal';

interface ProfileViewProps {
  user: User;
  currentUserId: string;
  allPosts?: Post[];
  onClose: () => void;
  onUpdate?: (updatedUser: User) => void;
}

const RACE_THEMES: Record<string, string> = {
  'Draeven': 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]',
  'Sylven': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  'Lunari': 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.15)]',
};

export const ProfileView: React.FC<ProfileViewProps> = ({ user, currentUserId, allPosts = [], onClose, onUpdate }) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'Posts' | 'Mídia' | 'Coleção'>('Posts');
  
  const isOwnProfile = String(user.id).toLowerCase() === String(currentUserId).toLowerCase();

  const userPosts = useMemo(() => {
    return allPosts.filter(p => p.author.id === user.id);
  }, [allPosts, user.id]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  return (
    <div className={`fixed inset-0 z-[210] bg-background-dark flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-right' : 'animate-in slide-in-right'}`}>
      
      {/* Botões de Ação Superiores */}
      <div className="absolute top-0 left-0 right-0 z-[250] px-6 pt-12 flex justify-between items-center pointer-events-none">
        <button 
          onClick={handleClose}
          className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all pointer-events-auto shadow-2xl"
        >
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>

        {isOwnProfile && (
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
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Banner Section */}
        <div className="relative h-[45vh] overflow-hidden">
          <img 
            src={user.banner || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000'} 
            className="w-full h-full object-cover scale-105" 
            alt="Banner" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background-dark"></div>
          
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
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center space-x-3">
                 {user.isLeader && (
                  <div className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Líder</span>
                  </div>
                )}
                {user.race && (
                  <div className={`px-5 py-1.5 rounded-full bg-gradient-to-br ${RACE_THEMES[user.race] || 'from-white/10 to-white/5 border-white/10 text-white'} border backdrop-blur-md`}>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em]">{user.race}</span>
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase text-center leading-none">{user.name}</h2>
              <span className="text-xs font-black text-primary tracking-widest uppercase italic mt-1">@{user.username}</span>
            </div>
          </div>
        </div>

        {/* Info & Tabs Section */}
        <div className="px-6 space-y-8 pb-32">
          <div className="bg-white/[0.03] backdrop-blur-3xl p-8 rounded-[48px] border border-white/5 text-center">
             <p className="text-sm font-medium text-white/70 leading-relaxed italic">
                "{user.bio || 'Explorando as fronteiras da MagicTalk.'}"
             </p>
          </div>

          <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded-3xl border border-white/5 sticky top-0 z-20 backdrop-blur-xl">
            {(['Posts', 'Mídia', 'Coleção'] as const).map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                  activeCategory === cat ? 'bg-white text-black shadow-2xl' : 'text-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {activeCategory === 'Posts' && (
              <div className="flex flex-col space-y-4">
                {userPosts.length > 0 ? userPosts.map((post) => (
                  <button 
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="flex flex-col text-left bg-white/[0.03] rounded-[32px] border border-white/5 overflow-hidden p-6 hover:bg-white/[0.06] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img src={post.author.avatar} className="w-10 h-10 rounded-2xl" />
                        <div>
                          <span className="text-xs font-black text-white">{post.author.name}</span>
                          <p className="text-[9px] font-bold text-white/20 mt-1">{post.timestamp}</p>
                        </div>
                      </div>
                      <span className="material-symbols-rounded text-white/10 group-hover:text-primary transition-colors">open_in_new</span>
                    </div>
                    <h4 className="text-white font-black mb-2">{post.title}</h4>
                    <p className="text-[13px] font-medium text-white/50 leading-relaxed line-clamp-3">{post.excerpt}</p>
                  </button>
                )) : (
                  <div className="py-20 text-center opacity-20 flex flex-col items-center">
                    <span className="material-symbols-rounded text-5xl mb-4 text-white/10">history_edu</span>
                    <p className="text-xs font-black uppercase tracking-widest">Ainda sem histórias.</p>
                  </div>
                )}
              </div>
            )}
            
            {activeCategory !== 'Posts' && (
               <div className="py-20 text-center opacity-10">
                  <p className="text-xs font-black uppercase tracking-widest italic">Galeria em desenvolvimento...</p>
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
        <PostDetailView post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
};