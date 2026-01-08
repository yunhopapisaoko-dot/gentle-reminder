"use client";

import React, { useState, useEffect } from 'react';
import { JobApplication } from '../types';
import { supabaseService } from '../services/supabaseService';

interface Worker {
  id: string;
  user_id: string;
  location: string;
  role: string;
  profile: {
    user_id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  } | null;
}

interface ManagerDashboardProps {
  location: string;
  onClose: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ location, onClose }) => {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<'applications' | 'workers'>('applications');
  const [firingId, setFiringId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [location]);

  const fetchData = async () => {
    setIsLoading(true);
    const [appsData, workersData] = await Promise.all([
      supabaseService.getJobApplications(location),
      supabaseService.getLocationWorkers(location)
    ]);
    setApps(appsData);
    setWorkers(workersData);
    setIsLoading(false);
  };

  const handleAction = async (app: JobApplication, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await supabaseService.approveApplication(app.id, app.user_id, location, app.role);
      } else {
        await supabaseService.rejectApplication(app.id);
      }
      setApps(prev => prev.filter(a => a.id !== app.id));
      // Atualizar lista de funcionários se aprovado
      if (action === 'approve') {
        const updatedWorkers = await supabaseService.getLocationWorkers(location);
        setWorkers(updatedWorkers);
      }
    } catch (error: any) {
      alert("Erro na ação: " + error.message);
    }
  };

  const handleFireWorker = async (worker: Worker) => {
    if (!confirm(`Tem certeza que deseja demitir ${worker.profile?.full_name || 'este funcionário'}?`)) {
      return;
    }
    
    setFiringId(worker.user_id);
    try {
      await supabaseService.fireWorker(worker.user_id, location);
      setWorkers(prev => prev.filter(w => w.user_id !== worker.user_id));
    } catch (error: any) {
      alert("Erro ao demitir: " + error.message);
    } finally {
      setFiringId(null);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  return (
    <div className={`fixed inset-0 z-[550] bg-background-dark/95 backdrop-blur-3xl flex flex-col h-[100dvh] ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
      <div className="pt-16 px-8 pb-8 bg-black/40 border-b border-white/5 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90">
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Gestão de Equipe</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-1.5">{location}</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
            <span className="material-symbols-rounded text-3xl">manage_accounts</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'applications'
                ? 'bg-primary text-white'
                : 'bg-white/5 text-white/50 border border-white/10'
            }`}
          >
            <span className="material-symbols-rounded text-base align-middle mr-2">description</span>
            Fichas ({apps.length})
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'workers'
                ? 'bg-primary text-white'
                : 'bg-white/5 text-white/50 border border-white/10'
            }`}
          >
            <span className="material-symbols-rounded text-base align-middle mr-2">groups</span>
            Equipe ({workers.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-8 space-y-6 pb-32">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center opacity-20">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          </div>
        ) : activeTab === 'applications' ? (
          /* TAB: FICHAS DE CANDIDATURA */
          apps.length === 0 ? (
            <div className="py-24 text-center opacity-20 flex flex-col items-center">
              <span className="material-symbols-rounded text-6xl mb-4">person_search</span>
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma ficha pendente</p>
            </div>
          ) : (
            apps.map(app => (
              <div key={app.id} className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 animate-in zoom-in">
                <div className="flex items-center space-x-4 mb-6">
                   <img src={app.profiles?.avatar_url} className="w-14 h-14 rounded-2xl object-cover border border-white/10" alt="avatar" />
                   <div>
                      <h4 className="text-lg font-black text-white leading-none">{app.applicant_name}</h4>
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1.5">@{app.profiles?.username} • {app.applicant_age} anos</p>
                   </div>
                </div>
                
                <div className="bg-black/30 rounded-3xl p-5 mb-8 border border-white/5">
                   <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Pretensão: <span className="text-white">{app.role}</span></p>
                   <p className="text-[11px] text-white/70 italic leading-relaxed">"{app.experience || 'Sem experiência relatada.'}"</p>
                </div>

                <div className="flex space-x-4">
                   <button onClick={() => handleAction(app, 'reject')} className="flex-1 py-4 rounded-2xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-500/20 active:scale-95 transition-all">Recusar</button>
                   <button onClick={() => handleAction(app, 'approve')} className="flex-1 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Aprovar</button>
                </div>
              </div>
            ))
          )
        ) : (
          /* TAB: FUNCIONÁRIOS */
          workers.length === 0 ? (
            <div className="py-24 text-center opacity-20 flex flex-col items-center">
              <span className="material-symbols-rounded text-6xl mb-4">group_off</span>
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhum funcionário no momento</p>
            </div>
          ) : (
            workers.map(worker => (
              <div key={worker.id} className="bg-white/[0.03] border border-white/5 rounded-[40px] p-6 animate-in zoom-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={worker.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.user_id}`} 
                      className="w-14 h-14 rounded-2xl object-cover border border-white/10" 
                      alt="avatar" 
                    />
                    <div>
                      <h4 className="text-lg font-black text-white leading-none">{worker.profile?.full_name || 'Funcionário'}</h4>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1.5">
                        @{worker.profile?.username || 'user'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/30">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{worker.role}</span>
                    </div>
                    
                    <button 
                      onClick={() => handleFireWorker(worker)}
                      disabled={firingId === worker.user_id}
                      className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 active:scale-90 transition-all disabled:opacity-50"
                    >
                      {firingId === worker.user_id ? (
                        <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-rounded">person_remove</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};