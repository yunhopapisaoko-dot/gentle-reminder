import React, { useMemo } from 'react';
import { User } from '../../types';
import { usePresence } from '../hooks/usePresence';

interface GlobalUsersGridProps {
  members: User[];
  onSelectUser: (user: User) => void;
  currentUserId?: string;
}

const RACE_THEMES: Record<string, { color: string, icon: string, bg: string }> = {
  'draeven': { color: 'text-rose-500', icon: 'local_fire_department', bg: 'bg-rose-500/10' },
  'sylven': { color: 'text-emerald-500', icon: 'eco', bg: 'bg-emerald-500/10' },
  'lunari': { color: 'text-cyan-400', icon: 'dark_mode', bg: 'bg-cyan-400/10' },
};

export const GlobalUsersGrid: React.FC<GlobalUsersGridProps> = ({ members, onSelectUser, currentUserId }) => {
  const { isUserOnline } = usePresence(currentUserId || null);

  // Ordenar: online primeiro, depois offline
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const aOnline = isUserOnline(a.id);
      const bOnline = isUserOnline(b.id);
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      return 0;
    });
  }, [members, isUserOnline]);

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-rounded text-4xl text-white/20 mb-4">group_off</span>
        <p className="text-sm font-bold text-white/40">Nenhum usuário cadastrado</p>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-2 gap-4 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {sortedMembers.map((user) => {
        const raceKey = (user.race || 'draeven').toLowerCase();
        const theme = RACE_THEMES[raceKey] || RACE_THEMES['draeven'];
        const isOnline = isUserOnline(user.id);

        return (
          <button
            key={user.id}
            onClick={() => onSelectUser(user)}
            className="group relative flex flex-col items-center bg-white/[0.03] border border-white/5 rounded-[40px] p-6 transition-all duration-500 hover:bg-white/[0.06] hover:border-primary/30 hover:translate-y-[-4px] active:scale-95 overflow-hidden shadow-2xl"
          >
            {/* Background Glow Effect */}
            <div className={`absolute -top-10 -right-10 w-24 h-24 blur-[40px] opacity-20 transition-opacity group-hover:opacity-40 ${theme.bg.replace('/10', '')}`}></div>

            {/* Avatar Section */}
            <div className="relative mb-5">
              <div className={`absolute -inset-2 rounded-[32px] blur-md opacity-20 group-hover:opacity-50 transition-opacity ${theme.bg.replace('/10', '')}`}></div>
              <div className="relative w-20 h-20 rounded-[28px] overflow-hidden border-2 border-white/10 shadow-xl p-1 bg-background-dark">
                <img 
                  src={user.avatar} 
                  className="w-full h-full rounded-[22px] object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={user.name} 
                />
              </div>
              
              {/* Online Status Indicator */}
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background-dark flex items-center justify-center shadow-lg transition-all duration-300 ${
                isOnline 
                  ? 'bg-emerald-500 shadow-emerald-500/50' 
                  : 'bg-zinc-600'
              }`}>
                {isOnline && (
                  <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                )}
              </div>
              
              {/* Race Icon Badge */}
              <div className={`absolute -bottom-2 -left-2 w-8 h-8 rounded-xl ${theme.bg} backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg`}>
                <span className={`material-symbols-rounded text-base ${theme.color}`}>{theme.icon}</span>
              </div>
            </div>

            {/* Text Section */}
            <div className="text-center w-full space-y-1">
              {user.isLeader && (
                <div className="mb-1">
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Líder</span>
                </div>
              )}
              <h4 className="text-sm font-black text-white truncate leading-none uppercase tracking-tight group-hover:text-primary transition-colors">
                {user.name}
              </h4>
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                @{user.username}
              </p>
              {/* Online Status Text */}
              <p className={`text-[8px] font-bold uppercase tracking-wider ${isOnline ? 'text-emerald-500' : 'text-zinc-500'}`}>
                {isOnline ? '● Online' : '○ Offline'}
              </p>
            </div>

            {/* Bottom Indicator */}
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 ${theme.bg.replace('/10', '')}`}></div>
          </button>
        );
      })}
    </div>
  );
};