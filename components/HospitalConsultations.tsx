"use client";

import React, { useState, useEffect } from 'react';
import { DISEASE_DETAILS, DiseaseInfo } from '../constants';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../supabase';

interface HospitalConsultationsProps {
  onClose: () => void;
  onTreat: (disease: DiseaseInfo) => void;
  currentUserId?: string;
}

export const HospitalConsultations: React.FC<HospitalConsultationsProps> = ({ onClose, onTreat, currentUserId }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [activeTreatment, setActiveTreatment] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  // Carregar status do tratamento do usuário
  useEffect(() => {
    const loadTreatmentStatus = async () => {
      if (!currentUserId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const pending = await supabaseService.getUserPendingTreatment(currentUserId);
        const active = await supabaseService.getUserActiveTreatment(currentUserId);
        setPendingRequest(pending);
        setActiveTreatment(active);
      } catch (error) {
        console.error('Erro ao carregar status do tratamento:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTreatmentStatus();

    // Realtime subscription para atualizações
    const channel = supabase
      .channel('treatment-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'treatment_requests',
          filter: `patient_id=eq.${currentUserId}`
        },
        () => {
          loadTreatmentStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Timer para tratamento ativo
  useEffect(() => {
    if (!activeTreatment?.approved_at) return;

    const calculateRemaining = () => {
      const approvedAt = new Date(activeTreatment.approved_at).getTime();
      const cureTimeMs = activeTreatment.cure_time_minutes * 60 * 1000;
      const endTime = approvedAt + cureTimeMs;
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      
      if (remaining === 0 && currentUserId) {
        // Tratamento completo
        supabaseService.completeTreatment(activeTreatment.id, currentUserId)
          .then(() => {
            setActiveTreatment(null);
          })
          .catch(console.error);
      }
      
      return remaining;
    };

    setTimeRemaining(calculateRemaining());
    
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTreatment, currentUserId]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRequestTreatment = async (disease: DiseaseInfo) => {
    if (!currentUserId) return;
    
    try {
      // Converter cureTime string (ex: "10 min") para minutos
      const cureTimeMinutes = parseInt(disease.cureTime.replace(/[^0-9]/g, ''));
      
      await supabaseService.createTreatmentRequest(
        currentUserId,
        disease.id,
        disease.name,
        disease.treatmentCost,
        cureTimeMinutes
      );
      
      setPendingRequest({
        disease_id: disease.id,
        disease_name: disease.name,
        status: 'pending'
      });
    } catch (error) {
      console.error('Erro ao solicitar tratamento:', error);
    }
  };

  const handleCancelRequest = async () => {
    if (!pendingRequest?.id) return;
    
    try {
      await supabaseService.cancelTreatmentRequest(pendingRequest.id);
      setPendingRequest(null);
    } catch (error) {
      console.error('Erro ao cancelar solicitação:', error);
    }
  };

  // Se há tratamento ativo, mostrar tela de cura
  if (activeTreatment) {
    const disease = DISEASE_DETAILS[activeTreatment.disease_id];
    
    return (
      <div className={`fixed inset-0 z-[300] bg-background-dark/95 backdrop-blur-3xl flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
        <div className="pt-16 px-8 pb-8 bg-emerald-500/10 border-b border-emerald-500/20 relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleClose}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
              >
                <span className="material-symbols-rounded">arrow_back</span>
              </button>
              <div>
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Em Tratamento</h2>
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] mt-1.5">Recuperando Saúde</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
              <span className="material-symbols-rounded text-3xl">healing</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-32 h-32 rounded-full bg-emerald-500/20 border-4 border-emerald-500/40 flex items-center justify-center mb-8 animate-pulse">
            <span className="material-symbols-rounded text-6xl text-emerald-400">{disease?.icon || 'healing'}</span>
          </div>
          
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{activeTreatment.disease_name}</h3>
          <p className="text-white/40 text-sm mb-8">Tratamento em andamento...</p>
          
          <div className="bg-white/[0.03] border border-emerald-500/20 rounded-[40px] p-8 text-center">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4">Tempo Restante</p>
            <p className="text-5xl font-black text-white italic tracking-tighter">{formatTime(timeRemaining)}</p>
          </div>
          
          <div className="mt-8 w-full max-w-sm">
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${100 - (timeRemaining / (activeTreatment.cure_time_minutes * 60 * 1000)) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="px-2 mb-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Selecione seu Diagnóstico</h3>
            </div>

            {Object.values(DISEASE_DETAILS).map((disease) => {
              const isPending = pendingRequest?.disease_id === disease.id;
              
              return (
                <div 
                  key={disease.id}
                  className={`group relative bg-white/[0.03] border rounded-[40px] p-8 transition-all overflow-hidden ${
                    isPending 
                      ? 'border-amber-500/30 bg-amber-500/5' 
                      : 'border-white/5 hover:bg-white/[0.05] hover:border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border shadow-lg transition-all duration-500 ${
                        isPending 
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white'
                      }`}>
                        <span className="material-symbols-rounded text-3xl">{disease.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-black text-white tracking-tight uppercase leading-none">{disease.name}</h4>
                          {isPending && (
                            <span className="bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-amber-500/30 animate-pulse">
                              Aguardando
                            </span>
                          )}
                        </div>
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

                  {isPending ? (
                    <button 
                      onClick={handleCancelRequest}
                      className="w-full py-5 rounded-3xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all"
                    >
                      Cancelar Solicitação
                    </button>
                  ) : pendingRequest ? (
                    <button 
                      disabled
                      className="w-full py-5 rounded-3xl bg-white/5 text-white/30 text-[11px] font-black uppercase tracking-[0.4em] cursor-not-allowed"
                    >
                      Já há uma solicitação pendente
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleRequestTreatment(disease)}
                      className="w-full py-5 rounded-3xl bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all group-hover:bg-blue-500 group-hover:text-white"
                    >
                      Iniciar Tratamento
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}
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
