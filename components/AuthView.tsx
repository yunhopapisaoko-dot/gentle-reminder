
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { supabaseService } from '../services/supabaseService';
import { User } from '../types';

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
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [gatePassword, setGatePassword] = useState('');
  
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
    try {
      const users = await supabaseService.getAllProfiles();
      setAllUsers(users);
    } catch (e: any) {
      setErrorMsg("Erro Administrativo: " + e.message);
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
              race: formData.race,
              email_display: email
            }
          }
        });
        
        if (error) throw error;
        
        if (data.session) {
          onLogin();
        } else {
          setSuccessMsg("Invocação completa! Agora, faça login para entrar no mundo (Se o erro persistir, desative a confirmação de e-mail no painel Auth do Supabase).");
          setScreen('login');
        }
      }
    } catch (error: any) {
      // Exibição clara do erro para diagnóstico do usuário
      let msg = error.message || "Erro de conexão.";
      if (msg.includes("Database error")) {
        msg = "Erro Crítico: Verifique as políticas de RLS e o bucket 'avatars' no seu Supabase.";
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (screen === 'secret_gate') {
    return (
      <div className="fixed inset-0 z-[600] bg-background-dark flex flex-col items-center justify-center p-8 animate-in zoom-in">
        <div className="w-full max-w-xs space-y-6 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-[30px] border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-rounded text-4xl text-primary">security</span>
          </div>
          <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Portal do Administrador</h2>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Insira a chave secreta</p>
          <form onSubmit={unlockSecret} className="space-y-4">
             <input 
              type="password" 
              autoFocus
              placeholder="••••••••" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-center text-white font-black tracking-[1em] focus:ring-primary focus:border-primary text-lg"
              value={gatePassword}
              onChange={(e) => setGatePassword(e.target.value)}
             />
             <div className="flex space-x-3 pt-4">
               <button type="button" onClick={() => setScreen('login')} className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest border border-white/5 active:scale-95 transition-all">Sair</button>
               <button type="submit" className="flex-1 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/30 active:scale-95 transition-all">Entrar</button>
             </div>
          </form>
        </div>
      </div>
    );
  }

  if (screen === 'secret_admin') {
    return (
      <div className="fixed inset-0 z-[600] bg-background-dark p-8 flex flex-col animate-in slide-in-bottom">
        <div className="flex justify-between items-center mb-8 shrink-0">
          <button onClick={() => setScreen('login')} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 active:scale-90">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <div className="text-center">
            <h2 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">Supervisão</h2>
            <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mt-1.5">Membros Registrados</p>
          </div>
          <button onClick={fetchUsers} className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20 active:scale-90 transition-all">
            <span className="material-symbols-rounded">refresh</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 pb-12">
          {allUsers.length === 0 && !isLoading && (
            <div className="text-center py-20 opacity-20">
              <span className="material-symbols-rounded text-6xl mb-4">search_off</span>
              <p className="text-sm font-black uppercase tracking-widest">Nenhum rastro encontrado</p>
            </div>
          )}
          {allUsers.map(user => (
            <div key={user.id} className="bg-white/5 p-6 rounded-[32px] border border-white/5 flex flex-col space-y-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-4">
                    <img src={user.avatar} className="w-12 h-12 rounded-2xl border border-white/10" alt="avatar" />
                    <div className="max-w-[150px]">
                      <p className="text-sm font-black text-white leading-none truncate">{user.name}</p>
                      <p className="text-[10px] text-white/30 font-bold uppercase mt-1">@{user.username}</p>
                    </div>
                 </div>
                 {user.isLeader && (
                   <span className="bg-amber-500/20 text-amber-500 text-[8px] font-black px-3 py-1 rounded-full border border-amber-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.2)]">Líder</span>
                 )}
               </div>
               
               <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Login</span>
                    <span className="text-[10px] font-mono text-primary/80 truncate ml-4">{user.email || 'Oculto'}</span>
                  </div>
               </div>
               
               <div className="flex items-center justify-end">
                  <button 
                    onClick={() => toggleLeader(user.id, !!user.isLeader)}
                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                      user.isLeader ? 'bg-rose-500/10 text-rose-500 border border-rose-500/10' : 'bg-primary text-white shadow-lg'
                    }`}
                  >
                    {user.isLeader ? 'Revogar Cargo' : 'Tornar Líder'}
                  </button>
               </div>
            </div>
          ))}
        </div>
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
