"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface AdminConversationsViewProps {
  userId: string;
  userName: string;
  userAvatar: string;
  onClose: () => void;
}

type ViewMode = 'menu' | 'public' | 'private' | 'duplicates';

interface PrivateConversation {
  id: string;
  other_user: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  };
  last_message?: string;
  updated_at: string;
}

const ADMIN_SECRET = "88620787";

export const AdminConversationsView: React.FC<AdminConversationsViewProps> = ({
  userId,
  userName,
  userAvatar,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [publicMessages, setPublicMessages] = useState<any[]>([]);
  const [privateConversations, setPrivateConversations] = useState<PrivateConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<PrivateConversation | null>(null);
  const [privateMessages, setPrivateMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);

  const locations = [
    { id: 'pousada', name: 'Pousada', icon: 'house' },
    { id: 'restaurante', name: 'Restaurante', icon: 'restaurant' },
    { id: 'padaria', name: 'Padaria', icon: 'bakery_dining' },
    { id: 'hospital', name: 'Hospital', icon: 'local_hospital' },
    { id: 'farmacia', name: 'Farmácia', icon: 'medication' },
    { id: 'creche', name: 'Creche', icon: 'child_care' },
    { id: 'chat_off', name: 'Chat OFF', icon: 'chat' },
  ];

  const fetchPublicMessages = async (location?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (location) {
        query = query.eq('location', location);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPublicMessages(data || []);
    } catch (e) {
      console.error('Error fetching public messages:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrivateConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://ltjtzyzxpxrbqiajafcm.supabase.co/functions/v1/admin-get-conversations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': ADMIN_SECRET,
          },
          body: JSON.stringify({ userId, type: 'conversations' }),
        }
      );

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPrivateConversations(data.conversations || []);
    } catch (e) {
      console.error('Error fetching private conversations:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrivateMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://ltjtzyzxpxrbqiajafcm.supabase.co/functions/v1/admin-get-conversations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': ADMIN_SECRET,
          },
          body: JSON.stringify({ userId, type: 'messages', conversationId }),
        }
      );

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPrivateMessages(data.messages || []);
    } catch (e) {
      console.error('Error fetching private messages:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDuplicateIps = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://ltjtzyzxpxrbqiajafcm.supabase.co/functions/v1/get-duplicate-ips',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': ADMIN_SECRET,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setDuplicateGroups(data.groups || []);
    } catch (e) {
      console.error('Error fetching duplicate IPs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'public') {
      fetchPublicMessages(selectedLocation || undefined);
    } else if (viewMode === 'private') {
      fetchPrivateConversations();
    } else if (viewMode === 'duplicates') {
      fetchDuplicateIps();
    }
  }, [viewMode, selectedLocation]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMenu = () => (
    <div className="p-8 space-y-6">
      <div className="flex flex-col items-center text-center space-y-4 mb-8">
        <div className="relative">
          <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
          <img src={userAvatar} className="relative w-24 h-24 rounded-[32px] border-2 border-white/10 object-cover shadow-2xl" alt="avatar" />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-background-dark border border-primary/30 rounded-2xl flex items-center justify-center shadow-xl">
             <span className="material-symbols-rounded text-primary text-xl">monitoring</span>
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{userName}</h3>
          <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] mt-1">Sincronização de Dados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setViewMode('public')}
          className="group relative w-full p-6 bg-white/[0.03] rounded-[36px] border border-white/5 flex items-center gap-5 active:scale-95 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-14 h-14 bg-blue-500/20 rounded-[20px] flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
            <span className="material-symbols-rounded text-blue-400 text-3xl">public</span>
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-black text-white uppercase tracking-widest">Logs Públicos</p>
            <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">Interações em locais</p>
          </div>
          <span className="material-symbols-rounded text-white/20 group-hover:text-blue-400 transition-colors">arrow_forward_ios</span>
        </button>

        <button
          onClick={() => setViewMode('private')}
          className="group relative w-full p-6 bg-white/[0.03] rounded-[36px] border border-white/5 flex items-center gap-5 active:scale-95 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-14 h-14 bg-purple-500/20 rounded-[20px] flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
            <span className="material-symbols-rounded text-purple-400 text-3xl">lock_open</span>
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-black text-white uppercase tracking-widest">Logs Privados</p>
            <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">Mensagens diretas</p>
          </div>
          <span className="material-symbols-rounded text-white/20 group-hover:text-purple-400 transition-colors">arrow_forward_ios</span>
        </button>

        <button
          onClick={() => setViewMode('duplicates')}
          className="group relative w-full p-6 bg-white/[0.03] rounded-[36px] border border-white/5 flex items-center gap-5 active:scale-95 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-14 h-14 bg-amber-500/20 rounded-[20px] flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
            <span className="material-symbols-rounded text-amber-400 text-3xl">group</span>
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-black text-white uppercase tracking-widest">Contas Duplicadas</p>
            <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">Mesmo IP detectado</p>
          </div>
          <span className="material-symbols-rounded text-white/20 group-hover:text-amber-400 transition-colors">arrow_forward_ios</span>
        </button>
      </div>
    </div>
  );

  const renderPublicMessages = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right">
      <div className="p-6 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => { setViewMode('menu'); setSelectedLocation(null); }} className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center text-white active:scale-90 border border-white/10">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Logs Públicos</h3>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Filtrar por localização</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setSelectedLocation(null)}
            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              !selectedLocation ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/40'
            }`}
          >
            Todos
          </button>
          {locations.map(loc => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                selectedLocation === loc.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/40'
              }`}
            >
              <span className="material-symbols-rounded text-sm">{loc.icon}</span>
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && publicMessages.length === 0 && (
          <div className="text-center py-20 opacity-20">
            <span className="material-symbols-rounded text-6xl mb-4">history</span>
            <p className="text-xs font-black uppercase tracking-[0.2em]">Sem atividades recentes</p>
          </div>
        )}
        {publicMessages.map(msg => (
          <div key={msg.id} className="bg-white/[0.03] p-5 rounded-[28px] border border-white/5 group hover:bg-white/[0.06] transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 bg-primary/10 rounded-lg text-[8px] font-black text-primary uppercase tracking-[0.2em] border border-primary/20">
                {msg.location} {msg.sub_location && `> ${msg.sub_location}`}
              </span>
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{formatTime(msg.created_at)}</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed font-medium italic">"{msg.content}"</p>
            {msg.character_name && (
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                 <span className="material-symbols-rounded text-xs text-amber-500/50">person</span>
                 <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest">Identidade: {msg.character_name}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPrivateConversations = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right">
      <div className="p-6 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewMode('menu')} className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center text-white active:scale-90 border border-white/10">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Logs Privados</h3>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Monitoramento de DMs</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && privateConversations.length === 0 && (
          <div className="text-center py-20 opacity-20">
            <span className="material-symbols-rounded text-6xl mb-4">forum</span>
            <p className="text-xs font-black uppercase tracking-[0.2em]">Nenhuma conexão ativa</p>
          </div>
        )}
        {privateConversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => {
              setSelectedConversation(conv);
              fetchPrivateMessages(conv.id);
            }}
            className="w-full bg-white/[0.03] p-5 rounded-[32px] border border-white/5 flex items-center gap-5 active:scale-95 transition-all group hover:bg-white/[0.06] hover:border-primary/20"
          >
            <div className="relative">
              <img 
                src={conv.other_user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.other_user.id}`} 
                className="w-14 h-14 rounded-2xl border border-white/10 object-cover shadow-xl" 
                alt="avatar" 
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background-dark border border-white/10 rounded-lg flex items-center justify-center">
                 <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-white leading-none">{conv.other_user.full_name}</p>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1.5">@{conv.other_user.username}</p>
            </div>
            <span className="material-symbols-rounded text-white/10 group-hover:text-primary transition-colors">arrow_forward_ios</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPrivateMessages = () => (
    <div className="flex flex-col h-full animate-in zoom-in-95">
      <div className="p-6 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedConversation(null); setPrivateMessages([]); }} className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center text-white active:scale-90 border border-white/10">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <img 
            src={selectedConversation?.other_user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation?.other_user.id}`} 
            className="w-11 h-11 rounded-xl border border-white/10 object-cover" 
            alt="avatar" 
          />
          <div className="min-w-0">
            <h3 className="text-sm font-black text-white truncate leading-none uppercase italic">
              {userName} ↔ {selectedConversation?.other_user.full_name}
            </h3>
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
               Modo Observador Ativo
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && privateMessages.length === 0 && (
          <div className="text-center py-20 opacity-20">
            <p className="text-xs font-black uppercase tracking-widest">Nenhuma transmissão capturada</p>
          </div>
        )}
        {privateMessages.map(msg => {
          const isFromTargetUser = msg.sender_id === userId;
          return (
            <div 
              key={msg.id} 
              className={`flex ${isFromTargetUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-[26px] shadow-2xl border transition-all ${
                isFromTargetUser 
                  ? 'bg-primary/10 border-primary/20 rounded-br-none' 
                  : 'bg-white/5 border-white/5 rounded-bl-none'
              }`}>
                <p className="text-[13px] font-medium text-white/80 leading-relaxed italic">"{msg.content}"</p>
                <div className={`flex items-center gap-2 mt-2 pt-2 border-t border-white/5 ${isFromTargetUser ? 'justify-end' : 'justify-start'}`}>
                   <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{formatTime(msg.created_at)}</span>
                   <span className={`text-[7px] font-black uppercase tracking-widest ${isFromTargetUser ? 'text-primary' : 'text-white/40'}`}>
                     {isFromTargetUser ? 'ORIGEM' : 'DESTINO'}
                   </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 bg-black/40 border-t border-white/5">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-rounded text-rose-500 text-xl">visibility_off</span>
          <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest leading-relaxed">
            As partes não são notificadas desta supervisão. Modo sigiloso.
          </p>
        </div>
      </div>
    </div>
  );

  const renderDuplicateIps = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right">
      <div className="p-6 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewMode('menu')} className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center text-white active:scale-90 border border-white/10">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Contas Duplicadas</h3>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Usuários com mesmo IP</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && duplicateGroups.length === 0 && (
          <div className="text-center py-20 opacity-20">
            <span className="material-symbols-rounded text-6xl mb-4">verified_user</span>
            <p className="text-xs font-black uppercase tracking-[0.2em]">Nenhuma duplicata detectada</p>
            <p className="text-[9px] text-white/30 mt-2">Todos os usuários possuem IPs únicos</p>
          </div>
        )}
        {duplicateGroups.map((group, index) => (
          <div key={index} className="bg-white/[0.03] p-5 rounded-[28px] border border-amber-500/20">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <span className="material-symbols-rounded text-amber-400 text-xl">warning</span>
              </div>
              <div>
                <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Grupo #{group.groupId || index + 1}</p>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">{group.users?.length || 0} contas vinculadas</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {group.users?.map((user: any) => (
                <div key={user.user_id} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <img 
                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`} 
                    className="w-10 h-10 rounded-xl border border-white/10 object-cover" 
                    alt="avatar" 
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-white truncate">{user.full_name}</p>
                    <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">@{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-black/40 border-t border-white/5">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-rounded text-amber-500 text-xl">info</span>
          <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest leading-relaxed">
            IPs são registrados a cada login. Mesma rede pode ter contas legítimas.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[700] bg-background-dark flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
         <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-background-dark via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 flex items-center justify-between p-6 pt-12 border-b border-white/10 bg-black/40 backdrop-blur-3xl shrink-0">
        <button onClick={onClose} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all shadow-xl">
          <span className="material-symbols-rounded text-2xl">close</span>
        </button>
        <div className="text-center">
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Supervisão Arcana</h2>
          <div className="flex items-center justify-center gap-2 mt-1.5">
             <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]"></div>
             <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em]">Protocolo 8862-X</p>
          </div>
        </div>
        <div className="w-12" />
      </div>

      <div className="relative z-10 flex-1 overflow-hidden">
        {viewMode === 'menu' && renderMenu()}
        {viewMode === 'public' && !selectedConversation && renderPublicMessages()}
        {viewMode === 'private' && !selectedConversation && renderPrivateConversations()}
        {viewMode === 'duplicates' && renderDuplicateIps()}
        {selectedConversation && renderPrivateMessages()}
      </div>
    </div>
  );
};