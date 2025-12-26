"use client";

import React, { useState } from 'react';

interface RecentChat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  icon: string;
  color: string;
  wallpaper: string;
}

interface AllChatsViewProps {
  onClose: () => void;
  onSelectChat: (id: string) => void;
}

const RECENT_CHATS: RecentChat[] = [
  { 
    id: 'hospital', 
    name: 'Hospital Central', 
    lastMessage: 'Preciso de um médico na sala 2 urgentemente!', 
    timestamp: '2 min',
    unreadCount: 3,
    icon: 'medical_services', 
    color: 'from-blue-500 to-cyan-400',
    wallpaper: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400'
  },
  { 
    id: 'restaurante', 
    name: 'Neon Grill', 
    lastMessage: 'Obrigado pelo jantar, estava tudo ótimo.', 
    timestamp: '1h',
    icon: 'restaurant', 
    color: 'from-orange-500 to-amber-400',
    wallpaper: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400'
  },
  { 
    id: 'padaria', 
    name: 'Baguette Miku', 
    lastMessage: 'O croissant de amêndoas ainda está disponível?', 
    timestamp: '3h',
    icon: 'bakery_dining', 
    color: 'from-yellow-600 to-orange-400',
    wallpaper: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400'
  },
];

export const AllChatsView: React.FC<AllChatsViewProps> = ({ onClose, onSelectChat }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const filteredChats = RECENT_CHATS.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`fixed inset-0 z-[550] bg-background-dark flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-right' : 'animate-in slide-in-right'}`}>
      
      {/* Immersive Header */}
      <div className="pt-16 px-6 pb-8 bg-black/40 backdrop-blur-3xl border-b border-white/5 relative z-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleClose}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Conversas</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-1.5">Roleplays Ativos</p>
            </div>
          </div>
          
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-rounded">chat_bubble</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
            <span className="material-symbols-rounded text-xl">search</span>
          </div>
          <input 
            type="text"
            placeholder="Buscar por local ou mensagem..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-[24px] py-4 pl-14 pr-6 text-sm text-white font-bold focus:ring-primary focus:border-primary placeholder:text-white/10 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-4 pb-32">
        {filteredChats.length > 0 ? filteredChats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => { onSelectChat(chat.id); handleClose(); }}
            className="w-full group relative flex items-center space-x-5 p-5 rounded-[36px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all active:scale-[0.98] overflow-hidden"
          >
            {/* Background Hint */}
            <div className="absolute top-0 right-0 w-32 h-full opacity-0 group-hover:opacity-10 transition-opacity">
              <img src={chat.wallpaper} className="w-full h-full object-cover grayscale" />
            </div>

            <div className="relative">
              <div className={`w-16 h-16 rounded-[24px] bg-gradient-to-br ${chat.color} flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <span className="material-symbols-rounded text-3xl">{chat.icon}</span>
              </div>
              {chat.unreadCount && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-background-dark shadow-lg">
                  {chat.unreadCount}
                </div>
              )}
            </div>

            <div className="flex-1 text-left min-w-0 pr-4">
              <div className="flex justify-between items-center mb-1.5">
                <h4 className="text-[15px] font-black text-white tracking-tight leading-none truncate">{chat.name}</h4>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{chat.timestamp}</span>
              </div>
              <p className="text-xs text-white/40 font-bold truncate italic leading-relaxed">
                "{chat.lastMessage}"
              </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/10 group-hover:bg-primary group-hover:text-white transition-all">
              <span className="material-symbols-rounded text-lg">chevron_right</span>
            </div>
          </button>
        )) : (
          <div className="py-32 flex flex-col items-center justify-center text-center opacity-20">
            <span className="material-symbols-rounded text-6xl mb-4">forum_off</span>
            <p className="text-sm font-black uppercase tracking-[0.3em]">Nenhuma conversa</p>
          </div>
        )}
      </div>

      {/* Bottom Action Area */}
      <div className="p-8 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent absolute bottom-0 left-0 right-0">
         <button className="w-full py-6 rounded-[32px] bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] shadow-3xl active:scale-95 transition-all flex items-center justify-center space-x-3">
            <span className="material-symbols-rounded text-xl">add_comment</span>
            <span>Novo Roleplay</span>
         </button>
      </div>
    </div>
  );
};