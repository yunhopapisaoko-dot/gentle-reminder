import React, { useState } from 'react';
import { User } from '../types';

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
      <span className="text-[10px] font-black text-white/60">{value}%</span>
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
  onLogout: () => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ user, isOpen, onClose, onOpenProfile, onLogout }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 400);
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

        <div className="p-8 pt-20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-30"></div>

          <button
            onClick={() => { handleClose(); onOpenProfile(); }}
            className="relative z-10 flex flex-col items-start active:scale-95 transition-transform group"
          >
            <div className="relative mb-4">
              <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-secondary rounded-[32px] blur-md opacity-30 group-hover:opacity-60 transition-opacity"></div>
              <img src={user.avatar} className="relative w-20 h-20 rounded-[28px] object-cover border border-white/20 shadow-2xl" alt="avatar" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-background-dark rounded-full"></div>
            </div>
            <div className="text-left">
              <h4 className="text-xl font-black text-white tracking-tighter leading-none group-hover:text-primary transition-colors">{user.name}</h4>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1.5">@{user.username}</p>
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mt-3 italic">Membro Magic</p>
            </div>
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="bg-white/[0.03] backdrop-blur-3xl p-6 rounded-[40px] border border-white/5 space-y-6 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Sinais Vitais</h3>
              <span className="material-symbols-rounded text-primary/40 text-sm">bolt</span>
            </div>
            <StatusItem label="Saúde" value={100} icon="favorite" color="bg-rose-500" />
            <StatusItem label="Fome" value={76} icon="restaurant" color="bg-orange-500" />
            <StatusItem label="Sede" value={54} icon="water_drop" color="bg-cyan-500" />
            <StatusItem label="Alcoolismo" value={12} icon="wine_bar" color="bg-indigo-500" />
          </div>
        </div>

        <div className="flex-1 px-4 py-8 space-y-2 overflow-y-auto scrollbar-hide">
          <div className="px-4 mb-4">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10">Menu Principal</h3>
          </div>

          {[
            { icon: 'forum', label: 'Meus Chats', count: '3' },
            { icon: 'inventory_2', label: 'Inventário', count: '24' },
            { icon: 'military_tech', label: 'Conquistas', count: null },
            { icon: 'settings', label: 'Configurações', count: null }
          ].map((item, idx) => (
            <button key={idx} className="w-full flex items-center justify-between p-4 rounded-[24px] hover:bg-white/5 group transition-all">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-white/40 border border-white/5 group-hover:border-primary/50 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <span className="material-symbols-rounded text-xl">{item.icon}</span>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{item.label}</span>
              </div>
              {item.count && (
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-lg border border-primary/20">{item.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-8 pb-12 border-t border-white/5">
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