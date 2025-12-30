"use client";

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';

interface SupermarketViewProps {
  userId: string;
  userName: string;
  userMoney: number;
  onClose: () => void;
  onMoneyChange: (newBalance: number) => void;
}

export const SupermarketView: React.FC<SupermarketViewProps> = ({ 
  userId, 
  userName, 
  userMoney,
  onClose,
  onMoneyChange
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [purchasedThisWeek, setPurchasedThisWeek] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const isOpen = supabaseService.isSupermarketOpen();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [itemsData, purchases] = await Promise.all([
      supabaseService.getSupermarketItems(),
      supabaseService.getUserPurchasesThisWeek(userId)
    ]);
    setItems(itemsData);
    setPurchasedThisWeek(purchases);
    setIsLoading(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handlePurchase = async (item: any) => {
    if (!isOpen) {
      alert("O empório está fechado hoje. Retorne no domingo!");
      return;
    }

    if (userMoney < item.price) {
      alert("Seu saldo não é suficiente para este item exclusivo.");
      return;
    }

    if (purchasedThisWeek.includes(item.item_id)) {
      alert("Limite semanal atingido para este item.");
      return;
    }

    setIsPurchasing(item.id);
    try {
      await supabaseService.purchaseSupermarketItem(userId, userName, item);
      const newBalance = userMoney - item.price;
      await supabaseService.updateMoney(userId, newBalance);
      onMoneyChange(newBalance);
      setPurchasedThisWeek([...purchasedThisWeek, item.item_id]);
      loadData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsPurchasing(null);
    }
  };

  const categories = ['Todos', ...Array.from(new Set(items.map(i => i.category)))];
  const filteredItems = selectedCategory === 'Todos' 
    ? items 
    : items.filter(i => i.category === selectedCategory);

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className={`fixed inset-0 z-[550] bg-background-dark flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom duration-700'}`}>
      
      {/* HEADER PREMIUM GLASS */}
      <div className="pt-16 px-8 pb-8 bg-black/40 backdrop-blur-3xl border-b border-white/5 relative z-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            <button onClick={handleClose} className="w-12 h-12 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/10">
              <span className="material-symbols-rounded text-2xl">arrow_back</span>
            </button>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Magic Market</h2>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOpen ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`}></div>
                <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${isOpen ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {isOpen ? 'Catálogo Disponível' : 'Fechado para Reposição'}
                </p>
              </div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-[22px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-rounded text-2xl">shopping_basket</span>
          </div>
        </div>

        {/* REFINED BALANCE SECTION */}
        <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-[32px] p-6">
           <div className="space-y-1">
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Seu Saldo Atual</p>
             <p className="text-2xl font-black text-white italic tracking-tighter">
               {userMoney.toLocaleString()} <span className="text-emerald-400 ml-1">MKC</span>
             </p>
           </div>
           <div className="flex flex-col items-end space-y-2">
             <span className="px-4 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">Membro VIP</span>
           </div>
        </div>

        {/* MINIMAL CATEGORIES */}
        <div className="flex gap-3 mt-8 overflow-x-auto scrollbar-hide pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-white text-black shadow-[0_10px_25px_rgba(255,255,255,0.2)] scale-105'
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* BOUTIQUE GRID */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-12 pb-40">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center opacity-30">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Sincronizando Inventário...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-32 text-center opacity-20">
            <span className="material-symbols-rounded text-6xl mb-4">inventory_2</span>
            <p className="text-sm font-black uppercase tracking-widest">Nenhum rastro de mercadoria</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-3">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">{category}</h3>
                </div>
                <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">{(categoryItems as any[]).length} Itens</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {(categoryItems as any[]).map((item: any) => {
                  const alreadyPurchased = purchasedThisWeek.includes(item.item_id);
                  const outOfStock = item.stock <= 0;
                  const cantAfford = userMoney < item.price;
                  const disabled = !isOpen || alreadyPurchased || outOfStock || cantAfford;

                  return (
                    <div 
                      key={item.id} 
                      className={`relative group flex flex-col bg-white/[0.03] border border-white/5 rounded-[42px] overflow-hidden transition-all duration-700 hover:border-emerald-500/30 hover:bg-white/[0.05] ${disabled ? 'opacity-40 grayscale' : 'shadow-2xl active:scale-[0.98]'}`}
                    >
                      {/* Product Image Area */}
                      <div className="relative aspect-square overflow-hidden bg-black/20">
                        <img 
                          src={item.item_image} 
                          alt={item.item_name} 
                          className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
                        
                        {/* Status Tags */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">{item.stock} EM ESTOQUE</span>
                          </div>
                        </div>

                        {alreadyPurchased && (
                          <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] flex items-center justify-center p-6">
                             <div className="bg-emerald-500 text-white px-5 py-2 rounded-2xl shadow-2xl rotate-[-4deg] border border-white/20 animate-in zoom-in">
                               <span className="text-[9px] font-black uppercase tracking-[0.2em]">Adquirido</span>
                             </div>
                          </div>
                        )}
                      </div>

                      {/* Product Info Area */}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="mb-4">
                          <h4 className="text-[13px] font-black text-white leading-tight uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{item.item_name}</h4>
                          <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1.5 line-clamp-1">{item.attributes?.description || category}</p>
                        </div>
                        
                        <div className="mt-auto flex items-center justify-between gap-3">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Preço</span>
                            <p className="text-base font-black text-white italic tracking-tighter">
                              {item.price.toLocaleString()} <span className="text-emerald-500 text-[10px] ml-0.5">MKC</span>
                            </p>
                          </div>
                          
                          <button
                            onClick={() => handlePurchase(item)}
                            disabled={disabled || isPurchasing === item.id}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                              disabled 
                                ? 'bg-white/5 text-white/10' 
                                : 'bg-emerald-500 text-white shadow-[0_10px_20px_rgba(16,185,129,0.3)] active:scale-90 hover:scale-105'
                            }`}
                          >
                            {isPurchasing === item.id ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              <span className="material-symbols-rounded text-2xl">add_shopping_cart</span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Bottom Accent */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* LUXURY FOOTER INFO */}
      {!isOpen && (
        <div className="absolute bottom-10 left-8 right-8 z-30 animate-in slide-in-from-bottom duration-1000">
           <div className="bg-rose-600/90 backdrop-blur-2xl text-white p-6 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center space-x-4 border border-white/20">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="material-symbols-rounded animate-spin-slow">lock_clock</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Empório em Manutenção</p>
                <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest mt-1">Visite-nos no próximo domingo</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};