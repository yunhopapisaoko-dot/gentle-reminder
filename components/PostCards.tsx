import React from 'react';
import { Post } from '../types';

export const FeaturedCard: React.FC<{ post: Post }> = ({ post }) => {
  return (
    <div className="mx-6 my-6 relative rounded-[40px] overflow-hidden group border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] bg-surface-purple flex flex-col">
      {/* Imagem no Topo */}
      <div className="aspect-[16/11] relative overflow-hidden">
        <img 
          alt={post.title} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110" 
          src={post.imageUrl || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000'} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        
        <div className="absolute top-5 left-5">
          <div className="bg-primary/80 backdrop-blur-xl px-4 py-1.5 rounded-2xl border border-white/20 shadow-xl">
             <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Em Alta ✨</span>
          </div>
        </div>
      </div>

      {/* Conteúdo em Baixo */}
      <div className="p-8 pt-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-0.5 rounded-full bg-white/10 backdrop-blur-md">
            <img src={post.author.avatar} className="w-8 h-8 rounded-full border border-primary/30" />
          </div>
          <div>
            <span className="text-[11px] font-black text-white tracking-tight">{post.author.name}</span>
            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest leading-none mt-1">Autor Verificado</p>
          </div>
        </div>

        <h2 className="text-2xl font-black text-white mb-3 leading-tight tracking-tighter uppercase italic">{post.title}</h2>
        <p className="text-sm font-medium text-white/60 leading-relaxed line-clamp-3 italic mb-6">
          "{post.excerpt}"
        </p>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
           <div className="flex items-center space-x-1.5 text-white/70">
              <span className="material-symbols-rounded text-base text-secondary fill-current">favorite</span>
              <span className="text-[11px] font-black">{post.likes}</span>
           </div>
           <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{post.timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export const GridCard: React.FC<{ post: Post }> = ({ post }) => {
  const hasMedia = post.imageUrl || post.videoUrl;
  
  return (
    <div className="relative aspect-square bg-surface-purple/40 overflow-hidden rounded-[32px] group border border-white/5 hover:border-primary/40 transition-all duration-500 shadow-xl active:scale-95">
      {post.videoUrl ? (
        <div className="w-full h-full relative">
          <video
            src={post.videoUrl}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700"
            muted
            playsInline
            loop
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
          />
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
            <span className="material-symbols-rounded text-white text-sm">play_arrow</span>
          </div>
        </div>
      ) : post.imageUrl ? (
        <img
          alt={post.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
          src={post.imageUrl}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-6 text-center bg-gradient-to-br from-surface-purple to-background-dark">
          <p className="text-[11px] font-bold text-white/40 leading-relaxed italic line-clamp-4">"{post.excerpt}"</p>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/10 to-transparent"></div>
      <div className="absolute bottom-0 inset-x-0 p-5">
        <p className="text-white text-[12px] font-black truncate tracking-tight">{post.title}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{post.timestamp}</span>
          <span className="material-symbols-rounded text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">north_east</span>
        </div>
      </div>
    </div>
  );
};