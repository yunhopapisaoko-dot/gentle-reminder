"use client";

import React, { useState, useEffect } from 'react';
import { DISEASE_DETAILS } from '../constants';
import { supabaseService } from '../services/supabaseService';

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
  userId: string;
  lastSpinAt?: string;
  onClose: () => void;
  onResult: (id: string, name: string, hpImpact: number) => void;
}

const OPTIONS: RouletteOption[] = [
  { ...DISEASE_DETAILS.d1, color: 'from-rose-600', type: 'disease', weight: 15 },
  { ...DISEASE_DETAILS.d2, color: 'from-purple-600', type: 'disease', weight: 15 },
  { ...DISEASE_DETAILS.d3, color: 'from-cyan-600', type: 'disease', weight: 15 },
  { ...DISEASE_DETAILS.d4, color: 'from-fuchsia-600', type: 'disease', weight: 15 },
  { ...DISEASE_DETAILS.d5, color: 'from-indigo-600', type: 'disease', weight: 15 },
  { id: 'p1', name: '1 MKC', icon: 'money', color: 'from-amber-700', type: 'prize', weight: 12, hpImpact: 0 },
  { id: 'p2', name: '10 MKC', icon: 'payments', color: 'from-slate-400', type: 'prize', weight: 8, hpImpact: 0 },
  { id: 'p3', name: '100 MKC', icon: 'local_atm', color: 'from-emerald-500', type: 'prize', weight: 4.5, hpImpact: 0 },
  { id: 'p4', name: '10.000 MKC', icon: 'diamond', color: 'from-yellow-400', type: 'prize', weight: 0.5, hpImpact: 0 },
];

export const RouletteView: React.FC<RouletteViewProps> = ({ userId, lastSpinAt, onClose, onResult }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [cooldownTime, setCooldownTime] = useState<string | null>(null);

  useEffect(() => {
    if (lastSpinAt) {
      const last = new Date(lastSpinAt).getTime();
      const now = new Date().getTime();
      const diff = now - last;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (diff < twentyFourHours) {
        const remaining = twentyFourHours - diff;
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        setCooldownTime(`${hours}h ${minutes}m`);
      }
    }
  }, [lastSpinAt]);

  const spin = async () => {
    if (isSpinning || showResult || cooldownTime) return;
    setIsSpinning(true);
    
    try {
      await supabaseService.updateLastSpin(userId);
      const targetIndex = Math.floor(Math.random() * OPTIONS.length);
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
    } catch (e) {
      alert("Erro ao girar: " + (e as any).message);
      setIsSpinning(false);
    }
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
        <div className="p-10 flex flex-col items-center">
          <h2 className="text-xl font-black text-white italic uppercase mb-10">Sorteio Magic</h2>
          
          {cooldownTime && !showResult ? (
            <div className="text-center py-10">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20 mx-auto mb-6">
                  <span className="material-symbols-rounded text-4xl">schedule</span>
               </div>
               <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Aguarde o Recarregamento</p>
               <p className="text-2xl font-black text-primary italic tracking-tighter">{cooldownTime}</p>
            </div>
          ) : showResult ? (
            <div className="text-center animate-in zoom-in">
               <span className="material-symbols-rounded text-7xl text-primary mb-6">{currentOption.icon}</span>
               <h3 className="text-2xl font-black text-white uppercase italic mb-8">{currentOption.name}</h3>
               <button onClick={handleClose} className="w-full py-6 rounded-3xl bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all">Confirmar</button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-56 h-56 flex items-center justify-center mb-12">
                <div className={`w-44 h-44 rounded-[45px] bg-gradient-to-br ${currentOption.color} to-black p-0.5 shadow-2xl transition-all ${isSpinning ? 'scale-110' : 'scale-100'}`}>
                  <div className="w-full h-full bg-background-dark/60 backdrop-blur-xl rounded-[43px] flex flex-col items-center justify-center p-4">
                    <span className="material-symbols-rounded text-7xl text-white mb-3">{currentOption.icon}</span>
                    <span className="text-[11px] font-black text-white uppercase tracking-widest text-center">{currentOption.name}</span>
                  </div>
                </div>
              </div>
              <button onClick={spin} disabled={isSpinning} className="w-full py-6 rounded-3xl bg-primary text-white text-[11px] font-black uppercase tracking-[0.5em] shadow-xl active:scale-95 transition-all">
                {isSpinning ? 'Sorteando...' : 'Girar Roleta'}
              </button>
            </div>
          )}
          {!isSpinning && <button onClick={handleClose} className="mt-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Sair</button>}
        </div>
      </div>
    </div>
  );
};