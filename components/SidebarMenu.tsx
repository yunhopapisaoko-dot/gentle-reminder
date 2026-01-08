import React, { useState } from 'react';
import { User } from '../types';
import { DISEASE_DETAILS } from '../constants';
import { supabaseService } from '../services/supabaseService';

interface StatusItemProps {
  label: string;
  value: number;
  icon: string;
  color: string;
}

const StatusItem: React.FC<StatusItemProps> = ({ label, value, icon, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end">
      <div className="flex items-center space-x-2">
        <span className={`material-symbols-rounded text-lg ${color.replace('bg-', 'text-')}`}>{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</span>
      </div>
      <span className="text-[10px] font-black text-white/60">{Math.round(value)}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
      <div
        className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.5)]`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

interface SidebarMenuProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenInventory: () => void;
  onOpenChats: () => void;
  onLogout: () => void;
  onStatusChange: (isActive: boolean) => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ 
  user, 
  isOpen, 
  onClose, 
  onOpenProfile, 
  onOpenInventory, 
  onOpenChats, 
  onLogout,
  onStatusChange
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const activeDisease = user.currentDisease ? DISEASE_DETAILS[user.currentDisease] : null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 400);
  };

  const toggleRoleplayStatus = async () => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const nextStatus = !user.isActiveRP;
      await supabaseService.updateRoleplayStatus(user.id, nextStatus);
      onStatusChange(nextStatus);
    } catch (e: any) {
      alert("Erro ao alterar status: " + e.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleLogout = () => {
    setIsClosing(true);
    setTimeout(() => {
      onLogout();
      onClose();
      setIsClosing(false);
    }, 400);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className="fixed inset-0 z-[200] flex overflow-hidden">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-500 ease-in-out ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />

      <div
        className={`relative w-[320px] h-full bg-background-dark border-r border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.5)] flex flex-col 
          ${isClosing ? 'animate-[slideOutLeft_400ms_cubic-bezier(0.32,0.72,0,1)_both]' : 'animate-[slideInLeft_500ms_cubic-bezier(0.32,0.72,0,1)_both]'}`}
      >

        <div className="p-8 pt-20 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-30"></div>

          <button
            onClick={() => { handleClose(); onOpenProfile(); }}
            className="relative z-10 flex flex-col items-start active:scale-95 transition-transform group"
          >
            <div className="relative mb-4">
              <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-secondary rounded-[32px] blur-md opacity-30 group-hover:opacity-60 transition-opacity"></div>
              <img src={user.avatar} className="relative w-20 h-20 rounded-[28px] object-cover border border-white/20 shadow-2xl" alt="avatar" />
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-background-dark rounded-full ${user.isActiveRP ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`}></div>
            </div>
            <div className="text-left">
              <h4 className="text-xl font-black text-white tracking-tighter leading-none group-hover:text-primary transition-colors">{user.name}</h4>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1.5">@{user.username}</p>
            </div>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto scrollbar-hide">
          {/* Doença Ativa - Exibida PRIMEIRO, acima dos status */}
          {activeDisease && (
            <div className="bg-gradient-to-br from-rose-500/10 to-rose-900/10 border border-rose-500/30 p-5 rounded-[28px] shadow-lg shadow-rose-500/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center animate-pulse">
                  <span className="material-symbols-rounded text-2xl text-rose-400">{activeDisease.icon}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-400">{activeDisease.name}</h3>
                  <p className="text-[9px] text-rose-400/60 font-bold uppercase tracking-wider">Enfermidade Ativa</p>
                </div>
              </div>
              
              <p className="text-xs text-white/70 leading-relaxed mb-4">{activeDisease.description}</p>
              
              {/* Sintomas - Agora dinâmicos */}
              <div className="bg-black/20 rounded-xl p-3 mb-4 border border-rose-500/10">
                <p className="text-[9px] text-rose-400/80 font-bold uppercase tracking-wider mb-2">Sintomas</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeDisease.symptoms.map((symptom, idx) => (
                    <span key={idx} className="text-[10px] bg-rose-500/10 text-rose-300 px-2 py-1 rounded-lg border border-rose-500/20">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-[10px] border-t border-rose-500/10 pt-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <span className="material-symbols-rounded text-sm">favorite</span>
                    {activeDisease.hpImpact} HP
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-amber-400 font-bold">{activeDisease.treatmentCost} MKC</span>
                </div>
              </div>
              <p className="text-[9px] text-rose-300/60 mt-3 italic text-center">⚕️ Vá ao Hospital para se curar</p>
            </div>
          )}

          {/* Status Roleplay Toggle */}
          <div className={`p-6 rounded-[32px] border transition-all duration-500 ${user.isActiveRP ? 'bg-green-500/5 border-green-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-[10px] font-black uppercase tracking-widest ${user.isActiveRP ? 'text-green-500' : 'text-rose-500'}`}>
                  Roleplay {user.isActiveRP ? 'Ativo' : 'Inativo'}
                </h3>
                <p className="text-[8px] text-white/20 font-bold uppercase mt-1">Status Global</p>
              </div>
              <button 
                onClick={toggleRoleplayStatus}
                disabled={isUpdatingStatus}
                className={`w-14 h-8 rounded-full relative transition-all duration-500 p-1 ${user.isActiveRP ? 'bg-green-500' : 'bg-zinc-800'}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-500 ${user.isActiveRP ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
            <p className="text-[9px] text-white/40 leading-relaxed font-bold italic">
              {user.isActiveRP 
                ? 'Você está pronto para o roleplay e pode entrar nos canais.' 
                : 'Roleplay desativado. Você não pode acessar locais agora.'}
            </p>
          </div>

          {/* Sinais Vitais */}
          <div className="bg-white/[0.03] backdrop-blur-3xl p-6 rounded-[40px] border border-white/5 space-y-6 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Sinais Vitais</h3>
              <span className="material-symbols-rounded text-primary/40 text-sm">bolt</span>
            </div>
            <StatusItem label="Saúde" value={user.hp || 100} icon="favorite" color="bg-rose-500" />
            <StatusItem label="Fome" value={user.hunger || 0} icon="restaurant" color="bg-orange-500" />
            <StatusItem label="Sede" value={user.thirst || 0} icon="water_drop" color="bg-cyan-500" />
            <StatusItem label="Alcoolismo" value={user.alcohol || 0} icon="local_bar" color="bg-purple-500" />
          </div>

          <div className="space-y-2 pt-4">
            <div className="px-4 mb-4">
              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10">Menu Principal</h3>
            </div>

            <button onClick={() => { handleClose(); onOpenChats(); }} className="w-full flex items-center justify-between p-4 rounded-[24px] hover:bg-white/5 group transition-all">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-white/40 border border-white/5">
                  <span className="material-symbols-rounded text-xl">forum</span>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Meus Chats</span>
              </div>
            </button>

            <button onClick={() => { handleClose(); onOpenInventory(); }} className="w-full flex items-center justify-between p-4 rounded-[24px] hover:bg-white/5 group transition-all">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-white/40 border border-white/5">
                  <span className="material-symbols-rounded text-xl">inventory_2</span>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Inventário</span>
              </div>
            </button>
          </div>
        </div>

        <div className="p-8 pb-12 border-t border-white/5 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 py-4 rounded-2xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] border border-rose-500/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-rounded text-lg">logout</span>
            <span>Desconectar</span>
          </button>
        </div>
      </div>
    </div>
  );
};