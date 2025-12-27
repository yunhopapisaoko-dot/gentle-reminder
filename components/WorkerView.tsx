"use client";

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../supabase';
import { DISEASE_DETAILS } from '../constants';

interface WorkerViewProps {
  location: string;
  role: string;
  onClose: () => void;
  onManageTeam?: () => void;
  currentUserId?: string;
}

export const WorkerView: React.FC<WorkerViewProps> = ({ location, role, onClose, onManageTeam, currentUserId }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [pendingTreatments, setPendingTreatments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const isHospital = location === 'hospital';
  const isCreche = location === 'creche';
  const isFood = location === 'restaurante' || location === 'padaria';

  // Carregar tratamentos pendentes
  useEffect(() => {
    const loadTreatments = async () => {
      if (!isHospital) {
        setIsLoading(false);
        return;
      }
      
      try {
        const treatments = await supabaseService.getPendingTreatments();
        setPendingTreatments(treatments);
      } catch (error) {
        console.error('Erro ao carregar tratamentos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTreatments();

    // Realtime subscription para atualizações
    if (isHospital) {
      const channel = supabase
        .channel('worker-treatment-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'treatment_requests'
          },
          () => {
            loadTreatments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isHospital]);

  const handleApprove = async (treatment: any) => {
    if (!currentUserId) return;
    setProcessingId(treatment.id);
    
    try {
      await supabaseService.approveTreatment(treatment.id, currentUserId);
      setPendingTreatments(prev => prev.filter(t => t.id !== treatment.id));
    } catch (error: any) {
      console.error('Erro ao aprovar tratamento:', error);
      alert(error.message || 'Erro ao aprovar tratamento');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (treatment: any) => {
    setProcessingId(treatment.id);
    
    try {
      await supabaseService.rejectTreatment(treatment.id);
      setPendingTreatments(prev => prev.filter(t => t.id !== treatment.id));
    } catch (error) {
      console.error('Erro ao rejeitar tratamento:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // Mock de dados para o roleplay (para não-hospital)
  const tasks = {
    food: [
      { id: 1, item: 'Miku Ramen x2', client: 'Luka', status: 'pendente', time: '5m' },
      { id: 2, item: 'Neon Sushi (12p)', client: 'Kaito', status: 'em preparo', time: '12m' }
    ],
    creche: [
      { id: 1, name: 'Hatsune Jr', type: 'Aluno', level: 'Iniciante', activity: 'Pintura' },
      { id: 2, name: 'Prof. Rin', type: 'Professor', level: 'Mestre', activity: 'Música' }
    ]
  };

  return (
    <div className={`fixed inset-0 z-[550] bg-background-dark/95 backdrop-blur-3xl flex flex-col h-[100dvh] ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
      <div className="pt-16 px-8 pb-8 bg-primary/10 border-b border-primary/20 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90">
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Painel de Trabalho</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-1.5">{role} @ {location}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {onManageTeam && (
              <button onClick={onManageTeam} className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg border border-white/20 active:scale-90 transition-all">
                <span className="material-symbols-rounded">manage_accounts</span>
              </button>
            )}
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-rounded text-3xl">assignment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-8 space-y-6 pb-32">
        <div className="px-2 mb-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
            {isHospital ? 'Solicitações de Tratamento' : 'Fila de Atendimento'}
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {isFood && tasks.food.map(task => (
              <div key={task.id} className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                 <div>
                    <p className="text-lg font-black text-white tracking-tight">{task.item}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Cliente: <span className="text-primary">{task.client}</span> • {task.time}</p>
                 </div>
                 <div className="bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{task.status}</span>
                 </div>
              </div>
            ))}

            {isHospital && (
              pendingTreatments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <span className="material-symbols-rounded text-4xl text-white/20">medical_services</span>
                  </div>
                  <p className="text-white/30 text-sm">Nenhuma solicitação pendente</p>
                </div>
              ) : (
                pendingTreatments.map(treatment => {
                  const disease = DISEASE_DETAILS[treatment.disease_id];
                  const isProcessing = processingId === treatment.id;
                  
                  return (
                    <div key={treatment.id} className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-5">
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                            <span className="material-symbols-rounded text-2xl">{disease?.icon || 'medical_information'}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="text-lg font-black text-white tracking-tight">{treatment.disease_name}</p>
                              <span className="bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-amber-500/30 animate-pulse">
                                Aguardando
                              </span>
                            </div>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                              Paciente: <span className="text-blue-400">{treatment.patient?.full_name || 'Desconhecido'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Custo</p>
                          <p className="text-lg font-black text-white italic tracking-tighter">{treatment.treatment_cost} MKC</p>
                          <p className="text-[9px] text-white/30 mt-1">Saldo: {treatment.patient?.money || 0} MKC</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleApprove(treatment)}
                          disabled={isProcessing || (treatment.patient?.money || 0) < treatment.treatment_cost}
                          className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span className="material-symbols-rounded text-lg">check_circle</span>
                              Aprovar
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => handleReject(treatment)}
                          disabled={isProcessing}
                          className="flex-1 py-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-rounded text-lg">cancel</span>
                          Rejeitar
                        </button>
                      </div>
                      
                      {(treatment.patient?.money || 0) < treatment.treatment_cost && (
                        <p className="text-rose-400 text-[10px] text-center mt-3 font-medium">
                          ⚠️ Paciente sem saldo suficiente
                        </p>
                      )}
                    </div>
                  );
                })
              )
            )}

            {isCreche && tasks.creche.map(task => (
               <div key={task.id} className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 flex items-center justify-between group">
                  <div className="flex items-center space-x-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${task.type === 'Aluno' ? 'bg-pink-500/10 text-pink-500' : 'bg-primary/10 text-primary'}`}>
                      <span className="material-symbols-rounded">{task.type === 'Aluno' ? 'child_care' : 'school'}</span>
                    </div>
                    <div>
                       <p className="text-lg font-black text-white tracking-tight">{task.name}</p>
                       <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{task.type} • Atividade: <span className="text-white/80">{task.activity}</span></p>
                    </div>
                  </div>
               </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
