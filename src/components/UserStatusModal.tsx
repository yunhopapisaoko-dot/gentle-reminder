import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { supabase } from '../../supabase';

interface UserStatusModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onViewProfile: (user: User) => void;
}

const RACE_THEMES: Record<string, { color: string; icon: string; bg: string; gradient: string }> = {
  draeven: { color: 'text-rose-400', icon: 'local_fire_department', bg: 'bg-rose-500/20', gradient: 'from-rose-500/20 to-rose-900/20' },
  sylven: { color: 'text-emerald-400', icon: 'eco', bg: 'bg-emerald-500/20', gradient: 'from-emerald-500/20 to-emerald-900/20' },
  lunari: { color: 'text-cyan-400', icon: 'dark_mode', bg: 'bg-cyan-500/20', gradient: 'from-cyan-500/20 to-cyan-900/20' },
};

export const UserStatusModal: React.FC<UserStatusModalProps> = ({
  user,
  isOpen,
  onClose,
  onViewProfile
}) => {
  const [isActiveRP, setIsActiveRP] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const fetchUserData = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_active_rp')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setIsActiveRP(data.is_active_rp ?? true);
      }
    };

    fetchUserData();
  }, [isOpen, user?.id]);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 500);
  };

  const handleViewProfile = () => {
    const u = user;
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
      onViewProfile(u);
    }, 500);
  };

  if (!isOpen || !user) return null;

  const raceKey = (user.race || 'draeven').toLowerCase();
  const raceTheme = RACE_THEMES[raceKey] || RACE_THEMES.draeven;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-end justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop with smooth transition */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ease-out ${
          isVisible && !isClosing ? 'opacity-100' : 'opacity-0'
        }`} 
      />

      {/* Modal with spring-like animation */}
      <div 
        className={`relative w-full max-w-md bg-gradient-to-b from-surface-dark to-background-dark rounded-[32px] border border-white/10 overflow-hidden shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isVisible && !isClosing 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-full scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient based on race */}
        <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${raceTheme.gradient} to-transparent`} />
        
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-200 hover:rotate-90 z-10"
        >
          <span className="material-symbols-rounded text-white/60 text-lg">close</span>
        </button>

        {/* Content */}
        <div className="relative p-6 pt-8">
          {/* Avatar & Basic Info */}
          <div className={`flex items-start gap-4 mb-6 transition-all duration-500 delay-75 ${
            isVisible && !isClosing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="relative">
              <div className="w-20 h-20 rounded-[24px] overflow-hidden border-2 border-white/20 shadow-xl">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
              {isActiveRP && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-background-dark flex items-center justify-center">
                  <span className="material-symbols-rounded text-white text-[10px]">circle</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-white truncate">{user.name}</h3>
              <p className="text-sm text-white/40 mb-2">@{user.username}</p>
              
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`px-3 py-1 rounded-full ${raceTheme.bg} border border-white/10 flex items-center gap-1.5`}>
                  <span className={`material-symbols-rounded text-xs ${raceTheme.color}`}>{raceTheme.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${raceTheme.color}`}>{user.race || 'Draeven'}</span>
                </div>
                {user.isLeader && (
                  <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5">
                    <span className="material-symbols-rounded text-xs text-amber-400">shield_person</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Líder</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* View Profile Button */}
          <button
            onClick={handleViewProfile}
            className={`w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-[0.98] transition-all duration-500 delay-200 hover:shadow-xl hover:shadow-primary/40 ${
              isVisible && !isClosing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="material-symbols-rounded">person</span>
            Ver Perfil Completo
          </button>
        </div>

        {/* Bottom safe area */}
        <div className="h-4" />
      </div>
    </div>
  );
};
