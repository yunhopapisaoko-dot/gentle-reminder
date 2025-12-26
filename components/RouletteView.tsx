"use client";

import React, { useState, useEffect } from 'react';

interface RouletteOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'disease' | 'prize';
}

interface RouletteViewProps {
  onClose: () => void;
  onResult: (id: string, name: string) => void;
}

const OPTIONS: RouletteOption[] = [
  // Doenças (Roleplay)
  { id: 'd1', name: 'Febre Mágica', icon: 'coronavirus', color: 'from-rose-600', type: 'disease' },
  { id: 'd2', name: 'Maldição do Silêncio', icon: 'comments_disabled', color: 'from-purple-600', type: 'disease' },
  { id: 'd3', name: 'Gripe Estelar', icon: 'ac_unit', color: 'from-cyan-600', type: 'disease' },
  { id: 'd4', name: 'Vírus Neon', icon: 'biotech', color: 'from-fuchsia-600', type: 'disease' },
  { id: 'd5', name: 'Amnésia Espiritual', icon: 'psychology_alt', color: 'from-indigo-600', type: 'disease' },
  // Prêmios
  { id: 'p1', name: '100 MKC', icon: 'payments', color: 'from-emerald-500', type: 'prize' },
  { id: 'p2', name: '500 MKC', icon: 'local_atm', color: 'from-green-500', type: 'prize' },
  { id: 'p3', name: '1.000 MKC', icon: 'paid', color: 'from-teal-500', type: 'prize' },
  { id: 'p4', name: '5.000 MKC', icon: 'savings', color: 'from-amber-500', type: 'prize' },
  { id: 'p5', name: '10.000 MKC', icon: 'diamond', color: 'from-yellow-400', type: 'prize' },
];

export const RouletteView: React.FC<RouletteViewProps> = ({ onClose, onResult }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    
    let speed = 50;
    let counts = 0;
    // Pelo menos 30 saltos para dar emoção
    const maxCounts = 30 + Math.floor(Math.random() * 20);

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % OPTIONS.length);
      counts++;
      
      if (counts >= maxCounts) {
        clearInterval(interval);
        setTimeout(() => {
          const winner = OPTIONS[currentIndex];
          onResult(winner.id, winner.name);
          setIsSpinning(false);
          // Pequeno delay para o usuário ver o resultado antes de fechar
          setTimeout(handleClose, 1500);
        }, 500);
      }
    }, speed);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const currentOption = OPTIONS[currentIndex];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
      <div className={`absolute inset-0 bg-background-dark/95 backdrop-blur-2xl transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />
      
      <div className={`relative w-full max-w-xs bg-white/[0.03] border border-white/10 rounded-[50px] p-10 flex flex-col items-center shadow-[0_0_150px_rgba(139,92,246,0.15)]
        ${isClosing ? 'animate-out zoom-out duration-500' : 'animate-in zoom-in duration-500'}`}>
        
        <div className="text-center mb-10">
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Sorteio Magic</h2>
          <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-2">Teste sua sorte agora</p>
        </div>

        <div className="relative w-56 h-56 flex items-center justify-center mb-12">
          {/* Brilho Dinâmico baseado no tipo */}
          <div className={`absolute inset-0 rounded-full blur-[50px] animate-pulse transition-colors duration-500 ${currentOption.type === 'disease' ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}></div>
          
          {/* Card Central */}
          <div className={`w-44 h-44 rounded-[45px] bg-gradient-to-br ${currentOption.color} to-black p-0.5 shadow-2xl transition-all duration-150 ${isSpinning ? 'scale-110' : 'scale-100'}`}>
            <div className="w-full h-full bg-background-dark/60 backdrop-blur-xl rounded-[43px] flex flex-col items-center justify-center p-4">
               <span className={`material-symbols-rounded text-7xl text-white mb-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] ${isSpinning ? 'animate-bounce' : ''}`}>
                 {currentOption.icon}
               </span>
               <span className="text-[11px] font-black text-white uppercase tracking-widest text-center leading-tight">
                 {currentOption.name}
               </span>
               <span className={`text-[8px] font-black uppercase tracking-[0.2em] mt-2 ${currentOption.type === 'disease' ? 'text-rose-400' : 'text-emerald-400'}`}>
                 {currentOption.type === 'disease' ? 'Status' : 'Recompensa'}
               </span>
            </div>
          </div>

          {/* Marcador Superior */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-primary">
            <span className="material-symbols-rounded text-4xl animate-bounce">stat_minus_1</span>
          </div>
        </div>

        <button
          onClick={spin}
          disabled={isSpinning}
          className={`w-full py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.5em] transition-all shadow-2xl ${
            isSpinning ? 'bg-white/5 text-white/10' : 'bg-primary text-white shadow-primary/40 active:scale-95 hover:brightness-110'
          }`}
        >
          {isSpinning ? 'Sorteando...' : 'Girar Roleta'}
        </button>
        
        <button 
          onClick={handleClose} 
          disabled={isSpinning} 
          className="mt-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-white transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};