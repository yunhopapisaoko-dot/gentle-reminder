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
  const [resultOption, setResultOption] = useState<RouletteOption | null>(null);

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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

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
            setResultOption(opt);
            
            // Aplica o resultado
            onResult(opt.id, opt.name, opt.hpImpact || 0);
            
            // Fecha automaticamente após mostrar o resultado por 2.5 segundos
            setTimeout(() => {
              handleClose();
            }, 2500);
          }, 500);
        }
      }, 60);
    } catch (e) {
      alert("Erro ao girar: " + (e as any).message);
      setIsSpinning(false);
    }
  };

  const currentOption = OPTIONS[currentIndex];
  const displayOption = resultOption || currentOption;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
      <div className={`absolute inset-0 bg-neutral-950/98 backdrop-blur-2xl transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`} />
      <div className={`relative w-full max-w-sm bg-neutral-900 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl ${isClosing ? 'animate-out zoom-out' : 'animate-in zoom-in'}`}>
        <div className="p-10 flex flex-col items-center">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-10">Sorteio Magic</h2>
          
          {cooldownTime ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20 mx-auto mb-6 border border-white/10">
                <span className="material-symbols-rounded text-4xl">schedule</span>
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-3">Aguarde o Recarregamento</p>
              <p className="text-3xl font-bold text-emerald-400 tracking-tight">{cooldownTime}</p>
              
              <button 
                onClick={handleClose}
                className="mt-8 text-sm text-white/40 hover:text-white transition-colors"
              >
                Voltar
              </button>
            </div>
          ) : showResult ? (
            <div className="text-center animate-in zoom-in">
              {/* Resultado - mostra por alguns segundos e fecha automaticamente */}
              <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 mx-auto ${
                displayOption.type === 'disease' 
                  ? 'bg-rose-500/20 border-2 border-rose-500/40' 
                  : 'bg-emerald-500/20 border-2 border-emerald-500/40'
              }`}>
                <span className={`material-symbols-rounded text-6xl ${
                  displayOption.type === 'disease' ? 'text-rose-400' : 'text-emerald-400'
                }`}>{displayOption.icon}</span>
              </div>
              
              <h3 className={`text-2xl font-bold uppercase mb-3 ${
                displayOption.type === 'disease' ? 'text-rose-400' : 'text-emerald-400'
              }`}>{displayOption.name}</h3>
              
              {displayOption.type === 'disease' ? (
                <p className="text-sm text-white/50 mb-4">
                  Você contraiu uma doença! Vá ao hospital para se curar.
                </p>
              ) : (
                <p className="text-sm text-white/50 mb-4">
                  Parabéns! Você ganhou {displayOption.name}!
                </p>
              )}
              
              {/* Indicador de fechamento automático */}
              <div className="flex items-center justify-center gap-2 text-white/30">
                <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                <span className="text-xs">Fechando automaticamente...</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-56 h-56 flex items-center justify-center mb-12">
                <div className={`w-44 h-44 rounded-[45px] bg-gradient-to-br ${currentOption.color} to-black p-0.5 shadow-2xl transition-all ${isSpinning ? 'scale-110' : 'scale-100'}`}>
                  <div className="w-full h-full bg-neutral-900/80 backdrop-blur-xl rounded-[43px] flex flex-col items-center justify-center p-4">
                    <span className="material-symbols-rounded text-7xl text-white mb-3">{currentOption.icon}</span>
                    <span className="text-xs font-bold text-white uppercase tracking-widest text-center">{currentOption.name}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={spin} 
                disabled={isSpinning} 
                className="w-full py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold uppercase tracking-wider shadow-xl shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSpinning ? 'Sorteando...' : 'Girar Roleta'}
              </button>
              
              {!isSpinning && (
                <button 
                  onClick={handleClose} 
                  className="mt-6 text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  Sair
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};