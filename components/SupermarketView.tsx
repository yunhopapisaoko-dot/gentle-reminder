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
      
      {/* HEADER LUXURY */}
      <div className="pt-16 px-8 pb-8 bg-black/40 backdrop-blur-3xl border-b border-white/5 relative z-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-5">
            <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Magic Market</h2>
              <p className={`text-[9px] font-black uppercase tracking-[0.3em] mt-1.5 ${isOpen ? 'text-emerald-400' : 'text-rose-500'}`}>
                {isOpen ? 'Aberto para visitação' : 'Acesso exclusivo aos domingos'}
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-rounded text-2xl">local_mall</span>
            </div>
          </div>
        </div>

        {/* BALANCE CARD */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 rounded-[32px] p-6 flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Seu Crédito</p>
             <p className="text-2xl font-black text-emerald-400 italic tracking-tighter">₭{userMoney.toLocaleString()}</p>
           </div>
           <div className="flex flex-col items-end">
             <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Status</p>
             <span className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest">Premium</span>
           </div>
        </div>

        {/* CATEGORIES SCROLL */}
        <div className="flex gap-3 mt-8 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white/5 text-white/40 hover:text-white/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-8 space-y-12 pb-40">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Catalogando itens...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center opacity-20">
            <span className="material-symbols-rounded text-6xl mb-4">sentiment_dissatisfied</span>
            <p className="text-sm font-black uppercase tracking-widest">Estoque indisponível</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="animate-in slide-in-bottom duration-500">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{category}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                {(categoryItems as any[]).map((item: any) => {
                  const alreadyPurchased = purchasedThisWeek.includes(item.item_id);
                  const outOfStock = item.stock <= 0;
                  const cantAfford = userMoney < item.price;
                  const disabled = !isOpen || alreadyPurchased || outOfStock || cantAfford;

                  return (
                    <div 
                      key={item.id} 
                      className={`relative group bg-white/[0.03] border border-white/5 rounded-[40px] overflow-hidden transition-all duration-500 hover:bg-white/[0.06] hover:translate-y-[-4px] ${disabled ? 'opacity-40 grayscale-[0.5]' : 'shadow-2xl shadow-black/40'}`}
                    >
                      <div className="relative aspect-square">
                        <img 
                          src={item.item_image} 
                          alt={item.item_name} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                        
                        {/* STOCK TAG */}
                        <div className="absolute top-4 left-4">
                          <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                            <span className="text-[8px] font-black text-white/80 uppercase tracking-widest">{item.stock} unidades</span>
                          </div>
                        </div>

                        {alreadyPurchased && (
                          <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] flex items-center justify-center">
                             <div className="bg-emerald-500 px-4 py-1.5 rounded-full shadow-2xl rotate-[-5deg]">
                               <span className="text-[8px] font-black text-white uppercase tracking-widest">Adquirido</span>
                             </div>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h4 className="text-sm font-black text-white leading-tight mb-1 truncate uppercase tracking-tight">{item.item_name}</h4>
                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-4 truncate">{item.attributes?.description || category}</p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-black text-emerald-400 italic tracking-tighter">₭{item.price}</p>
                          <button
                            onClick={() => handlePurchase(item)}
                            disabled={disabled || isPurchasing === item.id}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                              disabled 
                                ? 'bg-white/5 text-white/10' 
                                : 'bg-white text-black active:scale-90 hover:bg-emerald-500 hover:text-white shadow-xl'
                            }`}
                          >
                            {isPurchasing === item.id ? (
                              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <span className="material-symbols-rounded">add_shopping_cart</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER INFO */}
      {!isOpen && (
        <div className="absolute bottom-10 left-8 right-8 z-30 animate-in slide-in-from-bottom duration-1000">
           <div className="bg-rose-500 text-white p-5 rounded-[28px] shadow-2xl flex items-center justify-center space-x-3 border-2 border-white/20">
              <span className="material-symbols-rounded">schedule</span>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">O mercado está fechado para inventário</p>
           </div>
        </div>
      )}
    </div>
  );
};