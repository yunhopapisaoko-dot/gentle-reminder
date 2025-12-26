"use client";

import React, { useState, useEffect } from 'react';

interface RouletteViewProps {
  onClose: () => void;
  onResult: (id: string) => void;
}

const OPTIONS = [
  { id: 'hospital', name: 'Hospital', icon: 'medical_services', color: 'from-blue-500' },
  { id: 'creche', name: 'Creche', icon: 'child_care', color: 'from-pink-500' },
  { id: 'restaurante', name: 'Restaurante', icon: 'restaurant', color: 'from-orange-500' },
  { id: 'padaria', name: 'Padaria', icon: 'bakery_dining', color: 'from-yellow-600' },
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
    const maxCounts = 20 + Math.floor(Math.random() * 10);

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % OPTIONS.length);
      counts++;
      
      if (counts >= maxCounts) {
        clearInterval(interval);
        setTimeout(() => {
          onResult(OPTIONS[currentIndex].id);
          setIsSpinning(false);
          handleClose();
        }, 800);
      }
    }, speed);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
      <div className={`absolute inset-0 bg-background-dark/95 backdrop-blur-2xl transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />
      
      <div className={`relative w-full max-w-xs bg-white/[0.03] border border-white/10 rounded-[50px] p-10 flex flex-col items-center shadow-[0_0_100px_rgba(139,92,246,0.2)]
        ${isClosing ? 'animate-out zoom-out duration-500' : 'animate-in zoom-in duration-500'}`}>
        
        <h2 className="text-xl font-black text-white italic tracking-tighter uppercase mb-12">Sorteio de Destino</h2>

        <div className="relative w-48 h-48 flex items-center justify-center mb-12">
          {/* Círculo de Brilho */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-[40px] animate-pulse"></div>
          
          {/* Card Central */}
          <div className={`w-40 h-40 rounded-[40px] bg-gradient-to-br ${OPTIONS[currentIndex].color} to-black p-0.5 shadow-2xl transition-all duration-150 ${isSpinning ? 'scale-110 rotate-3' : 'scale-100'}`}>
            <div className="w-full h-full bg-background-dark/40 backdrop-blur-md rounded-[38px] flex flex-col items-center justify-center">
               <span className="material-symbols-rounded text-6xl text-white mb-3">{OPTIONS[currentIndex].icon}</span>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">{OPTIONS[currentIndex].name}</span>
            </div>
          </div>

          {/* Seta Indicadora */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-primary animate-bounce">
            <span className="material-symbols-rounded text-4xl">arrow_drop_down</span>
          </div>
        </div>

        <button
          onClick={spin}
          disabled={isSpinning}
          className={`w-full py-5 rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] transition-all shadow-2xl ${
            isSpinning ? 'bg-white/10 text-white/20' : 'bg-primary text-white shadow-primary/30 active:scale-95'
          }`}
        >
          {isSpinning ? 'Girando...' : 'Girar Roleta'}
        </button>
        
        <button onClick={handleClose} disabled={isSpinning} className="mt-6 text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
      </div>
    </div>
  );
};