"use client";

import React, { useState, useMemo, useRef } from 'react';

interface AllChatsViewProps {
  onClose: () => void;
  onSelectChat: (id: string) => void;
  onLeaveChat: (id: string) => void;
  visitedRooms: string[];
}

const LOCAIS_METADATA: Record<string, any> = {
  hospital: { name: 'Hospital Central', icon: 'medical_services', color: 'from-blue-500 to-cyan-400', wallpaper: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400' },
  restaurante: { name: 'Neon Grill', icon: 'restaurant', color: 'from-orange-500 to-amber-400', wallpaper: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400' },
  padaria: { name: 'Baguette Miku', icon: 'bakery_dining', color: 'from-yellow-600 to-orange-400', wallpaper: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400' },
  creche: { name: 'Sweet Kids', icon: 'child_care', color: 'from-pink-500 to-fuchsia-400', wallpaper: 'https://images.unsplash.com/photo-1560523160-754a9e25c68f?q=80&w=400' },
};

export const AllChatsView: React.FC<AllChatsViewProps> = ({ onClose, onSelectChat, onLeaveChat, visitedRooms }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [optionsFor, setOptionsFor] = useState<string | null>(null);
  const pressTimer = useRef<any>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const activeChats = useMemo(() => {
    return visitedRooms.map(id => ({
      id,
      ...LOCAIS_METADATA[id],
      lastMessage: 'Histórico de roleplay ativo...',
      timestamp: 'Agora'
    })).filter(chat => chat.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [visitedRooms, searchQuery]);

  // Handlers para pressionamento longo (Hold)
  const startPress = (id: string) => {
    pressTimer.current = setTimeout(() => {
      setOptionsFor(id);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
  };

  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleLeave = (id: string) => {
    onLeaveChat(id);
    setOptionsFor(null);
  };

  return (
    <div className={`fixed inset-0 z-[550] bg-background-dark flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-right' : 'animate-in slide-in-right'}`}>
      
      {/* Header */}
      <div className="pt-16 px-6 pb-8 bg-black/40 backdrop-blur-3xl border-b border-white/5 relative z-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Conversas</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-1.5">Roleplays Visitados</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-rounded">chat_bubble</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
            <span className="material-symbols-rounded text-xl">search</span>
          </div>
          <input 
            type="text"
            placeholder="Buscar nas suas histórias..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-[24px] py-4 pl-14 pr-6 text-sm text-white font-bold focus:ring-primary focus:border-primary placeholder:text-white/10 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-4 pb-32">
        {activeChats.length > 0 ? activeChats.map((chat) => (
          <button
            key={chat.id}
            onMouseDown={() => startPress(chat.id)}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchStart={() => startPress(chat.id)}
            onTouchEnd={endPress}
            onClick={() => !optionsFor && onSelectChat(chat.id)}
            className="w-full group relative flex items-center space-x-5 p-5 rounded-[36px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all active:scale-[0.98] overflow-hidden"
          >
            <div className="relative">
              <div className={`w-16 h-16 rounded-[24px] bg-gradient-to-br ${chat.color} flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110`}>
                <span className="material-symbols-rounded text-3xl">{chat.icon}</span>
              </div>
            </div>
            <div className="flex-1 text-left min-w-0 pr-4">
              <div className="flex justify-between items-center mb-1.5">
                <h4 className="text-[15px] font-black text-white tracking-tight leading-none truncate">{chat.name}</h4>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{chat.timestamp}</span>
              </div>
              <p className="text-xs text-white/40 font-bold truncate italic leading-relaxed">"{chat.lastMessage}"</p>
            </div>
            
            {/* Options Overlay (Hold to exit) */}
            {optionsFor === chat.id && (
              <div className="absolute inset-0 bg-primary/95 backdrop-blur-xl flex items-center justify-between px-8 animate-in zoom-in duration-300">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Deseja sair deste chat?</p>
                <div className="flex space-x-3">
                   <button onClick={(e) => { e.stopPropagation(); setOptionsFor(null); }} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"><span className="material-symbols-rounded">close</span></button>
                   <button onClick={(e) => { e.stopPropagation(); handleLeave(chat.id); }} className="px-5 py-2 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">Sair</button>
                </div>
              </div>
            )}
          </button>
        )) : (
          <div className="py-32 flex flex-col items-center justify-center text-center opacity-20">
            <span className="material-symbols-rounded text-6xl mb-4 text-white">explore</span>
            <p className="text-sm font-black uppercase tracking-[0.3em]">Nenhuma aventura ainda</p>
          </div>
        )}
      </div>

      <div className="px-10 pb-12 text-center">
         <p className="text-[8px] font-black text-white/10 uppercase tracking-widest">Dica: Pressione e segure um chat para sair</p>
      </div>
    </div>
  );
};