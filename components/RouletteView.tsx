"use client";

import React, { useState, useEffect } from 'react';
import { DISEASE_DETAILS } from '../constants';

interface RouletteOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'disease' | 'prize';
  weight: number; 
  description?: string;
  symptoms?: string[];
  hpImpact?: number;
}

interface RouletteViewProps {
  onClose: () => void;
  onResult: (id: string, name: string, hpImpact: number) => void;
}

const OPTIONS: RouletteOption[] = [
  // Doenças usando constantes centralizadas
  { ...DISEASE_DETAILS.d1, color: 'from-rose-600', type: 'disease', weight: 15, description: 'Oscilação de temperatura por mana residual.', symptoms: ['Olhos brilhando', 'Suor de luz', 'Calafrios'] },
  { ...DISEASE_DETAILS.d2, color: 'from-purple-600', type: 'disease', weight: 15, description: 'Selo que impede a fala.', symptoms: ['Mudez total', 'Brilho na garganta', 'Peso no peito'] },
  { ...DISEASE_DETAILS.d3, color: 'from-cyan-600', type: 'disease', weight: 15, description: 'Infecção por poeira cósmica.', symptoms: ['Espirros de fagulhas', 'Tontura', 'Flutuação'] },
  { ...DISEASE_DETAILS.d4, color: 'from-fuchsia-600', type: 'disease', weight: 15, description: 'Falha digital física.', symptoms: ['Manchas brilhantes', 'Taquicardia', 'Visão rosa'] },
  { ...DISEASE_DETAILS.d5, color: 'from-indigo-600', type: 'disease', weight: 15, description: 'Fragmentação da memória.', symptoms: ['Esquecimento', 'Translucidez', 'Desorientação'] },
  
  // Prêmios
  { id: 'p1', name: '1 MKC', icon: 'money', color: 'from-amber-700', type: 'prize', weight: 12, hpImpact: 0 },
  { id: 'p2', name: '10 MKC', icon: 'payments', color: 'from-slate-400', type: 'prize', weight: 8, hpImpact: 0 },
  { id: 'p3', name: '100 MKC', icon: 'local_atm', color: 'from-emerald-500', type: 'prize', weight: 4.5, hpImpact: 0 },
  { id: 'p4', name: '10.000 MKC', icon: 'diamond', color: 'from-yellow-400', type: 'prize', weight: 0.5, hpImpact: 0 },
];

export const RouletteView: React.FC<RouletteViewProps> = ({ onClose, onResult }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const getRandomOptionByWeight = () => {
    const totalWeight = OPTIONS.reduce((acc, opt) => acc + opt.weight, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < OPTIONS.length; i++) {
      if (random < OPTIONS[i].weight) return i;
      random -= OPTIONS[i].weight;
    }
    return 0;
  };

  const spin = () => {
    if (isSpinning || showResult) return;
    setIsSpinning(true);
    
    const targetIndex = getRandomOptionByWeight();
    const rounds = 5; 
    const totalSteps = (rounds * OPTIONS.length) + targetIndex - currentIndex;
    
    let step = 0;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % OPTIONS.length);
      step++;
      
      if (step >= totalSteps) {
        clearInterval(interval);
        setTimeout(() => {
          setIsSpinning(false);
          setShowResult(true);
          const opt = OPTIONS[targetIndex];
          onResult(opt.id, opt.name, opt.hpImpact || 0);
        }, 500);
      }
    }, 60);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const currentOption = OPTIONS[currentIndex];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
      <div className={`absolute inset-0 bg-background-dark/95 backdrop-blur-2xl transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />
      <div className={`relative w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-[50px] overflow-hidden shadow-[0_0_150px_rgba(139,92,246,0.15)] ${isClosing ? 'animate-out zoom-out' : 'animate-in zoom-in'}`}>
        {showResult && currentOption.type === 'disease' ? (
          <div className="p-10 animate-in slide-in-bottom">
             <div className="flex items-center space-x-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
                   <span className="material-symbols-rounded text-4xl">medical_information</span>
                </div>
                <div>
                   <h2 className="text-xl font-black text-white italic uppercase leading-none">Diagnóstico</h2>
                   <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mt-1.5 animate-pulse">Infectado</p>
                </div>
             </div>
             <div className="bg-black/40 rounded-[32px] p-6 border border-white/5 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="material-symbols-rounded text-rose-500">{currentOption.icon}</span>
                    <h3 className="text-lg font-black text-white tracking-tight">{currentOption.name}</h3>
                  </div>
                  <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">{currentOption.hpImpact} HP</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed font-medium mb-6 italic">"{currentOption.description}"</p>
                <div className="space-y-3">
                   {currentOption.symptoms?.map((s, i) => (
                     <div key={i} className="flex items-center space-x-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                        <span className="text-[11px] font-bold text-white/70">{s}</span>
                     </div>
                   ))}
                </div>
             </div>
             <button onClick={handleClose} className="w-full py-6 rounded-3xl bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all">Confirmar</button>
          </div>
        ) : showResult && currentOption.type === 'prize' ? (
          <div className="p-10 text-center animate-in zoom-in relative overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/20 blur-[100px] rounded-full animate-pulse"></div>
             <div className="relative z-10">
               <div className="w-24 h-24 bg-emerald-500/20 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-[0_0_50px_rgba(16,185,129,0.4)] animate-bounce">
                  <span className="material-symbols-rounded text-6xl">card_giftcard</span>
               </div>
               <h2 className="text-3xl font-black text-white italic uppercase mb-2">Parabéns!</h2>
               <div className="bg-emerald-500/10 rounded-[40px] py-10 border border-emerald-500/20 mb-10">
                  <span className="text-6xl font-black text-white italic tracking-tighter">{currentOption.name.split(' ')[0]}</span>
                  <span className="text-emerald-400 font-black ml-3 text-2xl uppercase">{currentOption.name.split(' ')[1]}</span>
               </div>
               <button onClick={handleClose} className="w-full py-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-400 text-white text-[11px] font-black uppercase tracking-[0.5em] active:scale-95 transition-all">Resgatar</button>
             </div>
          </div>
        ) : (
          <div className="p-10 flex flex-col items-center">
            <h2 className="text-xl font-black text-white italic uppercase mb-10">Sorteio Magic</h2>
            <div className="relative w-56 h-56 flex items-center justify-center mb-12">
              <div className={`absolute inset-0 rounded-full blur-[50px] animate-pulse transition-colors ${currentOption.type === 'disease' ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}></div>
              <div className={`w-44 h-44 rounded-[45px] bg-gradient-to-br ${currentOption.color} to-black p-0.5 shadow-2xl transition-all ${isSpinning ? 'scale-110' : 'scale-100'}`}>
                <div className="w-full h-full bg-background-dark/60 backdrop-blur-xl rounded-[43px] flex flex-col items-center justify-center p-4">
                  <span className="material-symbols-rounded text-7xl text-white mb-3">{currentOption.icon}</span>
                  <span className="text-[11px] font-black text-white uppercase tracking-widest text-center">{currentOption.name}</span>
                </div>
              </div>
            </div>
            <button onClick={spin} disabled={isSpinning} className={`w-full py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.5em] transition-all ${isSpinning ? 'bg-white/5 text-white/10' : 'bg-primary text-white shadow-primary/40 active:scale-95'}`}>
              {isSpinning ? 'Sorteando...' : 'Girar Roleta'}
            </button>
            <button onClick={handleClose} disabled={isSpinning} className="mt-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Sair</button>
          </div>
        )}
      </div>
    </div>
  );
};