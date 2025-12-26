"use client";

import React, { useState, useEffect } from 'react';

interface RouletteOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'disease' | 'prize';
  description?: string;
  symptoms?: string[];
}

interface RouletteViewProps {
  onClose: () => void;
  onResult: (id: string, name: string) => void;
}

const OPTIONS: RouletteOption[] = [
  // Doenças (Roleplay)
  { 
    id: 'd1', name: 'Febre Mágica', icon: 'coronavirus', color: 'from-rose-600', type: 'disease',
    description: 'Uma oscilação violenta na temperatura do corpo causada por excesso de mana residual no ambiente.',
    symptoms: ['Olhos brilhando em vermelho', 'Suor com partículas de luz', 'Calafrios rítmicos']
  },
  { 
    id: 'd2', name: 'Maldição do Silêncio', icon: 'comments_disabled', color: 'from-purple-600', type: 'disease',
    description: 'Um selo invisível que impede a vibração das cordas vocais. Comum após rituais mal executados.',
    symptoms: ['Incapacidade total de falar', 'Brilho roxo na garganta ao tentar gritar', 'Sensação de peso no peito']
  },
  { 
    id: 'd3', name: 'Gripe Estelar', icon: 'ac_unit', color: 'from-cyan-600', type: 'disease',
    description: 'Infecção por poeira cósmica que altera a percepção da gravidade do indivíduo.',
    symptoms: ['Espirros que soltam fagulhas azuis', 'Tontura extrema', 'Sensação de estar flutuando']
  },
  { 
    id: 'd4', name: 'Vírus Neon', icon: 'biotech', color: 'from-fuchsia-600', type: 'disease',
    description: 'Uma falha digital que se manifesta fisicamente, transformando a pigmentação da pele em cores saturadas.',
    symptoms: ['Manchas brilhantes na pele', 'Batimentos cardíacos acelerados', 'Visão em tons de rosa']
  },
  { 
    id: 'd5', name: 'Amnésia Espiritual', icon: 'psychology_alt', color: 'from-indigo-600', type: 'disease',
    description: 'Fragmentação da memória recente devido ao contato com dimensões instáveis da MagicTalk.',
    symptoms: ['Esquecimento de nomes', 'Aparência levemente translúcida', 'Desorientação espacial']
  },
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
  const [showResult, setShowResult] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const spin = () => {
    if (isSpinning || showResult) return;
    setIsSpinning(true);
    
    let speed = 50;
    let counts = 0;
    const maxCounts = 40 + Math.floor(Math.random() * 15);

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % OPTIONS.length);
      counts++;
      
      if (counts >= maxCounts) {
        clearInterval(interval);
        setTimeout(() => {
          setIsSpinning(false);
          setShowResult(true);
          onResult(OPTIONS[currentIndex].id, OPTIONS[currentIndex].name);
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
      
      <div className={`relative w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-[50px] overflow-hidden shadow-[0_0_150px_rgba(139,92,246,0.15)]
        ${isClosing ? 'animate-out zoom-out duration-500' : 'animate-in zoom-in duration-500'}`}>
        
        {showResult && currentOption.type === 'disease' ? (
          /* TELA DE DIAGNÓSTICO MÉDICO */
          <div className="p-10 animate-in slide-in-bottom duration-700">
             <div className="flex items-center space-x-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
                   <span className="material-symbols-rounded text-4xl">medical_information</span>
                </div>
                <div>
                   <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Diagnóstico</h2>
                   <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mt-1.5 animate-pulse">Infectado</p>
                </div>
             </div>

             <div className="bg-black/40 rounded-[32px] p-6 border border-white/5 mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="material-symbols-rounded text-rose-500">{currentOption.icon}</span>
                  <h3 className="text-lg font-black text-white tracking-tight">{currentOption.name}</h3>
                </div>
                <p className="text-xs text-white/50 leading-relaxed font-medium mb-6 italic">
                  "{currentOption.description}"
                </p>
                
                <div className="space-y-3">
                   <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-2">Sintomas Identificados</span>
                   {currentOption.symptoms?.map((symptom, i) => (
                     <div key={i} className="flex items-center space-x-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                        <span className="text-[11px] font-bold text-white/70">{symptom}</span>
                     </div>
                   ))}
                </div>
             </div>

             <button 
                onClick={handleClose}
                className="w-full py-6 rounded-3xl bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all"
             >
                Confirmar Leitura
             </button>
          </div>
        ) : showResult && currentOption.type === 'prize' ? (
          /* TELA DE RECOMPENSA */
          <div className="p-10 text-center animate-in zoom-in duration-500">
             <div className="w-24 h-24 bg-emerald-500/20 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                <span className="material-symbols-rounded text-6xl">card_giftcard</span>
             </div>
             <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Parabéns!</h2>
             <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-8">Você recebeu um prêmio</p>
             
             <div className="bg-emerald-500/10 rounded-[32px] py-8 border border-emerald-500/20 mb-8">
                <span className="text-5xl font-black text-white italic">{currentOption.name.split(' ')[0]}</span>
                <span className="text-emerald-400 font-black ml-2">{currentOption.name.split(' ')[1]}</span>
             </div>

             <button 
                onClick={handleClose}
                className="w-full py-6 rounded-3xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all"
             >
                Resgatar
             </button>
          </div>
        ) : (
          /* TELA DA ROLETA GIRANDO */
          <div className="p-10 flex flex-col items-center">
            <div className="text-center mb-10">
              <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Sorteio Magic</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-2">Teste sua sorte agora</p>
            </div>

            <div className="relative w-56 h-56 flex items-center justify-center mb-12">
              <div className={`absolute inset-0 rounded-full blur-[50px] animate-pulse transition-colors duration-500 ${currentOption.type === 'disease' ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}></div>
              
              <div className={`w-44 h-44 rounded-[45px] bg-gradient-to-br ${currentOption.color} to-black p-0.5 shadow-2xl transition-all duration-150 ${isSpinning ? 'scale-110' : 'scale-100'}`}>
                <div className="w-full h-full bg-background-dark/60 backdrop-blur-xl rounded-[43px] flex flex-col items-center justify-center p-4">
                  <span className={`material-symbols-rounded text-7xl text-white mb-3 ${isSpinning ? 'animate-bounce' : ''}`}>
                    {currentOption.icon}
                  </span>
                  <span className="text-[11px] font-black text-white uppercase tracking-widest text-center leading-tight">
                    {currentOption.name}
                  </span>
                </div>
              </div>

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
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );
};