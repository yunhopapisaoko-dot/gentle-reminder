"use client";

import React, { useState } from 'react';
import { DISEASE_DETAILS, DiseaseInfo } from '../constants';

interface HospitalConsultationsProps {
  onClose: () => void;
  onTreat: (disease: DiseaseInfo) => void;
}

export const HospitalConsultations: React.FC<HospitalConsultationsProps> = ({ onClose, onTreat }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  return (
    <div className={`fixed inset-0 z-[300] bg-background-dark/95 backdrop-blur-3xl flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
      
      {/* Header Imersivo */}
      <div className="pt-16 px-8 pb-8 bg-blue-500/10 border-b border-blue-500/20 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleClose}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Consultório</h2>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mt-1.5">Tratamentos Mágicos</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <span className="material-symbols-rounded text-3xl">medical_information</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-8 space-y-6 pb-32">
        <div className="px-2 mb-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Selecione seu Diagnóstico</h3>
        </div>

        {Object.values(DISEASE_DETAILS).map((disease) => (
          <div 
            key={disease.id}
            className="group relative bg-white/[0.03] border border-white/5 rounded-[40px] p-8 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all active:scale-[0.98] overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-lg">
                  <span className="material-symbols-rounded text-3xl">{disease.icon}</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-white tracking-tight uppercase leading-none">{disease.name}</h4>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{disease.hpImpact} HP</span>
                    <span className="text-white/20 text-[10px]">•</span>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{disease.cureTime}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Custo do Antídoto</p>
                <p className="text-xl font-black text-white italic tracking-tighter">{disease.treatmentCost} MKC</p>
              </div>
            </div>

            <button 
              onClick={() => onTreat(disease)}
              className="w-full py-5 rounded-3xl bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all group-hover:bg-blue-500 group-hover:text-white"
            >
              Iniciar Tratamento
            </button>
          </div>
        ))}
      </div>

      {/* Footer Informativo */}
      <div className="p-10 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent absolute bottom-0 left-0 right-0">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-[30px] p-5 text-center">
           <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">A saúde é seu bem mais precioso no MagicTalk</p>
        </div>
      </div>
    </div>
  );
};