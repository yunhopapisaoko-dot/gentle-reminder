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

const categoryIcons: Record<string, string> = {
  'Básicos': 'egg_alt',
  'Bebidas': 'local_cafe',
  'Brasileiro': 'restaurant',
  'Carnes': 'kebab_dining',
  'Coreano': 'ramen_dining',
  'Doces': 'cake',
  'Ingredientes': 'blender',
  'Japonês': 'set_meal',
  'Laticínios': 'water_drop',
  'Todos': 'grid_view'
};

const categoryColors: Record<string, { bg: string; text: string; accent: string }> = {
  'Básicos': { bg: 'from-amber-500/20 to-orange-500/10', text: 'text-amber-400', accent: 'bg-amber-500' },
  'Bebidas': { bg: 'from-cyan-500/20 to-blue-500/10', text: 'text-cyan-400', accent: 'bg-cyan-500' },
  'Brasileiro': { bg: 'from-green-500/20 to-emerald-500/10', text: 'text-green-400', accent: 'bg-green-500' },
  'Carnes': { bg: 'from-red-500/20 to-rose-500/10', text: 'text-red-400', accent: 'bg-red-500' },
  'Coreano': { bg: 'from-rose-500/20 to-pink-500/10', text: 'text-rose-400', accent: 'bg-rose-500' },
  'Doces': { bg: 'from-pink-500/20 to-fuchsia-500/10', text: 'text-pink-400', accent: 'bg-pink-500' },
  'Ingredientes': { bg: 'from-violet-500/20 to-purple-500/10', text: 'text-violet-400', accent: 'bg-violet-500' },
  'Japonês': { bg: 'from-orange-500/20 to-red-500/10', text: 'text-orange-400', accent: 'bg-orange-500' },
  'Laticínios': { bg: 'from-sky-500/20 to-indigo-500/10', text: 'text-sky-400', accent: 'bg-sky-500' },
};

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

  const getItemIcon = (itemName: string): string => {
    const name = itemName.toLowerCase();
    if (name.includes('ovo')) return 'egg_alt';
    if (name.includes('café') || name.includes('cafe')) return 'coffee';
    if (name.includes('leite')) return 'water_drop';
    if (name.includes('arroz')) return 'rice_bowl';
    if (name.includes('feijão') || name.includes('feijao')) return 'grain';
    if (name.includes('carne') || name.includes('picanha') || name.includes('porco')) return 'kebab_dining';
    if (name.includes('linguiça') || name.includes('linguica')) return 'lunch_dining';
    if (name.includes('açucar') || name.includes('acucar') || name.includes('doce')) return 'cake';
    if (name.includes('farinha')) return 'bakery_dining';
    if (name.includes('queijo') || name.includes('cream cheese')) return 'cheese';
    if (name.includes('manteiga')) return 'breakfast_dining';
    if (name.includes('shoyu') || name.includes('molho')) return 'soy_sauce';
    if (name.includes('nori') || name.includes('alga')) return 'spa';
    if (name.includes('dashi') || name.includes('mirin')) return 'ramen_dining';
    if (name.includes('kimchi') || name.includes('gochujang')) return 'local_fire_department';
    if (name.includes('óleo') || name.includes('oleo') || name.includes('gergelim')) return 'oil_barrel';
    if (name.includes('tofu')) return 'eco';
    if (name.includes('farofa')) return 'grain';
    if (name.includes('cacau') || name.includes('chocolate')) return 'cookie';
    if (name.includes('condensado')) return 'icecream';
    return 'inventory_2';
  };

  return (
    <div className={`fixed inset-0 z-[550] bg-zinc-950 flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom duration-700'}`}>
      
      {/* HEADER */}
      <div className="pt-14 px-6 pb-6 bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-white/5 relative z-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button onClick={handleClose} className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 active:scale-90 transition-all hover:bg-white/10 hover:text-white">
              <span className="material-symbols-rounded text-xl">arrow_back</span>
            </button>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Magic Market</h2>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <p className={`text-[10px] font-semibold uppercase tracking-widest ${isOpen ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>
                  {isOpen ? 'Aberto' : 'Fechado'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Balance Card */}
          <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5">
            <span className="material-symbols-rounded text-emerald-400 text-lg">account_balance_wallet</span>
            <div className="text-right">
              <p className="text-[9px] text-white/40 font-medium uppercase tracking-wider">Saldo</p>
              <p className="text-base font-bold text-white">{userMoney.toLocaleString()} <span className="text-emerald-400 text-xs">MKC</span></p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-2 px-2">
          {categories.map(cat => {
            const colors = categoryColors[cat] || { bg: 'from-white/10 to-white/5', text: 'text-white/60', accent: 'bg-white/20' };
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === cat
                    ? `bg-gradient-to-r ${colors.bg} ${colors.text} border border-white/10 shadow-lg`
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 border border-transparent'
                }`}
              >
                <span className="material-symbols-rounded text-base">{categoryIcons[cat] || 'category'}</span>
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ITEMS GRID */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-8 pb-32">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-xs text-white/30 font-medium">Carregando...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-32 text-center">
            <span className="material-symbols-rounded text-5xl text-white/10 mb-3 block">inventory_2</span>
            <p className="text-sm text-white/20 font-medium">Nenhum item disponível</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, categoryItems]) => {
            const colors = categoryColors[category] || { bg: 'from-white/10 to-white/5', text: 'text-white/60', accent: 'bg-white/30' };
            
            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center space-x-2 px-1">
                  <div className={`w-1 h-4 rounded-full ${colors.accent}`}></div>
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${colors.text}`}>{category}</h3>
                  <span className="text-[10px] text-white/20 font-medium ml-auto">{(categoryItems as any[]).length} itens</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {(categoryItems as any[]).map((item: any) => {
                    const alreadyPurchased = purchasedThisWeek.includes(item.item_id);
                    const outOfStock = item.stock <= 0;
                    const cantAfford = userMoney < item.price;
                    const disabled = !isOpen || alreadyPurchased || outOfStock || cantAfford;

                    return (
                      <div 
                        key={item.id} 
                        className={`group relative flex items-center bg-white/[0.03] border border-white/5 rounded-2xl p-4 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/10 ${disabled ? 'opacity-40' : ''}`}
                      >
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} border border-white/5 flex items-center justify-center shrink-0`}>
                          <span className={`material-symbols-rounded text-xl ${colors.text}`}>
                            {getItemIcon(item.item_name)}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 ml-4 min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">{item.item_name}</h4>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-[10px] text-white/30 font-medium">{item.stock} em estoque</span>
                            {alreadyPurchased && (
                              <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                                <span className="material-symbols-rounded text-xs">check_circle</span>
                                <span>Comprado</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="flex items-center space-x-3 ml-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">{item.price}</p>
                            <p className="text-[9px] text-emerald-400/70 font-medium">MKC</p>
                          </div>
                          
                          <button
                            onClick={() => handlePurchase(item)}
                            disabled={disabled || isPurchasing === item.id}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              disabled 
                                ? 'bg-white/5 text-white/20' 
                                : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-90 hover:bg-emerald-400'
                            }`}
                          >
                            {isPurchasing === item.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              <span className="material-symbols-rounded text-lg">add</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CLOSED BANNER */}
      {!isOpen && (
        <div className="absolute bottom-8 left-4 right-4 z-30">
          <div className="bg-rose-500/90 backdrop-blur-xl text-white p-4 rounded-2xl shadow-2xl flex items-center space-x-3 border border-white/20">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-rounded">schedule</span>
            </div>
            <div>
              <p className="text-sm font-semibold">Fechado para reposição</p>
              <p className="text-xs text-white/70">Volte no próximo domingo!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
