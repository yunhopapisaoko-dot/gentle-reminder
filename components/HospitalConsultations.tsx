"use client";

import React, { useState, useEffect } from 'react';
import { DISEASE_DETAILS, DiseaseInfo } from '../constants';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../supabase';

interface HospitalConsultationsProps {
  onClose: () => void;
  onTreat: (disease: DiseaseInfo) => void;
  currentUserId?: string;
  currentUserName?: string;
}

export const HospitalConsultations: React.FC<HospitalConsultationsProps> = ({ 
  onClose, 
  onTreat, 
  currentUserId,
  currentUserName = 'Paciente'
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [activeTreatment, setActiveTreatment] = useState<any>(null);
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
        (payload: any) => {
          console.log('Treatment update received:', payload);
          loadTreatmentStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // O timer agora é gerenciado no ChatInterface, não precisa mais aqui

  const handleRequestTreatment = async (disease: DiseaseInfo) => {
    if (!currentUserId) return;
    
    try {
      // Converter cureTime string (ex: "10 min") para minutos
      const cureTimeMinutes = parseInt(disease.cureTime.replace(/[^0-9]/g, ''));
      
      // Cria a solicitação pendente para o gerente aprovar
      await supabaseService.createTreatmentRequest(
        currentUserId,
        disease.id,
        disease.name,
        disease.treatmentCost,
        cureTimeMinutes
      );
      
      // Buscar a solicitação criada
      const pending = await supabaseService.getUserPendingTreatment(currentUserId);
      
      if (!pending) {
        throw new Error('Erro ao criar solicitação');
      }

      setPendingRequest(pending);
      
    } catch (error: any) {
      console.error('Erro ao solicitar tratamento:', error);
      alert(error.message || 'Erro ao processar tratamento');
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

  // Se há tratamento ativo, mostrar tela de cura com cena AI
  // Se há tratamento ativo, fechar o modal e deixar o chat mostrar o timer
  if (activeTreatment && !isLoading) {
    // Fechar automaticamente para o usuário ver o chat
    setTimeout(() => handleClose(), 100);
    return null;
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
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mt-1.5">Solicite atendimento</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <span className="material-symbols-rounded text-2xl">medical_services</span>
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
                      className="w-full py-5 rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                      <span className="material-symbols-rounded text-lg">send</span>
                      <span>Solicitar Tratamento</span>
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
           <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">🏥 Aguarde aprovação do gerente do hospital</p>
        </div>
      </div>
    </div>
  );
};
