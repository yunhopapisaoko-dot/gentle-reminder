"use client";

import React, { useState } from 'react';
import { TabType } from '../types';

interface FloatingActionDockProps {
  onCreateClick: () => void;
  onChatClick: () => void;
  onRouletteClick: () => void;
  activeTab: TabType;
}

export const FloatingActionDock: React.FC<FloatingActionDockProps> = ({ 
  onCreateClick, 
  onChatClick, 
  onRouletteClick,
  activeTab 
}) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[450] flex items-center px-6 py-4 bg-black/40 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-x-4 animate-in slide-in-bottom">
      
      {/* Botão Roleta - Sorteia um local */}
      <button 
        onClick={onRouletteClick}
        className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-amber-400 hover:bg-amber-400/10 hover:border-amber-400/30 transition-all duration-500 active:scale-90 group relative"
      >
        <span className="material-symbols-rounded text-2xl group-hover:rotate-180 transition-transform duration-700">casino</span>
        <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-black/80 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/10 whitespace-nowrap">Roleta Mágica</div>
      </button>

      {/* Botão Principal + (Criação) */}
      <div className="relative">
        <div className="absolute -inset-4 bg-primary/30 blur-2xl rounded-full opacity-50 animate-pulse"></div>
        <button 
          onClick={onCreateClick}
          className="relative w-18 h-18 bg-gradient-to-tr from-primary to-secondary rounded-[28px] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(139,92,246,0.5)] active:scale-95 hover:scale-105 transition-all duration-300 border border-white/20"
        >
          <span className="material-symbols-rounded text-4xl">add</span>
        </button>
      </div>

      {/* Botão Chat Miku */}
      <button 
        onClick={onChatClick}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 active:scale-90 group relative border ${
          activeTab === TabType.Chat 
            ? 'bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(139,92,246,0.3)]' 
            : 'bg-white/5 border-white/10 text-white/40 hover:text-primary hover:bg-primary/10'
        }`}
      >
        <span className="material-symbols-rounded text-2xl">auto_awesome</span>
        <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-black/80 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/10 whitespace-nowrap">Chat Miku</div>
      </button>

    </div>
  );
};