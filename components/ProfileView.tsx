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

// Configuração visual das raças: Cores, Ícones e Gradientes Premium
const RACE_CONFIG: Record<string, { theme: string; icon: string; label: string }> = {
  'Draeven': { 
    theme: 'from-rose-500 via-orange-500 to-rose-600 border-rose-400/40 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.4)]', 
    icon: 'local_fire_department',
    label: 'Draeven'
  },
  'Sylven': { 
    theme: 'from-emerald-400 via-teal-500 to-emerald-600 border-emerald-300/40 text-emerald-50/90 shadow-[0_0_20px_rgba(16,185,129,0.4)]', 
    icon: 'eco',
    label: 'Sylven'
  },
  'Lunari': { 
    theme: 'from-cyan-400 via-blue-500 to-indigo-600 border-cyan-300/40 text-cyan-50/90 shadow-[0_0_20px_rgba(34,211,238,0.4)]', 
    icon: 'dark_mode',
    label: 'Lunari'
  },
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

  const race = user.race && RACE_CONFIG[user.race] ? RACE_CONFIG[user.race] : null;

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
                {race && (
                  <div className={`px-5 py-2 rounded-full bg-gradient-to-br ${race.theme} border backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-default`}>
                    <div className="flex items-center space-x-2">
                       <span className="material-symbols-rounded text-[14px]">{race.icon}</span>
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">{race.label}</span>
                    </div>
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
          <div className="relative bg-white/[0.03] backdrop-blur-3xl p-8 rounded-[48px] border border-white/5 text-center overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
             <p className="text-sm font-medium text-white/70 leading-relaxed italic relative z-10">
                "{user.bio || 'Explorando as fronteiras da MagicTalk.'}"
             </p>
          </div>

          <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded-[32px] border border-white/5 sticky top-0 z-20 backdrop-blur-2xl shadow-xl">
            {(['Posts', 'Mídia', 'Coleção'] as const).map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-500 relative overflow-hidden ${
                  activeCategory === cat ? 'bg-white text-black shadow-2xl' : 'text-white/25 hover:text-white/40'
                }`}
              >
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
                {userPosts.length > 0 ? userPosts.map((post) => (
                  <button 
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="flex flex-col text-left bg-white/[0.03] rounded-[40px] border border-white/5 overflow-hidden p-8 hover:bg-white/[0.06] hover:border-white/10 transition-all group relative active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-secondary/20 p-[1px]">
                          <img src={post.author.avatar} className="w-full h-full rounded-2xl object-cover" />
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
            
            {activeCategory !== 'Posts' && (
               <div className="py-32 text-center opacity-10 flex flex-col items-center">
                  <span className="material-symbols-rounded text-6xl mb-4">construction</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">Módulo em Desenvolvimento</p>
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