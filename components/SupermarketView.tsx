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
      alert("O supermercado só abre aos domingos!");
      return;
    }

    if (userMoney < item.price) {
      alert("Dinheiro insuficiente!");
      return;
    }

    if (purchasedThisWeek.includes(item.item_id)) {
      alert("Você já comprou este item esta semana!");
      return;
    }

    setIsPurchasing(item.id);
    try {
      await supabaseService.purchaseSupermarketItem(userId, userName, item);
      await supabaseService.updateMoney(userId, userMoney - item.price);
      onMoneyChange(userMoney - item.price);
      setPurchasedThisWeek([...purchasedThisWeek, item.item_id]);
      alert(`${item.item_name} foi adicionado ao seu inventário!`);
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

  // Agrupar por categoria para exibição
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className={`fixed inset-0 z-[550] bg-background-dark/95 backdrop-blur-3xl flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-to-bottom duration-400' : 'animate-in slide-in-from-bottom duration-500'}`}>
      {/* Header */}
      <div className="pt-16 px-8 pb-6 bg-black/40 border-b border-white/5 relative shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Supermercado</h2>
              <p className="text-[9px] font-black text-green-400 uppercase tracking-[0.3em] mt-1.5">
                {isOpen ? '🟢 Aberto' : '🔴 Fechado (Só Domingo)'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <span className="material-symbols-rounded text-3xl">shopping_cart</span>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        {!isOpen && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4">
            <p className="text-[10px] text-amber-400 font-bold text-center">
              <span className="material-symbols-rounded text-sm align-middle mr-1">schedule</span>
              O supermercado abre apenas aos domingos (horário do Brasil)
            </p>
          </div>
        )}

        {/* Saldo */}
        <div className="flex items-center justify-between bg-white/[0.03] rounded-2xl p-4 border border-white/5">
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Seu Saldo</span>
          <span className="text-lg font-black text-green-400">${userMoney.toLocaleString()}</span>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-green-500 text-white'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 pb-32">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center opacity-20">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="py-32 text-center opacity-20 flex flex-col items-center">
            <span className="material-symbols-rounded text-6xl mb-4">inventory_2</span>
            <p className="text-sm font-black uppercase tracking-[0.3em]">Sem Produtos</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-4 px-2">{category}</h3>
              <div className="grid grid-cols-2 gap-3">
                {(categoryItems as any[]).map((item: any) => {
                  const alreadyPurchased = purchasedThisWeek.includes(item.item_id);
                  const outOfStock = item.stock <= 0;
                  const cantAfford = userMoney < item.price;
                  const disabled = !isOpen || alreadyPurchased || outOfStock || cantAfford;

                  return (
                    <div 
                      key={item.id} 
                      className={`bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden group hover:bg-white/[0.05] transition-all ${disabled ? 'opacity-50' : ''}`}
                    >
                      <div className="relative aspect-square">
                        <img 
                          src={item.item_image} 
                          alt={item.item_name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <span className="bg-black/60 backdrop-blur-sm text-white text-[8px] font-black px-2 py-1 rounded-lg">
                            {item.stock} disp.
                          </span>
                        </div>
                        {alreadyPurchased && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-green-400 text-[10px] font-black uppercase">Já Comprado</span>
                          </div>
                        )}
                        {outOfStock && !alreadyPurchased && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-red-400 text-[10px] font-black uppercase">Esgotado</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="text-sm font-black text-white leading-tight mb-1 line-clamp-1">{item.item_name}</h4>
                        <p className="text-[9px] text-white/30 mb-3 line-clamp-1">{item.attributes?.description || category}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-green-400 font-black">${item.price}</span>
                          <button
                            onClick={() => handlePurchase(item)}
                            disabled={disabled || isPurchasing === item.id}
                            className="px-4 py-2 rounded-xl bg-green-500 text-white text-[9px] font-black uppercase tracking-wider disabled:bg-white/10 disabled:text-white/30 active:scale-90 transition-all"
                          >
                            {isPurchasing === item.id ? '...' : 'Comprar'}
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
    </div>
  );
};
