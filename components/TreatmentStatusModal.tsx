"use client";

import React, { useState } from 'react';

interface TreatmentStatusModalProps {
  diseaseName: string;
  timeRemaining: string;
  progress: number;
  approverName?: string;
  approverAvatar?: string | null;
  requiredRoom?: string | null;
  isWaitingForRoom?: boolean;
  onClose: () => void;
}

export const TreatmentStatusModal: React.FC<TreatmentStatusModalProps> = ({
  diseaseName,
  timeRemaining,
  progress,
  approverName,
  approverAvatar,
  requiredRoom,
  isWaitingForRoom = false,
  onClose
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-6">
      {/* Backdrop com blur intenso */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      
      {/* Card do Modal */}
      <div className={`relative w-full max-w-xs bg-background-dark border ${isWaitingForRoom ? 'border-amber-500/30' : 'border-blue-500/30'} rounded-[48px] overflow-hidden shadow-[0_0_80px_${isWaitingForRoom ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}] ${isClosing ? 'animate-out zoom-out' : 'animate-in zoom-in duration-500'}`}>
        
        {/* Glow de fundo */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 ${isWaitingForRoom ? 'bg-amber-500/20' : 'bg-blue-500/20'} blur-[60px] rounded-full pointer-events-none`}></div>

        <div className="p-8 flex flex-col items-center">
          {/* Icone Animado */}
          <div className="relative mb-8">
            <div className={`absolute -inset-4 ${isWaitingForRoom ? 'bg-amber-500/20' : 'bg-blue-500/20'} blur-2xl rounded-full animate-pulse`}></div>
            <div className={`relative w-24 h-24 rounded-[32px] bg-gradient-to-br ${isWaitingForRoom ? 'from-amber-500 to-orange-600' : 'from-blue-500 to-cyan-600'} flex items-center justify-center text-white shadow-2xl border border-white/20`}>
               <span className="material-symbols-rounded text-5xl animate-[bounce_2s_infinite]">
                 {isWaitingForRoom ? 'door_open' : 'medical_services'}
               </span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
              {isWaitingForRoom ? 'Vá para a Sala' : 'Tratamento Ativo'}
            </h3>
            <p className={`text-[10px] font-black ${isWaitingForRoom ? 'text-amber-400' : 'text-blue-400'} uppercase tracking-[0.3em]`}>
              {isWaitingForRoom ? 'O cronômetro iniciará quando entrar' : 'Protocolo de Cura em curso'}
            </p>
          </div>

          {/* Info do Tratamento */}
          <div className="w-full bg-white/[0.03] border border-white/5 rounded-[32px] p-6 mb-8 relative group overflow-hidden">
             <div className={`absolute top-0 left-0 w-1 h-full ${isWaitingForRoom ? 'bg-amber-500/40' : 'bg-blue-500/40'}`}></div>
             
             <div className="mb-4">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Enfermidade</p>
                <p className="text-sm font-bold text-white uppercase">{diseaseName}</p>
             </div>

             {isWaitingForRoom && requiredRoom ? (
               <div className="space-y-3">
                  <div className="flex justify-between items-center">
                     <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Sala Designada</p>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <span className="material-symbols-rounded text-3xl text-amber-400">door_front</span>
                    <div>
                      <p className="text-lg font-black text-white">{requiredRoom}</p>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest">Entre para iniciar o tratamento</p>
                    </div>
                  </div>
               </div>
             ) : (
               <div className="space-y-3">
                  <div className="flex justify-between items-end">
                     <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Progresso</p>
                     <p className="text-lg font-black text-white italic tracking-tighter">{timeRemaining}</p>
                  </div>
                  
                  {/* Barra de Progresso Customizada */}
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1.5px]">
                     <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        style={{ width: `${progress}%` }}
                     />
                  </div>
               </div>
             )}
          </div>

          {/* Médico Responsável */}
          {approverName && (
            <div className="flex items-center gap-3 mb-8 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
               <img src={approverAvatar || '/jyp-avatar.jpg'} className="w-6 h-6 rounded-lg object-cover grayscale opacity-50" alt="Dr" />
               <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Aprovado por: <span className="text-white/60">{approverName}</span></p>
            </div>
          )}

          <button 
            onClick={handleClose}
            className="w-full py-5 rounded-[28px] bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all hover:bg-white/10 hover:text-white"
          >
            Entendido
          </button>
        </div>

        {/* Detalhe de luz inferior */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent ${isWaitingForRoom ? 'via-amber-500/20' : 'via-blue-500/20'} to-transparent`}></div>
      </div>
    </div>
  );
};