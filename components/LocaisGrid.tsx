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
  { id: 'hospital', name: 'Hospital', icon: 'medical_services', color: 'from-blue-500', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400&auto=format&fit=crop', activeCount: 'Saúde' },
  { id: 'creche', name: 'Creche', icon: 'child_care', color: 'from-pink-500', image: 'https://images.unsplash.com/photo-1560523160-754a9e25c68f?q=80&w=400&auto=format&fit=crop', activeCount: 'Infantil' },
  { id: 'restaurante', name: 'Neon Grill', icon: 'restaurant', color: 'from-orange-500', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400&auto=format&fit=crop', activeCount: 'Gastronomia' },
  { id: 'padaria', name: 'Baguette', icon: 'bakery_dining', color: 'from-yellow-600', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop', activeCount: 'Padaria' },
  { id: 'pousada', name: 'Pousada', icon: 'hotel', color: 'from-purple-500', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400&auto=format&fit=crop', activeCount: 'Hospedagem' },
  { id: 'praia', name: 'Praia', icon: 'beach_access', color: 'from-cyan-500', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop', activeCount: 'Lazer' },
  { id: 'farmacia', name: 'Farmácia', icon: 'local_pharmacy', color: 'from-teal-500', image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?q=80&w=400&auto=format&fit=crop', activeCount: 'Remédios' },
  { id: 'imobiliaria', name: 'Imóveis', icon: 'real_estate_agent', color: 'from-emerald-500', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=400&auto=format&fit=crop', activeCount: 'Vendas' },
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
    <div className="p-4 space-y-6 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-x-hidden">
      
      {/* Seção Especial: Chat OFF e Casa */}
      <div className="space-y-4">
        {/* Chat OFF */}
        <button
          onClick={() => onSelect('chat_off')}
          className="relative group w-full h-28 rounded-[32px] overflow-hidden border border-cyan-500/30 shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/90 to-blue-900/90"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400')] opacity-20 mix-blend-overlay"></div>
          
          <div className="relative h-full flex items-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-400/30 group-hover:scale-110 transition-transform">
              <span className="material-symbols-rounded text-cyan-400 text-3xl">forum</span>
            </div>
            <div className="ml-4 text-left">
              <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Chat OFF</h4>
              <p className="text-[9px] font-black text-cyan-300 uppercase tracking-widest mt-1">Sempre Aberto • Sem RPG</p>
            </div>
            {chatOffUnread > 0 && (
              <div className="ml-auto w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-[10px] font-black text-white">{chatOffUnread}</span>
              </div>
            )}
          </div>
        </button>

        {/* Sua Casa */}
        {userHouse && (
          <div className={`transition-opacity duration-500 ${!currentUser?.isActiveRP ? 'opacity-40 grayscale' : ''}`}>
            <button
              onClick={() => setExpandedHouse(!expandedHouse)}
              className="relative group w-full h-28 rounded-[32px] overflow-hidden border border-primary/30 shadow-lg transition-all active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-purple-900/80"></div>
              <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=400" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
              
              <div className="relative h-full flex items-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <span className="material-symbols-rounded text-white text-3xl">home</span>
                </div>
                <div className="ml-4 text-left">
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Casa de {userHouse.owner_name}</h4>
                  <p className="text-[9px] font-black text-primary-foreground/70 uppercase tracking-widest mt-1">Sua Propriedade • {HOUSE_ROOMS.length} Cômodos</p>
                </div>
                <span className={`ml-auto material-symbols-rounded text-white/50 transition-transform ${expandedHouse ? 'rotate-180' : ''}`}>expand_more</span>
              </div>
            </button>

            {expandedHouse && (
              <div className="grid grid-cols-3 gap-2 mt-3 animate-in slide-in-from-top-4 duration-300">
                {HOUSE_ROOMS.map(room => (
                  <button
                    key={room.id}
                    onClick={() => handleHouseRoomSelect(room.id)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-rounded text-primary text-xl mb-1">{room.icon}</span>
                    <span className="text-[8px] font-black text-white/60 uppercase tracking-tighter truncate w-full text-center">{room.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid de Locais Públicos (2 Colunas) */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-1 h-4 bg-white/20 rounded-full"></div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Explorar Cidade</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {LOCAIS_DATA.map((local) => {
            if (local.id === 'imobiliaria' && userHouse) return null;
            
            const isRPLocation = local.id !== 'imobiliaria';
            const needsCharacter = isRPLocation && !hasCharacter;
            const isBlocked = (!currentUser?.isActiveRP && isRPLocation) || needsCharacter;
            const unreadCount = getLocationUnread?.(local.id) || 0;

            return (
              <button
                key={local.id}
                onClick={() => handleSelect(local)}
                className={`relative group aspect-square rounded-[40px] overflow-hidden border transition-all duration-500 active:scale-95 shadow-xl ${isBlocked ? 'opacity-40 grayscale border-white/5' : 'border-white/10 hover:border-primary/50'}`}
              >
                <img src={local.image} alt={local.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                
                {/* Status/Badge */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                  {unreadCount > 0 && !isBlocked && (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg animate-pulse border-2 border-background-dark">
                      <span className="text-[9px] font-black text-white">{unreadCount}</span>
                    </div>
                  )}
                  {isBlocked && (
                    <div className="w-8 h-8 rounded-xl bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10">
                      <span className="material-symbols-rounded text-white/50 text-base">lock</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-left">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${local.color} to-black/50 flex items-center justify-center mb-2 shadow-lg border border-white/20 group-hover:rotate-6 transition-transform`}>
                    <span className="material-symbols-rounded text-white text-xl">{local.icon}</span>
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight leading-none truncate">{local.name}</h4>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1">{local.activeCount}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modais de Confirmação e Compra (Mantidos) */}
      {confirmingLocal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setConfirmingLocal(null)}></div>
          <div className="relative w-full max-w-xs bg-background-dark border border-white/10 rounded-[48px] p-8 shadow-[0_0_80px_rgba(139,92,246,0.3)] animate-in zoom-in duration-400">
            <div className="w-20 h-20 rounded-[28px] bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-6">
              <span className="material-symbols-rounded text-5xl">{confirmingLocal.icon}</span>
            </div>
            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase text-center mb-2">Entrar?</h3>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center mb-8">Iniciar roleplay em {confirmingLocal.name}?</p>
            <div className="flex space-x-4">
              <button onClick={() => setConfirmingLocal(null)} className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Não</button>
              <button onClick={() => { onSelect(confirmingLocal.id); setConfirmingLocal(null); }} className="flex-1 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Sim</button>
            </div>
          </div>
        </div>
      )}

      {showImobiliaria && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowImobiliaria(false)}></div>
          <div className="relative w-full max-w-sm bg-background-dark border border-white/10 rounded-[48px] p-8 shadow-[0_0_80px_rgba(16,185,129,0.3)] animate-in zoom-in duration-400 text-center">
            <div className="w-20 h-20 rounded-[28px] bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-6">
              <span className="material-symbols-rounded text-5xl">real_estate_agent</span>
            </div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6">Imobiliária</h3>
            <div className="bg-white/5 rounded-3xl p-5 border border-white/10 mb-6 text-left">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-white">Casa Padrão</span>
                <span className="text-lg font-black text-emerald-400">$100.000</span>
              </div>
              <p className="text-[10px] text-white/40 mb-4">6 cômodos totalmente customizáveis.</p>
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Seu Saldo:</span>
                <span className={`text-xs font-black ${(currentUser?.money || 0) >= 100000 ? 'text-emerald-400' : 'text-rose-500'}`}>${(currentUser?.money || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <button onClick={() => setShowImobiliaria(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Sair</button>
              <button 
                onClick={handleBuyHouse}
                disabled={isBuying || (currentUser?.money || 0) < 100000}
                className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30"
              >
                {isBuying ? '...' : 'Comprar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};