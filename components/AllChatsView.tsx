"use client";

import React, { useState } from 'react';

interface RecentChat {
  id: string;
  name: string;
  lastMessage: string;
  icon: string;
  color: string;
}

interface AllChatsViewProps {
  onClose: () => void;
  onSelectChat: (id: string) => void;
}

const RECENT_CHATS: RecentChat[] = [
  { id: 'hospital', name: 'Hospital Central', lastMessage: 'Preciso de um médico na sala 2!', icon: 'medical_services', color: 'bg-blue-500' },
  { id: 'restaurante', name: 'Neon Grill', lastMessage: 'O sushi está incrível hoje.', icon: 'restaurant', color: 'bg-orange-500' },
  { id: 'padaria', name: 'Baguette Miku', lastMessage: 'Acabou de sair pão quentinho!', icon: 'bakery_dining', color: 'bg-yellow-600' },
];

export const AllChatsView: React.FC<AllChatsViewProps> = ({ onClose, onSelectChat }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  return (
    <div className="fixed inset-0 z-[550] flex items-end justify-center">
      <div className={`absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />
      
      <div className={`relative w-full max-w-md bg-background-dark rounded-t-[60px] border-t border-white/10 p-10 pb-16 shadow-[0_-30px_100px_rgba(0,0,0,1)] flex flex-col max-h-[80vh]
        ${isClosing ? 'animate-out slide-out-bottom duration-500' : 'animate-in slide-in-bottom duration-500'}`}>
        
        <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-10 shrink-0"></div>
        
        <div className="flex items-center justify-between mb-8 px-2 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Minhas Conversas</h2>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-1.5">Roleplays Recentes</p>
          </div>
          <button onClick={handleClose} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 active:scale-90">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4">
          {RECENT_CHATS.map((chat) => (
            <button
              key={chat.id}
              onClick={() => { onSelectChat(chat.id); handleClose(); }}
              className="w-full flex items-center space-x-5 p-5 rounded-[32px] bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all active:scale-[0.98] group"
            >
              <div className={`w-14 h-14 rounded-2xl ${chat.color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-rounded text-3xl">{chat.icon}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <h4 className="text-sm font-black text-white uppercase tracking-tight leading-none mb-1.5">{chat.name}</h4>
                <p className="text-[11px] text-white/30 font-bold truncate italic">"{chat.lastMessage}"</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};