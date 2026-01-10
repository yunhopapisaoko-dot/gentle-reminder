"use client";

import React from 'react';
import { TabType } from '../types';

interface FloatingActionDockProps {
  onCreateClick: () => void;
  onAllChatsClick: () => void;
  onLocaisClick: () => void;
  activeTab: TabType;
  unreadMessages?: number;
  isSidebarOpen?: boolean;
  hasNewMessages?: boolean;
}

export const FloatingActionDock: React.FC<FloatingActionDockProps> = ({ 
  onCreateClick, 
  onAllChatsClick, 
  onLocaisClick,
  activeTab,
  unreadMessages = 0,
  isSidebarOpen = false,
  hasNewMessages = false
}) => {
  return (
    <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none transition-all duration-300 ${isSidebarOpen ? 'z-[100] opacity-50' : 'z-[500]'}`}>
      {/* Glow de fundo para profundidade */}
      <div className="absolute -inset-10 bg-primary/10 blur-[60px] rounded-full pointer-events-none"></div>
      
      {/* Main Dock Container */}
      <div className="relative flex items-center px-5 py-4 bg-white/[0.03] backdrop-blur-[50px] rounded-[50px] border border-white/10 shadow-[0_20px_100px_rgba(0,0,0,0.8)] space-x-6 animate-in slide-in-bottom duration-1000 pointer-events-auto">
        
        {/* Botão Locais - Esquerda */}
        <button 
          onClick={onLocaisClick}
          className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all active:scale-75"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${activeTab === TabType.Locais ? 'bg-primary/20 border-primary/30 text-primary shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'bg-white/5 border-white/5 text-white/40 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/10'}`}>
            <span className="material-symbols-rounded text-2xl group-hover:scale-110 transition-transform">location_on</span>
          </div>
          <span className="absolute -bottom-6 text-[7px] font-black uppercase tracking-[0.2em] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">Locais</span>
        </button>

        {/* Botão Central de Criação (+) - O Coração da Dock */}
        <div className="relative">
          {/* Sombra Neon Pulsante */}
          <div className="absolute inset-0 bg-primary/40 blur-[25px] rounded-[32px] animate-pulse"></div>
          
          <button 
            onClick={onCreateClick}
            className="relative w-20 h-20 bg-gradient-to-br from-primary via-secondary to-primary rounded-[35px] flex items-center justify-center text-white shadow-[0_15px_40px_rgba(139,92,246,0.6)] active:scale-90 hover:scale-110 transition-all duration-500 border-2 border-white/30 group"
          >
            <span className="material-symbols-rounded text-6xl font-light group-hover:rotate-90 transition-transform duration-500">add</span>
            
            {/* Detalhe Premium: Anel de luz */}
            <div className="absolute inset-0 rounded-[33px] border border-white/20 opacity-50"></div>
          </button>
        </div>

        {/* Botão Lista de Chats - Direita */}
        <button 
          onClick={onAllChatsClick}
          className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all active:scale-75"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 bg-white/5 border-white/5 text-white/40 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/10`}>
            <span className="material-symbols-rounded text-2xl group-hover:scale-110 transition-transform">forum</span>
          </div>
          {(unreadMessages > 0 || hasNewMessages) && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
              {unreadMessages > 0 ? (unreadMessages > 9 ? '9+' : unreadMessages) : ''}
            </span>
          )}
          <span className="absolute -bottom-6 text-[7px] font-black uppercase tracking-[0.2em] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">Chats</span>
        </button>

      </div>
    </div>
  );
};