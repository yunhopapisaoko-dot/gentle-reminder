"use client";

import React from 'react';

interface PostOptionsMenuProps {
  onEdit: () => void;
  onViewLikes: () => void;
  onDelete: () => void;
  onClose: () => void;
  isOwner?: boolean;
}

export const PostOptionsMenu: React.FC<PostOptionsMenuProps> = ({ onEdit, onViewLikes, onDelete, onClose, isOwner = false }) => {
  return (
    <div className="absolute right-0 top-14 z-[100] w-60 animate-in zoom-in duration-300 origin-top-right">
      <div className="bg-black/80 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="flex flex-col">
          <button
            onClick={(e) => { e.stopPropagation(); onViewLikes(); }}
            className="w-full px-6 py-5 flex items-center gap-4 text-left hover:bg-white/5 transition-all border-b border-white/5 group active:bg-white/10"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-lg shadow-primary/10">
              <span className="material-symbols-rounded text-xl">favorite</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-widest text-white">Curtidas</span>
              <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Ver quem curtiu</span>
            </div>
          </button>

          {isOwner && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="w-full px-6 py-5 flex items-center gap-4 text-left hover:bg-white/5 transition-all border-b border-white/5 group active:bg-white/10"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/10">
                  <span className="material-symbols-rounded text-xl">edit</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">Editar</span>
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Alterar conteúdo</span>
                </div>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="w-full px-6 py-5 flex items-center gap-4 text-left hover:bg-rose-500/10 transition-all group active:bg-rose-500/20"
              >
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform shadow-lg shadow-rose-500/10">
                  <span className="material-symbols-rounded text-xl">delete</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-widest text-rose-500">Excluir</span>
                  <span className="text-[8px] font-bold text-rose-500/40 uppercase tracking-widest">Remover postagem</span>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};