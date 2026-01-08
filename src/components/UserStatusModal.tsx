import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { DISEASE_DETAILS } from '../../constants';
import { supabase } from '../../supabase';

interface UserStatusModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onViewProfile: (user: User) => void;
}

interface FullUserData {
  hp: number;
  maxHp: number;
  hunger: number;
  thirst: number;
  alcohol: number;
  money: number;
  currentDisease?: string;
  isActiveRP: boolean;
}

const RACE_THEMES: Record<string, { color: string; icon: string; bg: string; gradient: string }> = {
  draeven: { color: 'text-rose-400', icon: 'local_fire_department', bg: 'bg-rose-500/20', gradient: 'from-rose-500/20 to-rose-900/20' },
  sylven: { color: 'text-emerald-400', icon: 'eco', bg: 'bg-emerald-500/20', gradient: 'from-emerald-500/20 to-emerald-900/20' },
  lunari: { color: 'text-cyan-400', icon: 'dark_mode', bg: 'bg-cyan-500/20', gradient: 'from-cyan-500/20 to-cyan-900/20' },
};

const StatusBar: React.FC<{ label: string; value: number; max: number; icon: string; color: string; bgColor: string }> = ({
  label, value, max, icon, color, bgColor
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`material-symbols-rounded text-sm ${color}`}>{icon}</span>
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-[11px] font-black text-white">{value}/{max}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${bgColor} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const UserStatusModal: React.FC<UserStatusModalProps> = ({
  user,
  isOpen,
  onClose,
  onViewProfile
}) => {
  const [userData, setUserData] = useState<FullUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger the animation
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
      setIsLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('health, hunger, energy, alcoholism, money, current_disease, is_active_rp')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setUserData({
          hp: data.health ?? 100,
          maxHp: 100,
          hunger: data.hunger ?? 100,
          thirst: data.energy ?? 100,
          alcohol: data.alcoholism ?? 0,
          money: data.money ?? 0,
          currentDisease: data.current_disease || undefined,
          isActiveRP: data.is_active_rp ?? true
        });
      }
      setIsLoading(false);
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
  const disease = userData?.currentDisease ? DISEASE_DETAILS[userData.currentDisease] : null;

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
              <div className={`w-20 h-20 rounded-[24px] overflow-hidden border-2 ${disease ? 'border-red-500' : 'border-white/20'} shadow-xl`}>
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
              {disease && (
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full border-2 border-background-dark flex items-center justify-center animate-pulse">
                  <span className="material-symbols-rounded text-white text-sm">coronavirus</span>
                </div>
              )}
              {userData?.isActiveRP && (
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

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : userData ? (
            <div className={`transition-all duration-500 delay-150 ${
              isVisible && !isClosing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {/* Money */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-amber-400">monetization_on</span>
                  <span className="text-sm font-bold text-white/60">Dinheiro</span>
                </div>
                <span className="text-lg font-black text-amber-400">M$ {userData.money.toLocaleString()}</span>
              </div>

              {/* Status Bars */}
              <div className="space-y-3 mb-4">
                <StatusBar label="Saúde" value={userData.hp} max={100} icon="favorite" color="text-rose-400" bgColor="bg-rose-500" />
                <StatusBar label="Fome" value={userData.hunger} max={100} icon="restaurant" color="text-orange-400" bgColor="bg-orange-500" />
                <StatusBar label="Sede" value={userData.thirst} max={100} icon="water_drop" color="text-cyan-400" bgColor="bg-cyan-500" />
                <StatusBar label="Alcoolismo" value={userData.alcohol} max={100} icon="local_bar" color="text-purple-400" bgColor="bg-purple-500" />
              </div>

              {/* Disease Section */}
              {disease && (
                <div className="p-4 bg-gradient-to-br from-red-900/30 to-red-950/30 rounded-2xl border border-red-500/30 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-rounded text-red-400">{disease.icon}</span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-400 block">Enfermo</span>
                      <h4 className="text-sm font-black text-white">{disease.name}</h4>
                    </div>
                  </div>
                  <p className="text-xs text-white/50 mb-3 italic">{disease.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {disease.symptoms.map((symptom, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 rounded-full bg-red-500/20 text-[9px] font-bold text-red-300 border border-red-500/20"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

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