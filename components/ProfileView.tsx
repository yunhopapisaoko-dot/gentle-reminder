"use client";

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

const RACE_THEMES: Record<string, { icon: string, color: string, label: string }> = {
  'Draeven': { icon: 'local_fire_department', color: 'from-rose-600 to-rose-400', label: 'Draeven' },
  'Sylven': { icon: 'eco', color: 'from-emerald-600 to-emerald-400', label: 'Sylven' },
  'Lunari': { icon: 'dark_mode', color: 'from-cyan-500 to-blue-400', label: 'Lunari' },
};

export const ProfileView: React.FC<ProfileViewProps> = ({ user, currentUserId, allPosts = [], onClose, onUpdate }) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const isOwnProfile = String(user.id) === String(currentUserId);
  const raceTheme = user.race ? RACE_THEMES[user.race] : null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  return (
    <div className={`fixed inset-0 z-[210] bg-background-dark flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-right' : 'animate-in slide-in-right'}`}>
      
      <div className="absolute top-0 left-0 right-0 z-[250] px-6 pt-12 flex justify-between items-center pointer-events-none">
        <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white active:scale-90 pointer-events-auto">
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        {isOwnProfile && (
          <button onClick={() => setIsEditing(true)} className="px-6 h-12 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-xl active:scale-90 pointer-events-auto flex items-center space-x-2">
            <span className="material-symbols-rounded text-lg">edit</span>
            <span>Editar</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="relative h-[40vh]">
          <img src={user.banner || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000'} className="w-full h-full object-cover" alt="Banner" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-background-dark"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center">
            <img src={user.avatar} className="w-32 h-32 rounded-[40px] border-4 border-background-dark shadow-2xl mb-4" alt={user.name} />
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{user.name}</h2>
            
            {/* Tag de Raça no Perfil */}
            {raceTheme && (
              <div className={`mt-4 flex items-center space-x-2 px-5 py-1.5 rounded-full bg-gradient-to-r ${raceTheme.color} border border-white/20 shadow-lg`}>
                <span className="material-symbols-rounded text-white text-base">{raceTheme.icon}</span>
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{raceTheme.label}</span>
              </div>
            )}
            <span className="text-xs font-black text-white/30 tracking-widest uppercase mt-3">@{user.username}</span>
          </div>
        </div>

        <div className="px-8 space-y-8 pb-32">
          <div className="bg-white/[0.03] p-8 rounded-[40px] border border-white/5 text-center">
             <p className="text-sm font-medium text-white/60 italic leading-relaxed">
                "{user.bio || 'Sem biografia definida.'}"
             </p>
          </div>
        </div>
      </div>

      {isEditing && (
        <EditProfileModal user={user} onClose={() => setIsEditing(false)} onUpdate={(updated) => onUpdate?.(updated)} />
      )}
    </div>
  );
};