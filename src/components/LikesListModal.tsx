"use client";

import React from 'react';

interface LikeUser {
  id: string;
  name: string;
  avatar: string;
  username: string;
}

interface LikesListModalProps {
  users: LikeUser[];
  isLoading: boolean;
  onClose: () => void;
  onUserClick: (userId: string) => void;
}

export const LikesListModal: React.FC<LikesListModalProps> = ({ users, isLoading, onClose, onUserClick }) => {
  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 z-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-background-dark border border-white/10 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-400 max-h-[70vh] flex flex-col">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Interações</h3>
            <p className="text-[9px] font-black text-secondary uppercase tracking-[0.3em] mt-1">{users.length} curtidas</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center opacity-40">
              <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[9px] font-black uppercase tracking-widest text-white">Sincronizando...</p>
            </div>
          ) : users.length > 0 ? (
            users.map((user) => (
              <button 
                key={user.id} 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUserClick(user.id);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-[28px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-primary/30 active:scale-[0.96] transition-all group"
              >
                <div className="relative">
                  <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-lg" alt="" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-lg flex items-center justify-center border-2 border-background-dark">
                    <span className="material-symbols-rounded text-[10px] text-white fill-current">favorite</span>
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-black text-white uppercase italic leading-none group-hover:text-primary transition-colors">{user.name}</p>
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">@{user.username}</p>
                </div>
                <span className="material-symbols-rounded text-white/10 group-hover:text-primary transition-colors">arrow_forward_ios</span>
              </button>
            ))
          ) : (
            <div className="py-20 text-center opacity-20">
              <span className="material-symbols-rounded text-5xl mb-4">heart_broken</span>
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma curtida ainda</p>
            </div>
          )}
        </div>
        
        <div className="p-8 border-t border-white/5 bg-black/20">
           <button onClick={onClose} className="w-full py-5 rounded-[24px] bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-white/5">Fechar</button>
        </div>
      </div>
    </div>
  );
};