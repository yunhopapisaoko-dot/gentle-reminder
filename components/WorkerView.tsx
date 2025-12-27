"use client";

import React, { useState } from 'react';

interface WorkerViewProps {
  location: string;
  role: string;
  onClose: () => void;
  onManageTeam?: () => void;
}

export const WorkerView: React.FC<WorkerViewProps> = ({ location, role, onClose, onManageTeam }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const isHospital = location === 'hospital';
  const isCreche = location === 'creche';
  const isFood = location === 'restaurante' || location === 'padaria';

  // Mock de dados para o roleplay (Em um app real viria do Supabase Realtime)
  const tasks = {
    food: [
      { id: 1, item: 'Miku Ramen x2', client: 'Luka', status: 'pendente', time: '5m' },
      { id: 2, item: 'Neon Sushi (12p)', client: 'Kaito', status: 'em preparo', time: '12m' }
    ],
    consults: [
      { id: 1, type: 'Febre Mágica', client: 'Miku Art', status: 'Sala 1', time: '14:30' },
      { id: 2, type: 'Diagnóstico Geral', client: 'Tadachi', status: 'Aguardando', time: '15:00' }
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
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Fila de Atendimento</h3>
        </div>

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

        {isHospital && tasks.consults.map(task => (
          <div key={task.id} className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 flex items-center justify-between group">
             <div className="flex items-center space-x-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <span className="material-symbols-rounded">medical_information</span>
                </div>
                <div>
                   <p className="text-lg font-black text-white tracking-tight">{task.type}</p>
                   <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Paciente: <span className="text-blue-400">{task.client}</span> • {task.time}</p>
                </div>
             </div>
             <div className="text-right">
                <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 uppercase tracking-widest">{task.status}</span>
             </div>
          </div>
        ))}

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
      </div>
    </div>
  );
};