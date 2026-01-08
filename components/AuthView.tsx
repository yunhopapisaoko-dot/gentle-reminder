import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { supabaseService } from '../services/supabaseService';
import { User } from '../types';
import { AdminConversationsView } from './AdminConversationsView';
import { usePWAInstall } from '../src/hooks/usePWAInstall';
interface AuthViewProps {
  onLogin: () => void;
}

type AuthScreen = 'login' | 'signup' | 'secret_gate' | 'secret_admin';
type RaceType = 'Draeven' | 'Sylven' | 'Lunari';

const RACES: { id: RaceType; name: string; desc: string; color: string; icon: string }[] = [
  { id: 'Draeven', name: 'Draeven', desc: 'Guerreiros do Fogo', color: 'border-rose-500/50 text-rose-500 bg-rose-500/10', icon: 'local_fire_department' },
  { id: 'Sylven', name: 'Sylven', desc: 'Espíritos da Floresta', color: 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10', icon: 'eco' },
  { id: 'Lunari', name: 'Lunari', desc: 'Sacerdotes da Lua', color: 'border-cyan-400/50 text-cyan-400 bg-cyan-400/10', icon: 'dark_mode' },
];

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const { install } = usePWAInstall();
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [gatePassword, setGatePassword] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
    race: 'Draeven' as RaceType
  });

  useEffect(() => {
    const saved = localStorage.getItem('magic_talk_creds');
    if (saved) {
      try {
        const creds = JSON.parse(saved);
        setFormData(prev => ({ ...prev, email: creds.email, password: creds.password }));
        setRememberMe(true);
      } catch (e) {}
    }
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
      if (error) {
        console.error('Error fetching profiles:', error);
        setErrorMsg("Erro ao carregar usuários: " + error.message);
        setAllUsers([]);
      } else {
        const users = (data || []).map((p: any) => ({
          id: p.user_id,
          name: p.full_name || 'Usuário',
          username: p.username || 'user',
          avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
          isLeader: p.is_leader || false,
        }));
        setAllUsers(users);
      }
    } catch (e: any) {
      console.error('Exception fetching profiles:', e);
      setErrorMsg("Erro Administrativo: " + e.message);
      setAllUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const unlockSecret = (e: React.FormEvent) => {
    e.preventDefault();
    if (gatePassword === '88620787') {
      setScreen('secret_admin');
      fetchUsers();
    } else {
      alert("Acesso Negado!");
      setGatePassword('');
    }
  };

  const toggleLeader = async (userId: string, currentStatus: boolean) => {
    try {
      await supabaseService.updateLeaderStatus(userId, !currentStatus);
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isLeader: !currentStatus } : u));
    } catch (e: any) {
      alert("Erro ao alterar cargo: " + e.message);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const email = formData.email.trim();
    const password = formData.password.trim();

    try {
      if (screen === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        if (rememberMe) {
          localStorage.setItem('magic_talk_creds', JSON.stringify({ email, password }));
        } else {
          localStorage.removeItem('magic_talk_creds');
        }
        onLogin();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: formData.name,
              username: formData.username,
              race: formData.race
            }
          }
        });
        
        if (error) throw error;
        
        if (data.session) {
          onLogin();
        } else {
          setSuccessMsg("Lenda invocada! Verifique seu e-mail ou faça login agora.");
          setScreen('login');
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Erro na conexão com o portal.");
    } finally {
      setIsLoading(false);
    }
  };

  if (screen === 'secret_gate') {
    return (
      <div className="fixed inset-0 z-[600] bg-background-dark flex flex-col items-center justify-center p-8 animate-in zoom-in">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/40 via-transparent to-transparent"></div>
        <div className="w-full max-w-xs space-y-8 text-center relative z-10">
          <div className="relative mx-auto mb-6">
            <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
            <div className="relative w-24 h-24 bg-white/[0.03] rounded-[40px] border border-white/10 flex items-center justify-center mx-auto shadow-2xl">
              <span className="material-symbols-rounded text-5xl text-primary drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]">security</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Sala de Controle</h2>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mt-2">Área Restrita / Autenticação Nível 5</p>
          </div>
          <form onSubmit={unlockSecret} className="space-y-6">
             <input 
              type="password" 
              autoFocus
              placeholder="••••••••" 
              className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-6 text-center text-white font-black tracking-[1em] focus:ring-primary focus:border-primary text-2xl transition-all shadow-inner"
              value={gatePassword}
              onChange={(e) => setGatePassword(e.target.value)}
             />
             <div className="flex space-x-4 pt-4">
               <button type="button" onClick={() => setScreen('login')} className="flex-1 py-5 rounded-[28px] bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-[0.4em] border border-white/5 active:scale-95 transition-all">Abortar</button>
               <button type="submit" className="flex-1 py-5 rounded-[28px] bg-primary text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_15px_40px_rgba(139,92,246,0.4)] active:scale-95 transition-all">Acessar</button>
             </div>
          </form>
        </div>
      </div>
    );
  }

  if (screen === 'secret_admin') {
    return (
      <div className="fixed inset-0 z-[600] bg-neutral-950 p-6 pt-12 flex flex-col animate-in slide-in-bottom duration-500 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 flex justify-between items-center mb-10 shrink-0">
          <button onClick={() => setScreen('login')} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 active:scale-90 shadow-xl">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <div className="text-center">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Administração</h2>
            <div className="flex items-center justify-center gap-2 mt-1.5">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
               <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Magic Oversight System</p>
            </div>
          </div>
          <button onClick={fetchUsers} className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 active:scale-90 shadow-xl transition-all">
            <span className="material-symbols-rounded">refresh</span>
          </button>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide space-y-4 pb-32">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Escaneando rede...</p>
            </div>
          )}
          {allUsers.length === 0 && !isLoading && (
            <div className="text-center py-20 opacity-20 flex flex-col items-center">
              <span className="material-symbols-rounded text-6xl mb-4">group_off</span>
              <p className="text-sm font-black uppercase tracking-widest">Nenhuma lenda detectada</p>
            </div>
          )}
          {allUsers.map(user => (
            <div key={user.id} className="relative group bg-white/[0.03] p-5 rounded-[32px] border border-white/5 flex flex-col gap-5 hover:bg-white/[0.05] transition-all overflow-hidden shadow-2xl">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img src={user.avatar} className="w-16 h-16 rounded-[20px] border border-white/10 object-cover shadow-xl" alt="avatar" />
                  {user.isLeader && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 border-2 border-background-dark rounded-lg flex items-center justify-center shadow-lg">
                       <span className="material-symbols-rounded text-xs text-white fill-current">stars</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-base font-black text-white truncate leading-none uppercase italic">{user.name}</p>
                  </div>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-2">@{user.username}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <button 
                  onClick={() => toggleLeader(user.id, !!user.isLeader)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                    user.isLeader 
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  <span className="material-symbols-rounded text-sm">{user.isLeader ? 'no_accounts' : 'verified_user'}</span>
                  {user.isLeader ? 'Revogar' : 'Líder'}
                </button>
                <button 
                  onClick={() => setViewingUser(user)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  <span className="material-symbols-rounded text-sm">visibility</span>
                  Logs
                </button>
                <button 
                  onClick={() => {
                    setSelectedUser(user);
                    setFormData(prev => ({ ...prev, password: '' }));
                    setScreen('login');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <span className="material-symbols-rounded text-sm">login</span>
                  Entrar
                </button>
              </div>
            </div>
          ))}
        </div>

        {viewingUser && (
          <AdminConversationsView
            userId={viewingUser.id}
            userName={viewingUser.name}
            userAvatar={viewingUser.avatar}
            onClose={() => setViewingUser(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] bg-background-dark flex flex-col items-center justify-start py-20 px-8 overflow-y-auto scrollbar-hide">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-30 blur-3xl fixed pointer-events-none"></div>
      
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl">MagicTalk</h1>
          <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.4em] mt-3">Portal de Acesso</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-5 rounded-[28px] bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-bold text-center animate-in zoom-in shadow-xl backdrop-blur-md">
             <p className="uppercase tracking-widest mb-1 text-[9px] opacity-50">Log de Erro</p>
             {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-5 rounded-[28px] bg-green-500/10 border border-green-500/20 text-green-500 text-[11px] font-bold text-center animate-in zoom-in backdrop-blur-md">
            {successMsg}
          </div>
        )}

        {selectedUser && screen === 'login' && (
          <div className="bg-emerald-500/10 p-4 rounded-[28px] border border-emerald-500/20 mb-6 animate-in slide-in-from-top">
            <div className="flex items-center gap-4">
              <img src={selectedUser.avatar} className="w-12 h-12 rounded-xl border border-emerald-500/30 object-cover" alt="avatar" />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{selectedUser.name}</p>
                <p className="text-[10px] text-emerald-400">@{selectedUser.username}</p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-rounded text-sm">close</span>
              </button>
            </div>
            <p className="text-[9px] text-emerald-400/60 mt-3 text-center uppercase tracking-widest">Insira a senha para entrar como este usuário</p>
          </div>
        )}

        <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-xl shadow-2xl transition-all duration-500 mb-6">
          <form onSubmit={handleAuth} className="space-y-4">
            {screen === 'signup' && (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Nome de Batismo</label>
                  <input type="text" required placeholder="Seu nome" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:ring-primary focus:border-primary placeholder:text-white/10" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Username único</label>
                  <input type="text" required placeholder="Ex: miku_fan" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:ring-primary focus:border-primary placeholder:text-white/10" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})} />
                </div>
                <div className="py-2 space-y-2">
                   {RACES.map((race) => (
                     <button key={race.id} type="button" onClick={() => setFormData({...formData, race: race.id})} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.race === race.id ? `${race.color} border-current scale-[1.02]` : 'border-white/5 bg-white/[0.02] text-white/30'}`}>
                       <div className="flex items-center space-x-3">
                         <span className="material-symbols-rounded text-xl">{race.icon}</span>
                         <span className="text-[11px] font-black uppercase tracking-widest">{race.name}</span>
                       </div>
                     </button>
                   ))}
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">E-mail</label>
              <input type="email" required placeholder="exemplo@email.com" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:ring-primary focus:border-primary placeholder:text-white/10" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Senha</label>
              <input type="password" required minLength={6} placeholder="Senha" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:ring-primary focus:border-primary placeholder:text-white/10" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>

            {screen === 'login' && (
              <button 
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center space-x-3 px-4 py-2 group"
              >
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${rememberMe ? 'bg-primary border-primary text-white' : 'border-white/10 bg-white/5'}`}>
                  {rememberMe && <span className="material-symbols-rounded text-sm">check</span>}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${rememberMe ? 'text-white' : 'text-white/40'}`}>Salvar Acesso</span>
              </button>
            )}

            <button type="submit" disabled={isLoading} className={`w-full py-5 rounded-[28px] text-[11px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all mt-4 disabled:opacity-50 flex items-center justify-center space-x-2 ${rememberMe && screen === 'login' && formData.email ? 'bg-white text-black shadow-xl' : 'bg-primary text-white'}`}>
              {isLoading ? 'Invocando...' : screen === 'login' ? 'Entrar no Mundo' : 'Iniciar Jornada'}
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center space-y-6 pb-20">
          <button 
            onClick={() => { setScreen(screen === 'login' ? 'signup' : 'login'); setErrorMsg(null); setSuccessMsg(null); }}
            className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] hover:text-white transition-colors border-b border-transparent hover:border-white/20"
          >
            {screen === 'login' ? 'Não tem conta? Crie sua lenda' : 'Já possui conta? Retorne ao mundo'}
          </button>

          <button 
            onClick={() => install()}
            className="w-full max-w-xs py-4 rounded-[28px] bg-primary/20 text-primary text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 border border-primary/20 active:scale-95 transition-all shadow-xl"
          >
            <span className="material-symbols-rounded text-lg">install_mobile</span>
            Instalar App
          </button>
          
          <button 
            onClick={() => { setScreen('secret_gate'); }}
            className="text-[9px] font-black text-primary/30 uppercase tracking-[0.5em] border border-primary/10 px-6 py-2 rounded-full hover:bg-primary/10 transition-all active:scale-90"
          >
            Acesso Restrito
          </button>
        </div>
      </div>
    </div>
  );
};