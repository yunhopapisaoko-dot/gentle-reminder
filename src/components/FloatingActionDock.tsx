"use client";

import React from 'react';
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
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[450] flex items-center justify-center">
      {/* Container Principal com Glassmorphism Extremo */}
      <div className="flex items-center px-4 py-3 bg-white/[0.03] backdrop-blur-[40px] rounded-[48px] border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.8)] space-x-2 animate-in slide-in-bottom duration-700">
        
        {/* Botão Roleta - Esquerda */}
        <button 
          onClick={onRouletteClick}
          className="w-14 h-14 rounded-full flex flex-col items-center justify-center text-white/40 hover:text-amber-400 transition-all duration-300 active:scale-75 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-amber-400/30 group-hover:bg-amber-400/10 transition-all">
            <span className="material-symbols-rounded text-2xl group-hover:rotate-180 transition-transform duration-500">casino</span>
          </div>
          <span className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Roleta</span>
        </button>

        {/* Botão Central de Criação (+) - DESTAQUE */}
        <div className="relative px-2">
          {/* Brilho de Fundo Neon */}
          <div className="absolute inset-0 bg-primary/40 blur-[30px] rounded-full animate-pulse"></div>
          
          <button 
            onClick={onCreateClick}
            className="relative w-18 h-18 bg-gradient-to-tr from-primary via-secondary to-primary rounded-[32px] flex items-center justify-center text-white shadow-[0_15px_40px_rgba(139,92,246,0.5)] active:scale-90 hover:scale-110 transition-all duration-500 border-2 border-white/30"
          >
            <span className="material-symbols-rounded text-5xl font-light">add</span>
            
            {/* Indicador Visual de Ação */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-lg">
               <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
            </div>
          </button>
        </div>

        {/* Botão Chat - Direita */}
        <button 
          onClick={onChatClick}
          className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-300 active:scale-75 group ${
            activeTab === TabType.Chat ? 'text-primary' : 'text-white/40'
          }`}
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${
            activeTab === TabType.Chat 
              ? 'bg-primary/20 border-primary/40 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
              : 'bg-white/5 border-white/5 group-hover:border-primary/30 group-hover:bg-primary/10'
          }`}>
            <span className="material-symbols-rounded text-2xl">auto_awesome</span>
          </div>
          <span className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Miku</span>
        </button>

      </div>
    </div>
  );
};