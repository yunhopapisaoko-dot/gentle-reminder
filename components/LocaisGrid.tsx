"use client";

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';

interface Local {
  id: string;
  name: string;
  icon: string;
  color: string;
  image: string;
  activeCount: string;
  isHouse?: boolean;
  rooms?: { id: string; name: string; icon: string }[];
}

interface LocaisGridProps {
  onSelect: (id: string) => void;
  confirmedRooms: string[];
  currentUser: {
    id: string;
    name: string;
    money?: number;
    age?: number;
    isActiveRP?: boolean;
  } | null;
  characters: any[];
  onMoneyChange?: (newBalance: number) => void;
  onUserClick?: (user: any) => void;
  getLocationUnread?: (location: string) => number;
}

const LOCAIS_DATA: Local[] = [
  { id: 'imobiliaria', name: 'Imobiliária', icon: 'real_estate_agent', color: 'from-emerald-500', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=400&auto=format&fit=crop', activeCount: 'Compre sua casa' },
  { id: 'hospital', name: 'Hospital', icon: 'medical_services', color: 'from-blue-500', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400&auto=format&fit=crop', activeCount: '12 online' },
  { id: 'creche', name: 'Creche', icon: 'child_care', color: 'from-pink-500', image: 'https://images.unsplash.com/photo-1560523160-754a9e25c68f?q=80&w=400&auto=format&fit=crop', activeCount: '8 online' },
  { id: 'restaurante', name: 'Neon Grill', icon: 'restaurant', color: 'from-orange-500', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400&auto=format&fit=crop', activeCount: '24 online' },
  { id: 'padaria', name: 'Baguette Miku', icon: 'bakery_dining', color: 'from-yellow-600', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop', activeCount: '15 online' },
  { id: 'pousada', name: 'Pousada', icon: 'hotel', color: 'from-purple-500', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400&auto=format&fit=crop', activeCount: '🚨 Cuidado com JYP!' },
  { id: 'praia', name: 'Praia', icon: 'beach_access', color: 'from-cyan-500', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop', activeCount: '🌊 Cuidado com JYP!' },
  { id: 'farmacia', name: 'Farmácia', icon: 'local_pharmacy', color: 'from-teal-500', image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?q=80&w=400&auto=format&fit=crop', activeCount: '💊 Saúde & Bem-Estar' },
  { id: 'supermercado', name: 'Supermercado', icon: 'local_grocery_store', color: 'from-green-500', image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=400&auto=format&fit=crop', activeCount: '🛒 Só Domingo!' },
];

const HOUSE_ROOMS = [
  { id: 'sala', name: 'Sala', icon: 'weekend' },
  { id: 'quarto1', name: 'Quarto 1', icon: 'bed' },
  { id: 'quarto2', name: 'Quarto 2', icon: 'bed' },
  { id: 'banheiro', name: 'Banheiro', icon: 'shower' },
  { id: 'cozinha', name: 'Cozinha', icon: 'cooking' },
  { id: 'area_externa', name: 'Área Externa', icon: 'deck' },
];

export const LocaisGrid: React.FC<LocaisGridProps> = ({ 
  onSelect, 
  confirmedRooms, 
  currentUser,
  characters,
  onMoneyChange,
  onUserClick,
  getLocationUnread
}) => {
  const [confirmingLocal, setConfirmingLocal] = useState<Local | null>(null);
  const [userHouse, setUserHouse] = useState<any>(null);
  const [showImobiliaria, setShowImobiliaria] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [expandedHouse, setExpandedHouse] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      loadUserHouse();
    }
  }, [currentUser?.id]);

  const loadUserHouse = async () => {
    if (!currentUser?.id) return;
    const house = await supabaseService.getUserHouse(currentUser.id);
    setUserHouse(house);
  };

  // Pega a idade do personagem do usuário
  const userCharacter = characters.find(c => c.user_id === currentUser?.id);
  const userAge = userCharacter?.age || 0;
  const hasCharacter = !!userCharacter;

  const handleSelect = (local: Local) => {
    const isRPLocation = local.id !== 'imobiliaria' && local.id !== 'supermercado';
    
    if (isRPLocation && !hasCharacter) {
      alert("Você precisa criar um personagem primeiro para acessar os locais de Roleplay.");
      return;
    }
    
    if (!currentUser?.isActiveRP && isRPLocation) {
      alert("Seu status de Roleplay está DESLIGADO. Ative no menu lateral para entrar.");
      return;
    }

    if (local.id === 'imobiliaria') {
      setShowImobiliaria(true);
      return;
    }

    if (confirmedRooms.includes(local.id)) {
      onSelect(local.id);
    } else {
      setConfirmingLocal(local);
    }
  };

  const handleBuyHouse = async () => {
    if (!currentUser) return;
    
    if (userAge < 18) {
      alert("Você precisa ter um personagem com 18 anos ou mais para comprar uma casa.");
      return;
    }

    if ((currentUser.money || 0) < 100000) {
      alert("Você não tem dinheiro suficiente. A casa custa 100.000.");
      return;
    }

    setIsBuying(true);
    try {
      await supabaseService.buyHouse(currentUser.id, currentUser.name);
      await loadUserHouse();
      onMoneyChange?.((currentUser.money || 0) - 100000);
      setShowImobiliaria(false);
      alert("Parabéns! Você comprou sua casa! 🏠");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsBuying(false);
    }
  };

  const handleHouseRoomSelect = (roomId: string) => {
    if (!currentUser?.isActiveRP) {
      alert("Seu status de Roleplay está DESLIGADO. Ative no menu lateral para entrar.");
      return;
    }
    if (!userHouse) return;
    const chatId = `house_${userHouse.id}_${roomId}`;
    onSelect(chatId);
  };

  const chatOffUnread = getLocationUnread?.('chat_off') || 0;

  return (
    <div className="p-4 grid grid-cols-1 gap-5 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Chat OFF - Sempre disponível */}
      <div className="px-2 mb-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/80">💬 Conversa Livre</h3>
      </div>
      
      <button
        onClick={() => onSelect('chat_off')}
        className="relative group h-32 w-full rounded-[32px] overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] hover:border-cyan-400 transition-all duration-500 transform active:scale-[0.96]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/80 via-slate-900 to-purple-900/50"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&auto=format&fit=crop')] opacity-20 mix-blend-overlay"></div>
        
        {/* Notification Badge for Chat OFF */}
        {chatOffUnread > 0 && (
          <div className="absolute top-3 left-3 z-30">
            <span className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-red-500 text-white text-[11px] font-black rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)] border-2 border-white/20">
              {chatOffUnread > 99 ? '99+' : chatOffUnread}
            </span>
          </div>
        )}
        
        <div className="relative h-full flex flex-col justify-center items-center p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-xl border border-white/30 group-hover:rotate-6 group-hover:scale-110 transition-all duration-300">
              <span className="material-symbols-rounded text-white text-4xl">forum</span>
            </div>
            <div className="text-left">
              <h4 className="text-2xl font-black text-white tracking-tighter leading-none drop-shadow-md">Chat OFF</h4>
              <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest mt-1">Fora do Roleplay</p>
              <p className="text-[9px] text-white/50 mt-1">Converse sem personagem</p>
            </div>
          </div>
        </div>
        
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-cyan-500/30 border border-cyan-400/50 backdrop-blur-sm">
          <span className="text-[8px] font-black text-cyan-300 uppercase tracking-widest">Sempre Aberto</span>
        </div>
      </button>
      {/* Casa do Usuário - Aparece primeiro se tiver */}
      {userHouse && (
        <>
          <div className="px-2 mb-1 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Sua Casa</h3>
            {!currentUser?.isActiveRP && (
              <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Modo Offline</span>
            )}
          </div>
          
          <div className={`relative transition-opacity duration-500 ${!currentUser?.isActiveRP ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
            <button
              onClick={() => setExpandedHouse(!expandedHouse)}
              className="relative group h-40 w-full rounded-[32px] overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/20 hover:border-primary/50 transition-all duration-500"
            >
              <img 
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=400&auto=format&fit=crop" 
                alt="Sua Casa" 
                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-1000" 
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-background-dark via-background-dark/30 to-transparent"></div>
              
              <div className="relative h-full flex flex-col justify-end p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-background-dark/80 flex items-center justify-center shadow-xl border border-white/20 group-hover:rotate-3 transition-transform">
                      <span className="material-symbols-rounded text-white text-3xl">home</span>
                    </div>
                    <div className="text-left">
                      <h4 className="text-2xl font-black text-white tracking-tighter leading-none drop-shadow-md">Casa de {userHouse.owner_name}</h4>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-[10px] font-black text-primary/80 uppercase tracking-widest">{HOUSE_ROOMS.length} cômodos</span>
                      </div>
                    </div>
                  </div>
                  <div className={`w-11 h-11 rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 flex items-center justify-center text-primary transition-all shadow-lg ${expandedHouse ? 'rotate-90' : ''}`}>
                    <span className="material-symbols-rounded text-2xl">arrow_forward</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Cômodos da casa */}
            {expandedHouse && (
              <div className="mt-3 grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {HOUSE_ROOMS.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleHouseRoomSelect(room.id)}
                    className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary/10 hover:border-primary/30 transition-all active:scale-95"
                  >
                    <span className="material-symbols-rounded text-2xl text-primary mb-2">{room.icon}</span>
                    <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{room.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="px-2 mb-1 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Locais de Roleplay</h3>
        {!currentUser?.isActiveRP && (
          <div className="flex items-center space-x-2">
            <span className="material-symbols-rounded text-rose-500 text-xs">lock</span>
            <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Acesso Restrito</span>
          </div>
        )}
      </div>


      {LOCAIS_DATA.map((local) => {
        // Esconde imobiliária se já tem casa
        if (local.id === 'imobiliaria' && userHouse) return null;
        
        const isRPLocation = local.id !== 'imobiliaria' && local.id !== 'supermercado';
        const needsCharacter = isRPLocation && !hasCharacter;
        const isBlocked = (!currentUser?.isActiveRP && isRPLocation) || needsCharacter;
        const unreadCount = getLocationUnread?.(local.id) || 0;

        return (
          <button
            key={local.id}
            onClick={() => handleSelect(local)}
            className={`relative group h-40 w-full rounded-[32px] overflow-hidden border border-white/5 shadow-2xl transition-all duration-500 transform active:scale-[0.96] ${isBlocked ? 'opacity-40 grayscale hover:border-rose-500/30' : 'hover:border-primary/50'}`}
          >
            <img src={local.image} alt={local.name} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-tr from-background-dark via-background-dark/30 to-transparent"></div>
            
            {/* Notification Badge */}
            {unreadCount > 0 && !isBlocked && (
              <div className="absolute top-4 right-4 z-30">
                <span className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-red-500 text-white text-[11px] font-black rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)] border-2 border-white/20">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </div>
            )}
            
            {isBlocked && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="bg-black/60 backdrop-blur-md p-4 rounded-full border border-white/10 shadow-2xl flex flex-col items-center">
                  <span className="material-symbols-rounded text-white text-3xl">lock</span>
                  {needsCharacter && (
                    <span className="text-[8px] font-black text-white/60 uppercase tracking-widest mt-2">Crie uma ficha</span>
                  )}
                </div>
              </div>
            )}

            <div className="relative h-full flex flex-col justify-end p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${local.color} to-background-dark/80 flex items-center justify-center shadow-xl border border-white/20 group-hover:rotate-3 transition-transform`}>
                    <span className="material-symbols-rounded text-white text-3xl">{local.icon}</span>
                  </div>
                  <div className="text-left">
                    <h4 className="text-2xl font-black text-white tracking-tighter leading-none drop-shadow-md">{local.name}</h4>
                    <div className="flex items-center space-x-2 mt-2">
                      {!isBlocked && local.id !== 'imobiliaria' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                      )}
                      <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{local.activeCount}</span>
                    </div>
                  </div>
                </div>
                <div className={`w-11 h-11 rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg ${isBlocked ? 'opacity-0' : ''}`}>
                  <span className="material-symbols-rounded text-2xl">arrow_forward</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* Modal de confirmação de local */}
      {confirmingLocal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setConfirmingLocal(null)}></div>
          <div className="relative w-full max-w-xs bg-background-dark border border-white/10 rounded-[48px] p-8 shadow-[0_0_80px_rgba(139,92,246,0.3)] animate-in zoom-in duration-400">
            <div className="w-20 h-20 rounded-[28px] bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-6">
              <span className="material-symbols-rounded text-5xl">{confirmingLocal.icon}</span>
            </div>
            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase text-center mb-2">Entrar no Local?</h3>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center mb-8">Deseja iniciar um roleplay no {confirmingLocal.name}?</p>
            
            <div className="flex space-x-4">
              <button 
                onClick={() => setConfirmingLocal(null)}
                className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Não
              </button>
              <button 
                onClick={() => { onSelect(confirmingLocal.id); setConfirmingLocal(null); }}
                className="flex-1 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal da Imobiliária */}
      {showImobiliaria && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowImobiliaria(false)}></div>
          <div className="relative w-full max-w-sm bg-background-dark border border-white/10 rounded-[48px] p-8 shadow-[0_0_80px_rgba(16,185,129,0.3)] animate-in zoom-in duration-400">
            <div className="w-20 h-20 rounded-[28px] bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-6">
              <span className="material-symbols-rounded text-5xl">real_estate_agent</span>
            </div>
            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase text-center mb-2">Imobiliária</h3>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center mb-6">Compre sua própria casa!</p>
            
            {/* Info da casa */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">Casa Padrão</span>
                <span className="text-lg font-black text-emerald-400">$100.000</span>
              </div>
              <p className="text-[10px] text-white/40 mb-3">Inclui: Sala, 2 Quartos, Banheiro, Cozinha e Área Externa</p>
              
              <div className="flex items-center justify-between text-[9px] text-white/30 border-t border-white/5 pt-3">
                <span>Seu saldo:</span>
                <span className={`font-bold ${(currentUser?.money || 0) >= 100000 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${(currentUser?.money || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Aviso de idade */}
            {userAge < 18 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mb-4">
                <p className="text-[10px] text-red-400 font-bold text-center">
                  <span className="material-symbols-rounded text-sm align-middle mr-1">warning</span>
                  Seu personagem precisa ter 18+ anos
                </p>
              </div>
            )}

            {!userCharacter && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mb-4">
                <p className="text-[10px] text-amber-400 font-bold text-center">
                  <span className="material-symbols-rounded text-sm align-middle mr-1">person_off</span>
                  Você precisa criar um personagem primeiro
                </p>
              </div>
            )}
            
            <div className="flex space-x-4">
              <button 
                onClick={() => setShowImobiliaria(false)}
                className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Fechar
              </button>
              <button 
                onClick={handleBuyHouse}
                disabled={isBuying || userAge < 18 || !userCharacter || (currentUser?.money || 0) < 100000}
                className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBuying ? 'Comprando...' : 'Comprar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};